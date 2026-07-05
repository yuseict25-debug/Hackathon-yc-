import { create } from "zustand";

import type { ConversationStore } from "./conversationStore";
import { createConversationStoreActions } from "./conversationStore";

export const useConversationStore = create<ConversationStore>((set) => ({
  messages: [],
  isTyping: false,
  isPanelOpen: false,
  ...createConversationStoreActions(set),
}));
