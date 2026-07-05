import type { RoomStatePayload } from "@/types/roomState";

export interface SceneStore {
  sessionId: string | null;
  roomState: RoomStatePayload | null;
  appliedRevision: string | null;
  movementControl: "player" | "backend";
  setSessionId: (sessionId: string | null) => void;
  setMovementControl: (control: "player" | "backend") => void;
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
  "sessionId" | "roomState" | "appliedRevision" | "movementControl"
> {
  return {
    setSessionId: (sessionId) => set({ sessionId }),
    setMovementControl: (movementControl) => set({ movementControl }),
    setRoomState: (roomState) =>
      set((state) => ({
        roomState,
        movementControl: roomState.movementControl ?? state.movementControl,
      })),
    markRevisionApplied: (appliedRevision) => set({ appliedRevision }),
    clearRoomState: () =>
      set({
        sessionId: null,
        roomState: null,
        appliedRevision: null,
        movementControl: "player",
      }),
  };
}
