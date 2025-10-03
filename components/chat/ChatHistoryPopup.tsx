"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getChatHistory, type ChatPreview } from "./utils/chat-history";

interface ChatHistoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ChatHistoryPopup({ isOpen, onClose, onSelectChat }: ChatHistoryPopupProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldClose, setShouldClose] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<ChatPreview[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getChatHistory());
    }
  }, [isOpen]);

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShouldClose(true);
      onClose();
    }, 250); // 250ms delay before closing
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShouldClose(false);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute top-10 right-0 z-50"
            style={{ width: "700px" }}
          >
            <div className="relative bg-black/95 backdrop-blur-xl rounded-xl border border-[#1FD5F9]/10 shadow-2xl shadow-[#1FD5F9]/5 overflow-hidden">
              {/* Left Arrow - wider gradient fade */}
              <div
                className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none"
              />
              <button
                onClick={() => scroll("left")}
                className="absolute left-2 top-0 bottom-0 w-10 z-20 flex items-center justify-center hover:bg-black/30 transition-all group rounded-l-xl"
                style={{
                  transform: "perspective(400px) rotateY(-8deg)",
                  transformOrigin: "right center",
                }}
              >
                <ChevronLeft className="w-6 h-6 text-[#1FD5F9]/40 group-hover:text-[#1FD5F9]/80 transition-colors" />
              </button>

              {/* Horizontal scroll container */}
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide px-20 py-4"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {history.length === 0 ? (
                  <div className="w-full h-52 flex items-center justify-center">
                    <div className="text-[#666666] text-sm">No chat history yet</div>
                  </div>
                ) : (
                  history.map((chat) => (
                  <motion.button
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(31, 213, 249, 0.2)" }}
                    whileTap={{ scale: 0.97 }}
                    className="relative flex-shrink-0 w-72 h-52 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2.5 overflow-hidden hover:border-[#1FD5F9]/50 transition-all text-left group"
                  >
                    {/* Chat bubbles preview */}
                    <div className="space-y-1.5 h-full flex flex-col justify-start overflow-hidden pb-6">
                      {chat.messages.slice(0, 7).map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-2.5 py-1.5 rounded-md text-[9px] leading-snug ${
                              msg.role === "user"
                                ? "bg-[#1FD5F9]/20 text-[#1FD5F9] ml-3"
                                : "bg-[#1a1a1a] text-[#94a3b8] mr-3 border border-[#2a2a2a]"
                            }`}
                            style={{
                              wordBreak: "break-word",
                              hyphens: "auto",
                            }}
                          >
                            {msg.text.length > 65 ? msg.text.slice(0, 65) + "..." : msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Timestamp in bottom-right corner */}
                    <div className="absolute bottom-2 right-2 text-[9px] text-[#666666] font-mono">
                      {formatRelativeTime(chat.timestamp)}
                    </div>

                    {/* Subtle glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1FD5F9]/0 via-[#1FD5F9]/0 to-[#1FD5F9]/0 group-hover:from-[#1FD5F9]/5 group-hover:to-[#1FD5F9]/10 transition-all duration-300 rounded-lg pointer-events-none" />
                  </motion.button>
                  ))
                )}
              </div>

              {/* Right Arrow - wider gradient fade */}
              <div
                className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black via-black/90 to-transparent z-10 pointer-events-none"
              />
              <button
                onClick={() => scroll("right")}
                className="absolute right-2 top-0 bottom-0 w-10 z-20 flex items-center justify-center hover:bg-black/30 transition-all group rounded-r-xl"
                style={{
                  transform: "perspective(400px) rotateY(8deg)",
                  transformOrigin: "left center",
                }}
              >
                <ChevronRight className="w-6 h-6 text-[#1FD5F9]/40 group-hover:text-[#1FD5F9]/80 transition-colors" />
              </button>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
