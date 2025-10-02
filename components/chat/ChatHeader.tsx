"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatHeaderProps {
  model: "low" | "high";
  reasoningEffort: "low" | "medium" | "high";
  onModelChange: (model: "low" | "high") => void;
  onReasoningChange: (effort: "low" | "medium" | "high") => void;
  onClear: () => void;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ChatHeader({
  model,
  reasoningEffort,
  onModelChange,
  onReasoningChange,
  onClear,
  onClose,
  isExpanded,
  onToggleExpand,
}: ChatHeaderProps) {
  const [showModelMenu, setShowModelMenu] = useState(false);

  const handleClear = () => {
    onClear();
    toast.success("Chat history cleared");
  };

  return (
    <>
      <div className="sticky top-0 z-50 flex-shrink-0 border-b border-[#1a1a1b] bg-[#0a0a0b] h-[63px]">
        <div className="flex items-center justify-between px-4 py-3 pt-[22px]">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2 text-[#f8fafc] font-medium hover:text-white transition-colors outline-none focus:outline-none"
          >
            Ask LiveKit Agent
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
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 text-[#999999] hover:text-white transition-colors outline-none focus:outline-none"
                title={isExpanded ? "Collapse chat" : "Expand chat"}
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={handleClear}
              className="p-1.5 text-[#999999] hover:text-white transition-colors outline-none focus:outline-none"
              title="Clear chat history"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
      </div>

      {/* Model Menu Dropdown - Outside fixed height container */}
      <AnimatePresence>
        {showModelMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden border-b border-[#1a1a1b] bg-[#0a0a0b]"
          >
            <div className="px-4 py-3 space-y-3">
              <div>
                <div className="text-[#999999] text-xs font-medium mb-2">Model</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onModelChange("high")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                      model === "high"
                        ? "bg-[#1FD5F9] text-[#070707] border-[#1FD5F9]"
                        : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                    )}
                  >
                    Smart
                  </button>
                  <button
                    onClick={() => onModelChange("low")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                      model === "low"
                        ? "bg-[#1FD5F9] text-[#070707] border-[#1FD5F9]"
                        : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                    )}
                  >
                    Fast
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[#999999] text-xs font-medium mb-2">Reasoning</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onReasoningChange("low")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                      reasoningEffort === "low"
                        ? "bg-[#1FD5F9] text-[#070707] border-[#1FD5F9]"
                        : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                    )}
                  >
                    Low
                  </button>
                  <button
                    onClick={() => onReasoningChange("medium")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                      reasoningEffort === "medium"
                        ? "bg-[#1FD5F9] text-[#070707] border-[#1FD5F9]"
                        : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
                    )}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => onReasoningChange("high")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors outline-none focus:outline-none border",
                      reasoningEffort === "high"
                        ? "bg-[#1FD5F9] text-[#070707] border-[#1FD5F9]"
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
    </>
  );
}
