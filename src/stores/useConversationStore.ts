import { create } from "zustand";

import type { ConversationStore } from "./conversationStore";
import { createConversationStoreActions } from "./conversationStore";

export const useConversationStore = create<ConversationStore>((set) => ({
  messages: [],
  isTyping: false,
  isSpeaking: false,
  isDeliveringResponse: false,
  voiceModeEnabled: false,
  aiTone: null,
  isPanelOpen: false,
  isUserTyping: false,
  ...createConversationStoreActions(set),
}));
