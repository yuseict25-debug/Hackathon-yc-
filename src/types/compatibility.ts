export interface CompatibilityMatch {
  id: string;
  name: string;
  compatibilityScore: number;
  sharedTraits: string[];
  matchType: "friendship" | "cofounder" | "teammate" | "mentor" | "roommate" | "relationship" | "community";
  summary: string;
}

export interface CompatibilityData {
  matches: CompatibilityMatch[];
  isReady: boolean;
}
