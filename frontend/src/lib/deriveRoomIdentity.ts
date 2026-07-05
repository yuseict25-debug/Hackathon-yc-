import identityMock from "@/data/mock/identity.json";
import type { Message } from "@/types/conversation";
import type { IdentityData } from "@/types/identity";

function hashSession(sessionId: string): number {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Derive room-scoped identity from user messages in this session only */
export function deriveRoomIdentity(
  messages: Message[],
  sessionId: string
): IdentityData {
  const userMessages = messages.filter((message) => message.role === "user");
  const pool = [...identityMock.traits];
  const offset = hashSession(sessionId) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];

  const traitCount = Math.min(
    rotated.length,
    Math.floor(userMessages.length / 2)
  );
  const traits = rotated.slice(0, traitCount);
  const completeness = Math.min(0.95, userMessages.length * 0.03);

  return {
    userId: sessionId,
    traits,
    completeness,
    lastUpdated: new Date().toISOString(),
  };
}
