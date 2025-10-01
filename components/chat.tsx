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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map frontend model names to API model names
  const apiModel = model === "gpt-5" ? "high" : "low";

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model: apiModel, currentUrl, selectedCategories, effort: reasoningEffort },
    }),
    onData: (data) => {
      setError(null);
    },
    onError: (error) => {
      console.error("Error occurred", error);
      setError(error.message || String(error));
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

    const savedModel = localStorage.getItem("chat-model");
    if (savedModel) {
      setModel(savedModel as "gpt-5" | "gpt-5-mini");
    }

    const savedEffort = localStorage.getItem("chat-reasoning-effort");
    if (savedEffort) {
      setReasoningEffort(savedEffort as "low" | "medium" | "high");
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

  // Save model to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chat-model", model);
  }, [model]);

  // Save reasoning effort to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chat-reasoning-effort", reasoningEffort);
  }, [reasoningEffort]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem("chat-messages");
    setError(null);
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

      {error && (
        <div className="flex-shrink-0 bg-red-950 border-t border-red-800 px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-red-200 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Error occurred</span>
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors flex-shrink-0"
              >
                Clear Chat
              </button>
            </div>
            <div className="text-red-300 text-xs font-mono pl-6 break-all">
              {error}
            </div>
          </div>
        </div>
      )}

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
