"use client";

import { useEffect } from "react";

import { useCharacterStore } from "@/stores/useCharacterStore";

/** Eula is never shown on the canvas — the player avatar handles conversation visuals */
export function useEulaVisibility() {
  useEffect(() => {
    const eula = useCharacterStore.getState().characters.eula;
    if (!eula.visible) return;

    useCharacterStore.setState((state) => ({
      characters: {
        ...state.characters,
        eula: { ...state.characters.eula, visible: false },
      },
    }));
  }, []);
}
