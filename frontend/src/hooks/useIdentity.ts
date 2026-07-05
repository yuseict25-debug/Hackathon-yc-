"use client";

import { useEffect } from "react";

import { deriveRoomIdentity } from "@/lib/deriveRoomIdentity";
import { fetchIdentity } from "@/lib/api";
import { useConversationStore } from "@/stores/useConversationStore";
import { useIdentityStore } from "@/stores/useIdentityStore";
import { useSceneStore } from "@/stores/useSceneStore";

const HAS_API = Boolean(process.env.NEXT_PUBLIC_API_URL);

export function useIdentity() {
  const sessionId = useSceneStore((s) => s.sessionId);
  const messages = useConversationStore((s) => s.messages);
  const traits = useIdentityStore((s) => s.traits);
  const completeness = useIdentityStore((s) => s.completeness);
  const loadedSessionId = useIdentityStore((s) => s.sessionId);
  const isPanelOpen = useIdentityStore((s) => s.isPanelOpen);
  const setSessionId = useIdentityStore((s) => s.setSessionId);
  const setTraits = useIdentityStore((s) => s.setTraits);
  const setCompleteness = useIdentityStore((s) => s.setCompleteness);
  const togglePanel = useIdentityStore((s) => s.togglePanel);

  useEffect(() => {
    if (!sessionId) return;

    if (loadedSessionId !== sessionId) {
      setSessionId(sessionId);
      setTraits([]);
      setCompleteness(0);
    }

    if (HAS_API) {
      fetchIdentity(sessionId).then((data) => {
        if (useSceneStore.getState().sessionId !== sessionId) return;
        setTraits(data.traits);
        setCompleteness(data.completeness);
      });
      return;
    }

    const data = deriveRoomIdentity(messages, sessionId);
    setTraits(data.traits);
    setCompleteness(data.completeness);
  }, [
    loadedSessionId,
    messages,
    sessionId,
    setCompleteness,
    setSessionId,
    setTraits,
  ]);

  return {
    traits,
    completeness,
    isPanelOpen,
    togglePanel,
    sessionId,
  };
}
