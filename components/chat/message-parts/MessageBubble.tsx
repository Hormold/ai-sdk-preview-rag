"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Response } from "@/components/ai-elements/response";
import { Actions, Action } from "@/components/ai-elements/actions";
import { useFeedback } from "../hooks/useFeedback";
import { reorderMessageParts } from "../utils/message-utils";
import type { MessageBubbleProps } from "../types";
import { CodeBlockPart } from "./CodeBlockPart";
import { RedirectPart } from "./RedirectPart";
import { ToolInvocationPart } from "./ToolInvocationPart";
import { ReasoningPart } from "./ReasoningPart";
import { TesterPart } from "./TesterPart";

export function MessageBubble({ message, allMessages }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { feedbackGiven, handleFeedback } = useFeedback(allMessages);
  const [feedbackPerPart, setFeedbackPerPart] = useState<Set<number>>(new Set());

  const reorderedParts = useMemo(() =>
    reorderMessageParts(message.parts, isUser),
    [message.parts, isUser]
  );

  const handlePartFeedback = (partIndex: number, type: 'positive' | 'negative') => {
    setFeedbackPerPart(prev => new Set(prev).add(partIndex));
    handleFeedback(type);
  };

  return (
    <div className="space-y-2">
      {reorderedParts.map((part: any, index: number) => {
        const partFeedbackGiven = feedbackPerPart.has(index);
        switch (part.type) {
          case 'text':
            if(!part.text || part.text.trim() === '') {
              return null;
            }
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%] space-y-2">
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3",
                      isUser
                        ? "bg-[#1FD5F9] text-[#070707] font-semibold"
                        : "bg-[#1a1a1a] text-[#e5e5e5] border border-[#2a2a2a]"
                    )}
                  >
                    {isUser ? (
                      <div className="text-sm">{part.text}</div>
                    ) : (
                      <Response parseIncompleteMarkdown={true}>
                        {part.text}
                      </Response>
                    )}
                  </div>
                  <TesterPart part={part} />
                  {!isUser && (
                    <Actions className="ml-2">
                      <Action
                        tooltip="Copy message"
                        onClick={() => {
                          navigator.clipboard.writeText(part.text);
                          toast.success('Copied to clipboard!');
                        }}
                        className="text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1a1a1a]"
                      >
                        <Copy className="h-4 w-4" />
                      </Action>
                      {!partFeedbackGiven ? (
                        <>
                          <Action
                            tooltip="Good response"
                            onClick={() => handlePartFeedback(index, 'positive')}
                            className="text-[#64748b] hover:text-[#22c55e] hover:bg-[#1a1a1a]"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Action>
                          <Action
                            tooltip="Bad response"
                            onClick={() => handlePartFeedback(index, 'negative')}
                            className="text-[#64748b] hover:text-[#ef4444] hover:bg-[#1a1a1a]"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Action>
                        </>
                      ) : (
                        <div className="text-xs text-[#64748b] ml-1">Thanks for your feedback!</div>
                      )}
                    </Actions>
                  )}
                </div>
              </motion.div>
            );

          case 'tool-codeBlock':
            return <CodeBlockPart key={index} part={part} />;

          case 'tool-redirectToDocs':
          case 'tool-redirectToSlack':
          case 'tool-redirectToExternalURL':
            return <RedirectPart key={index} part={part} />;

          case 'tool-openTester':
            return <TesterPart key={index} part={part} />;

          case 'tool-addResource':
          case 'tool-getInformation':
          case 'tool-knowledgeSearch':
          case 'tool-getFullDocument':
          case 'tool-getSDKChangelog':
          case 'tool-askRepo':
            return <ToolInvocationPart key={index} part={part} />;

    
          case 'step-start':
            return null;

          case 'reasoning':
            return <ReasoningPart key={index} part={part} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
