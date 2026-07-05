import { create } from "zustand";

import type { CompatibilityStore } from "./compatibilityStore";
import { createCompatibilityStoreActions } from "./compatibilityStore";

export const useCompatibilityStore = create<CompatibilityStore>((set) => ({
  sessionId: null,
  matches: [],
  isReady: false,
  isPanelOpen: false,
  status: "idle",
  resultStatus: "idle",
  message: null,
  personality: null,
  analyzedAt: null,
  errorMessage: null,
  ...createCompatibilityStoreActions(set),
}));
