import type { AnimationState, CharacterId } from "./character";

export interface CharacterAnimationConfig {
  frames: string[];
  speed: number;
  loop: boolean;
  /** Multiplier to normalize sprites with different source dimensions */
  scale?: number;
}

export type CharacterAnimationMap = Partial<
  Record<AnimationState, CharacterAnimationConfig>
>;

export type PlayerMovementKey =
  | "idle"
  | "thinking"
  | "talking"
  | "happy"
  | "sad"
  | "laugh"
  | "surprised"
  | "wave"
  | "confused"
  | "idle_down"
  | "walk_down"
  | "idle_up"
  | "walk_up"
  | "walk_left"
  | "walk_right"
  | "building";

export interface CharacterAnimationsData {
  characters: Partial<Record<CharacterId, CharacterAnimationMap>>;
  playerMovement?: Partial<Record<PlayerMovementKey, CharacterAnimationConfig>>;
}

/** Resolve a frame URL — if no frame number in path, defaults to /1.png */
export function resolveFrameUrl(basePath: string, frame = 1): string {
  if (basePath.match(/\.\w+$/)) return basePath;
  const normalized = basePath.replace(/\/$/, "");
  return `${normalized}/${frame}.png`;
}
