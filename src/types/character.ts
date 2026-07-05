import type { Vector2 } from "./common";

export type CharacterId = "player" | "eula";

export type AnimationState =
  | "idle"
  | "walking"
  | "thinking"
  | "happy"
  | "sad"
  | "surprised"
  | "wave"
  | "sit"
  | "confused"
  | "laugh";

export interface CharacterData {
  id: CharacterId;
  name: string;
  position: Vector2;
  rotation: number;
  scale: Vector2;
  currentAnimation: AnimationState;
  emotion: AnimationState;
  sprite: string;
  visible: boolean;
}

export interface SpriteSheetConfig {
  spriteId: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<
    AnimationState,
    {
      frames: number[];
      frameRate: number;
      loop: boolean;
    }
  >;
}
