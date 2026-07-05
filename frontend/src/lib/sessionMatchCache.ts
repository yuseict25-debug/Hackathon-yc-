import type { CompatibilityData, MatchAnalysisResult } from "@/types/compatibility";

const STORAGE_KEY = "eula-room-match-cache";

type MatchCache = Record<string, CompatibilityData>;

function readCache(): MatchCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MatchCache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: MatchCache): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function getSessionMatches(sessionId: string): CompatibilityData | null {
  return readCache()[sessionId] ?? null;
}

export function saveSessionMatches(
  sessionId: string,
  data: CompatibilityData
): void {
  const cache = readCache();
  cache[sessionId] = data;
  writeCache(cache);
}

export function saveSessionAnalysis(
  sessionId: string,
  result: MatchAnalysisResult & { isReady?: boolean }
): CompatibilityData {
  const data: CompatibilityData = {
    matches: result.matches,
    isReady: result.isReady ?? true,
    status: result.status,
    message: result.message,
    personality: result.personality,
    analyzedAt: result.analyzedAt,
  };
  saveSessionMatches(sessionId, data);
  return data;
}
