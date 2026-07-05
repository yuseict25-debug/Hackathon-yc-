"use client";

import { useEffect } from "react";

import { fetchSavedMatches } from "@/lib/api";
import { useCompatibilityStore } from "@/stores/useCompatibilityStore";
import { useSceneStore } from "@/stores/useSceneStore";

export function useCompatibility() {
  const sessionId = useSceneStore((s) => s.sessionId);
  const matches = useCompatibilityStore((s) => s.matches);
  const isReady = useCompatibilityStore((s) => s.isReady);
  const loadedSessionId = useCompatibilityStore((s) => s.sessionId);
  const setSessionId = useCompatibilityStore((s) => s.setSessionId);
  const setMatches = useCompatibilityStore((s) => s.setMatches);
  const setReady = useCompatibilityStore((s) => s.setReady);
  const setStatus = useCompatibilityStore((s) => s.setStatus);
  const setResultStatus = useCompatibilityStore((s) => s.setResultStatus);
  const setMessage = useCompatibilityStore((s) => s.setMessage);
  const setPersonality = useCompatibilityStore((s) => s.setPersonality);
  const setAnalyzedAt = useCompatibilityStore((s) => s.setAnalyzedAt);
  const resetMatchState = useCompatibilityStore((s) => s.resetMatchState);

  useEffect(() => {
    if (!sessionId) return;

    if (loadedSessionId !== sessionId) {
      resetMatchState();
      setSessionId(sessionId);
    }

    fetchSavedMatches(sessionId).then((data) => {
      if (useSceneStore.getState().sessionId !== sessionId) return;
      setMatches(data.matches);
      setReady(data.isReady);
      if (data.personality) setPersonality(data.personality);
      if (data.analyzedAt) setAnalyzedAt(data.analyzedAt);
      if (data.status) setResultStatus(data.status);
      if (data.message) setMessage(data.message);
      if (data.isReady) setStatus("ready");
    });
  }, [
    loadedSessionId,
    resetMatchState,
    sessionId,
    setAnalyzedAt,
    setMatches,
    setMessage,
    setPersonality,
    setReady,
    setResultStatus,
    setSessionId,
    setStatus,
  ]);

  return { matches, isReady, sessionId };
}
