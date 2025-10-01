"use client";

import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown, { Options } from "react-markdown";
import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";

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
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    body: { model, currentUrl, selectedCategories, effort: reasoningEffort },
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
    setIsLoadingCategories(true);
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch((err) => console.error("Failed to fetch categories:", err))
      .finally(() => setIsLoadingCategories(false));
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1a1a1b] bg-[#0a0a0b]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2 text-[#f8fafc] font-medium hover:text-white transition-colors outline-none focus:outline-none"
          >
            Ask AI
            <svg
              className={cn("w-4 h-4 transition-transform", showModelMenu && "rotate-180")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([]);
                localStorage.removeItem("chat-messages");
                toast.success("Chat history cleared");
              }}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#1a1a1a] text-[#999999] hover:bg-[#dc2626] hover:text-white outline-none focus:outline-none"
              title="Clear chat history"
            >
              Clear
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-[#999999] hover:text-white transition-colors outline-none focus:outline-none"
                title="Close chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Model Menu Dropdown */}
        <AnimatePresence>
          {showModelMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[#1a1a1b]"
            >
              <div className="px-4 py-3 space-y-3">
                <div>
                  <div className="text-[#999999] text-xs font-medium mb-2">Model</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModel("gpt-5")}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                        model === "gpt-5"
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                      )}
                    >
                      GPT-5
                    </button>
                    <button
                      onClick={() => setModel("gpt-5-mini")}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                        model === "gpt-5-mini"
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                      )}
                    >
                      GPT-5 mini
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[#999999] text-xs font-medium mb-2">Reasoning</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReasoningEffort("low")}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                        reasoningEffort === "low"
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                      )}
                    >
                      Low
                    </button>
                    <button
                      onClick={() => setReasoningEffort("medium")}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                        reasoningEffort === "medium"
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                      )}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setReasoningEffort("high")}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                        reasoningEffort === "high"
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                      )}
                    >
                      High
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[#94a3b8] text-lg mb-2">Start a conversation</div>
              <div className="text-[#64748b] text-sm">Ask me anything about your docs</div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={message.id || index} message={message} />
            ))}
            {status === 'submitted' && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <Loading />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Sticky Bottom */}
      <div className="flex-shrink-0 border-t border-[#1a1a1b] bg-[#0a0a0b] p-4">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2 items-center transition-all duration-200">
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  localStorage.setItem("selected-categories", JSON.stringify([]));
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors outline-none focus:outline-none border",
                  selectedCategories.length === 0
                    ? "bg-[#2563eb] text-white border-[#2563eb]"
                    : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                )}
              >
                All
              </button>
              {(showAllCategories ? categories : categories.slice(0, 3)).map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    const newSelected = selectedCategories.includes(cat.name)
                      ? selectedCategories.filter((c) => c !== cat.name)
                      : [...selectedCategories, cat.name];
                    setSelectedCategories(newSelected);
                    localStorage.setItem("selected-categories", JSON.stringify(newSelected));
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors outline-none focus:outline-none border",
                    selectedCategories.includes(cat.name)
                      ? "bg-[#2563eb] text-white border-[#2563eb]"
                      : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                  )}
                >
                  {cat.name}{" "}
                  <span className={selectedCategories.includes(cat.name) ? "text-white/70" : "text-[#666666]"}>
                    ({cat.count})
                  </span>
                </button>
              ))}
              {categories.length > 3 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="px-2 py-1 text-xs text-[#999999] hover:text-white transition-colors outline-none focus:outline-none"
                >
                  {showAllCategories ? "Less" : "More"}
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            className="flex-1 bg-[#1a1a1b] border-[#333333] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] transition-all"
            minLength={3}
            required
            value={input}
            placeholder="Ask me anything..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || status === "submitted"}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#1e293b] disabled:text-[#64748b] text-white rounded-md transition-colors font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const MessageBubble = ({ message }: { message: any }) => {
  const isUser = message.role === "user";

  return (
    <div className="space-y-2">
      {message.parts.map((part: any, index: number) => {
        switch (part.type) {
          case 'text':
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%]">
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3",
                      isUser
                        ? "bg-[#2563eb] text-white font-semibold"
                        : "bg-[#1a1a1a] text-[#e5e5e5] border border-[#2a2a2a]"
                    )}
                  >
                    {isUser ? (
                      <div className="text-sm">{part.text}</div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <MemoizedReactMarkdown>
                          {part.text}
                        </MemoizedReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );

          case 'tool-addResource':
          case 'tool-getInformation':
          case 'tool-knowledgeSearch':
            return <ToolInvocationPart key={index} part={part} />;

          case 'tool-understandQuery':
            return <UnderstandQueryPart key={index} part={part} />;

          case 'step-start':
            return <StepStart key={index} index={index} />;

          case 'reasoning':
            return <ReasoningPart key={index} part={part} />;

          default:
            return null;
        }
      })}
    </div>
  );
};

const Loading = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-2 bg-[#0f0f10] border border-[#262626] rounded-full px-3 py-1.5">
        <div className="animate-pulse">
          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <span className="text-[#94a3b8] text-xs font-medium">
          Thinking
        </span>
      </div>
    </motion.div>
  );
};

const ToolInvocationPart = ({ part }: { part: any }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (part.state === 'input-streaming' || part.state === 'input-available') {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [part.state]);

  const getToolLabel = (type: string) => {
    switch (type) {
      case 'tool-getInformation':
        return 'Searching knowledge base';
      case 'tool-addResource':
        return 'Adding resource';
      case 'tool-understandQuery':
        return 'Understanding query';
      case 'tool-knowledgeSearch':
        return 'Searching documents';
      default:
        return 'Processing';
    }
  };

  const getToolIcon = (spinning = false) => (
    <svg className={cn("w-3.5 h-3.5 text-[#2563eb]", spinning && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  switch (part.state) {
    case 'input-streaming':
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-2 bg-[#0f0f10] border border-[#262626] rounded-full px-3 py-1.5">
            {getToolIcon(true)}
            <span className="text-[#94a3b8] text-xs font-medium">
              {getToolLabel(part.type)}... {elapsedTime > 0 && `${elapsedTime}s`}
            </span>
          </div>
        </motion.div>
      );

    case 'input-available':
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-start"
        >
          <div className="bg-[#0f0f10] border border-[#262626] rounded-lg px-3 py-2 max-w-[80%]">
            <div className="flex items-center gap-2 mb-1">
              {getToolIcon(true)}
              <span className="text-[#94a3b8] text-xs font-medium">
                {getToolLabel(part.type)}... {elapsedTime > 0 && `${elapsedTime}s`}
              </span>
            </div>
            {part.input && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.2 }}
                className="text-[#64748b] text-xs font-mono overflow-hidden"
              >
                {typeof part.input === 'object' ? (
                  Object.entries(part.input).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-[#94a3b8]">{key}:</span>
                      <span className="text-[#cbd5e1] truncate">{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <span>{String(part.input)}</span>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      );

    case 'output-available':
      // Show what we found for search tools
      const isSearchTool = part.type === 'tool-knowledgeSearch' || part.type === 'tool-getInformation';
      const searchQuery = part.input?.question || part.input?.similarQuestions?.[0];
      const timeTaken = elapsedTime > 0 ? `${elapsedTime}s` : '';

      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-2 bg-[#0f0f10] border border-[#262626] rounded-full px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[#94a3b8] text-xs font-medium">
              {isSearchTool && searchQuery ? (
                <>found results for "{searchQuery}" {timeTaken && <span className="text-[#64748b]">({timeTaken})</span>}</>
              ) : (
                <>{getToolLabel(part.type)} complete {timeTaken && <span className="text-[#64748b]">({timeTaken})</span>}</>
              )}
            </span>
          </div>
        </motion.div>
      );

    case 'output-error':
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-full px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-red-400 text-xs font-medium">
              Error: {part.errorText}
            </span>
          </div>
        </motion.div>
      );

    default:
      return null;
  }
};

const UnderstandQueryPart = ({ part }: { part: any }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (part.state === 'input-streaming' || part.state === 'input-available') {
      const interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [part.state]);

  // Show processing state
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start"
      >
        <div className="flex items-center gap-2 bg-[#0f0f10] border border-[#262626] rounded-full px-3 py-1.5">
          <svg className="w-3.5 h-3.5 text-[#2563eb] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[#94a3b8] text-xs font-medium">
            Understanding query... {elapsed > 0 && <span className="text-[#64748b]">({elapsed}s)</span>}
          </span>
        </div>
      </motion.div>
    );
  }

  // Show internal reasoning output if available and contains array
  if (part.state === 'output-available' && Array.isArray(part.output)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="flex justify-start"
      >
        <div className="max-w-[80%]">
          <div className="bg-[#0f0f10] border border-[#262626] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[#64748b] text-xs italic">
                thinking about similar questions {elapsed > 0 && <span className="text-[#64748b]">({elapsed}s)</span>}
              </span>
            </div>
            <div className="space-y-1.5 pl-1">
              {part.output.map((question: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-2 text-[#94a3b8] text-xs"
                >
                  <span className="text-[#64748b] mt-0.5">•</span>
                  <span className="flex-1">{question}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show error state
  if (part.state === 'output-error') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start"
      >
        <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-full px-3 py-1.5">
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-400 text-xs font-medium">
            Error: {part.errorText}
          </span>
        </div>
      </motion.div>
    );
  }

  return null;
};

const StepStart = ({ index }: { index: number }) => {
  // Don't show step boundaries in chat
  return null;
};

const ReasoningPart = ({ part }: { part: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (part.state === 'streaming') {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [part.state]);

  // streaming state
  if (part.state === 'streaming') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start"
      >
        <div className="flex items-center gap-2 bg-[#0f0f10] border border-[#262626] rounded-full px-3 py-1.5">
          <div className="animate-pulse">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-[#94a3b8] text-xs font-medium">
            Reasoning... {elapsedTime > 0 && `${elapsedTime}s`}
          </span>
        </div>
      </motion.div>
    );
  }

  // done state
  if (part.state === 'done') {
    const hasContent = part.text && part.text.trim().length > 0;
    const timeTaken = elapsedTime > 0 ? `${elapsedTime}s` : '';

    if (!hasContent) {
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-2 bg-[#0f0f10] border border-[#262626] rounded-full px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[#94a3b8] text-xs font-medium">
              Reasoning complete {timeTaken && <span className="text-[#64748b]">({timeTaken})</span>}
            </span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start"
      >
        <div className="max-w-[80%]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 bg-[#0f0f10] border border-[#262626] rounded-lg px-3 py-2 hover:bg-[#1a1a1b] transition-colors w-full"
          >
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-[#94a3b8] text-xs font-medium flex-1 text-left">
              Reasoning
            </span>
            <svg
              className={cn("w-4 h-4 text-[#64748b] transition-transform", isExpanded && "rotate-180")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-[#0f0f10] border border-[#262626] rounded-lg p-3">
                <div className="text-[#cbd5e1] text-xs whitespace-pre-wrap font-mono">
                  {part.text}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);
