import { create } from "zustand";

import type { CompatibilityStore } from "./compatibilityStore";
import { createCompatibilityStoreActions } from "./compatibilityStore";

export const useCompatibilityStore = create<CompatibilityStore>((set) => ({
  matches: [],
  isReady: false,
  ...createCompatibilityStoreActions(set),
}));
