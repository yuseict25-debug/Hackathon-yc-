import type { RoomStatePayload } from "@/types/roomState";

export interface SceneStore {
  roomState: RoomStatePayload | null;
  appliedRevision: string | null;
  movementControl: "player" | "backend";
  setRoomState: (state: RoomStatePayload) => void;
  markRevisionApplied: (revision: string) => void;
  clearRoomState: () => void;
}

export function createSceneStoreActions(
  set: (
    partial: Partial<SceneStore> | ((state: SceneStore) => Partial<SceneStore>)
  ) => void
): Omit<
  SceneStore,
  "roomState" | "appliedRevision" | "movementControl"
> {
  return {
    setRoomState: (roomState) =>
      set({
        roomState,
        movementControl: roomState.movementControl ?? "player",
      }),
    markRevisionApplied: (appliedRevision) => set({ appliedRevision }),
    clearRoomState: () =>
      set({
        roomState: null,
        appliedRevision: null,
        movementControl: "player",
      }),
  };
}
