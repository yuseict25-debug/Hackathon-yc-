import { create } from "zustand";

import type { CharacterStore } from "./characterStore";
import { createCharacterStoreActions } from "./characterStore";
import type { CharacterId } from "@/types/character";

const defaultCharacters: CharacterStore["characters"] = {
  player: {
    id: "player",
    name: "You",
    position: { x: 720, y: 680 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    currentAnimation: "idle",
    emotion: "idle",
    sprite: "placeholder-player",
    visible: true,
  },
  eula: {
    id: "eula",
    name: "Eula",
    position: { x: 1050, y: 680 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    currentAnimation: "idle",
    emotion: "idle",
    sprite: "placeholder-eula",
    visible: true,
  },
};

export const useCharacterStore = create<CharacterStore>((set) => ({
  characters: defaultCharacters,
  ...createCharacterStoreActions(set),
}));

export type { CharacterId };
