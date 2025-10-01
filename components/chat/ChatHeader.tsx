"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatHeaderProps {
  model: "gpt-5" | "gpt-5-mini";
  reasoningEffort: "low" | "medium" | "high";
  onModelChange: (model: "gpt-5" | "gpt-5-mini") => void;
  onReasoningChange: (effort: "low" | "medium" | "high") => void;
  onClear: () => void;
  onClose?: () => void;
}

export function ChatHeader({
  model,
  reasoningEffort,
  onModelChange,
  onReasoningChange,
  onClear,
  onClose,
}: ChatHeaderProps) {
  const [showModelMenu, setShowModelMenu] = useState(false);

  const handleClear = () => {
    onClear();
    toast.success("Chat history cleared");
  };

  return (
    <div className="sticky top-0 z-50 flex-shrink-0 border-b border-[#1a1a1b] bg-[#0a0a0b]">
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
            onClick={handleClear}
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
                    onClick={() => onModelChange("gpt-5")}
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
                    onClick={() => onModelChange("gpt-5-mini")}
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
                    onClick={() => onReasoningChange("low")}
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
                    onClick={() => onReasoningChange("medium")}
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
                    onClick={() => onReasoningChange("high")}
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
  );
}
