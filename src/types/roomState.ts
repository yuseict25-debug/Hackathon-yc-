import type { Direction, PlayerConversationMode } from "./character";
import type { RoomLighting } from "./common";

/** Background appearance — partner controls color and canvas footprint */
export interface RoomBackgroundState {
  /** CSS hex (#ffffff) or Pixi number string (0xffffff) */
  color: string;
  floorColor?: string;
  /** Optional world width/height override for expanded rooms */
  width?: number;
  height?: number;
}

/** Character pose/position from backend scene sync */
export interface RoomCharacterState {
  x: number;
  y: number;
  direction?: Direction;
  conversationMode?: PlayerConversationMode;
}

/**
 * Scene snapshot from backend.
 * Frontend applies changes only when `revision` differs from the last applied value.
 */
export interface RoomStatePayload {
  revision: string;
  background: RoomBackgroundState;
  character?: RoomCharacterState;
  lighting?: RoomLighting;
  /** When "backend", WASD movement is disabled */
  movementControl?: "player" | "backend";
}

export function parseSceneColor(value: string): number {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    return Number.parseInt(trimmed.slice(1), 16);
  }
  if (trimmed.startsWith("0x")) {
    return Number.parseInt(trimmed.slice(2), 16);
  }
  return Number.parseInt(trimmed, 16);
}

export function roomStatesEqual(
  a: RoomStatePayload | null,
  b: RoomStatePayload | null
): boolean {
  if (!a || !b) return a === b;
  return a.revision === b.revision;
}
