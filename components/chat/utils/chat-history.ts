import type { Message } from "../types";

export interface ChatPreview {
  id: string;
  timestamp: Date;
  messages: Array<{ role: "user" | "assistant"; text: string }>;
  fullMessages: Message[];
}

const HISTORY_KEY = "chat-history";
const MAX_HISTORY = 10;

export function convertMessagesToPreview(messages: Message[]): ChatPreview["messages"] {
  const preview: ChatPreview["messages"] = [];

  for (const msg of messages) {
    if (msg.role === "user" || msg.role === "assistant") {
      // Extract only text parts
      const textParts = msg.parts
        .filter((part) => part.type === "text")
        .map((part) => ('text' in part ? part.text : ''))
        .filter(text => text?.trim())
        .join(" ");

      if (textParts) {
        preview.push({
          role: msg.role,
          text: textParts,
        });
      }
    }
  }

  return preview;
}

function isSameChat(messages1: Message[], messages2: Message[]): boolean {
  if (!messages1 || !messages2 || messages1.length !== messages2.length) return false;

  return messages1.every((msg1, idx) => {
    const msg2 = messages2[idx];
    if (msg1.role !== msg2.role) return false;
    if (msg1.parts.length !== msg2.parts.length) return false;

    return msg1.parts.every((part1, pIdx) => {
      const part2 = msg2.parts[pIdx];
      const text1 = 'text' in part1 ? part1.text : undefined;
      const text2 = 'text' in part2 ? part2.text : undefined;
      return part1.type === part2.type && text1 === text2;
    });
  });
}

export function saveChatToHistory(messages: Message[]): void {
  if (!messages.length) return;

  const preview = convertMessagesToPreview(messages);
  if (!preview.length) return;

  const history = getChatHistory();

  // Check if this chat already exists in history
  const isDuplicate = history.some((chat) => chat.fullMessages && isSameChat(chat.fullMessages, messages));
  if (isDuplicate) return;

  const chatPreview: ChatPreview = {
    id: Date.now().toString(),
    timestamp: new Date(),
    messages: preview,
    fullMessages: messages,
  };

  history.unshift(chatPreview);

  // Keep only last MAX_HISTORY chats
  const trimmed = history.slice(0, MAX_HISTORY);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function getChatById(chatId: string): Message[] | null {
  const history = getChatHistory();
  const chat = history.find((c) => c.id === chatId);
  return chat?.fullMessages || null;
}

export function getChatHistory(): ChatPreview[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    // Convert timestamp strings back to Date objects
    return parsed.map((chat: any) => ({
      ...chat,
      timestamp: new Date(chat.timestamp),
      fullMessages: chat.fullMessages as Message[],
    }));
  } catch (e) {
    console.error("Failed to load chat history", e);
    return [];
  }
}

export function clearChatHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
