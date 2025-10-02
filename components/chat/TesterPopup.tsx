"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TesterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const testStatuses = [
  {
    title: "Connecting to signal connection via WebSocket",
    error: "Error: invalid authorization token",
  },
  {
    title: "Establishing WebRTC connection",
    warning: "Warning: ports need to be open on firewall in order to connect.",
    error: "Error: could not establish signal connection: invalid authorization token",
  },
  {
    title: "Can connect via TURN",
    error: "Error: invalid authorization token",
  },
  {
    title: "Can publish audio",
    error: "Error: could not establish signal connection: invalid authorization token",
  },
  {
    title: "Can publish video",
    error: "Error: could not establish signal connection: invalid authorization token",
  },
  {
    title: "Resuming connection after interruption",
    error: "Error: could not establish signal connection: invalid authorization token",
  },
];

export function TesterPopup({ isOpen, onClose }: TesterPopupProps) {
  const [livekitUrl, setLivekitUrl] = useState("wss://skipcalls-a51qwxnj.livekit.cloud");
  const [roomToken, setRoomToken] = useState("qweqweqwe");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[9998]"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 m-auto w-full max-w-5xl h-[90vh] bg-black z-[9999] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-black border-b border-[#1a1a1a] px-8 py-6">
              <div className="flex items-center gap-3">
                <h1 className="text-white text-3xl font-bold tracking-tight">LiveKit</h1>
                <div className="flex items-center gap-2 text-[#94a3b8]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-lg font-medium">TESTER</span>
                </div>
              </div>
            </div>

            {/* Content - Two columns */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Form */}
              <div className="w-96 bg-[#0a0a0a] border-r border-[#1a1a1a] p-8 flex flex-col">
                <div className="space-y-8 flex-1">
                  {/* LiveKit URL Input */}
                  <div>
                    <label className="block text-[#666666] text-xs font-medium mb-3 tracking-wider">
                      LIVEKIT URL
                    </label>
                    <input
                      type="text"
                      value={livekitUrl}
                      onChange={(e) => setLivekitUrl(e.target.value)}
                      className="w-full bg-transparent border-b border-[#333333] text-white pb-2 focus:outline-none focus:border-[#1FD5F9] transition-colors text-sm"
                    />
                  </div>

                  {/* Room Token Input */}
                  <div>
                    <label className="block text-[#666666] text-xs font-medium mb-3 tracking-wider">
                      ROOM TOKEN
                    </label>
                    <input
                      type="text"
                      value={roomToken}
                      onChange={(e) => setRoomToken(e.target.value)}
                      className="w-full bg-transparent border-b border-[#1FD5F9] text-[#1FD5F9] pb-2 focus:outline-none transition-colors text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Restart Test Button */}
                <button
                  onClick={() => {}}
                  className="w-full bg-[#1FD5F9] hover:bg-[#1FD5F9]/90 text-black font-bold py-4 rounded transition-colors text-sm tracking-wide"
                >
                  RESTART TEST
                </button>
              </div>

              {/* Right Panel - Test Results */}
              <div className="flex-1 bg-[#141414] p-8 overflow-y-auto">
                <div className="space-y-6">
                  {testStatuses.map((status, index) => (
                    <div key={index} className="flex gap-4">
                      {/* X Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>

                      {/* Status Content */}
                      <div className="flex-1 space-y-2">
                        <div className="text-white text-base font-normal">
                          {status.title}
                        </div>
                        {status.warning && (
                          <div className="text-yellow-500 text-sm">
                            {status.warning}
                          </div>
                        )}
                        {status.error && (
                          <div className="text-[#999999] text-sm">
                            {status.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
