/** Room-space placement helpers (origin = top-left of room footprint). */

const PLACEMENT_PADDING = 20;
const GRID_STEP = 48;

export function getRoomDimensions(state) {
    const width = state?.dimensions?.width ?? 1120;
    const height = state?.dimensions?.height ?? 720;
    return { width, height };
}

export const DEFAULT_ROOM_WIDTH = 1120;
export const DEFAULT_ROOM_HEIGHT = 720;

function objectRect(obj, padding = 0) {
    const w = obj.width ?? 64;
    const h = obj.height ?? 64;
    const cx = obj.x ?? 0;
    const cy = obj.y ?? 0;
    return {
        x: cx - w / 2 - padding,
        y: cy - h / 2 - padding,
        width: w + padding * 2,
        height: h + padding * 2,
    };
}

function rectsOverlap(a, b) {
    return !(
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
    );
}

function fitsInRoom(rect, roomW, roomH) {
    return (
        rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= roomW &&
        rect.y + rect.height <= roomH
    );
}

function isFreeAt(objects, roomW, roomH, x, y, width, height) {
    const candidate = { x, y, width, height };
    const rect = objectRect(candidate, PLACEMENT_PADDING);
    if (!fitsInRoom(rect, roomW, roomH)) return false;
    return !objects.some((obj) => rectsOverlap(rect, objectRect(obj, PLACEMENT_PADDING)));
}

function buildCandidateGrid(roomW, roomH, width, height, preferredX, preferredY) {
    const candidates = [{ x: preferredX, y: preferredY }];
    const halfW = width / 2;
    const halfH = height / 2;
    const margin = Math.max(halfW, halfH) + PLACEMENT_PADDING;

    for (let radius = GRID_STEP; radius <= Math.max(roomW, roomH); radius += GRID_STEP) {
        for (let dx = -radius; dx <= radius; dx += GRID_STEP) {
            for (let dy = -radius; dy <= radius; dy += GRID_STEP) {
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                const x = Math.round(preferredX + dx);
                const y = Math.round(preferredY + dy);
                if (x < margin || y < margin || x > roomW - margin || y > roomH - margin) {
                    continue;
                }
                candidates.push({ x, y });
            }
        }
    }

    return candidates;
}

/**
 * Find a non-overlapping position in room space.
 * @returns {{ x: number, y: number, shifted: boolean } | null}
 */
export function findFreePlacement(state, width, height, preferredX, preferredY, excludeId = null) {
    const objects = (state?.objects ?? []).filter((obj) => obj.id !== excludeId);
    const { width: roomW, height: roomH } = getRoomDimensions(state);
    const candidates = buildCandidateGrid(roomW, roomH, width, height, preferredX, preferredY);

    for (const { x, y } of candidates) {
        if (isFreeAt(objects, roomW, roomH, x, y, width, height)) {
            const shifted = x !== preferredX || y !== preferredY;
            return { x, y, shifted };
        }
    }

    return null;
}

/** Stand beside the object — not overlapping its footprint. */
export function walkTargetForPlacement(
    objX,
    objY,
    roomW,
    roomH,
    objWidth = 64,
    objHeight = 64
) {
    const GAP = 32;
    const CHAR_HALF = 28;
    // Frontend renders furniture taller than backend bbox; use visual height for spacing.
    const visualH = Math.max(objHeight, 150);
    const visualW = Math.max(objWidth, 100);
    const halfW = visualW / 2;
    const halfH = visualH / 2;

    const minX = CHAR_HALF + 16;
    const maxX = roomW - CHAR_HALF - 16;
    const feetY = Math.min(objY + halfH + 12, roomH - 44);

    // Prefer standing to the right; fall back to left, then below.
    const rightX = objX + halfW + GAP + CHAR_HALF;
    const leftX = objX - halfW - GAP - CHAR_HALF;

    let x = rightX;
    if (x > maxX) x = leftX;
    if (x < minX) {
        x = Math.max(minX, Math.min(maxX, objX));
        return {
            x: Math.round(x),
            y: Math.round(Math.min(feetY + halfH + GAP, roomH - 44)),
        };
    }

    return {
        x: Math.round(Math.max(minX, Math.min(maxX, x))),
        y: Math.round(feetY),
    };
}

export function defaultAgentPosition(roomW, roomH) {
    return { x: Math.round(roomW / 2), y: Math.round(roomH * 0.7) };
}

/** Size tiers in room-space pixels — overall larger than legacy 64px defaults. */
const SIZE_TIERS = {
    tiny: { width: 72, height: 80 },
    small: { width: 110, height: 120 },
    medium: { width: 160, height: 175 },
    large: { width: 240, height: 200 },
    xl: { width: 300, height: 220 },
};

const TIER_PATTERNS = [
    { tier: "xl", re: /\b(sofa|couch|bed|bookshelf|bookcase|wardrobe|cabinet|shelf)\b/i },
    { tier: "large", re: /\b(desk|table|dresser|counter|bench|tv|television|monitor|fridge|refrigerator)\b/i },
    { tier: "medium", re: /\b(chair|stool|plant|planter|lamp|floor.?lamp|rug|mirror|clock|radio|speaker)\b/i },
    { tier: "small", re: /\b(cat|dog|puppy|kitten|pet|fish|bird|hamster|robot|doll|toy|vase|frame|picture|poster)\b/i },
    { tier: "tiny", re: /\b(cup|mug|book|candle|flower|pot|mug|plate|bowl|phone|key|coin)\b/i },
];

/**
 * Infer display footprint from object type when the LLM omits width/height.
 * @param {string} type
 * @returns {{ width: number, height: number }}
 */
export function inferObjectSize(type) {
    if (!type) return { ...SIZE_TIERS.medium };
    const lower = String(type).toLowerCase();
    for (const { tier, re } of TIER_PATTERNS) {
        if (re.test(lower)) return { ...SIZE_TIERS[tier] };
    }
    return { ...SIZE_TIERS.medium };
}

/** Apply inferred dimensions when width/height are missing. */
export function normalizeObjectDimensions(obj) {
    const inferred = inferObjectSize(obj?.type);
    return {
        ...obj,
        width: obj?.width ?? inferred.width,
        height: obj?.height ?? inferred.height,
    };
}
