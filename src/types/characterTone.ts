import type { AnimationState } from "./character";
import type { RoomStatePayload } from "./roomState";

/** Tone analysis payload sent by the backend with each AI response */
export interface CharacterTonePayload {
  /** Analyzed tone label, e.g. "empathetic", "playful" */
  tone: string;
  /** Sprite animation set to play while responding */
  animation: AnimationState;
  /** Optional frame URLs — overrides default animation config when provided */
  frames?: string[];
  speed?: number;
  loop?: boolean;
  /** Optional idle stance key for the player avatar when not moving */
  playerStance?: string;
}

export interface AiMessageResponse {
  id: string;
  content: string;
  timestamp: string;
  tone: CharacterTonePayload;
  /** Optional scene update bundled with the AI reply */
  roomState?: RoomStatePayload;
}
