import type { CompatibilityMatch } from "@/types/compatibility";

export interface CompatibilityStore {
  matches: CompatibilityMatch[];
  isReady: boolean;
  setMatches: (matches: CompatibilityMatch[]) => void;
  setReady: (ready: boolean) => void;
}

export function createCompatibilityStoreActions(
  set: (
    partial:
      | Partial<CompatibilityStore>
      | ((state: CompatibilityStore) => Partial<CompatibilityStore>)
  ) => void
): Omit<CompatibilityStore, "matches" | "isReady"> {
  return {
    setMatches: (matches) => set({ matches }),
    setReady: (isReady) => set({ isReady }),
  };
}
