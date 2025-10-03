"use client";

import { motion } from "framer-motion";
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";
import type { PartComponentProps } from "../types";

export function CodeBlockPart({ part }: PartComponentProps) {
  // Type guard for code block data part
  if (part.type !== 'data-codeBlock') {
    return null;
  }

  const { language, filename, code } = part.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start my-4"
    >
      <div className="max-w-[95%] w-full dark">
        <div className="mb-2 flex items-center gap-2">
          <div className="text-[#94a3b8] text-xs font-mono">{filename}</div>
        </div>
        <CodeBlock code={code} language={language} showLineNumbers={true}>
          <CodeBlockCopyButton />
        </CodeBlock>
      </div>
    </motion.div>
  );
}
