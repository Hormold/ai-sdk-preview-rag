import type { UIMessage, InferUITools } from "ai";
import type { ChatTools, ChatDataTypes } from "@/lib/ai/tools";

// Infer UI tool types from ChatTools
export type ChatUITools = InferUITools<ChatTools>;

// Create typed UIMessage with our tools and data types
export type Message = UIMessage<unknown, ChatDataTypes, ChatUITools>;
export type MessagePart = Message['parts'][number];

export interface MessageListProps {
  messages: Message[];
  status: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onFocusInput?: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  allMessages: Message[];
}

export interface PartComponentProps {
  part: MessagePart;
  index?: number;
}
