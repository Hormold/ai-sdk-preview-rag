"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ai-elements/sources";
import { Response } from "@/components/ai-elements/response";

interface MessageListProps {
  messages: any[];
  status: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, status, messagesEndRef }: MessageListProps) {
  return (
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
                      <Response parseIncompleteMarkdown={true}>
                        {part.text}
                      </Response>
                    )}
                  </div>
                </div>
              </motion.div>
            );

          case 'tool-codeBlock':
            return <CodeBlockPart key={index} part={part} />;

          case 'tool-redirectToDocs':
          case 'tool-redirectToSlack':
          case 'tool-redirectToExternalURL':
            return <RedirectPart key={index} part={part} />;

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
      const isSearchTool = part.type === 'tool-knowledgeSearch' || part.type === 'tool-getInformation';
      const searchQuery = part.input?.question || part.input?.similarQuestions?.[0];
      const timeTaken = elapsedTime > 0 ? `${elapsedTime}s` : '';

      // Extract sources from result if available
      console.log('🔍 Full part object:', part);
      console.log('🔍 Tool result:', part.result);
      console.log('🔍 Tool output:', part.output);
      console.log('🔍 Tool type:', part.type);

      const toolData = part.result || part.output;
      const sources = toolData && Array.isArray(toolData)
        ? toolData
            .filter((r: any) => {
              console.log('📄 Result item:', r);
              return r.sourceUrl && r.sourceTitle;
            })
            .map((r: any) => ({ url: r.sourceUrl, title: r.sourceTitle }))
            // Remove duplicates
            .filter((s: any, i: number, arr: any[]) =>
              arr.findIndex((x: any) => x.url === s.url) === i
            )
        : [];
      console.log('✅ Extracted sources:', sources);

      return (
        <>
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
          {sources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mt-2"
            >
              <Sources className="max-w-[80%]">
                <SourcesTrigger count={sources.length} />
                <SourcesContent>
                  {sources.map((source: any, idx: number) => (
                    <Source key={idx} href={source.url} title={source.title} />
                  ))}
                </SourcesContent>
              </Sources>
            </motion.div>
          )}
        </>
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
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (part.state === 'input-streaming' || part.state === 'input-available') {
      const interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [part.state]);

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

  if (part.state === 'output-available' && Array.isArray(part.output)) {
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
              Query analysis
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
                <div className="space-y-1.5">
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
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

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

const CodeBlockPart = ({ part }: { part: any }) => {
  // Check both 'result' and 'output-available' states
  if ((part.state === 'result' || part.state === 'output-available') && (part.result || part.output)) {
    const data = part.result || part.output;
    const { language, filename, code } = data;

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

  return null;
};

const RedirectPart = ({ part }: { part: any }) => {
  console.log('🔗 RedirectPart:', part);

  const data = part.result || part.output;
  if ((part.state === 'result' || part.state === 'output-available') && data) {
    const { url, description, type } = data;

    const getIcon = () => {
      if (type === 'slack') {
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
          </svg>
        );
      }
      if (type === 'docs') {
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      }
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start my-2"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg transition-colors duration-200 outline-none focus:outline-none"
        >
          {getIcon()}
          <span className="text-sm font-medium">{description}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </motion.div>
    );
  }

  return null;
};
