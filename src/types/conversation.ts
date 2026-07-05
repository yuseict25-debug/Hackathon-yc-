export interface Message {
  id: string;
  role: "user" | "eula";
  content: string;
  timestamp: string;
  emotion?: string;
}

export interface ConversationData {
  id: string;
  messages: Message[];
  isTyping: boolean;
}
