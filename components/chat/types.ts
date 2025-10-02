export interface MessagePart {
  type: string;
  text?: string;
  state?: string;
  input?: any;
  output?: any;
  result?: any;
  toolCallId?: string;
  callProviderMetadata?: any;
  providerMetadata?: any;
  errorText?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
}

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
