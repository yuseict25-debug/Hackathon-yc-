"use client";

import { useCallback } from "react";

import { analyzeMatches } from "@/lib/api";
import type { IdentityTrait } from "@/types/identity";
import { useCompatibilityStore } from "@/stores/useCompatibilityStore";

export function useMatchmaking(
  sessionId: string | null | undefined,
  identityTraits: IdentityTrait[],
  completeness: number
) {
  const status = useCompatibilityStore((s) => s.status);
  const resultStatus = useCompatibilityStore((s) => s.resultStatus);
  const message = useCompatibilityStore((s) => s.message);
  const matches = useCompatibilityStore((s) => s.matches);
  const personality = useCompatibilityStore((s) => s.personality);
  const analyzedAt = useCompatibilityStore((s) => s.analyzedAt);
  const errorMessage = useCompatibilityStore((s) => s.errorMessage);
  const setMatches = useCompatibilityStore((s) => s.setMatches);
  const setReady = useCompatibilityStore((s) => s.setReady);
  const setStatus = useCompatibilityStore((s) => s.setStatus);
  const setResultStatus = useCompatibilityStore((s) => s.setResultStatus);
  const setMessage = useCompatibilityStore((s) => s.setMessage);
  const setPersonality = useCompatibilityStore((s) => s.setPersonality);
  const setAnalyzedAt = useCompatibilityStore((s) => s.setAnalyzedAt);
  const setErrorMessage = useCompatibilityStore((s) => s.setErrorMessage);

  const canAnalyze = Boolean(sessionId);

  const runAnalysis = useCallback(async () => {
    if (!sessionId || !canAnalyze) return;

    setStatus("analyzing");
    setErrorMessage(null);
    setMessage(null);

    try {
      const labels = identityTraits.map((t) => t.label);
      const result = await analyzeMatches(labels, completeness, sessionId);

      setMatches(result.matches);
      setPersonality(result.personality);
      setAnalyzedAt(result.analyzedAt);
      setResultStatus(result.status);
      setMessage(result.message ?? null);
      setReady(true);
      setStatus("ready");
    } catch {
      setStatus("error");
      setErrorMessage("Could not run matching right now. Try again in a bit.");
    }
  }, [
    canAnalyze,
    completeness,
    identityTraits,
    sessionId,
    setAnalyzedAt,
    setErrorMessage,
    setMatches,
    setMessage,
    setPersonality,
    setReady,
    setResultStatus,
    setStatus,
  ]);

  const reset = useCallback(() => {
    setStatus("idle");
    setResultStatus("idle");
    setMessage(null);
    setErrorMessage(null);
  }, [setErrorMessage, setMessage, setResultStatus, setStatus]);

  return {
    status,
    resultStatus,
    message,
    matches,
    personality,
    analyzedAt,
    errorMessage,
    canAnalyze,
    runAnalysis,
    reset,
  };
}
