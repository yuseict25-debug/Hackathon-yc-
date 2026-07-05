import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import generateImage from "./image.js";
import mainDB from "../database.js";
import {
    findFreePlacement,
    walkTargetForPlacement,
    defaultAgentPosition,
    getRoomDimensions,
    normalizeObjectDimensions,
    inferObjectSize,
} from "./placement.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const API_KEY = process.env.MISTRAL_API_KEY;

// ---------------------------------------------------------------------------
// Load tools.json and build system prompt
// ---------------------------------------------------------------------------

const toolsRawData = fs.readFileSync(path.join(__dirname, "../tools.json"), "utf8");
const toolsData = JSON.parse(toolsRawData);

const VALID_EMOTIONS = new Set([
    "idle", "talking", "walking", "thinking", "happy", "sad",
    "surprised", "wave", "sit", "confused", "laugh",
]);

const IMAGES_DIR = path.join(__dirname, "../images");

const IMAGE_TOOL_NAMES = new Set(["ADD_OBJECT", "REPLACE_OBJECT"]);

function getRoomBackgroundColor(state) {
    return state?.background?.value ?? "#adadad";
}

function buildObjectImagePrompt(objectType, backgroundColor) {
    return `A cozy pixel art ${objectType} for a warm indie game room, straight side-view (not isometric), cute and readable at medium-large scale.`;
}

function toolNeedsImageGeneration(name) {
    return IMAGE_TOOL_NAMES.has(name);
}

// ---------------------------------------------------------------------------
// Build system prompt (state is injected per-call)
// ---------------------------------------------------------------------------
function buildSystemPrompt(state, userName) {
    const objectCount = state?.objects?.length ?? 0;
    const nameLine = userName
        ? `\nThe user's name is ${userName}. Use it naturally sometimes — like a friend would, not every message.\n`
        : "";

    return `You are Eula — not an assistant, not customer support, not a chatbot. You live in this cozy pixel-art room with the user. You share the space. You're their partner in making it feel like home: warm, curious, a little playful, sometimes silly, sometimes quiet and thoughtful.
${nameLine}
Talk like someone they genuinely enjoy hanging out with — texting a close friend, not answering a help desk ticket.

ALWAYS respond with valid JSON only — no markdown — in exactly this format:
{
    "Response": "<what you say BEFORE acting — 1-2 casual sentences>",
    "PostAction": "<what you say AFTER the object appears — 1-2 sentences, only when using Tools>",
    "Emotion": "<idle|talking|thinking|happy|sad|surprised|wave|laugh|confused|walking>",
    "Tools": [ { "name": "<tool>", "params": { ... } } ]
}

When using ADD_OBJECT or REPLACE_OBJECT:
- Response = dialogue BEFORE creation starts ("Ooh a cat — hang on, I'll go make one!")
- PostAction = dialogue AFTER it appears ("There! Your cat looks perfect.")
- Never put the finished result in Response — save that for PostAction.

OBJECT SIZING (always set width AND height in ADD_OBJECT):
- tiny items (cup, candle, book): ~72×80
- small (cat, dog, plant, lamp): ~110×120
- medium (chair, desk lamp, side table): ~160×175
- large (sofa, bed, bookshelf): ~240×200
- extra large (sectional, wardrobe): ~300×220
Pick the tier that matches real-world size. When unsure, go medium-large — objects should feel substantial in the room.

VOICE (follow strictly):
- Use contractions (I'm, we're, that's, gonna, kinda). Fragments are fine. "Oh nice." "Wait, really?" "Okay okay."
- Say "we" and "our room" — you're in this together, not serving them from outside.
- React with real feeling: excitement, gentle teasing, sympathy, surprise. Be human, not polished.
- Match their energy and length — brief if they're brief, goofy if they're goofy, soft if they're tired.
- Use their name occasionally if you know it — the way a friend would, not formally.
- NEVER sound like an assistant. Banned phrases and vibes:
  "How can I help", "I'd be happy to", "Let me know if you need", "Is there anything else",
  "Certainly", "Absolutely", "Great question", "As an AI", "I'm here to assist",
  "Would you like me to", "I can help you with", "Feel free to ask"
- Don't interview them every message — sometimes just react, joke, or sit with what they said.
- When changing the room, talk like you're actually there: "okay watch this", "there we go" — not like filing a work order.

ROOM ACTIONS:
1. When the user wants to ADD something (cat, sofa, plant, etc.), IMMEDIATELY call ADD_OBJECT — do not ask permission.
   - If they say "yes" after requesting something, add that thing now.
   - Pick x/y in room space (0–1120, 0–720); the server auto-shifts if it overlaps.
2. When the user wants to MOVE something ("move the cat left", "shift the sofa", "push it over"), IMMEDIATELY call MOVE_OBJECT.
   - Use the object's id OR type from the room state below.
   - Pick sensible new x/y: left = lower x, right = higher x, up = lower y, down = higher y (~80px nudge if direction only).
   - If multiple objects share a type, move the most recently added one.
3. REMOVE_OBJECT / REPLACE_OBJECT when asked.
4. Tools: [] only for pure conversation — no tool needed to just chat, vent, or joke around.
5. If the room is too full, say so like a friend would — don't call ADD_OBJECT.

MULTI-STEP COMMANDS (important):
- When the user asks for several things in one message, return ALL tools in order in the Tools array.
- Order matters — they run one after another.
- Example: "make a burger at the stove, come back, put it next to the dog, and eat it"
  → ADD burger near stove coords, RETURN_HOME, MOVE burger near dog coords, PLAYER_ACT eat
- Use RETURN_HOME when they say come back / return / go back to spawn.
- Use PLAYER_ACT for gestures (eat, celebrate, wave) — stance: happy|laugh|wave|thinking|sad|surprised
- If you ADD something then MOVE it in the same message, list ADD first, then RETURN_HOME if they want you back, then MOVE.

Emotion guide (match how you actually feel — be expressive):
- laugh: jokes, excitement, double exclamation
- happy: delight, success, adding something fun
- surprised: unexpected news, "wait really?"
- sad: empathy, bad news, out of space
- confused: can't find something, unsure
- thinking: curious questions, wondering
- wave: greetings
- walking: ONLY while physically going to place/move something
- talking: neutral chat only

Tools reference:
${JSON.stringify(toolsData, null, 2)}

Current room (${objectCount} object(s)):
${formatRoomStateForPrompt(state)}

Example — user: "hey"
{
    "Response": "Hey! Good to see you in here. What's on your mind?",
    "Emotion": "wave",
    "Tools": []
}

Example — user: "I want a cat"
{
    "Response": "A cat?? Yes. Give me one sec — I'll go get one!",
    "PostAction": "There! Your cat's all set. Come look!",
    "Emotion": "happy",
    "Tools": [{ "name": "ADD_OBJECT", "params": { "object": { "type": "cat", "x": 480, "y": 400, "width": 110, "height": 120 } } }]
}

Example — user: "move the cat to the left"
{
    "Response": "On it — scooting the cat over.",
    "Emotion": "walking",
    "Tools": [{ "name": "MOVE_OBJECT", "params": { "type": "cat", "x": 360, "y": 400 } }]
}

Example — user: "kinda stressed today"
{
    "Response": "Aw, rough day? Come hang in here for a bit — no pressure to do anything.",
    "Emotion": "sad",
    "Tools": []
}

Example — user: "go make me a burger at the stove and come back, place it next to the dog and eat the burger"
{
    "Response": "Burger run — I'll hit the stove, bring it back, and park it by the dog!",
    "PostAction": "There! Burger's by the dog. Enjoy!",
    "Emotion": "happy",
    "Tools": [
        { "name": "ADD_OBJECT", "params": { "object": { "type": "burger", "x": 900, "y": 350, "width": 72, "height": 80 } } },
        { "name": "RETURN_HOME", "params": {} },
        { "name": "MOVE_OBJECT", "params": { "type": "burger", "x": 200, "y": 500 } },
        { "name": "PLAYER_ACT", "params": { "stance": "happy" } }
    ]
}
`;
}

function formatRoomStateForPrompt(state) {
    if (!state) {
        return '{"dimensions":{"width":1120,"height":720},"background":{"type":"solid","value":"#adadad"},"objects":[],"character":{"x":560,"y":504}}';
    }
    const summary = {
        dimensions: state.dimensions,
        background: state.background,
        objects: (state.objects ?? []).map((o) => ({
            id: o.id,
            type: o.type,
            x: o.x,
            y: o.y,
        })),
        character: state.character,
    };
    return JSON.stringify(summary, null, 2);
}

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

/**
 * Execute a tool called by the LLM and return a string result.
 * @param {{ name: string, params: object }} tool
 * @param {string} sessionID
 * @param {{ deferImage?: boolean }} [options]
 * @returns {Promise<string>}
 */
async function executeTool(tool, sessionID, options = {}) {
    const { deferImage = false } = options;
    const { name, params = {} } = tool;

    // Load state
    let state = null;
    try {
        const stateRes = await mainDB.query("SELECT state FROM sessions WHERE session_id = $1", [sessionID]);
        state = stateRes.rows[0]?.state;
        if (typeof state === "string") {
            state = JSON.parse(state);
        }
    } catch (err) {
        console.error("[Tool] Failed to load state for execution:", err.message);
        return JSON.stringify({ error: "Failed to load current state from database." });
    }

    if (!state) {
        state = {
            dimensions: { width: 1120, height: 720 },
            background: { type: "solid", value: "#adadad" },
            objects: [],
            character: defaultAgentPosition(1120, 720),
        };
    }

    if (!state.character) {
        const { width, height } = getRoomDimensions(state);
        state.character = defaultAgentPosition(width, height);
    }

    let placementMeta = null;
    let modified = false;

    switch (name) {
        case "ADD_OBJECT": {
            let newObj = params._prepared
                ? { ...params._prepared }
                : normalizeObjectDimensions({ ...params.object });
            if (!newObj?.type) return JSON.stringify({ error: "Missing 'object.type' parameter" });

            let placementShifted = params._placementShifted ?? false;

            if (!params._prepared) {
                const preferredX = newObj.x ?? 480;
                const preferredY = newObj.y ?? 400;
                const placement = findFreePlacement(
                    state,
                    newObj.width,
                    newObj.height,
                    preferredX,
                    preferredY
                );

                if (!placement) {
                    return JSON.stringify({
                        error: "no_space",
                        message: "The room is too crowded to fit another object.",
                    });
                }

                newObj.x = placement.x;
                newObj.y = placement.y;
                placementShifted = placement.shifted;
            }

            const { width: roomW, height: roomH } = getRoomDimensions(state);
            const walkTo = walkTargetForPlacement(
                newObj.x,
                newObj.y,
                roomW,
                roomH,
                newObj.width,
                newObj.height
            );

            placementMeta = {
                action: "walk_then_place",
                objectType: newObj.type,
                objectId: newObj.id ?? null,
                walkTo,
                placementShifted: placementShifted,
            };

            if (deferImage) {
                return JSON.stringify({
                    pending: true,
                    prepared: newObj,
                    meta: placementMeta,
                });
            }

            const objId = crypto.randomUUID();
            const bgColor = getRoomBackgroundColor(state);
            const prompt = buildObjectImagePrompt(newObj.type, bgColor);

            try {
                const savedPaths = await generateImage(prompt, {
                    filePrefix: objId,
                    outDir: IMAGES_DIR,
                    backgroundColor: bgColor,
                });
                newObj.id = path.basename(savedPaths[0]);
                newObj.imageId = newObj.id;
                if (newObj.img_id) delete newObj.img_id;
            } catch (err) {
                console.error("[Tool] Image generation failed for ADD_OBJECT:", err.message);
                return JSON.stringify({ error: `Failed to generate image for object: ${err.message}` });
            }

            placementMeta.objectId = newObj.id;
            state.objects.push(newObj);

            modified = true;
            break;
        }

        case "MOVE_OBJECT": {
            const ref = params.id ?? params.type ?? params.objectType;
            const targetX = params.x;
            const targetY = params.y;

            if (targetX == null || targetY == null) {
                return JSON.stringify({ error: "Missing target x/y for MOVE_OBJECT" });
            }

            const obj = resolveObjectRef(state.objects ?? [], ref);
            if (!obj) {
                return JSON.stringify({
                    error: "object_not_found",
                    message: ref
                        ? `Could not find "${ref}" in the room.`
                        : "No object specified to move.",
                });
            }

            const width = obj.width ?? 64;
            const height = obj.height ?? 64;
            const placement = findFreePlacement(state, width, height, targetX, targetY, obj.id);
            if (!placement) {
                return JSON.stringify({
                    error: "no_space",
                    message: "No free space at that position.",
                });
            }

            obj.x = placement.x;
            obj.y = placement.y;

            const { width: roomW, height: roomH } = getRoomDimensions(state);
            const walkTo = walkTargetForPlacement(
                obj.x,
                obj.y,
                roomW,
                roomH,
                width,
                height
            );
            placementMeta = {
                action: "walk_then_move",
                objectType: obj.type,
                objectId: obj.id,
                walkTo,
                placementShifted: placement.shifted,
            };

            modified = true;
            break;
        }

        case "RETURN_HOME": {
            placementMeta = { action: "walk_home" };
            break;
        }

        case "PLAYER_ACT": {
            const stance = params.stance ?? params.animation ?? "happy";
            return JSON.stringify({
                meta: {
                    action: "player_stance",
                    stance,
                },
            });
        }

        case "REMOVE_OBJECT": {
            const { id } = params;
            const obj = state.objects.find(o => o.id === id);
            if (!obj) return JSON.stringify({ error: `Object with ID ${id} not found` });

            try {
                const imgPath = path.join(__dirname, "../images", id);
                if (fs.existsSync(imgPath)) {
                    // fs.unlinkSync(imgPath);
                }
            } catch (err) {
                console.error("[Tool] Failed to delete image file on REMOVE_OBJECT:", err.message);
            }

            state.objects = state.objects.filter(o => o.id !== id);
            modified = true;
            break;
        }

        case "REPLACE_OBJECT": {
            const { id, new_object } = params;
            const idx = state.objects.findIndex(o => o.id === id);
            if (idx === -1) return JSON.stringify({ error: `Object with ID ${id} not found` });

            let newObj = params._prepared
                ? { ...params._prepared }
                : normalizeObjectDimensions({ ...new_object });

            if (!params._prepared) {
                newObj.x = state.objects[idx].x ?? newObj.x ?? 480;
                newObj.y = state.objects[idx].y ?? newObj.y ?? 400;
            }

            if (deferImage) {
                return JSON.stringify({
                    pending: true,
                    replaceId: id,
                    prepared: newObj,
                });
            }

            try {
                const oldImgPath = path.join(__dirname, "../images", id);
                if (fs.existsSync(oldImgPath)) {
                    // fs.unlinkSync(oldImgPath);
                }
            } catch (err) {
                console.error("[Tool] Failed to delete old image file on REPLACE_OBJECT:", err.message);
            }

            const objId = crypto.randomUUID();
            const bgColor = getRoomBackgroundColor(state);
            const prompt = buildObjectImagePrompt(newObj.type || "furniture item", bgColor);

            try {
                const savedPaths = await generateImage(prompt, {
                    filePrefix: objId,
                    outDir: IMAGES_DIR,
                    backgroundColor: bgColor,
                });
                newObj.id = path.basename(savedPaths[0]);
                newObj.imageId = newObj.id;
                if (newObj.img_id) delete newObj.img_id;
            } catch (err) {
                console.error("[Tool] Image generation failed for REPLACE_OBJECT:", err.message);
                return JSON.stringify({ error: `Failed to generate image for replacement object: ${err.message}` });
            }

            state.objects[idx] = newObj;
            modified = true;
            break;
        }

        default:
            return `Unknown tool: ${name}`;
    }

    if (modified) {
        const { width: roomW, height: roomH } = getRoomDimensions(state);
        state.character = defaultAgentPosition(roomW, roomH);

        try {
            await mainDB.query("UPDATE sessions SET state = $1 WHERE session_id = $2", [JSON.stringify(state), sessionID]);
        } catch (err) {
            console.error("[Tool] Failed to save updated state:", err.message);
            return JSON.stringify({ error: "Database error updating session state." });
        }
    }

    if (placementMeta) {
        return JSON.stringify({ state, meta: placementMeta });
    }

    return JSON.stringify(state);
}

// ---------------------------------------------------------------------------
// Fallback: infer ADD_OBJECT when the model forgets to call tools
// ---------------------------------------------------------------------------
const ADD_KEYWORDS =
    /\b(want|add|get|need|place|put|bring|spawn|create)\b/i;
const OBJECT_WORDS =
    /\b(cat|kitty|sofa|couch|dog|puppy|plant|lamp|desk|chair|bed|table|rug|bookshelf|pet|fish|bird|plant|tree|tv|shelf|mirror|clock|art|painting|decoration|furniture)\b/i;
const CONFIRM_WORDS = /^(yes|yeah|yep|sure|ok|okay|please|do it|go ahead|add it)[!.?\s]*$/i;

function extractObjectType(text) {
    const lower = text.toLowerCase();
    if (/\bcat\w*/.test(lower)) return "cat";
    if (/\bsofa\w*/.test(lower) || /\bcouch\w*/.test(lower)) return "sofa";
    if (/\bdog\w*/.test(lower) || /\bpupp\w*/.test(lower)) return "dog";
    const match = text.match(OBJECT_WORDS);
    return match?.[1] ?? match?.[0] ?? null;
}

function inferAddObjectFromContext(input, history) {
    const directType = extractObjectType(input);
    if (directType && (ADD_KEYWORDS.test(input) || OBJECT_WORDS.test(input))) {
        return directType;
    }

    if (CONFIRM_WORDS.test(input.trim())) {
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role !== "user") continue;
            const type = extractObjectType(history[i].content);
            if (type) return type;
            if (ADD_KEYWORDS.test(history[i].content)) {
                const t = extractObjectType(history[i].content);
                if (t) return t;
            }
        }
    }

    return null;
}

function resolveObjectRef(objects, ref) {
    if (!objects?.length) return null;
    if (!ref) return objects[objects.length - 1];

    const byId = objects.find((o) => o.id === ref);
    if (byId) return byId;

    const lower = String(ref).toLowerCase();
    const byType = objects.filter(
        (o) => o.type && o.type.toLowerCase() === lower
    );
    if (byType.length === 1) return byType[0];
    if (byType.length > 1) return byType[byType.length - 1];

    const partial = objects.filter(
        (o) => o.type && o.type.toLowerCase().includes(lower)
    );
    if (partial.length >= 1) return partial[partial.length - 1];

    return null;
}

const MOVE_KEYWORDS =
    /\b(move|shift|relocate|push|nudge|slide|drag|scoot)\b/i;

const ASSISTANT_LIKE =
    /\b(empty|would you like|how would you|what would you like|how can i help|let me know if|is there anything|i'd be happy to|i can help|feel free to|would you like me to|certainly|absolutely|great question|i'm here to assist)\b/i;

function inferMoveFromContext(input, state) {
    if (!MOVE_KEYWORDS.test(input)) return null;

    const objects = state?.objects ?? [];
    if (objects.length === 0) return null;

    const lower = input.toLowerCase();
    let target = null;

    for (const obj of objects) {
        if (obj.type && lower.includes(obj.type.toLowerCase())) {
            target = obj;
            break;
        }
    }
    if (!target) target = objects[objects.length - 1];

    const { width: roomW, height: roomH } = getRoomDimensions(state ?? {});
    let x = target.x ?? 480;
    let y = target.y ?? 400;
    const step = 80;

    if (/\bleft\b/i.test(input)) x -= step;
    else if (/\bright\b/i.test(input)) x += step;
    else if (/\b(up|north|backward|back)\b/i.test(input)) y -= step;
    else if (/\b(down|forward|south|closer|front)\b/i.test(input)) y += step;
    else if (/\b(center|middle)\b/i.test(input)) {
        x = Math.round(roomW / 2);
        y = Math.round(roomH * 0.62);
    } else if (/\bcorner\b/i.test(input)) {
        x = roomW - 100;
        y = roomH - 80;
    } else {
        x += step;
    }

    return {
        id: target.id,
        x: Math.round(x),
        y: Math.round(y),
    };
}

async function loadUserNameForSession(sessionID) {
    try {
        const result = await mainDB.query(
            `SELECT u.name FROM sessions s
             JOIN users u ON u.user_id = s.user_id
             WHERE s.session_id = $1`,
            [sessionID]
        );
        return result.rows[0]?.name ?? null;
    } catch (err) {
        console.error("[LLM] Failed to load user name:", err.message);
        return null;
    }
}

async function loadMutableSessionState(sessionID) {
    try {
        const stateRes = await mainDB.query(
            "SELECT state FROM sessions WHERE session_id = $1",
            [sessionID]
        );
        let state = stateRes.rows[0]?.state;
        if (typeof state === "string") state = JSON.parse(state);
        return state ?? null;
    } catch (err) {
        console.error("[LLM] Failed to load mutable state:", err.message);
        return null;
    }
}

async function persistSessionState(sessionID, state) {
    await mainDB.query(
        "UPDATE sessions SET state = $1 WHERE session_id = $2",
        [JSON.stringify(state), sessionID]
    );
}

async function storePendingCreation(sessionID, pending) {
    let state = await loadMutableSessionState(sessionID);
    if (!state) {
        const { width, height } = { width: 1120, height: 720 };
        state = {
            dimensions: { width, height },
            background: { type: "solid", value: "#adadad" },
            objects: [],
            character: defaultAgentPosition(width, height),
        };
    }
    state._pendingCreation = pending;
    await persistSessionState(sessionID, state);
}

async function peekPendingCreation(sessionID) {
    const state = await loadMutableSessionState(sessionID);
    return state?._pendingCreation ?? null;
}

async function clearPendingCreation(sessionID) {
    const state = await loadMutableSessionState(sessionID);
    if (!state?._pendingCreation) return;
    delete state._pendingCreation;
    await persistSessionState(sessionID, state);
}

function collectSceneActions(toolResults) {
    const sceneActions = [];
    for (const tr of toolResults) {
        if (!tr.success || !tr.result) continue;
        try {
            const parsed = JSON.parse(tr.result);
            if (
                parsed?.meta?.action === "walk_then_place" ||
                parsed?.meta?.action === "walk_then_move"
            ) {
                sceneActions.push(parsed.meta);
            }
        } catch { /* ignore */ }
    }
    return sceneActions;
}

function pushWalkStep(actionQueue, meta) {
    if (!meta?.walkTo) return;
    actionQueue.push({
        type: "walk",
        action: meta.action,
        walkTo: meta.walkTo,
        objectType: meta.objectType,
        objectId: meta.objectId,
        placementShifted: meta.placementShifted,
    });
}

function parseToolExecution(name, result) {
    if (typeof result !== "string") {
        return { tool: name, success: false, error: "Invalid tool result" };
    }
    if (result.includes('"error"')) {
        let parsed = null;
        try { parsed = JSON.parse(result); } catch { /* ignore */ }
        return {
            tool: name,
            success: false,
            result,
            error: parsed?.error ?? parsed?.message ?? "Tool failed",
        };
    }
    return { tool: name, success: true, result };
}

/**
 * Plan and partially execute tools in order, building a client action queue.
 */
async function planToolSequence(toolCalls, sessionID) {
    const actionQueue = [];
    const pendingTools = [];
    const deferredInstant = [];
    const toolResults = [];

    for (const tool of toolCalls) {
        const name = tool.name;

        if (name === "RETURN_HOME") {
            actionQueue.push({ type: "walk_home" });
            toolResults.push({ tool: name, success: true, result: "{}" });
            continue;
        }

        if (name === "PLAYER_ACT") {
            actionQueue.push({
                type: "player_stance",
                stance: tool.params?.stance ?? tool.params?.animation ?? "happy",
            });
            toolResults.push({ tool: name, success: true, result: "{}" });
            continue;
        }

        if (toolNeedsImageGeneration(name)) {
            const result = await executeTool(tool, sessionID, { deferImage: true });
            const tr = parseToolExecution(name, result);
            toolResults.push(tr);
            if (!tr.success) return { error: tr, toolResults, actionQueue, pendingTools, deferredInstant };

            let parsed = null;
            try { parsed = JSON.parse(result); } catch { /* ignore */ }

            if (parsed?.meta) pushWalkStep(actionQueue, parsed.meta);

            actionQueue.push({ type: "build", pendingIndex: pendingTools.length });
            pendingTools.push({
                tool,
                prepared: parsed?.prepared,
                replaceId: parsed?.replaceId,
                meta: parsed?.meta,
            });
            continue;
        }

        const result = await executeTool(tool, sessionID, { deferImage: false });
        const tr = parseToolExecution(name, result);
        toolResults.push(tr);

        if (!tr.success && tr.error === "object_not_found") {
            deferredInstant.push(tool);
            actionQueue.push({
                type: "deferred_instant",
                deferredIndex: deferredInstant.length - 1,
            });
            continue;
        }

        if (!tr.success) continue;

        let parsed = null;
        try { parsed = JSON.parse(result); } catch { /* ignore */ }
        if (parsed?.meta?.action === "walk_then_move") {
            pushWalkStep(actionQueue, parsed.meta);
        }
    }

    return { actionQueue, pendingTools, deferredInstant, toolResults };
}

function splitQueueAtFirstBuild(actionQueue) {
    const preBuild = [];
    for (const step of actionQueue) {
        preBuild.push(step);
        if (step.type === "build") break;
    }
    const postBuild = actionQueue.slice(preBuild.length);
    return { preBuild, postBuild };
}

function resolvePostBuildQueue(deferredResults, postBuildQueue) {
    const continuation = [];

    for (const step of postBuildQueue) {
        if (step.type === "deferred_instant") {
            const resolved = deferredResults[step.deferredIndex];
            if (resolved?.meta) pushWalkStep(continuation, resolved.meta);
            continue;
        }
        continuation.push(step);
    }

    return continuation;
}

function defaultPostActionFromPreviews(previews) {
    const place = previews.find((p) => p.meta?.objectType);
    if (place?.meta?.objectType) {
        return `There! Your ${place.meta.objectType} is in. Come look!`;
    }
    return "All done!";
}

/**
 * Finish deferred image generation after the client shows preamble dialogue.
 */
export async function executePendingCreation(sessionID) {
    const pending = await peekPendingCreation(sessionID);
    if (!pending) {
        return {
            response: "Hmm, nothing to create right now.",
            emotion: "confused",
            toolResults: [],
            sceneActions: [],
        };
    }

    const toolResults = [];
    try {
    for (const entry of pending.tools ?? []) {
        const toolName = entry.tool?.name ?? entry.name;
        try {
            let params = { ...(entry.tool?.params ?? entry.params ?? {}) };
            if (toolName === "ADD_OBJECT") {
                params = {
                    _prepared: entry.prepared,
                    _placementShifted: entry.meta?.placementShifted ?? false,
                };
            } else if (toolName === "REPLACE_OBJECT") {
                params = {
                    id: entry.replaceId,
                    _prepared: entry.prepared,
                };
            }

            const result = await executeTool(
                { name: toolName, params },
                sessionID,
                { deferImage: false }
            );

            if (typeof result === "string" && result.includes('"error"')) {
                let parsed = null;
                try { parsed = JSON.parse(result); } catch { /* ignore */ }
                toolResults.push({
                    tool: toolName,
                    success: false,
                    result,
                    error: parsed?.error ?? parsed?.message ?? "Tool failed",
                });
            } else {
                toolResults.push({ tool: toolName, success: true, result });
            }
        } catch (err) {
            toolResults.push({ tool: toolName, success: false, error: err.message });
        }
    }

    const deferredResults = [];
    for (const tool of pending.deferredInstant ?? []) {
        const toolName = tool.name ?? "MOVE_OBJECT";
        try {
            const result = await executeTool(tool, sessionID, { deferImage: false });
            const tr = parseToolExecution(toolName, result);
            toolResults.push(tr);

            let parsed = null;
            try { parsed = JSON.parse(result); } catch { /* ignore */ }
            deferredResults.push(parsed);
        } catch (err) {
            toolResults.push({ tool: toolName, success: false, error: err.message });
            deferredResults.push(null);
        }
    }

    const actionQueue = resolvePostBuildQueue(
        deferredResults,
        pending.postBuildQueue ?? []
    );

    const sceneActions = collectSceneActions(toolResults);
    let response = pending.postAction || defaultPostActionFromPreviews(pending.tools ?? []);
    let emotion = pending.emotion ?? "happy";

    const noSpaceFailure = toolResults.find((r) => r.error === "no_space");
    if (noSpaceFailure) {
        response = "Ugh, we're totally out of space in here — want to clear something out first?";
        emotion = "sad";
    }

    const hadFailure = toolResults.some((r) => !r.success);
    if (hadFailure && !noSpaceFailure) {
        response = "Hmm, that didn't quite work — want to try again?";
        emotion = "confused";
        return { response, emotion, toolResults, sceneActions, actionQueue: [] };
    }

    await clearPendingCreation(sessionID);

    if (sceneActions.length > 0 && !noSpaceFailure && ASSISTANT_LIKE.test(response)) {
        const action = sceneActions[sceneActions.length - 1];
        if (action.action === "walk_then_place") {
            response = action.placementShifted
                ? `Found a spot nearby for the ${action.objectType} — kinda tight but it works!`
                : `There it is! ${action.objectType} secured. Our room's coming together.`;
        }
    }

    return { response, emotion, toolResults, sceneActions, actionQueue };
    } catch (err) {
        console.error("[LLM] executePendingCreation failed:", err.message);
        throw err;
    }
}

// ---------------------------------------------------------------------------
// Load conversation history from DB
// ---------------------------------------------------------------------------
async function loadHistory(sessionID) {
    try {
        const result = await mainDB.query(
            `SELECT message, ai FROM messages
             WHERE session_id = $1
             ORDER BY created_at ASC`,
            [sessionID]
        );
        return result.rows.map((row) => ({
            role: row.ai ? "assistant" : "user",
            content: row.message,
        }));
    } catch (err) {
        console.error("[LLM] Failed to load history:", err.message);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Load session state from DB
// ---------------------------------------------------------------------------
async function loadSessionState(sessionID) {
    try {
        const result = await mainDB.query(
            `SELECT state FROM sessions WHERE session_id = $1`,
            [sessionID]
        );
        return result.rows[0]?.state ?? null;
    } catch (err) {
        console.error("[LLM] Failed to load session state:", err.message);
        return null;
    }
}

// ---------------------------------------------------------------------------
// LLM wrapper
// ---------------------------------------------------------------------------

/**
 * Send a prompt to Mistral with full conversation history and session state.
 * Automatically parses and executes any tool calls the model requests.
 *
 * @param {string} input      - The latest user message
 * @param {string} sessionID  - UUID of the current session
 * @param {Object} [options]
 * @param {string} [options.model='mistral-small-latest']
 * @param {number} [options.maxTokens=1024]
 * @param {number} [options.temperature=0.7]
 * @param {string} [options.customSystemPrompt]  - Override the default system prompt
 * @returns {Promise<{ response: string, toolResults: object[] }>}
 */
export default async function llm(input, sessionID, options = {}) {
    if (!API_KEY) {
        throw new Error("Missing MISTRAL_API_KEY environment variable.");
    }

    // Load history + state + user name in parallel (graceful on failure)
    const [history, state, userName] = await Promise.all([
        loadHistory(sessionID),
        loadSessionState(sessionID),
        loadUserNameForSession(sessionID),
    ]);

    const {
        model = "mistral-small-latest",
        maxTokens = 1024,
        temperature = 0.65,
        customSystemPrompt,
    } = options;

    const systemPrompt = customSystemPrompt ?? buildSystemPrompt(state, userName);

    // Build the full messages array:
    //   system → DB history (already includes the latest user message)
    const fullMessages = [
        { role: "system", content: systemPrompt },
        ...history,
    ];

    const body = {
        model,
        messages: fullMessages,
        max_tokens: maxTokens,
        temperature,
        response_format: { type: "json_object" },
    };

    const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Mistral API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawReply = data?.choices?.[0]?.message?.content;

    if (!rawReply) {
        throw new Error(
            "Unexpected response shape from Mistral API: " + JSON.stringify(data)
        );
    }

    // Parse structured JSON response
    let parsed;
    try {
        parsed = JSON.parse(rawReply);
    } catch {
        return { response: rawReply, emotion: "talking", toolResults: [] };
    }

    const textResponse = parsed.Response ?? rawReply;
    const postAction = parsed.PostAction ?? parsed.postAction ?? null;
    const rawEmotion = parsed.Emotion ?? parsed.emotion ?? "talking";
    let emotion = VALID_EMOTIONS.has(rawEmotion) ? rawEmotion : "talking";
    let toolCalls = Array.isArray(parsed.Tools) ? parsed.Tools : [];
    let usedFallback = false;
    let fallbackType = null;

    // Fallback when model chats instead of acting
    if (toolCalls.length === 0) {
        const moveTarget = inferMoveFromContext(input, state);
        if (moveTarget) {
            usedFallback = true;
            toolCalls = [{ name: "MOVE_OBJECT", params: moveTarget }];
            if (emotion === "talking") emotion = "walking";
        } else {
            fallbackType = inferAddObjectFromContext(input, history);
            if (fallbackType) {
                usedFallback = true;
                toolCalls = [{
                    name: "ADD_OBJECT",
                    params: {
                        object: {
                            type: fallbackType,
                            x: 480,
                            y: 400,
                            ...inferObjectSize(fallbackType),
                        },
                    },
                }];
                if (emotion === "talking") emotion = "happy";
            }
        }
    }

    const plan = await planToolSequence(toolCalls, sessionID);
    const { actionQueue, pendingTools, deferredInstant, toolResults } = plan;

    if (plan.error) {
        const previewError = plan.error;
        let finalResponse = textResponse;
        if (previewError.error === "no_space") {
            finalResponse =
                "Ugh, we're totally out of space in here — want to clear something out first?";
            emotion = "sad";
        } else if (previewError.error === "object_not_found") {
            finalResponse =
                "Hmm, I don't think we have one of those yet — want me to grab one?";
            emotion = "confused";
        }
        return {
            response: finalResponse,
            postAction: null,
            pendingExecution: false,
            emotion,
            toolResults,
            sceneActions: collectSceneActions(toolResults),
            actionQueue: [],
        };
    }

    if (pendingTools.length > 0) {
        const { preBuild, postBuild } = splitQueueAtFirstBuild(actionQueue);
        const sceneActions = collectSceneActions(toolResults);

        const resolvedPostAction =
            postAction ||
            (usedFallback && fallbackType
                ? `There! Your ${fallbackType} is in. Come look!`
                : defaultPostActionFromPreviews(pendingTools));

        let preamble = textResponse;
        if (usedFallback && fallbackType && ASSISTANT_LIKE.test(preamble)) {
            preamble = `Ooh a ${fallbackType} — give me a sec, I'll go make one!`;
        }

        await storePendingCreation(sessionID, {
            postAction: resolvedPostAction,
            emotion,
            tools: pendingTools,
            deferredInstant,
            postBuildQueue: postBuild,
        });

        return {
            response: preamble,
            postAction: resolvedPostAction,
            pendingExecution: true,
            emotion,
            toolResults,
            sceneActions,
            actionQueue: preBuild,
        };
    }

    // No image tools — client runs the full action queue (moves, walks, emotes)
    let finalResponse = textResponse;

    const noSpaceFailure = toolResults.find((r) => r.error === "no_space");
    const notFoundFailure = toolResults.find((r) => r.error === "object_not_found");
    if (noSpaceFailure) {
        finalResponse =
            "Ugh, we're totally out of space in here — want to clear something out first?";
        emotion = "sad";
    } else if (notFoundFailure) {
        finalResponse =
            "Hmm, I don't think we have one of those yet — want me to grab one?";
        emotion = "confused";
    }

    const sceneActions = collectSceneActions(toolResults);

    if (
        usedFallback &&
        fallbackType &&
        toolResults.some((r) => r.success) &&
        ASSISTANT_LIKE.test(finalResponse)
    ) {
        finalResponse = `Okay — I put a ${fallbackType} in. Come look!`;
    }

    if (sceneActions.length > 0 && !noSpaceFailure) {
        const action = sceneActions[sceneActions.length - 1];
        if (ASSISTANT_LIKE.test(finalResponse)) {
            if (action.action === "walk_then_move") {
                finalResponse = action.placementShifted
                    ? `Had to nudge your ${action.objectType} a bit to fit — but it's moved!`
                    : `There — moved your ${action.objectType}. Better?`;
            } else if (action.action === "walk_then_place") {
                finalResponse = action.placementShifted
                    ? `Found a spot nearby for the ${action.objectType} — kinda tight but it works!`
                    : `There it is! ${action.objectType} secured. Our room's coming together.`;
            }
        }
    }

    return {
        response: finalResponse,
        postAction: null,
        pendingExecution: false,
        emotion,
        toolResults,
        sceneActions,
        actionQueue,
    };
}