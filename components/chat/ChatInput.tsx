"use client";

import { Input } from "@/components/ui/input";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        className="flex-1 bg-[#1a1a1b] border-[#333333] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] transition-all"
        minLength={3}
        required
        value={value}
        placeholder="Ask me anything..."
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#1e293b] disabled:text-[#64748b] text-white rounded-md transition-colors font-medium"
      >
        Send
      </button>
    </form>
  );
}
