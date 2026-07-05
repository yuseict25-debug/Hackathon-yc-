import dotenv from "dotenv";
import mainDB from "../database.js";

dotenv.config();

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const API_KEY = process.env.MISTRAL_API_KEY;

/** Minimum user messages in this room before we attempt evaluation */
export const MIN_USER_MESSAGES = 3;

/** Weighted cosine similarity must meet or exceed this to count as a match */
export const SIMILARITY_CUTOFF = 0.72;

/** LLM must be at least this confident that the transcript is informative */
export const MIN_LLM_CONFIDENCE = 0.35;

export const DIMENSIONS = [
    "social_energy",
    "expressiveness",
    "emotional_warmth",
    "emotional_stability",
    "optimism",
    "analytical_vs_intuitive",
    "structured_vs_spontaneous",
    "decision_speed",
    "proactivity",
    "risk_tolerance",
    "novelty_seeking",
    "communication_directness",
    "communication_verbosity",
    "cooperativeness",
    "trust_level",
    "independence_orientation",
    "achievement_orientation",
    "tradition_vs_innovation",
];

/** Higher weight = more important for friendship-style matching */
export const DIMENSION_WEIGHTS = {
    social_energy: 1.15,
    expressiveness: 1.0,
    emotional_warmth: 1.25,
    emotional_stability: 1.1,
    optimism: 1.0,
    analytical_vs_intuitive: 0.9,
    structured_vs_spontaneous: 0.95,
    decision_speed: 0.85,
    proactivity: 1.0,
    risk_tolerance: 0.9,
    novelty_seeking: 1.0,
    communication_directness: 1.15,
    communication_verbosity: 0.9,
    cooperativeness: 1.2,
    trust_level: 1.15,
    independence_orientation: 0.95,
    achievement_orientation: 0.9,
    tradition_vs_innovation: 0.85,
};

const DIMENSION_LABELS = {
    social_energy: "Social energy",
    expressiveness: "Expressiveness",
    emotional_warmth: "Emotional warmth",
    emotional_stability: "Emotional stability",
    optimism: "Optimism",
    analytical_vs_intuitive: "Analytical thinking",
    structured_vs_spontaneous: "Structure",
    decision_speed: "Decision speed",
    proactivity: "Proactivity",
    risk_tolerance: "Risk tolerance",
    novelty_seeking: "Novelty seeking",
    communication_directness: "Direct communication",
    communication_verbosity: "Expressive communication",
    cooperativeness: "Cooperativeness",
    trust_level: "Trust",
    independence_orientation: "Independence",
    achievement_orientation: "Achievement drive",
    tradition_vs_innovation: "Openness to change",
};

const EVAL_SYSTEM_PROMPT = `You are a personality analyst. Read ONLY the user's messages in a cozy chat-room conversation and infer their personality on 18 dimensions.

Each dimension is a float from 0.0 to 1.0:
- 0.0 = low end of the trait (e.g. introverted, reserved, cautious)
- 1.0 = high end of the trait (e.g. extroverted, expressive, bold)
- 0.5 = neutral / unclear

Dimensions:
- social_energy: introverted (0) ↔ extroverted (1)
- expressiveness: reserved (0) ↔ expressive (1)
- emotional_warmth: cool/distant (0) ↔ warm/caring (1)
- emotional_stability: reactive (0) ↔ steady (1)
- optimism: pessimistic (0) ↔ optimistic (1)
- analytical_vs_intuitive: analytical (0) ↔ intuitive (1)
- structured_vs_spontaneous: structured (0) ↔ spontaneous (1)
- decision_speed: deliberate (0) ↔ fast (1)
- proactivity: passive (0) ↔ proactive (1)
- risk_tolerance: risk-averse (0) ↔ risk-seeking (1)
- novelty_seeking: prefers familiar (0) ↔ seeks novelty (1)
- communication_directness: indirect (0) ↔ direct (1)
- communication_verbosity: concise (0) ↔ verbose (1)
- cooperativeness: independent (0) ↔ cooperative (1)
- trust_level: guarded (0) ↔ trusting (1)
- independence_orientation: interdependent (0) ↔ independent (1)
- achievement_orientation: process-focused (0) ↔ achievement-focused (1)
- tradition_vs_innovation: traditional (0) ↔ innovative (1)

If the transcript is too short, vague, or mostly small talk with no personality signal, set enoughInfo to false and confidence below 0.35.

Respond with valid JSON only — no markdown:
{
  "enoughInfo": true,
  "confidence": 0.0,
  "headline": "One short sentence summarizing their vibe",
  "topTraits": ["trait label", "..."],
  "social_energy": 0.0,
  "expressiveness": 0.0,
  "emotional_warmth": 0.0,
  "emotional_stability": 0.0,
  "optimism": 0.0,
  "analytical_vs_intuitive": 0.0,
  "structured_vs_spontaneous": 0.0,
  "decision_speed": 0.0,
  "proactivity": 0.0,
  "risk_tolerance": 0.0,
  "novelty_seeking": 0.0,
  "communication_directness": 0.0,
  "communication_verbosity": 0.0,
  "cooperativeness": 0.0,
  "trust_level": 0.0,
  "independence_orientation": 0.0,
  "achievement_orientation": 0.0,
  "tradition_vs_innovation": 0.0
}`;

function clamp01(value, fallback = 0.5) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(1, Math.max(0, n));
}

function rowToVector(row) {
    const vector = {};
    for (const key of DIMENSIONS) {
        vector[key] = clamp01(row[key]);
    }
    return vector;
}

export function weightedCosineSimilarity(vecA, vecB) {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (const key of DIMENSIONS) {
        const weight = DIMENSION_WEIGHTS[key] ?? 1;
        const a = vecA[key] ?? 0.5;
        const b = vecB[key] ?? 0.5;
        dot += weight * a * b;
        normA += weight * a * a;
        normB += weight * b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function sharedTraitLabels(vecA, vecB, limit = 3) {
    return DIMENSIONS.map((key) => {
        const a = vecA[key] ?? 0.5;
        const b = vecB[key] ?? 0.5;
        const avg = (a + b) / 2;
        const closeness = 1 - Math.abs(a - b);
        return {
            key,
            label: DIMENSION_LABELS[key],
            score: avg * closeness,
        };
    })
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
        .map((item) => item.label);
}

async function loadUserMessages(sessionID) {
    const result = await mainDB.query(
        `SELECT message FROM messages
         WHERE session_id = $1 AND ai = false
         ORDER BY created_at ASC`,
        [sessionID]
    );
    return result.rows.map((row) => row.message);
}

async function loadConversationForEval(sessionID) {
    const result = await mainDB.query(
        `SELECT message, ai FROM messages
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [sessionID]
    );
    return result.rows;
}

async function callMistralEval(transcript) {
    if (!API_KEY) {
        throw new Error("Missing MISTRAL_API_KEY environment variable.");
    }

    const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [
                { role: "system", content: EVAL_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Analyze this room conversation transcript:\n\n${transcript}`,
                },
            ],
            max_tokens: 800,
            temperature: 0.2,
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Mistral API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
        throw new Error("Empty response from Mistral personality evaluator");
    }

    return JSON.parse(raw);
}

export async function upsertMatcherProfile(sessionID, evaluation) {
    const values = [sessionID];
    const columns = ["session_id"];
    const updates = [];

    for (const key of DIMENSIONS) {
        columns.push(key);
        values.push(clamp01(evaluation[key]));
        updates.push(`${key} = EXCLUDED.${key}`);
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

    await mainDB.query(
        `INSERT INTO matchers (${columns.join(", ")})
         VALUES (${placeholders})
         ON CONFLICT (session_id) DO UPDATE SET ${updates.join(", ")}`,
        values
    );
}

export async function loadMatcherProfile(sessionID) {
    const result = await mainDB.query(
        `SELECT * FROM matchers WHERE session_id = $1`,
        [sessionID]
    );
    return result.rows[0] ?? null;
}

async function loadCandidateProfiles(sessionID, userID) {
    const result = await mainDB.query(
        `SELECT m.*, u.name AS user_name, u.user_id, s.title AS session_title
         FROM matchers m
         JOIN sessions s ON s.session_id = m.session_id
         JOIN users u ON u.user_id = s.user_id
         WHERE m.session_id != $1
           AND s.user_id != $2`,
        [sessionID, userID]
    );
    return result.rows;
}

async function saveMatchResults(sessionID, payload) {
    const stateResult = await mainDB.query(
        `SELECT state FROM sessions WHERE session_id = $1`,
        [sessionID]
    );

    let state = stateResult.rows[0]?.state ?? {};
    if (typeof state === "string") {
        state = JSON.parse(state);
    }

    state.matches = payload;

    await mainDB.query(
        `UPDATE sessions SET state = $1 WHERE session_id = $2`,
        [JSON.stringify(state), sessionID]
    );
}

function buildMatchSummary(name, score, sharedTraits) {
    const pct = Math.round(score * 100);
    const traits =
        sharedTraits.length > 0
            ? sharedTraits.join(", ").toLowerCase()
            : "communication style and emotional tone";
    return `You and ${name} overlap ${pct}% on personality — especially in ${traits}.`;
}

function insufficientResult(message, completeness = 0) {
    return {
        status: "insufficient_data",
        message,
        matches: [],
        personality: {
            headline: "",
            traits: [],
            completeness,
        },
        analyzedAt: new Date().toISOString(),
    };
}

/**
 * Evaluate this room's conversation via LLM, upsert matchers row, find best match.
 */
export async function analyzeSessionMatch(sessionID, userID) {
    const userMessages = await loadUserMessages(sessionID);

    if (userMessages.length < MIN_USER_MESSAGES) {
        const result = insufficientResult(
            "Not enough info — you need more interaction",
            userMessages.length / Math.max(MIN_USER_MESSAGES, 1) * 0.25
        );
        await saveMatchResults(sessionID, result);
        return result;
    }

    const rows = await loadConversationForEval(sessionID);
    const transcript = rows
        .map((row) => `${row.ai ? "Eula" : "User"}: ${row.message}`)
        .join("\n");

    let evaluation;
    try {
        evaluation = await callMistralEval(transcript);
    } catch (err) {
        console.error("[Matcher] LLM evaluation failed:", err.message);
        throw err;
    }

    const confidence = clamp01(evaluation.confidence, 0);
    const enoughInfo =
        evaluation.enoughInfo !== false &&
        confidence >= MIN_LLM_CONFIDENCE;

    if (!enoughInfo) {
        const result = insufficientResult(
            "Not enough info — you need more interaction",
            confidence
        );
        await saveMatchResults(sessionID, result);
        return result;
    }

    await upsertMatcherProfile(sessionID, evaluation);

    const selfVector = rowToVector(evaluation);
    const candidates = await loadCandidateProfiles(sessionID, userID);

    if (candidates.length === 0) {
        const result = {
            status: "no_match",
            message:
                "We read your personality, but there isn't anyone to match with yet. Check back once more people join.",
            matches: [],
            personality: {
                headline: evaluation.headline ?? "Getting to know you",
                traits: Array.isArray(evaluation.topTraits)
                    ? evaluation.topTraits.slice(0, 6)
                    : [],
                completeness: confidence,
            },
            analyzedAt: new Date().toISOString(),
        };
        await saveMatchResults(sessionID, result);
        return result;
    }

    let best = null;
    for (const candidate of candidates) {
        const candidateVector = rowToVector(candidate);
        const score = weightedCosineSimilarity(selfVector, candidateVector);
        if (!best || score > best.score) {
            best = { candidate, score, candidateVector };
        }
    }

    if (!best || best.score < SIMILARITY_CUTOFF) {
        const result = {
            status: "no_match",
            message:
                "We analyzed your personality, but no strong match yet. Keep chatting — a better fit might show up.",
            matches: [],
            personality: {
                headline: evaluation.headline ?? "Getting to know you",
                traits: Array.isArray(evaluation.topTraits)
                    ? evaluation.topTraits.slice(0, 6)
                    : [],
                completeness: confidence,
            },
            analyzedAt: new Date().toISOString(),
        };
        await saveMatchResults(sessionID, result);
        return result;
    }

    const { candidate, score, candidateVector } = best;
    const sharedTraits = sharedTraitLabels(selfVector, candidateVector);

    const result = {
        status: "success",
        message: "It's a match!",
        matches: [
            {
                id: candidate.session_id,
                name: candidate.user_name ?? "Someone",
                compatibilityScore: Number(score.toFixed(4)),
                sharedTraits,
                matchType: "friendship",
                summary: buildMatchSummary(
                    candidate.user_name ?? "Someone",
                    score,
                    sharedTraits
                ),
                avatarColor: "#e8a87c",
                vibe: candidate.session_title ?? "Similar vibe",
            },
        ],
        personality: {
            headline: evaluation.headline ?? "Getting to know you",
            traits: Array.isArray(evaluation.topTraits)
                ? evaluation.topTraits.slice(0, 6)
                : [],
            completeness: confidence,
        },
        analyzedAt: new Date().toISOString(),
    };

    await saveMatchResults(sessionID, result);
    return result;
}

export async function ensureMatchersTable() {
    await mainDB.query(`
        CREATE TABLE IF NOT EXISTS matchers (
            session_id UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
            social_energy FLOAT,
            expressiveness FLOAT,
            emotional_warmth FLOAT,
            emotional_stability FLOAT,
            optimism FLOAT,
            analytical_vs_intuitive FLOAT,
            structured_vs_spontaneous FLOAT,
            decision_speed FLOAT,
            proactivity FLOAT,
            risk_tolerance FLOAT,
            novelty_seeking FLOAT,
            communication_directness FLOAT,
            communication_verbosity FLOAT,
            cooperativeness FLOAT,
            trust_level FLOAT,
            independence_orientation FLOAT,
            achievement_orientation FLOAT,
            tradition_vs_innovation FLOAT
        )
    `);
}
