"use client";

import { useEffect } from "react";

import type { PlayerConversationMode } from "@/types/character";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";

function resolveConversationMode(
  isTyping: boolean,
  isDeliveringResponse: boolean,
  isSpeaking: boolean
): PlayerConversationMode {
  if (isTyping) return "thinking";
  if (isDeliveringResponse || isSpeaking) return "talking";
  return "none";
}

/** Player thinking while backend processes, talking once the response arrives */
export function usePlayerConversationAnimation() {
  const isTyping = useConversationStore((s) => s.isTyping);
  const isDeliveringResponse = useConversationStore(
    (s) => s.isDeliveringResponse
  );
  const isSpeaking = useConversationStore((s) => s.isSpeaking);
  const setConversationMode = useCharacterStore((s) => s.setConversationMode);
  const setDirection = useCharacterStore((s) => s.setDirection);

  useEffect(() => {
    const mode = resolveConversationMode(
      isTyping,
      isDeliveringResponse,
      isSpeaking
    );
    setConversationMode("player", mode);

    if (mode === "none") return;

    const player = useCharacterStore.getState().characters.player;
    if (player.direction === "up") {
      setDirection("player", "down");
    }
    if (player.isMoving) {
      useCharacterStore.getState().setMoving("player", false);
    }
  }, [
    isTyping,
    isDeliveringResponse,
    isSpeaking,
    setConversationMode,
    setDirection,
  ]);
}
