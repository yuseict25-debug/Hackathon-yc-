import { create } from "zustand";

import { createAuthStoreActions, type AuthStore } from "./authStore";

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  ...createAuthStoreActions(set),
}));
