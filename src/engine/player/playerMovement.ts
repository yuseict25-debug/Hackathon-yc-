import type { Direction, PlayerConversationMode } from "@/types/character";
import type { PlayerMovementKey } from "@/types/characterAnimations";

/** Idle pose after stopping — back-facing when last direction was up, neutral otherwise */
export function resolvePlayerIdleKey(direction: Direction): PlayerMovementKey {
  return direction === "up" ? "idle_up" : "idle";
}

export function resolvePlayerMovementKey(
  direction: Direction,
  isMoving: boolean,
  stanceOverride?: PlayerMovementKey | null,
  conversationMode: PlayerConversationMode = "none"
): PlayerMovementKey {
  if (!isMoving) {
    if (conversationMode === "thinking") return "thinking";
    if (conversationMode === "talking") return "talking";
    return stanceOverride ?? resolvePlayerIdleKey(direction);
  }

  switch (direction) {
    case "up":
      return "walk_up";
    case "down":
      return "walk_down";
    case "left":
      return "walk_left";
    case "right":
      return "walk_right";
  }
}
