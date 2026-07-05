"use client";

import { useEffect } from "react";

import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";
import type { PlayerMovementKey } from "@/types/characterAnimations";

/**
 * Applies AI-analyzed player stance when idle.
 * Backend can set tone.playerStance (e.g. "idle", "idle_up") per conversation tone.
 */
export function usePlayerStance() {
  const aiTone = useConversationStore((s) => s.aiTone);
  const setStance = useCharacterStore((s) => s.setStance);

  useEffect(() => {
    const override = aiTone?.playerStance as PlayerMovementKey | undefined;
    setStance("player", override);
  }, [aiTone?.playerStance, setStance]);
}
