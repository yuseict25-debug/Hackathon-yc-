import { BASE_HEIGHT, BASE_WIDTH } from "@/engine/constants";
import type { CharacterStore } from "@/stores/characterStore";
import type { RoomStore } from "@/stores/roomStore";
import type { SceneStore } from "@/stores/sceneStore";
import type { WorldStore } from "@/stores/worldStore";
import type { RoomBackgroundState, RoomStatePayload } from "@/types/roomState";

type ApplyRoomStateArgs = {
  next: RoomStatePayload;
  scene: Pick<SceneStore, "appliedRevision" | "setRoomState" | "markRevisionApplied">;
  character: Pick<
    CharacterStore,
    "setPosition" | "setDirection" | "setConversationMode" | "setMoving"
  >;
  room: Pick<RoomStore, "room" | "setRoom">;
  world: Pick<WorldStore, "setBounds">;
};

export function worldBoundsFromBackground(
  bg: RoomBackgroundState
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (bg.width == null || bg.height == null) return null;

  const cx = BASE_WIDTH / 2;
  const cy = BASE_HEIGHT / 2;

  return {
    minX: cx - bg.width / 2,
    maxX: cx + bg.width / 2,
    minY: cy - bg.height / 2,
    maxY: cy + bg.height / 2,
  };
}

/** Apply backend scene state when revision changes */
export function applyRoomState({
  next,
  scene,
  character,
  room,
  world,
}: ApplyRoomStateArgs): boolean {
  if (scene.appliedRevision === next.revision) {
    return false;
  }

  scene.setRoomState(next);

  const boundsOverride = worldBoundsFromBackground(next.background);
  if (boundsOverride) {
    world.setBounds(boundsOverride);
  }

  if (next.character) {
    const { x, y, direction, conversationMode } = next.character;
    character.setPosition("player", x, y);
    if (direction) {
      character.setDirection("player", direction);
    }
    if (conversationMode) {
      character.setConversationMode("player", conversationMode);
    }
    character.setMoving("player", false);
  }

  if (next.lighting && room.room) {
    room.setRoom({
      ...room.room,
      lighting: next.lighting,
    });
  }

  scene.markRevisionApplied(next.revision);
  return true;
}
