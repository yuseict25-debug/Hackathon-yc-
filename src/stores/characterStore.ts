import type { CharacterData, AnimationState, CharacterId } from "@/types/character";

export interface CharacterStore {
  characters: Record<CharacterId, CharacterData>;
  setCharacters: (characters: Record<CharacterId, CharacterData>) => void;
  setAnimation: (id: CharacterId, animation: AnimationState) => void;
  setEmotion: (id: CharacterId, emotion: AnimationState) => void;
  setPosition: (id: CharacterId, x: number, y: number) => void;
}

export function createCharacterStoreActions(
  set: (
    partial:
      | Partial<CharacterStore>
      | ((state: CharacterStore) => Partial<CharacterStore>)
  ) => void
): Omit<CharacterStore, "characters"> {
  return {
    setCharacters: (characters) => set({ characters }),
    setAnimation: (id, animation) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: { ...state.characters[id], currentAnimation: animation },
        },
      })),
    setEmotion: (id, emotion) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: {
            ...state.characters[id],
            emotion,
            currentAnimation: emotion,
          },
        },
      })),
    setPosition: (id, x, y) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: {
            ...state.characters[id],
            position: { x, y },
          },
        },
      })),
  };
}
