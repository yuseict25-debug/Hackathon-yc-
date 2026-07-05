import { BASE_HEIGHT, BASE_WIDTH } from "@/engine/constants";
import type { AnimationState } from "@/types/character";
import type { Message } from "@/types/conversation";
import type { FurnitureItem } from "@/types/furniture";
import type {
  AiMessageResponse,
  ActionStep,
  CharacterTonePayload,
  SceneAction,
} from "@/types/characterTone";
import {
  FURNITURE_SPRITE_HEIGHT,
  ROOM_DEFAULT_HEIGHT,
  ROOM_DEFAULT_WIDTH,
} from "@/engine/constants";
import { backendImageUrl } from "@/lib/images";
import type { RoomStatePayload, RoomCharacterState } from "@/types/roomState";

export interface BackendSessionState {
  dimensions?: { width?: number; height?: number };
  background?: { type?: string; value?: string };
  character?: { x?: number; y?: number };
  objects?: Array<{
    id: string;
    imageId?: string;
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }>;
}

export interface BackendHistoryMessage {
  message_id: string | number;
  message: string;
  ai: boolean;
  created_at: string;
}

export interface BackendSceneActionMeta {
  action: "walk_then_place" | "walk_then_move" | "walk_home" | "player_stance";
  objectType?: string;
  objectId?: string;
  walkTo?: { x: number; y: number };
  placementShifted?: boolean;
  stance?: string;
}

export interface BackendActionStep {
  type: "walk" | "walk_home" | "build" | "player_stance" | "deferred_instant";
  action?: "walk_then_place" | "walk_then_move";
  walkTo?: { x: number; y: number };
  objectType?: string;
  objectId?: string;
  placementShifted?: boolean;
  stance?: string;
  pendingIndex?: number;
  deferredIndex?: number;
}

export interface BackendChatResponse {
  response?: {
    response?: string;
    postAction?: string | null;
    pendingExecution?: boolean;
    emotion?: string;
    sceneActions?: BackendSceneActionMeta[];
    actionQueue?: BackendActionStep[];
    toolResults?: Array<{
      tool?: string;
      success?: boolean;
      result?: string;
      error?: string;
    }>;
  };
}

const EMOTION_TONE: Record<AnimationState, string> = {
  idle: "warm",
  talking: "warm",
  walking: "warm",
  thinking: "curious",
  happy: "warm",
  sad: "empathetic",
  surprised: "excited",
  wave: "warm",
  sit: "warm",
  confused: "curious",
  laugh: "playful",
};

export function roomToCanvas(
  x: number,
  y: number,
  roomW = ROOM_DEFAULT_WIDTH,
  roomH = ROOM_DEFAULT_HEIGHT
): { x: number; y: number } {
  return {
    x: BASE_WIDTH / 2 - roomW / 2 + x,
    y: BASE_HEIGHT / 2 - roomH / 2 + y,
  };
}

const EMOTION_SPEED: Partial<Record<AnimationState, number>> = {
  laugh: 0.16,
  happy: 0.14,
  sad: 0.08,
  surprised: 0.13,
  thinking: 0.09,
  confused: 0.09,
  wave: 0.1,
  walking: 0.15,
  talking: 0.1,
};

export function mapBackendEmotion(emotion: string): CharacterTonePayload {
  const animation = (
    emotion in EMOTION_TONE ? emotion : "talking"
  ) as AnimationState;

  return {
    tone: EMOTION_TONE[animation] ?? "warm",
    animation,
    speed: EMOTION_SPEED[animation] ?? 0.12,
    loop: animation !== "wave",
  };
}

function parseToolResultState(raw: unknown): BackendSessionState | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { state?: BackendSessionState } & BackendSessionState;
  return obj.state ?? obj;
}

function parseBackendState(raw: unknown): BackendSessionState | null {
  return parseToolResultState(raw);
}

function mapCharacterFromState(
  state: BackendSessionState
): RoomCharacterState | undefined {
  if (state.character?.x == null || state.character?.y == null) return undefined;

  const roomW = state.dimensions?.width ?? ROOM_DEFAULT_WIDTH;
  const roomH = state.dimensions?.height ?? ROOM_DEFAULT_HEIGHT;
  const canvas = roomToCanvas(state.character.x, state.character.y, roomW, roomH);

  return {
    x: canvas.x,
    y: canvas.y,
    direction: "down",
  };
}

export function mapBackendStateToRoomState(
  state: BackendSessionState,
  sessionId: string,
  updatedAt?: string,
  movementControl: "player" | "backend" = "player"
): RoomStatePayload {
  const bgValue = state.background?.value ?? "#ffffff";
  const character = mapCharacterFromState(state);

  return {
    revision: updatedAt ?? `${sessionId}-initial`,
    background: {
      color: bgValue,
      floorColor: bgValue,
      width: state.dimensions?.width,
      height: state.dimensions?.height,
    },
    movementControl,
    character,
    lighting: {
      warmth: 0.75,
      brightness: 0.35,
    },
  };
}

export function mapBackendObjectsToFurniture(
  objects: BackendSessionState["objects"],
  _apiUrl?: string,
  roomW = ROOM_DEFAULT_WIDTH,
  roomH = ROOM_DEFAULT_HEIGHT
): FurnitureItem[] {
  if (!objects?.length) return [];

  return objects.map((obj) => {
    const canvas = roomToCanvas(obj.x ?? 0, obj.y ?? 0, roomW, roomH);
    const imageId = obj.imageId ?? obj.id;
    return {
      id: obj.id,
      type: "furniture",
      category: "other",
      position: canvas,
      rotation: 0,
      scale: { x: 1, y: 1 },
      sprite: backendImageUrl(imageId),
      visibility: true,
      source: "backend",
      metadata: {
        objectType: obj.type,
        imageId,
        height: obj.height ?? FURNITURE_SPRITE_HEIGHT,
      },
    };
  });
}

export function mapHistoryMessage(row: BackendHistoryMessage): Message {
  return {
    id: String(row.message_id),
    role: row.ai ? "eula" : "user",
    content: row.message,
    timestamp: row.created_at,
    ...(row.ai
      ? {
          tone: "warm",
          animation: "talking",
        }
      : {}),
  };
}

export function inferToneFromText(content: string): CharacterTonePayload {
  const lower = content.toLowerCase();

  if (/!{2,}|let's go|love it|perfect|yay|woohoo|yes\.|yes!/.test(lower)) {
    return { tone: "playful", animation: "laugh", speed: 0.16, loop: true };
  }
  if (/there!|all set|come look|secured|it's in|looks great|pretty cute/.test(lower)) {
    return { tone: "warm", animation: "happy", speed: 0.14, loop: true };
  }
  if (/ugh|out of space|rough day|aw,|stress|tough|heavy|sorry/.test(lower)) {
    return { tone: "empathetic", animation: "sad", speed: 0.08, loop: true };
  }
  if (/hmm|don't think|don't see|nothing to|confused|not sure/.test(lower)) {
    return { tone: "curious", animation: "confused", speed: 0.09, loop: true };
  }
  if (/wait|really\?|what\?|whoa|wow|surprise/.test(lower)) {
    return { tone: "excited", animation: "surprised", speed: 0.13, loop: true };
  }
  if (/\b(hey|hello|hi\b|good to see|welcome back)/.test(lower)) {
    return { tone: "warm", animation: "wave", speed: 0.1, loop: false };
  }
  if (/haha|lol|funny|silly|goofy|joke/.test(lower)) {
    return { tone: "playful", animation: "laugh", speed: 0.15, loop: true };
  }
  if (/give me a sec|hang on|one sec|go make|go grab|on it|scooting|moving/.test(lower)) {
    return { tone: "warm", animation: "happy", speed: 0.12, loop: true };
  }
  if (/\?/.test(content) || lower.includes("wonder") || lower.includes("curious")) {
    return { tone: "curious", animation: "thinking", speed: 0.09, loop: true };
  }

  return { tone: "warm", animation: "talking", speed: 0.1, loop: true };
}

function mapActionQueue(
  steps: BackendActionStep[] | undefined,
  roomW: number,
  roomH: number
): ActionStep[] {
  if (!steps?.length) return [];

  return steps
    .map((step): ActionStep | null => {
      if (step.type === "walk_home") return { type: "walk_home" };
      if (step.type === "build") {
        return { type: "build", pendingIndex: step.pendingIndex };
      }
      if (step.type === "player_stance") {
        return { type: "player_stance", stance: step.stance ?? "happy" };
      }
      if (step.type === "walk" && step.walkTo) {
        const canvas = roomToCanvas(step.walkTo.x, step.walkTo.y, roomW, roomH);
        return {
          type: "walk",
          action: step.action ?? "walk_then_move",
          walkTo: canvas,
          objectType: step.objectType,
          objectId: step.objectId,
          placementShifted: step.placementShifted,
        };
      }
      return null;
    })
    .filter((step): step is ActionStep => step !== null);
}

function buildSceneAction(
  meta: BackendSceneActionMeta,
  roomW: number,
  roomH: number
): SceneAction | undefined {
  if (!meta.walkTo) return undefined;
  const canvas = roomToCanvas(meta.walkTo.x, meta.walkTo.y, roomW, roomH);
  return {
    type: meta.action as SceneAction["type"],
    walkTo: canvas,
    objectType: meta.objectType,
    objectId: meta.objectId,
    placementShifted: meta.placementShifted,
  };
}

export function mapChatResponse(
  data: BackendChatResponse,
  sessionId: string,
  apiUrl: string
): AiMessageResponse {
  const payload = data.response ?? {};
  const content =
    payload.response ??
    "I'm still learning about you. Every word helps me understand who you are a little better.";

  let sessionState: BackendSessionState | null = null;
  let roomState: RoomStatePayload | undefined;
  let furniture: FurnitureItem[] | undefined;

  for (const toolResult of payload.toolResults ?? []) {
    if (!toolResult.success || !toolResult.result) continue;

    try {
      const parsed = parseBackendState(JSON.parse(toolResult.result));
      if (parsed?.dimensions || parsed?.background || parsed?.objects) {
        sessionState = parsed;
      }
    } catch {
      // Ignore malformed tool payloads
    }
  }

  const roomW = sessionState?.dimensions?.width ?? ROOM_DEFAULT_WIDTH;
  const roomH = sessionState?.dimensions?.height ?? ROOM_DEFAULT_HEIGHT;

  if (sessionState) {
    roomState = mapBackendStateToRoomState(
      sessionState,
      sessionId,
      `${sessionId}-${Date.now()}`,
      "backend"
    );
    furniture = mapBackendObjectsToFurniture(
      sessionState.objects,
      apiUrl,
      roomW,
      roomH
    );
  }
  const lastAction = payload.sceneActions?.[payload.sceneActions.length - 1];
  const sceneAction = lastAction
    ? buildSceneAction(lastAction, roomW, roomH)
    : undefined;
  const actionQueue = mapActionQueue(payload.actionQueue, roomW, roomH);
  const resolvedQueue =
    actionQueue.length > 0
      ? actionQueue
      : sceneAction
        ? [
            {
              type: "walk" as const,
              action: sceneAction.type,
              walkTo: sceneAction.walkTo,
              objectType: sceneAction.objectType,
              objectId: sceneAction.objectId,
              placementShifted: sceneAction.placementShifted,
            },
          ]
        : [];

  const tone = payload.emotion
    ? mapBackendEmotion(payload.emotion)
    : inferToneFromText(content);

  const inferred = inferToneFromText(content);
  if (
    !payload.emotion ||
    payload.emotion === "talking" ||
    payload.emotion === "idle"
  ) {
    Object.assign(tone, inferred);
  } else if (payload.emotion === "happy" && inferred.animation !== "happy") {
    tone.animation = inferred.animation;
    tone.speed = inferred.speed ?? tone.speed;
    tone.loop = inferred.loop ?? tone.loop;
  }

  // Phase 1: preamble dialogue, walk, then client calls /execute for image gen
  if (payload.pendingExecution) {
    return {
      id: `msg-${Date.now()}`,
      content,
      postAction: payload.postAction ?? undefined,
      pendingExecution: true,
      timestamp: new Date().toISOString(),
      tone: {
        ...tone,
        animation: resolvedQueue.length > 0 ? "walking" : tone.animation,
      },
      sceneAction,
      actionQueue: resolvedQueue,
    };
  }

  if (resolvedQueue.length > 0) {
    const deferredRoomState = roomState
      ? (() => {
          const { character: _character, ...roomWithoutCharacter } = roomState;
          return { ...roomWithoutCharacter, movementControl: "player" as const };
        })()
      : undefined;

    return {
      id: `msg-${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      tone: { ...tone, animation: "walking" },
      deferredFurniture: furniture,
      deferredRoomState,
      sceneAction,
      actionQueue: resolvedQueue,
    };
  }

  if (sceneAction) {
    // Walk is handled client-side; keep player control and don't snap character from backend.
    const { character: _character, ...roomWithoutCharacter } = roomState!;
    return {
      id: `msg-${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      tone: { ...tone, animation: "walking" },
      deferredFurniture: furniture,
      deferredRoomState: {
        ...roomWithoutCharacter,
        movementControl: "player",
      },
      sceneAction,
    };
  }

  return {
    id: `msg-${Date.now()}`,
    content,
    timestamp: new Date().toISOString(),
    tone,
    roomState,
    furniture,
  };
}

export function extractFurnitureFromState(
  state: BackendSessionState | null | undefined,
  apiUrl: string
): FurnitureItem[] {
  const roomW = state?.dimensions?.width ?? ROOM_DEFAULT_WIDTH;
  const roomH = state?.dimensions?.height ?? ROOM_DEFAULT_HEIGHT;
  return mapBackendObjectsToFurniture(state?.objects, apiUrl, roomW, roomH);
}
