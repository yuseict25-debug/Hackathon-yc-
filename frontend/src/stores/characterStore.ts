import type { CharacterData, AnimationState, CharacterId, Direction, PlayerConversationMode } from "@/types/character";
import type { PlayerMovementKey } from "@/types/characterAnimations";

export interface CharacterStore {
  characters: Record<CharacterId, CharacterData>;
  setCharacters: (characters: Record<CharacterId, CharacterData>) => void;
  setAnimation: (id: CharacterId, animation: AnimationState) => void;
  setEmotion: (id: CharacterId, emotion: AnimationState) => void;
  setPosition: (id: CharacterId, x: number, y: number) => void;
  setDirection: (id: CharacterId, direction: Direction) => void;
  setMoving: (id: CharacterId, isMoving: boolean) => void;
  setResponding: (id: CharacterId, isResponding: boolean) => void;
  setConversationMode: (id: CharacterId, mode: PlayerConversationMode) => void;
  setStance: (id: CharacterId, stance: PlayerMovementKey | undefined) => void;
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
    setDirection: (id, direction) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: { ...state.characters[id], direction },
        },
      })),
    setMoving: (id, isMoving) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: { ...state.characters[id], isMoving },
        },
      })),
    setResponding: (id, isResponding) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: {
            ...state.characters[id],
            conversationMode: isResponding ? "talking" : "none",
          },
        },
      })),
    setConversationMode: (id, conversationMode) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: { ...state.characters[id], conversationMode },
        },
      })),
    setStance: (id, stance) =>
      set((state) => ({
        characters: {
          ...state.characters,
          [id]: { ...state.characters[id], stance },
        },
      })),
  };
}
