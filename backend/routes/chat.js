import express from "express"
import crypto from "crypto"
import llm, { executePendingCreation } from "../models/llm.js";
import mainDB from "../database.js";
import { defaultAgentPosition } from "../models/placement.js";
import { Mistral } from "@mistralai/mistralai";

const router = express.Router()

// Helps save a message to the DB (fire-and-forget, never throws)
async function saveMessage(sessionID, message, isAI) {
    try {
        await mainDB.query(
            `INSERT INTO messages ( session_id, message, ai)
             VALUES ($1, $2, $3)`,
            [sessionID, message, isAI]
        );
    } catch (err) {
        console.error("[DB] Failed to save message:", err.message);
    }
}

// Helps verify session belongs to the authenticated user
async function verifySession(sessionID, userID) {
    try {
        const result = await mainDB.query(
            `SELECT session_id FROM sessions WHERE session_id = $1 AND user_id = $2`,
            [sessionID, userID]
        );
        return result.rows.length > 0;
    } catch (err) {
        console.error("[DB] Failed to verify session:", err.message);
        return false;
    }
}

// POST /chat/text/:id   — text conversation
router.post("/text/:id", async (req, res) => {
    const sessionID = req.params.id
    const userID = req.user?.userID

    if (!sessionID) return res.status(400).json({ msg: "Missing session ID" })
    if (!req.body.prompt) return res.status(400).json({ msg: "Missing prompt" })

    // verify session ownership
    const owns = await verifySession(sessionID, userID)
    if (!owns) return res.status(403).json({ msg: "Session not found or not yours" })

    // save user message before LLM reads history
    await saveMessage(sessionID, req.body.prompt, false)

    try {
        const response = await llm(req.body.prompt, sessionID)

        // save AI response (fire-and-forget)
        if (response?.response) {
            saveMessage(sessionID, response.response, true)
        }

        res.json({ response })
    } catch (err) {
        console.error("[Chat] LLM error:", err.message)
        return res.status(500).json({ msg: "Failed to get AI response" })
    }
})

// POST /chat/text/:id/execute — finish deferred object creation (image gen)
router.post("/text/:id/execute", async (req, res) => {
    const sessionID = req.params.id
    const userID = req.user?.userID

    if (!sessionID) return res.status(400).json({ msg: "Missing session ID" })

    const owns = await verifySession(sessionID, userID)
    if (!owns) return res.status(403).json({ msg: "Session not found or not yours" })

    try {
        const response = await executePendingCreation(sessionID)

        if (response?.response) {
            saveMessage(sessionID, response.response, true)
        }

        res.json({ response })
    } catch (err) {
        console.error("[Chat] Execute error:", err.message)
        return res.status(500).json({ msg: "Failed to create object" })
    }
})

// POST /chat/voice/:id  — voice conversation
router.post("/voice/:id", async (req, res) => {
    const sessionID = req.params.id
    const userID = req.user?.userID

    if (!sessionID) return res.status(400).json({ msg: "Missing session ID" })

    // verify session ownership
    const owns = await verifySession(sessionID, userID)
    if (!owns) return res.status(403).json({ msg: "Session not found or not yours" })

    try {
        // 1. STT
        const stt = await mistral.audio.transcriptions.create({
            model: "voxtral-mini-transcribe-realtime-2602",
            file: audioBuffer,
        });

        const text = stt.text;

        // save user message before LLM reads history
        await saveMessage(sessionID, text, false)

        // 2. LLM
        const chat = await llm(text, sessionID)

        const reply = chat.choices[0].message.content;

        // save AI response (fire-and-forget)
        if (reply) {
            saveMessage(sessionID, reply, true)
        }

        // 3. TTS (streamable)
        const ttsStream = await mistral.audio.speech({
            model: "voxtral-mini-tts-2603",
            input: reply,
        });

        res.setHeader("Content-Type", "audio/mpeg");

        const reader = ttsStream.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
        }

        res.end();
    } catch (err) {
        console.error("[Chat] Voice error:", err.message)
        if (!res.headersSent) {
            return res.status(500).json({ msg: "Voice processing failed" })
        }
        res.end();
    }
})

// POST /chat/session     — create a new session
router.post("/session", async (req, res) => {
    const userID = req.user?.userID

    function createDefaultRoomState() {
        return {
            dimensions: {
                width: 1120,
                height: 720
            },
            background: {
                type: "solid",
                value: "#adadad"
            },
            objects: [],
            character: defaultAgentPosition(1120, 720),
        };
    }

    try {
        const result = await mainDB.query(
            `INSERT INTO sessions (user_id, title, state)
             VALUES ($1, $2, $3)
             RETURNING session_id, title, state, created_at`,
            [
                userID,
                req.body.title ?? "Untitled Session",
                JSON.stringify(createDefaultRoomState())
            ]
        );

        return res.status(201).json(result.rows[0])
    } catch (err) {
        console.error("[DB] Failed to create session:", err.message)
        return res.status(500).json({ msg: "Failed to create session" })
    }
})

// GET /chat/sessions     — list user's sessions
router.get("/sessions", async (req, res) => {
    const userID = req.user?.userID

    try {
        const result = await mainDB.query(
            `SELECT session_id, title, created_at
             FROM sessions
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userID]
        );

        return res.json(result.rows)
    } catch (err) {
        console.error("[DB] Failed to list sessions:", err.message)
        return res.status(500).json({ msg: "Failed to list sessions" })
    }
})

// GET /chat/history/:id  — get messages for a session
router.get("/history/:id", async (req, res) => {
    const sessionID = req.params.id
    const userID = req.user?.userID

    const owns = await verifySession(sessionID, userID)
    if (!owns) return res.status(403).json({ msg: "Session not found or not yours" })

    try {
        const result = await mainDB.query(
            `SELECT message_id, message, ai, created_at
             FROM messages
             WHERE session_id = $1
             ORDER BY created_at ASC`,
            [sessionID]
        );

        return res.json(result.rows)
    } catch (err) {
        console.error("[DB] Failed to load history:", err.message)
        return res.status(500).json({ msg: "Failed to load history" })
    }
})

// GET /chat/identity/:id — room-scoped personality traits
router.get("/identity/:id", async (req, res) => {
    const sessionID = req.params.id
    const userID = req.user?.userID

    const owns = await verifySession(sessionID, userID)
    if (!owns) return res.status(403).json({ msg: "Session not found or not yours" })

    try {
        const result = await mainDB.query(
            `SELECT state FROM sessions WHERE session_id = $1`,
            [sessionID]
        )

        let state = result.rows[0]?.state ?? {}
        if (typeof state === "string") {
            state = JSON.parse(state)
        }

        const identity = state.identity ?? {
            traits: [],
            completeness: 0,
            lastUpdated: null,
        }

        return res.json({
            userId: sessionID,
            traits: identity.traits ?? [],
            completeness: identity.completeness ?? 0,
            lastUpdated: identity.lastUpdated ?? new Date().toISOString(),
        })
    } catch (err) {
        console.error("[DB] Failed to load identity:", err.message)
        return res.status(500).json({ msg: "Failed to load identity" })
    }
})

// GET /chat/state/:id — get session room state for the frontend
router.get("/state/:id", async (req, res) => {
    const sessionID = req.params.id
    const userID = req.user?.userID

    const owns = await verifySession(sessionID, userID)
    if (!owns) return res.status(403).json({ msg: "Session not found or not yours" })

    try {
        const result = await mainDB.query(
            `SELECT session_id, state, created_at
             FROM sessions
             WHERE session_id = $1`,
            [sessionID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Session not found" })
        }

        const row = result.rows[0]
        let state = row.state
        if (typeof state === "string") {
            state = JSON.parse(state)
        }

        return res.json({
            session_id: row.session_id,
            state,
            updated_at: row.created_at,
        })
    } catch (err) {
        console.error("[DB] Failed to load session state:", err.message)
        return res.status(500).json({ msg: "Failed to load session state" })
    }
})


export default router