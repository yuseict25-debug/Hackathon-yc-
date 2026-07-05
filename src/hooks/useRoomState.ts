"use client";

import { useCallback, useEffect } from "react";

import { applyRoomState } from "@/engine/room/applyRoomState";
import { fetchRoomState } from "@/lib/api";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSceneStore } from "@/stores/useSceneStore";
import { useWorldStore } from "@/stores/useWorldStore";
import type { RoomStatePayload } from "@/types/roomState";

export function useRoomState() {
  const roomState = useSceneStore((s) => s.roomState);
  const appliedRevision = useSceneStore((s) => s.appliedRevision);
  const movementControl = useSceneStore((s) => s.movementControl);

  const syncRoomState = useCallback((next: RoomStatePayload) => {
    applyRoomState({
      next,
      scene: useSceneStore.getState(),
      character: useCharacterStore.getState(),
      room: useRoomStore.getState(),
      world: useWorldStore.getState(),
    });
  }, []);

  useEffect(() => {
    fetchRoomState().then(syncRoomState).catch(() => {
      // Room state is optional until backend is wired
    });
  }, [syncRoomState]);

  return {
    roomState,
    appliedRevision,
    movementControl,
    syncRoomState,
  };
}
