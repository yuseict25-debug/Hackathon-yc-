import type { Message, ConversationData } from "@/types/conversation";
import type { CompatibilityData } from "@/types/compatibility";
import type { IdentityData } from "@/types/identity";
import type { UserProfile } from "@/types/profile";
import type { RoomData } from "@/types/common";
import type { FurnitureItem } from "@/types/furniture";

import compatibilityMock from "@/data/mock/compatibility.json";
import conversationMock from "@/data/mock/conversation.json";
import furnitureMock from "@/data/mock/furniture.json";
import identityMock from "@/data/mock/identity.json";
import profileMock from "@/data/mock/profile.json";
import roomMock from "@/data/mock/room.json";

const MOCK_DELAY = 300;

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), MOCK_DELAY);
  });
}

export async function fetchRoom(): Promise<RoomData> {
  return delay(roomMock as RoomData);
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

export async function sendMessage(
  content: string
): Promise<{ id: string; content: string; timestamp: string }> {
  return delay({
    id: `msg-${Date.now()}`,
    content,
    timestamp: new Date().toISOString(),
  });
}
