"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import type { PartComponentProps } from "../types";

export function ReasoningPart({ part }: PartComponentProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  // Type guard for reasoning parts
  if (part.type !== 'reasoning') {
    return null;
  }

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

  if (part.state === 'streaming') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start"
      >
        <div className="not-prose max-w-prose">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <svg className="size-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="flex-1">Reasoning... {elapsedTime > 0 && `${elapsedTime}s`}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (part.state === 'done') {
    const hasContent = part.text && part.text.trim().length > 0;
    const timeTaken = elapsedTime > 0 ? ` (${elapsedTime}s)` : '';

    if (!hasContent) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="not-prose max-w-prose">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="flex-1">Reasoning complete{timeTaken}</span>
            </div>
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
        <ChainOfThought defaultOpen={false} className="max-w-[80%]">
          <ChainOfThoughtHeader>
            Reasoning
          </ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              label="Completed"
              status="complete"
            >
              <div className="text-[#cbd5e1] text-xs whitespace-pre-wrap font-mono">
                {part.text}
              </div>
            </ChainOfThoughtStep>
          </ChainOfThoughtContent>
        </ChainOfThought>
      </motion.div>
    );
  }

  return null;
}
