"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TesterPopup } from "../TesterPopup";
import type { PartComponentProps } from "../types";

export function TesterPart({ part }: PartComponentProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const data = part.result || part.output;
  if ((part.state === 'result' || part.state === 'output-available') && data) {
    const { description = "Open Connection Tester" } = data;

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start my-2"
        >
          <button
            onClick={() => setIsPopupOpen(true)}
            className="flex items-center gap-2 bg-[#1FD5F9] hover:bg-[#1FD5F9]/80 text-[#070707] px-4 py-2 rounded-lg transition-colors duration-200 outline-none focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium">{description}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>

        <TesterPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
      </>
    );
  }

  return null;
}
