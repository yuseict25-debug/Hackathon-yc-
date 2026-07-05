import type { IdentityTrait } from "@/types/identity";

export interface IdentityStore {
  traits: IdentityTrait[];
  completeness: number;
  isPanelOpen: boolean;
  setTraits: (traits: IdentityTrait[]) => void;
  setCompleteness: (completeness: number) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
}

export function createIdentityStoreActions(
  set: (
    partial:
      | Partial<IdentityStore>
      | ((state: IdentityStore) => Partial<IdentityStore>)
  ) => void
): Omit<IdentityStore, "traits" | "completeness" | "isPanelOpen"> {
  return {
    setTraits: (traits) => set({ traits }),
    setCompleteness: (completeness) => set({ completeness }),
    setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  };
}
