import express from "express";
import mainDB from "../database.js";
import {
    analyzeSessionMatch,
    ensureMatchersTable,
} from "../models/matcher.js";

const router = express.Router();

let tableReady = false;

async function ensureTable() {
    if (tableReady) return;
    await ensureMatchersTable();
    tableReady = true;
}

async function verifySession(sessionID, userID) {
    try {
        const result = await mainDB.query(
            `SELECT session_id, state FROM sessions WHERE session_id = $1 AND user_id = $2`,
            [sessionID, userID]
        );
        return result.rows[0] ?? null;
    } catch (err) {
        console.error("[Match] Failed to verify session:", err.message);
        return null;
    }
}

function parseState(raw) {
    if (!raw) return {};
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }
    return raw;
}

/** GET /match/results/:sessionId — saved matches for one room */
router.get("/results/:sessionId", async (req, res) => {
    await ensureTable();

    const sessionID = req.params.sessionId;
    const userID = req.user?.userID;
    const row = await verifySession(sessionID, userID);

    if (!row) {
        return res.status(403).json({ error: "Session not found or not yours" });
    }

    const state = parseState(row.state);
    const matches = state.matches;

    if (!matches) {
        return res.status(404).json({ error: "No saved matches yet" });
    }

    return res.json({
        matches: matches.matches ?? [],
        isReady: Boolean(matches.isReady ?? matches.status),
        personality: matches.personality,
        analyzedAt: matches.analyzedAt,
        status: matches.status ?? "idle",
        message: matches.message ?? null,
    });
});

/** POST /match/analyze/:sessionId — LLM evaluate + weighted cosine match */
router.post("/analyze/:sessionId", async (req, res) => {
    await ensureTable();

    const sessionID = req.params.sessionId;
    const userID = req.user?.userID;
    const row = await verifySession(sessionID, userID);

    if (!row) {
        return res.status(403).json({ error: "Session not found or not yours" });
    }

    try {
        const result = await analyzeSessionMatch(sessionID, userID);
        return res.json({
            ...result,
            isReady: true,
        });
    } catch (err) {
        console.error("[Match] Analyze error:", err.message);
        return res.status(500).json({ error: "Match analysis failed" });
    }
});

export default router;
