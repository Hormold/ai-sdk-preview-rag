"use client";

import { useEffect, useState, useRef, RefObject } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { ChatHeader } from "./chat/ChatHeader";
import { CategoryFilter } from "./chat/CategoryFilter";
import { MessageList } from "./chat/MessageList";
import { ChatInput } from "./chat/ChatInput";
import { saveChatToHistory, getChatById } from "./chat/utils/chat-history";
import type { Message } from "./chat/types";

interface ChatProps {
  onClose?: () => void;
  onExpandChange?: (isExpanded: boolean) => void;
  talkWithPage?: boolean;
  pageTitle?: string;
  pageUrl?: string;
  onDisableTalkWithPage?: () => void;
}

export default function Chat({ onClose, onExpandChange, talkWithPage = false, pageTitle, pageUrl, onDisableTalkWithPage }: ChatProps = {}) {
  const [input, setInput] = useState<string>("");
  const [model, setModel] = useState<"low" | "high">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("chat-model");
      return (saved as "low" | "high") || "low";
    }
    return "low";
  });
  const [reasoningEffort, setReasoningEffort] = useState<"low" | "medium" | "high">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("chat-reasoning-effort");
      return (saved as "low" | "medium" | "high") || "low";
    }
    return "low";
  });
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("chat-expanded");
      return saved === "true";
    }
    return false;
  });
  const [userHasScrolled, setUserHasScrolled] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const modelRef = useRef(model);
  const effortRef = useRef(reasoningEffort);
  const categoriesRef = useRef(selectedCategories);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    effortRef.current = reasoningEffort;
  }, [reasoningEffort]);

  useEffect(() => {
    categoriesRef.current = selectedCategories;
  }, [selectedCategories]);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        model: modelRef.current,
        currentUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        selectedCategories: categoriesRef.current,
        effort: effortRef.current,
        talkWithPage,
      }),
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

  // Save model to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chat-model", model);
  }, [model]);

  // Save reasoning effort to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chat-reasoning-effort", reasoningEffort);
  }, [reasoningEffort]);

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chat-expanded", String(isExpanded));
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  // Reset userHasScrolled when streaming stops
  useEffect(() => {
    if (status !== 'streaming') {
      setUserHasScrolled(false);
    }
  }, [status]);

  // Auto-scroll to bottom when messages change, but only during streaming and if user hasn't scrolled
  useEffect(() => {
    if (!userHasScrolled && (status === 'streaming' || status === 'submitted')) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userHasScrolled, status]);

  // Detect user scroll during streaming
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let lastScrollTop = container.scrollTop;

    const handleScroll = () => {
      if (status === 'streaming') {
        const currentScrollTop = container.scrollTop;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        // If user scrolled up (even slightly), disable auto-scroll
        if (currentScrollTop < lastScrollTop && !userHasScrolled) {
          setUserHasScrolled(true);
        }
        // Re-enable only when explicitly at bottom
        else if (isAtBottom && userHasScrolled) {
          setUserHasScrolled(false);
        }

        lastScrollTop = currentScrollTop;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [status, userHasScrolled]);

  const handleClear = () => {
    // Save current chat to history before clearing
    if (messages.length > 0) {
      saveChatToHistory(messages as Message[]);
    }

    setMessages([]);
    localStorage.removeItem("chat-messages");
    setError(null);
  };

  const handleRestoreChat = (chatId: string) => {
    const chatMessages = getChatById(chatId);
    if (chatMessages) {
      // Save current chat first if not empty
      if (messages.length > 0) {
        saveChatToHistory(messages as Message[]);
      }

      setMessages(chatMessages);
      localStorage.setItem("chat-messages", JSON.stringify(chatMessages));

      // Force scroll after messages render
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
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
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onRestoreChat={handleRestoreChat}
      />

      <MessageList
        ref={messagesContainerRef}
        messages={messages as Message[]}
        status={status}
        messagesEndRef={messagesEndRef as RefObject<HTMLDivElement>}
        onFocusInput={() => inputRef.current?.focus()}
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

      <div className="flex-shrink-0 px-4 pb-4">
        <div className="mb-2">
          <AnimatePresence>
            {talkWithPage && pageTitle && (
              <motion.div
                className="inset-0"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#1a1a1b] border border-[#333333] rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-sm text-[#f8fafc]">{pageTitle}</span>
                  </div>
                  <button
                    onClick={onDisableTalkWithPage}
                    className="p-1 text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
                    title="Exit page mode"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <ChatInput
          ref={inputRef as RefObject<HTMLTextAreaElement>}
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onStop={stop}
          disabled={status === "submitted"}
          isStreaming={status === "streaming"}
          model={model}
          reasoningEffort={reasoningEffort}
          onModelChange={setModel}
          onReasoningChange={setReasoningEffort}
          renderFilter={() => (
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onSelectCategories={setSelectedCategories}
            />
          )}
        />
      </div>
    </div>
  );
}
