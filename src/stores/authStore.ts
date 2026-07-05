import type { AuthUser } from "@/types/auth";

export interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export function createAuthStoreActions(
  set: (
    partial: Partial<AuthStore> | ((state: AuthStore) => Partial<AuthStore>)
  ) => void
): Omit<
  AuthStore,
  "user" | "isAuthenticated" | "isHydrated" | "isLoading"
> {
  return {
    setUser: (user) =>
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      }),
    clearSession: () =>
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }),
    setHydrated: (isHydrated) => set({ isHydrated }),
    setLoading: (isLoading) => set({ isLoading }),
  };
}

/** Dev-only mock user when NEXT_PUBLIC_API_URL is unset */
export const DEV_MOCK_USER: AuthUser = {
  id: "mock-user",
  email: "you@example.com",
  name: "You",
};
