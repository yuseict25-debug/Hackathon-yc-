"use client";

import { useEffect } from "react";

import { fetchRoom } from "@/lib/api";
import { useRoomStore } from "@/stores/useRoomStore";

export function useRoom() {
  const room = useRoomStore((s) => s.room);
  const isLoading = useRoomStore((s) => s.isLoading);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setLoading = useRoomStore((s) => s.setLoading);

  useEffect(() => {
    if (room) return;

    setLoading(true);
    fetchRoom()
      .then(setRoom)
      .finally(() => setLoading(false));
  }, [room, setRoom, setLoading]);

  return { room, isLoading };
}
