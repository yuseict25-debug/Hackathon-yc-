"use client";

import { useEffect } from "react";

import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";
import type { AnimationState } from "@/types/character";
import type { PlayerMovementKey } from "@/types/characterAnimations";

const EMOTION_TO_STANCE: Partial<Record<AnimationState, PlayerMovementKey>> = {
  happy: "happy",
  sad: "sad",
  laugh: "laugh",
  surprised: "surprised",
  wave: "wave",
  confused: "confused",
  thinking: "thinking",
  talking: "talking",
};

/** Maps backend emotion → expressive player sprite while AI responds */
export function usePlayerStance() {
  const aiTone = useConversationStore((s) => s.aiTone);
  const setStance = useCharacterStore((s) => s.setStance);

  useEffect(() => {
    const animation = aiTone?.animation;
    const stance = animation ? EMOTION_TO_STANCE[animation] : undefined;
    setStance("player", stance);
  }, [aiTone?.animation, setStance]);
}
