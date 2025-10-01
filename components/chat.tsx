"use client";

import { useEffect, useState, useRef, RefObject } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { ChatHeader } from "./chat/ChatHeader";
import { CategoryFilter } from "./chat/CategoryFilter";
import { MessageList } from "./chat/MessageList";
import { ChatInput } from "./chat/ChatInput";

interface ChatProps {
  onClose?: () => void;
}

export default function Chat({ onClose }: ChatProps = {}) {
  const [input, setInput] = useState<string>("");
  const [model, setModel] = useState<"gpt-5" | "gpt-5-mini">("gpt-5-mini");
  const [reasoningEffort, setReasoningEffort] = useState<"low" | "medium" | "high">("low");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map frontend model names to API model names
  const apiModel = model === "gpt-5" ? "high" : "low";

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model: apiModel, currentUrl, selectedCategories, effort: reasoningEffort },
    }),
    onError: (error) => {
      toast.error("You've been rate limited, please try again later!");
    },
  });

  // Load messages and categories from localStorage on mount
  useEffect(() => {
    setCurrentUrl(window.location.href);

    const saved = localStorage.getItem("chat-messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }

    const savedCategories = localStorage.getItem("selected-categories");
    if (savedCategories) {
      try {
        setSelectedCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error("Failed to parse saved categories", e);
      }
    }

    // Fetch available categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat-messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem("chat-messages");
  };

  const handleSubmit = () => {
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b]">
      <ChatHeader
        model={model}
        reasoningEffort={reasoningEffort}
        onModelChange={setModel}
        onReasoningChange={setReasoningEffort}
        onClear={handleClear}
        onClose={onClose}
      />

      <MessageList
        messages={messages}
        status={status}
        messagesEndRef={messagesEndRef as RefObject<HTMLDivElement>}
      />

      <div className="flex-shrink-0 border-t border-[#1a1a1b] bg-[#0a0a0b] p-4">
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onSelectCategories={setSelectedCategories}
        />

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={status === "submitted"}
        />
      </div>
    </div>
  );
}
