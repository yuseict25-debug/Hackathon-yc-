import type {
  CompatibilityMatch,
  MatchAnalysisStatus,
  MatchResultStatus,
  PersonalitySnapshot,
} from "@/types/compatibility";

export interface CompatibilityStore {
  sessionId: string | null;
  matches: CompatibilityMatch[];
  isReady: boolean;
  isPanelOpen: boolean;
  status: MatchAnalysisStatus;
  resultStatus: MatchResultStatus;
  message: string | null;
  personality: PersonalitySnapshot | null;
  analyzedAt: string | null;
  errorMessage: string | null;
  setMatches: (matches: CompatibilityMatch[]) => void;
  setReady: (ready: boolean) => void;
  setStatus: (status: MatchAnalysisStatus) => void;
  setResultStatus: (status: MatchResultStatus) => void;
  setMessage: (message: string | null) => void;
  setPersonality: (personality: PersonalitySnapshot | null) => void;
  setAnalyzedAt: (at: string | null) => void;
  setErrorMessage: (message: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  togglePanel: () => void;
  resetMatchState: () => void;
}

export function createCompatibilityStoreActions(
  set: (
    partial:
      | Partial<CompatibilityStore>
      | ((state: CompatibilityStore) => Partial<CompatibilityStore>)
  ) => void
): Omit<
  CompatibilityStore,
  | "sessionId"
  | "matches"
  | "isReady"
  | "isPanelOpen"
  | "status"
  | "resultStatus"
  | "message"
  | "personality"
  | "analyzedAt"
  | "errorMessage"
> {
  return {
    setMatches: (matches) => set({ matches }),
    setReady: (isReady) => set({ isReady }),
    setStatus: (status) => set({ status }),
    setResultStatus: (resultStatus) => set({ resultStatus }),
    setMessage: (message) => set({ message }),
    setPersonality: (personality) => set({ personality }),
    setAnalyzedAt: (analyzedAt) => set({ analyzedAt }),
    setErrorMessage: (errorMessage) => set({ errorMessage }),
    setSessionId: (sessionId) => set({ sessionId }),
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
    resetMatchState: () =>
      set({
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
      }),
  };
}
