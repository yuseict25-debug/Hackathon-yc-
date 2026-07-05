export interface Message {
  id: string;
  role: "user" | "eula";
  content: string;
  timestamp: string;
  tone?: string;
  animation?: string;
}

export interface ConversationData {
  id: string;
  messages: Message[];
  isTyping: boolean;
}
