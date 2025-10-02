"use client";

import { forwardRef, useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { MicIcon, ArrowUpIcon, SquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  ref: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled: boolean;
  isStreaming?: boolean;
  renderFilter?: () => React.ReactNode;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ value, onChange, onSubmit, onStop, disabled, isStreaming, renderFilter }, ref) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
      // Initialize Web Speech API
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            onChange(value + finalTranscript);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }, [value, onChange]);

    const toggleListening = () => {
      if (!recognitionRef.current) {
        alert('Speech recognition is not supported in your browser');
        return;
      }

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
        setIsListening(true);
      }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!value.trim()) return;
      onSubmit();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) {
          onSubmit();
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-[#1a1a1b] border border-[#333333] rounded-2xl px-4 py-3 focus-within:border-[#2563eb] transition-colors">
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask AI a question..."
            className="min-h-[60px] max-h-[200px] bg-transparent border-0 text-[#f8fafc] placeholder-[#64748b] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-lg"
            rows={2}
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {renderFilter && renderFilter()}
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "p-1.5 transition-colors",
                  isListening
                    ? "text-red-500"
                    : "text-[#94a3b8] hover:text-white"
                )}
                title={isListening ? "Stop recording" : "Start voice input"}
              >
                <MicIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="p-1.5 text-[#94a3b8] hover:text-white transition-colors"
                  title="Stop generation"
                >
                  <SquareIcon className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!value.trim() || disabled}
                  className={cn(
                    "p-1.5 transition-colors",
                    value.trim() && !disabled
                      ? "text-[#2563eb] hover:text-[#1d4ed8]"
                      : "text-[#64748b] cursor-not-allowed"
                  )}
                  title="Send message"
                >
                  <ArrowUpIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    );
  }
);
