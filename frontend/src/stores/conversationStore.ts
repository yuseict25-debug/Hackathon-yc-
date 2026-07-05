import type { Message } from "@/types/conversation";
import type { CharacterTonePayload } from "@/types/characterTone";

export interface ConversationStore {
  messages: Message[];
  isTyping: boolean;
  isSpeaking: boolean;
  isDeliveringResponse: boolean;
  voiceModeEnabled: boolean;
  aiTone: CharacterTonePayload | null;
  isPanelOpen: boolean;
  isUserTyping: boolean;
  /** True while generating/placing a room object */
  isBuilding: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setDeliveringResponse: (delivering: boolean) => void;
  setAiTone: (tone: CharacterTonePayload | null) => void;
  setVoiceMode: (enabled: boolean) => void;
  toggleVoiceMode: () => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setUserTyping: (typing: boolean) => void;
  setBuilding: (building: boolean) => void;
}

export function createConversationStoreActions(
  set: (
    partial:
      | Partial<ConversationStore>
      | ((state: ConversationStore) => Partial<ConversationStore>)
  ) => void
): Omit<
  ConversationStore,
  | "messages"
  | "isTyping"
  | "isSpeaking"
  | "isDeliveringResponse"
  | "voiceModeEnabled"
  | "aiTone"
  | "isPanelOpen"
  | "isUserTyping"
  | "isBuilding"
> {
  return {
    setMessages: (messages) => set({ messages }),
    addMessage: (message) =>
      set((state) => ({ messages: [...state.messages, message] })),
    setTyping: (isTyping) => set({ isTyping }),
    setSpeaking: (isSpeaking) => set({ isSpeaking }),
    setDeliveringResponse: (isDeliveringResponse) =>
      set({ isDeliveringResponse }),
    setAiTone: (aiTone) => set({ aiTone }),
    setVoiceMode: (voiceModeEnabled) => set({ voiceModeEnabled }),
    toggleVoiceMode: () =>
      set((state) => ({ voiceModeEnabled: !state.voiceModeEnabled })),
    setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
    setUserTyping: (isUserTyping) => set({ isUserTyping }),
    setBuilding: (isBuilding) => set({ isBuilding }),
  };
}
