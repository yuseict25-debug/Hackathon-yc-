"use client";

import { useEffect } from "react";

import { fetchCompatibility } from "@/lib/api";
import { useCompatibilityStore } from "@/stores/useCompatibilityStore";

export function useCompatibility() {
  const matches = useCompatibilityStore((s) => s.matches);
  const isReady = useCompatibilityStore((s) => s.isReady);
  const setMatches = useCompatibilityStore((s) => s.setMatches);
  const setReady = useCompatibilityStore((s) => s.setReady);

  useEffect(() => {
    fetchCompatibility().then((data) => {
      setMatches(data.matches);
      setReady(data.isReady);
    });
  }, [setMatches, setReady]);

  return { matches, isReady };
}
