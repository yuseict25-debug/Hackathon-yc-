"use client";

import { useCallback, useEffect, useRef } from "react";

import { CharacterAssetLoader } from "@/engine/pixi/CharacterAssetLoader";
import { applyRoomState } from "@/engine/room/applyRoomState";
import { fetchConversation, sendMessage, executePendingChatAction } from "@/lib/api";
import { pauseForDialogue } from "@/lib/dialogueTiming";
import { runActionQueue } from "@/lib/runActionQueue";
import type { AiMessageResponse, CharacterTonePayload } from "@/types/characterTone";
import { useCharacterStore } from "@/stores/useCharacterStore";
import { useConversationStore } from "@/stores/useConversationStore";
import { useFurnitureStore } from "@/stores/useFurnitureStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSceneStore } from "@/stores/useSceneStore";
import { useWorldStore } from "@/stores/useWorldStore";

const HAS_API = Boolean(process.env.NEXT_PUBLIC_API_URL);

const TEXT_DELIVERY_MS = 3000;

export function useConversation() {
  const sessionId = useSceneStore((s) => s.sessionId);
  const messages = useConversationStore((s) => s.messages);
  const isTyping = useConversationStore((s) => s.isTyping);
  const isSpeaking = useConversationStore((s) => s.isSpeaking);
  const voiceModeEnabled = useConversationStore((s) => s.voiceModeEnabled);
  const isPanelOpen = useConversationStore((s) => s.isPanelOpen);
  const setMessages = useConversationStore((s) => s.setMessages);
  const addMessage = useConversationStore((s) => s.addMessage);
  const setTyping = useConversationStore((s) => s.setTyping);
  const setBuilding = useConversationStore((s) => s.setBuilding);
  const setSpeaking = useConversationStore((s) => s.setSpeaking);
  const setDeliveringResponse = useConversationStore(
    (s) => s.setDeliveringResponse
  );
  const setAiTone = useConversationStore((s) => s.setAiTone);
  const toggleVoiceMode = useConversationStore((s) => s.toggleVoiceMode);
  const togglePanel = useConversationStore((s) => s.togglePanel);
  const setItems = useFurnitureStore((s) => s.setItems);

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

  const applySceneUpdates = useCallback(
    (response: AiMessageResponse) => {
      if (response.deferredRoomState) {
        applyRoomState({
          next: response.deferredRoomState,
          scene: useSceneStore.getState(),
          character: useCharacterStore.getState(),
          room: useRoomStore.getState(),
          world: useWorldStore.getState(),
        });
      } else if (response.roomState) {
        applyRoomState({
          next: response.roomState,
          scene: useSceneStore.getState(),
          character: useCharacterStore.getState(),
          room: useRoomStore.getState(),
          world: useWorldStore.getState(),
        });
      }

      const furniture = response.deferredFurniture ?? response.furniture;
      if (furniture?.length) {
        setItems(furniture);
      }
    },
    [setItems]
  );

  useEffect(() => {
    if (messages.length > 0) return;
    if (HAS_API && !sessionId) return;

    fetchConversation(sessionId ?? undefined).then((data) => {
      setMessages(data.messages);
      setTyping(data.isTyping);
    });
  }, [messages.length, sessionId, setMessages, setTyping]);

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

      const response = await sendMessage(content, sessionId ?? undefined);

      setTyping(false);

      const finishDelivery = (tone: AiMessageResponse["tone"]) => {
        if (voiceModeEnabled) {
          setSpeaking(true);
        } else {
          clearDeliveryTimer();
          deliveryTimerRef.current = setTimeout(
            () => endAiResponse(),
            TEXT_DELIVERY_MS
          );
        }
      };

      const appendEulaMessage = (msg: AiMessageResponse) => {
        addMessage({
          id: msg.id,
          role: "eula",
          content: msg.content,
          timestamp: msg.timestamp,
          tone: msg.tone.tone,
          animation: msg.tone.animation,
        });
      };

      const queue = response.actionQueue ?? [];

      if (response.pendingExecution) {
        await applyTone(response.tone);
        appendEulaMessage(response);
        await pauseForDialogue(response.content);

        if (queue.length > 0) {
          await runActionQueue({
            steps: queue,
            tone: response.tone,
            applyTone,
            applySceneUpdates,
            appendEulaMessage,
            setBuilding,
            setTyping,
            onBuild: () => executePendingChatAction(sessionId ?? undefined),
          });
        } else if (response.sceneAction) {
          await applyTone({ ...response.tone, animation: "walking" });
          const { walkPlayerTo } = await import("@/engine/player/walkToPosition");
          await walkPlayerTo(
            response.sceneAction.walkTo.x,
            response.sceneAction.walkTo.y
          );
          useSceneStore.getState().setMovementControl("player");

          setTyping(true);
          setBuilding(true);
          try {
            const followUp = await executePendingChatAction(sessionId ?? undefined);
            applySceneUpdates(followUp);
            await applyTone(followUp.tone);
            appendEulaMessage(followUp);
          } catch {
            const errorMsg: AiMessageResponse = {
              id: `msg-err-${Date.now()}`,
              content:
                "Ugh — something went wrong while I was making that. Want to try again?",
              timestamp: new Date().toISOString(),
              tone: {
                tone: "empathetic",
                animation: "confused",
                speed: 0.09,
                loop: true,
              },
            };
            await applyTone(errorMsg.tone);
            appendEulaMessage(errorMsg);
            finishDelivery(errorMsg.tone);
            return;
          } finally {
            setTyping(false);
            setBuilding(false);
          }
        }

        finishDelivery(response.tone);
        return;
      }

      if (queue.length > 0) {
        await applyTone(response.tone);
        appendEulaMessage(response);
        await pauseForDialogue(response.content);
        await runActionQueue({
          steps: queue,
          tone: response.tone,
          applyTone,
          applySceneUpdates,
          appendEulaMessage,
          setBuilding,
          setTyping,
          onBuild: () => executePendingChatAction(sessionId ?? undefined),
        });
        applySceneUpdates(response);
        finishDelivery(response.tone);
        return;
      }

      if (response.sceneAction) {
        await applyTone({ ...response.tone, animation: "walking" });
        const { walkPlayerTo, walkPlayerHome } = await import(
          "@/engine/player/walkToPosition"
        );
        await walkPlayerTo(
          response.sceneAction.walkTo.x,
          response.sceneAction.walkTo.y
        );
        applySceneUpdates(response);
        useSceneStore.getState().setMovementControl("player");
        await applyTone(response.tone);
        await walkPlayerHome();
      } else {
        await applyTone(response.tone);
        applySceneUpdates(response);
      }

      appendEulaMessage(response);
      finishDelivery(response.tone);
    },
    [
      addMessage,
      applySceneUpdates,
      applyTone,
      clearDeliveryTimer,
      endAiResponse,
      setDeliveringResponse,
      sessionId,
      setSpeaking,
      setTyping,
      setBuilding,
      voiceModeEnabled,
    ]
  );

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
