export type MatchType =
  | "friendship"
  | "cofounder"
  | "teammate"
  | "mentor"
  | "roommate"
  | "relationship"
  | "community";

export type MatchAnalysisStatus =
  | "idle"
  | "analyzing"
  | "ready"
  | "error";

export interface CompatibilityMatch {
  id: string;
  name: string;
  compatibilityScore: number;
  sharedTraits: string[];
  matchType: MatchType;
  summary: string;
  /** Optional avatar accent — hex color */
  avatarColor?: string;
  /** One-line vibe tag, e.g. "Calm builder" */
  vibe?: string;
}

/** Snapshot of the user's personality fed into matching (from identity + future AI) */
export interface PersonalitySnapshot {
  headline: string;
  traits: string[];
  completeness: number;
}

export type MatchResultStatus =
  | "success"
  | "insufficient_data"
  | "no_match"
  | "idle";

export interface MatchAnalysisResult {
  status: MatchResultStatus;
  message?: string;
  matches: CompatibilityMatch[];
  personality: PersonalitySnapshot;
  analyzedAt: string;
}

export interface CompatibilityData {
  matches: CompatibilityMatch[];
  isReady: boolean;
  status?: MatchResultStatus;
  message?: string | null;
  personality?: PersonalitySnapshot;
  analyzedAt?: string;
}
