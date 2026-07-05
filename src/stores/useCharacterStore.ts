import { create } from "zustand";

import type { CharacterStore } from "./characterStore";
import { createCharacterStoreActions } from "./characterStore";
import type { CharacterId } from "@/types/character";

const defaultCharacters: CharacterStore["characters"] = {
  player: {
    id: "player",
    name: "You",
    position: { x: 960, y: 700 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    currentAnimation: "idle",
    emotion: "idle",
    sprite: "url",
    visible: true,
    direction: "down",
    isMoving: false,
  },
  eula: {
    id: "eula",
    name: "Eula",
    position: { x: 960, y: 820 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    currentAnimation: "idle",
    emotion: "idle",
    sprite: "url",
    visible: false,
    direction: "down",
    isMoving: false,
  },
};

export const useCharacterStore = create<CharacterStore>((set) => ({
  characters: defaultCharacters,
  ...createCharacterStoreActions(set),
}));

export type { CharacterId };
