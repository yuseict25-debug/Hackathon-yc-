"use client";

import { useEffect } from "react";

import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";
import type { AnimationState } from "@/types/character";

/**
 * AI response animations only — idle when nothing is happening.
 * Tone/appearance comes from backend JSON via aiTone.
 */
export function useEulaConversationAnimation() {
  const isTyping = useConversationStore((s) => s.isTyping);
  const isSpeaking = useConversationStore((s) => s.isSpeaking);
  const isDeliveringResponse = useConversationStore(
    (s) => s.isDeliveringResponse
  );
  const aiTone = useConversationStore((s) => s.aiTone);
  const setAnimation = useCharacterStore((s) => s.setAnimation);

  useEffect(() => {
    const aiResponding = isTyping || isSpeaking || isDeliveringResponse;

    if (!aiResponding) {
      setAnimation("eula", "idle");
      return;
    }

    const animation: AnimationState =
      aiTone?.animation ?? (isTyping ? "talking" : "idle");

    setAnimation("eula", animation);
  }, [
    isTyping,
    isSpeaking,
    isDeliveringResponse,
    aiTone,
    setAnimation,
  ]);
}
