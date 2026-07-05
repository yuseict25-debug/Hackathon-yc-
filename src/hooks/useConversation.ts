"use client";

import { useCallback, useEffect } from "react";

import { fetchConversation, sendMessage } from "@/lib/api";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";

export function useConversation() {
  const messages = useConversationStore((s) => s.messages);
  const isTyping = useConversationStore((s) => s.isTyping);
  const isPanelOpen = useConversationStore((s) => s.isPanelOpen);
  const setMessages = useConversationStore((s) => s.setMessages);
  const addMessage = useConversationStore((s) => s.addMessage);
  const setTyping = useConversationStore((s) => s.setTyping);
  const togglePanel = useConversationStore((s) => s.togglePanel);
  const setEmotion = useCharacterStore((s) => s.setEmotion);

  useEffect(() => {
    if (messages.length > 0) return;

    fetchConversation().then((data) => {
      setMessages(data.messages);
      setTyping(data.isTyping);
    });
  }, [messages.length, setMessages, setTyping]);

  const send = useCallback(
    async (content: string) => {
      addMessage({
        id: `msg-user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      });

      setTyping(true);
      setEmotion("eula", "thinking");

      const response = await sendMessage(content);

      setTyping(false);
      setEmotion("eula", "happy");
      addMessage({
        id: response.id,
        role: "eula",
        content:
          "I'm still learning about you. Every word helps me understand who you are a little better.",
        timestamp: response.timestamp,
        emotion: "happy",
      });

      setTimeout(() => setEmotion("eula", "idle"), 2000);
    },
    [addMessage, setTyping, setEmotion]
  );

  return {
    messages,
    isTyping,
    isPanelOpen,
    togglePanel,
    send,
  };
}
