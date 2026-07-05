import type { Vector2 } from "./common";
import type { PlayerMovementKey } from "./characterAnimations";

export type CharacterId = "player" | "eula";

export type Direction = "up" | "down" | "left" | "right";

export type AnimationState =
  | "idle"
  | "talking"
  | "walking"
  | "thinking"
  | "happy"
  | "sad"
  | "surprised"
  | "wave"
  | "sit"
  | "confused"
  | "laugh";

export type PlayerConversationMode = "none" | "thinking" | "talking" | "building";

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
  direction: Direction;
  isMoving: boolean;
  /** Thinking / talking visuals while AI processes and responds */
  conversationMode?: PlayerConversationMode;
  /** Idle stance when not moving — driven by AI tone later */
  stance?: PlayerMovementKey;
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
