import type { AuthUser, BackendAuthUser } from "@/types/auth";
import { AuthError, mapBackendUser } from "@/types/auth";
import type { Message, ConversationData } from "@/types/conversation";
import type { CompatibilityData } from "@/types/compatibility";
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

import compatibilityMock from "@/data/mock/compatibility.json";
import conversationMock from "@/data/mock/conversation.json";
import furnitureMock from "@/data/mock/furniture.json";
import identityMock from "@/data/mock/identity.json";
import profileMock from "@/data/mock/profile.json";
import roomMock from "@/data/mock/room.json";

const MOCK_DELAY = 300;
const MOCK_SEND_DELAY = 2000;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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

/** POST /google — verifies credential and sets httpOnly session cookie */
export async function loginWithGoogleCredential(
  credential: string
): Promise<void> {
  if (!API_URL) return;

  const response = await apiFetch("/google", {
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

/** GET /auth — returns the logged-in user (cookie session) */
export async function fetchAuthUser(): Promise<AuthUser> {
  if (!API_URL) {
    throw new AuthError("API URL not configured");
  }

  const response = await apiFetch("/auth");

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
  if (!API_URL) return;

  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {
    // Best-effort — cookie may already be cleared
  });
}

export async function fetchRoom(): Promise<RoomData> {
  return delay(roomMock as RoomData);
}

/** GET /room/state — backend-driven scene (background, character pose, etc.) */
export async function fetchRoomState(): Promise<RoomStatePayload> {
  if (!API_URL) {
    return delay(roomStateMock as RoomStatePayload);
  }

  const response = await apiFetch("/room/state");

  if (!response.ok) {
    throw new Error(`Failed to fetch room state (${response.status})`);
  }

  return (await response.json()) as RoomStatePayload;
}

export async function fetchFurniture(): Promise<FurnitureItem[]> {
  const data = furnitureMock as { items: FurnitureItem[] };
  return delay(data.items);
}

export async function fetchConversation(): Promise<ConversationData> {
  return delay({
    id: "conv-1",
    messages: conversationMock.messages as Message[],
    isTyping: conversationMock.isTyping,
  });
}

export async function fetchIdentity(): Promise<IdentityData> {
  return delay(identityMock as IdentityData);
}

export async function fetchCompatibility(): Promise<CompatibilityData> {
  return delay(compatibilityMock as CompatibilityData);
}

export async function fetchProfile(): Promise<UserProfile> {
  return delay(profileMock as UserProfile);
}

export async function fetchCharacterAnimations(): Promise<CharacterAnimationsData> {
  return delay(characterAnimationsMock as CharacterAnimationsData);
}

export async function sendMessage(content: string): Promise<AiMessageResponse> {
  if (API_URL) {
    const response = await apiFetch("/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message (${response.status})`);
    }

    return (await response.json()) as AiMessageResponse;
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
