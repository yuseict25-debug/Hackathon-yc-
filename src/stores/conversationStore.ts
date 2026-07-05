import type { Message } from "@/types/conversation";

export interface ConversationStore {
  messages: Message[];
  isTyping: boolean;
  isPanelOpen: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
}

export function createConversationStoreActions(
  set: (
    partial:
      | Partial<ConversationStore>
      | ((state: ConversationStore) => Partial<ConversationStore>)
  ) => void
): Omit<ConversationStore, "messages" | "isTyping" | "isPanelOpen"> {
  return {
    setMessages: (messages) => set({ messages }),
    addMessage: (message) =>
      set((state) => ({ messages: [...state.messages, message] })),
    setTyping: (isTyping) => set({ isTyping }),
    setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  };
}
