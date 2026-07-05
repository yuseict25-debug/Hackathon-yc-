import type { AuthUser, BackendAuthUser } from "@/types/auth";
import { AuthError, mapBackendUser } from "@/types/auth";
import type { Message, ConversationData } from "@/types/conversation";
import type {
  CompatibilityData,
  MatchAnalysisResult,
} from "@/types/compatibility";
import type { IdentityData } from "@/types/identity";
import type { UserProfile } from "@/types/profile";
import type { RoomData } from "@/types/common";
import type { FurnitureItem } from "@/types/furniture";
import type { CharacterAnimationsData } from "@/types/characterAnimations";
import type { AiMessageResponse, CharacterTonePayload } from "@/types/characterTone";
import type { RoomStatePayload } from "@/types/roomState";

import characterAnimationsMock from "@/data/mock/characterAnimations.json";
import characterToneMock from "@/data/mock/characterTone.json";
import roomStateMock from "@/data/mock/roomState.json";

import {
  getSessionMatches,
  saveSessionAnalysis,
} from "@/lib/sessionMatchCache";
import matchSamplesMock from "@/data/mock/matchSamples.json";
import furnitureMock from "@/data/mock/furniture.json";
import profileMock from "@/data/mock/profile.json";
import roomMock from "@/data/mock/room.json";

import {
  extractFurnitureFromState,
  mapBackendStateToRoomState,
  mapChatResponse,
  mapHistoryMessage,
  type BackendHistoryMessage,
  type BackendSessionState,
} from "@/lib/backendMappers";

const MOCK_DELAY = 300;
const MOCK_SEND_DELAY = 2000;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const HAS_API = Boolean(API_URL);

function delay<T>(data: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export interface ChatSession {
  session_id: string;
  title?: string;
  created_at?: string;
  state?: BackendSessionState;
}

/** POST /user/login — verifies credential and sets httpOnly session cookie */
export async function loginWithGoogleCredential(
  credential: string
): Promise<void> {
  if (!HAS_API) return;

  const response = await apiFetch("/user/login", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new AuthError(body?.error ?? "Google sign-in failed", response.status);
  }
}

/** GET /user/auth — returns the logged-in user (cookie session) */
export async function fetchAuthUser(): Promise<AuthUser> {
  if (!HAS_API) {
    throw new AuthError("API URL not configured");
  }

  const response = await apiFetch("/user/auth");

  if (response.status === 401) {
    throw new AuthError("Not authenticated", 401);
  }

  if (!response.ok) {
    throw new AuthError("Failed to fetch user", response.status);
  }

  const data = (await response.json()) as BackendAuthUser;
  return mapBackendUser(data);
}

export async function logout(): Promise<void> {
  if (!HAS_API) return;

  await apiFetch("/user/logout", { method: "POST" }).catch(() => {
    // Best-effort — cookie may already be cleared
  });
}

  /** Create a new chat session */
export async function createChatSession(title = "My Room"): Promise<ChatSession> {
  if (!HAS_API) {
    return { session_id: "mock-session", title };
  }

  const response = await apiFetch("/chat/session", {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session (${response.status})`);
  }

  return (await response.json()) as ChatSession;
}

/** List all sessions for the current user */
export async function listChatSessions(): Promise<ChatSession[]> {
  if (!HAS_API) {
    return [{ session_id: "mock-session", title: "Mock Session" }];
  }

  const response = await apiFetch("/chat/sessions");
  if (!response.ok) {
    throw new Error(`Failed to list sessions (${response.status})`);
  }

  return (await response.json()) as ChatSession[];
}

/** Create a new chat session or reuse the latest one */
export async function ensureChatSession(): Promise<ChatSession> {
  if (!HAS_API) {
    return {
      session_id: "mock-session",
      title: "Mock Session",
    };
  }

  const sessions = await listChatSessions();
  if (sessions.length > 0) {
    return sessions[0];
  }

  return createChatSession();
}

export async function fetchSessionState(
  sessionId: string
): Promise<{ state: BackendSessionState; updatedAt?: string }> {
  if (!HAS_API) {
    return {
      state: {},
      updatedAt: "mock-initial",
    };
  }

  const response = await apiFetch(`/chat/state/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch session state (${response.status})`);
  }

  const data = (await response.json()) as {
    state: BackendSessionState;
    updated_at?: string;
  };

  return {
    state: data.state,
    updatedAt: data.updated_at,
  };
}

export async function fetchRoom(): Promise<RoomData> {
  return delay(roomMock as RoomData);
}

/** GET /chat/state/:id — backend-driven scene */
export async function fetchRoomState(
  sessionId?: string
): Promise<RoomStatePayload> {
  if (!HAS_API) {
    return delay(roomStateMock as RoomStatePayload);
  }

  const activeSessionId = sessionId ?? (await ensureChatSession()).session_id;
  const { state, updatedAt } = await fetchSessionState(activeSessionId);
  return mapBackendStateToRoomState(state, activeSessionId, updatedAt);
}

export async function fetchFurniture(
  sessionId?: string
): Promise<FurnitureItem[]> {
  if (!HAS_API) {
    const data = furnitureMock as { items: FurnitureItem[] };
    return delay(data.items);
  }

  const activeSessionId = sessionId ?? (await ensureChatSession()).session_id;
  const { state } = await fetchSessionState(activeSessionId);
  return extractFurnitureFromState(state, API_URL);
}

export async function fetchConversation(
  sessionId?: string
): Promise<ConversationData> {
  if (!HAS_API) {
    return delay({
      id: sessionId ?? "mock-session",
      messages: [],
      isTyping: false,
    });
  }

  const activeSessionId = sessionId ?? (await ensureChatSession()).session_id;
  const response = await apiFetch(`/chat/history/${activeSessionId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation (${response.status})`);
  }

  const rows = (await response.json()) as BackendHistoryMessage[];

  return {
    id: activeSessionId,
    messages: rows.map(mapHistoryMessage),
    isTyping: false,
  };
}

export async function fetchIdentity(sessionId: string): Promise<IdentityData> {
  if (HAS_API) {
    const response = await apiFetch(`/chat/identity/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to load identity (${response.status})`);
    }
    return response.json();
  }

  return delay({
    userId: sessionId,
    traits: [],
    completeness: 0,
    lastUpdated: new Date().toISOString(),
  });
}

export async function fetchCompatibility(
  sessionId: string
): Promise<CompatibilityData> {
  return fetchSavedMatches(sessionId);
}

/** Load previously saved match results for one room */
export async function fetchSavedMatches(
  sessionId: string
): Promise<CompatibilityData> {
  if (HAS_API) {
    const response = await apiFetch(`/match/results/${sessionId}`);
    if (response.status === 404) {
      return { matches: [], isReady: false };
    }
    if (!response.ok) {
      throw new Error(`Failed to load matches (${response.status})`);
    }
    return response.json();
  }

  return delay(getSessionMatches(sessionId) ?? { matches: [], isReady: false });
}

/**
 * Run personality analysis and return compatible matches.
 * TODO: Friend's AI — backend POST /match/analyze
 */
export async function analyzeMatches(
  traitLabels: string[] = [],
  completeness = 0,
  sessionId?: string
): Promise<MatchAnalysisResult> {
  if (HAS_API) {
    if (!sessionId) {
      throw new Error("sessionId is required for match analysis");
    }
    const response = await apiFetch(`/match/analyze/${sessionId}`, {
      method: "POST",
      body: JSON.stringify({ traits: traitLabels, completeness }),
    });
    if (!response.ok) {
      throw new Error(`Match analysis failed (${response.status})`);
    }
    return response.json();
  }

  if (!sessionId) {
    throw new Error("sessionId is required for match analysis");
  }

  await delay(null, 2800);

  if (traitLabels.length < 2) {
    const insufficient: MatchAnalysisResult = {
      status: "insufficient_data",
      message: "Not enough info — you need more interaction",
      matches: [],
      personality: {
        headline: "",
        traits: [],
        completeness,
      },
      analyzedAt: new Date().toISOString(),
    };
    saveSessionAnalysis(sessionId, { ...insufficient, isReady: true });
    return insufficient;
  }

  const samples = matchSamplesMock as MatchAnalysisResult;
  const result: MatchAnalysisResult = {
    status: "success",
    message: "It's a match!",
    matches: samples.matches.slice(0, 1),
    personality: {
      headline: samples.personality.headline,
      traits:
        traitLabels.length > 0
          ? traitLabels.slice(0, 6)
          : samples.personality.traits,
      completeness: completeness || samples.personality.completeness,
    },
    analyzedAt: new Date().toISOString(),
  };
  saveSessionAnalysis(sessionId, {
    ...result,
    isReady: true,
  });
  return result;
}

export async function fetchProfile(): Promise<UserProfile> {
  return delay(profileMock as UserProfile);
}

export async function fetchCharacterAnimations(): Promise<CharacterAnimationsData> {
  return delay(characterAnimationsMock as CharacterAnimationsData);
}

export async function sendMessage(
  content: string,
  sessionId?: string
): Promise<AiMessageResponse> {
  if (HAS_API) {
    const activeSessionId = sessionId ?? (await ensureChatSession()).session_id;
    const response = await apiFetch(`/chat/text/${activeSessionId}`, {
      method: "POST",
      body: JSON.stringify({ prompt: content }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message (${response.status})`);
    }

    const data = await response.json();
    return mapChatResponse(data, activeSessionId, API_URL);
  }

  return delay(
    {
      id: `msg-${Date.now()}`,
      content:
        "I'm still learning about you. Every word helps me understand who you are a little better.",
      timestamp: new Date().toISOString(),
      tone: characterToneMock as CharacterTonePayload,
    },
    MOCK_SEND_DELAY
  );
}

export async function executePendingChatAction(
  sessionId?: string
): Promise<AiMessageResponse> {
  if (HAS_API) {
    const activeSessionId = sessionId ?? (await ensureChatSession()).session_id;
    const response = await apiFetch(`/chat/text/${activeSessionId}/execute`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to execute pending action (${response.status})`);
    }

    const data = await response.json();
    return mapChatResponse(data, activeSessionId, API_URL);
  }

  return delay(
    {
      id: `msg-${Date.now()}`,
      content: "There! All set.",
      timestamp: new Date().toISOString(),
      tone: characterToneMock as CharacterTonePayload,
    },
    MOCK_SEND_DELAY
  );
}
