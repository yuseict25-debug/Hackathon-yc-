"use client";

import { useEffect, useState } from "react";

import { CharacterAssetLoader } from "@/engine/pixi/CharacterAssetLoader";
import { fetchCharacterAnimations } from "@/lib/api";

export function useCharacterAssets() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchCharacterAnimations()
      .then((data) => CharacterAssetLoader.load(data))
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load character assets");
        }
      });

    return () => {
      cancelled = true;
      CharacterAssetLoader.reset();
    };
  }, []);

  return { isReady, error };
}
