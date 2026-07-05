"use client";

import { useCallback, useEffect, useState } from "react";

import { applyRoomState } from "@/engine/room/applyRoomState";
import { fetchRoomState } from "@/lib/api";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSceneStore } from "@/stores/useSceneStore";
import { useWorldStore } from "@/stores/useWorldStore";
import type { RoomStatePayload } from "@/types/roomState";

const HAS_API = Boolean(process.env.NEXT_PUBLIC_API_URL);

export function useRoomState() {
  const sessionId = useSceneStore((s) => s.sessionId);
  const roomState = useSceneStore((s) => s.roomState);
  const appliedRevision = useSceneStore((s) => s.appliedRevision);
  const movementControl = useSceneStore((s) => s.movementControl);
  const [isLoaded, setIsLoaded] = useState(false);

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
    setIsLoaded(false);

    if (HAS_API && !sessionId) return;

    let cancelled = false;

    void fetchRoomState(sessionId ?? undefined)
      .then((state) => {
        if (!cancelled) syncRoomState(state);
      })
      .catch(() => {
        // Room state is optional until backend is wired
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, syncRoomState]);

  return {
    roomState,
    appliedRevision,
    movementControl,
    isLoaded,
    syncRoomState,
  };
}
