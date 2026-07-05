"use client";

import { useCallback, useEffect, useRef } from "react";

import { CharacterAssetLoader } from "@/engine/pixi/CharacterAssetLoader";
import { applyRoomState } from "@/engine/room/applyRoomState";
import { fetchConversation, sendMessage } from "@/lib/api";
import type { CharacterTonePayload } from "@/types/characterTone";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSceneStore } from "@/stores/useSceneStore";
import { useWorldStore } from "@/stores/useWorldStore";

const TEXT_DELIVERY_MS = 3000;

export function useConversation() {
  const messages = useConversationStore((s) => s.messages);
  const isTyping = useConversationStore((s) => s.isTyping);
  const isSpeaking = useConversationStore((s) => s.isSpeaking);
  const voiceModeEnabled = useConversationStore((s) => s.voiceModeEnabled);
  const isPanelOpen = useConversationStore((s) => s.isPanelOpen);
  const setMessages = useConversationStore((s) => s.setMessages);
  const addMessage = useConversationStore((s) => s.addMessage);
  const setTyping = useConversationStore((s) => s.setTyping);
  const setSpeaking = useConversationStore((s) => s.setSpeaking);
  const setDeliveringResponse = useConversationStore(
    (s) => s.setDeliveringResponse
  );
  const setAiTone = useConversationStore((s) => s.setAiTone);
  const toggleVoiceMode = useConversationStore((s) => s.toggleVoiceMode);
  const togglePanel = useConversationStore((s) => s.togglePanel);

  const deliveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDeliveryTimer = useCallback(() => {
    if (deliveryTimerRef.current) {
      clearTimeout(deliveryTimerRef.current);
      deliveryTimerRef.current = null;
    }
  }, []);

  const applyTone = useCallback(
    async (tone: CharacterTonePayload) => {
      await CharacterAssetLoader.applyBackendTone(tone);
      setAiTone(tone);
    },
    [setAiTone]
  );

  const endAiResponse = useCallback(() => {
    clearDeliveryTimer();
    setDeliveringResponse(false);
    setSpeaking(false);
    setAiTone(null);
    CharacterAssetLoader.applyBackendTone(null);
  }, [clearDeliveryTimer, setDeliveringResponse, setSpeaking, setAiTone]);

  useEffect(() => {
    if (messages.length > 0) return;

    fetchConversation().then((data) => {
      setMessages(data.messages);
      setTyping(data.isTyping);
    });
  }, [messages.length, setMessages, setTyping]);

  useEffect(() => () => clearDeliveryTimer(), [clearDeliveryTimer]);

  const send = useCallback(
    async (content: string) => {
      endAiResponse();

      addMessage({
        id: `msg-user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      });

      setTyping(true);
      setDeliveringResponse(true);

      const response = await sendMessage(content);

      setTyping(false);
      await applyTone(response.tone);

      if (response.roomState) {
        applyRoomState({
          next: response.roomState,
          scene: useSceneStore.getState(),
          character: useCharacterStore.getState(),
          room: useRoomStore.getState(),
          world: useWorldStore.getState(),
        });
      }

      addMessage({
        id: response.id,
        role: "eula",
        content: response.content,
        timestamp: response.timestamp,
        tone: response.tone.tone,
        animation: response.tone.animation,
      });

      if (voiceModeEnabled) {
        setSpeaking(true);
      } else {
        clearDeliveryTimer();
        deliveryTimerRef.current = setTimeout(
          () => endAiResponse(),
          TEXT_DELIVERY_MS
        );
      }
    },
    [
      addMessage,
      applyTone,
      clearDeliveryTimer,
      endAiResponse,
      setDeliveringResponse,
      setSpeaking,
      setTyping,
      voiceModeEnabled,
    ]
  );

  /** Called when backend TTS playback finishes */
  const stopSpeaking = useCallback(() => {
    endAiResponse();
  }, [endAiResponse]);

  return {
    messages,
    isTyping,
    isSpeaking,
    voiceModeEnabled,
    isPanelOpen,
    togglePanel,
    toggleVoiceMode,
    setSpeaking,
    stopSpeaking,
    send,
  };
}
