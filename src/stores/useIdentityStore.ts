import { create } from "zustand";

import type { IdentityStore } from "./identityStore";
import { createIdentityStoreActions } from "./identityStore";

export const useIdentityStore = create<IdentityStore>((set) => ({
  traits: [],
  completeness: 0,
  isPanelOpen: false,
  ...createIdentityStoreActions(set),
}));
