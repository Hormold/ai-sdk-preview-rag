"use client";

import { MessageBubble, LoadingIndicator } from "./message-parts";
import { EmptyState } from "./EmptyState";
import type { MessageListProps } from "./types";

export function MessageList({ messages, status, messagesEndRef, onFocusInput }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.length === 0 ? (
        <EmptyState onFocusInput={onFocusInput} />
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble key={message.id || index} message={message} allMessages={messages} />
          ))}
          {status === 'submitted' && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <LoadingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
