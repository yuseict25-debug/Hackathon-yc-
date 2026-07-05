import type { IdentityTrait } from "@/types/identity";

export interface IdentityStore {
  sessionId: string | null;
  traits: IdentityTrait[];
  completeness: number;
  isPanelOpen: boolean;
  setSessionId: (sessionId: string | null) => void;
  setTraits: (traits: IdentityTrait[]) => void;
  setCompleteness: (completeness: number) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  resetIdentityState: () => void;
}

export function createIdentityStoreActions(
  set: (
    partial:
      | Partial<IdentityStore>
      | ((state: IdentityStore) => Partial<IdentityStore>)
  ) => void
): Omit<IdentityStore, "sessionId" | "traits" | "completeness" | "isPanelOpen"> {
  return {
    setSessionId: (sessionId) => set({ sessionId }),
    setTraits: (traits) => set({ traits }),
    setCompleteness: (completeness) => set({ completeness }),
    setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
    resetIdentityState: () =>
      set({
        sessionId: null,
        traits: [],
        completeness: 0,
        isPanelOpen: false,
      }),
  };
}
