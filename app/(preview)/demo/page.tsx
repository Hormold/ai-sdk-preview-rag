"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useMemo } from "react";
import ReactMarkdown, { Options } from "react-markdown";
import ProjectOverview from "@/components/project-overview";
import { LoadingIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import Chat from '@/components/chat';
import Image from 'next/image';

// Types for our documentation structure
interface NavItem {
  title: string;
  href?: string;
  children?: NavItem[];
  current?: boolean;
}

interface TocItem {
  title: string;
  id: string;
  level: number;
}

// Sample navigation structure
const navigation: NavItem[] = [
  {
    title: 'Home',
    href: '#',
  },
  {
    title: 'AI Agents',
    href: '#',
    children: [
      { title: 'Overview', href: '#' },
      { title: 'Quick Start', href: '#' },
      { title: 'Building Agents', href: '#' },
    ],
  },
  {
    title: 'Telephony',
    href: '#',
  },
  {
    title: 'Recipes',
    href: '#',
  },
  {
    title: 'Reference',
    href: '#',
  },
];

// Sample sidebar navigation
const sidebarNav: NavItem[] = [
  {
    title: 'GETTING STARTED',
    children: [
      { title: 'Introduction', href: '#introduction' },
      { title: 'Voice AI quickstart', href: '#quickstart' },
      { title: 'Telephony integration', href: '#telephony' },
      { title: 'Web & mobile frontends', href: '#frontends' },
      { title: 'Agents playground', href: '#playground' },
      { title: 'Deeplearning.ai course', href: '#course' },
    ],
  },
  {
    title: 'BUILDING VOICE AGENTS',
    children: [
      { title: 'Overview', href: '#overview' },
      { title: 'Workflows', href: '#workflows' },
      { title: 'Speech & audio', href: '#speech' },
      { title: 'Vision', href: '#vision' },
      { title: 'Tool definition & use', href: '#tools' },
      { title: 'Pipeline nodes & hooks', href: '#pipeline' },
      { title: 'Text & transcriptions', href: '#text', current: true },
      { title: 'Turn detection & interruptions', href: '#interruptions' },
      { title: 'External data & RAG', href: '#rag' },
      { title: 'Logs, metrics, & telemetry', href: '#logs' },
      { title: 'Events & error handling', href: '#events' },
      { title: 'Testing & evaluation', href: '#testing' },
    ],
  },
  {
    title: 'WORKER LIFECYCLE',
    children: [
      { title: 'Overview', href: '#worker-overview' },
      { title: 'Agent dispatch', href: '#dispatch' },
    ],
  },
];

// Sample content sections for TOC generation
const contentSections = [
  { title: 'Overview', id: 'overview', level: 2 },
  { title: 'Transcriptions', id: 'transcriptions', level: 2 },
  { title: 'Synchronized transcription forwarding', id: 'sync-forwarding', level: 2 },
  { title: 'Text input', id: 'text-input', level: 3 },
  { title: 'Sending from frontend', id: 'sending-frontend', level: 3 },
  { title: 'Manual input', id: 'manual-input', level: 3 },
  { title: 'Text-only sessions', id: 'text-sessions', level: 3 },
  { title: 'Frontend rendering', id: 'frontend-rendering', level: 2 },
  { title: 'Receiving text streams', id: 'receiving-streams', level: 3 },
];

export default function DemoPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatSliderOpen, setIsChatSliderOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simulate scroll spy functionality
  useEffect(() => {
    const handleScroll = () => {
      const sections = contentSections.map(item => ({
        id: item.id,
        element: document.getElementById(item.id),
      }));

      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        if (section.element) {
          const { offsetTop, offsetHeight } = section.element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0a0a0b] text-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0b] border-b border-[#1a1a1b]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
             
              <Image src={require('@/assets/svg/LK_icon_darkbg.svg')} alt="LiveKit" width={32} height={32} />
              <span className="font-semibold text-lg text-[#f8fafc]">LiveKit Docs</span>
            </div>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <div key={item.title} className="relative group">
                <button className="text-[#cbd5e1] hover:text-[#f8fafc] transition-colors">
                  {item.title}
                </button>
                {item.children && (
                  <div className="absolute top-full left-0 mt-1 bg-[#1a1a1b] border border-[#333333] rounded-md py-2 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl">
                    {item.children.map((child) => (
                      <a
                        key={child.title}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#1e1e20] transition-colors"
                      >
                        {child.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right side - Search and controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1a1a1b] border border-[#333333] text-[#f8fafc] placeholder-[#94a3b8] rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
              />
              <svg className="absolute right-3 top-2.5 w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="p-2 text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </button>
            <button className="p-2 text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <div className="flex items-center gap-1 text-sm text-[#94a3b8]">
              <span>EN</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button
              onClick={() => setIsChatSliderOpen(true)}
              className="p-2 text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
              title="Open Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content wrapper */}
      <motion.div
        animate={{
          marginRight: isChatSliderOpen ? (isChatExpanded ? 640 : 420) : 0
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="flex"
      >

      {/* Chat Slider */}
      <AnimatePresence>
        {isChatSliderOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{
              x: 0,
              width: isChatExpanded ? 640 : 420
            }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full bg-[#0a0a0b] border-l border-[#1a1a1b] z-50"
          >
            <Chat
              onClose={() => setIsChatSliderOpen(false)}
              onExpandChange={setIsChatExpanded}
            />
          </motion.div>
        )}
      </AnimatePresence>

        {/* Left Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-40 w-64 h-screen bg-[#0f0f10] border-r border-[#1a1a1b] transition-transform duration-300 ease-in-out`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              {sidebarNav.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.children?.map((item) => (
                      <li key={item.title}>
                        <button
                          onClick={() => scrollToSection(item.href?.replace('#', '') || '')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            item.current
                              ? 'bg-[#2563eb] text-white shadow-sm'
                              : 'text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#1e1e20]'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-30 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-[#0a0a0b]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-[#f8fafc] mb-4">Text and transcriptions</h1>
                <p className="text-lg text-[#cbd5e1]">Integrate realtime text features into your agent.</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] border border-[#333333] hover:border-[#94a3b8] rounded-md transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy page
              </button>
            </div>

            {/* Content */}
            <div className="prose prose-invert max-w-none">
              <section id="overview" className="mb-12">
                <h2 className="text-2xl font-semibold text-[#f8fafc] mb-4">Overview</h2>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  LiveKit Agents supports text inputs and outputs in addition to audio, based on the{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300">text streams</a> feature of the LiveKit SDKs. This guide explains what's possible and how to use it in your app.
                </p>
              </section>

              <section id="transcriptions" className="mb-12">
                <h2 className="text-2xl font-semibold text-[#f8fafc] mb-4">Transcriptions</h2>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  When an agent performs STT as part of its processing pipeline, the transcriptions are also published to the frontend in realtime. Additionally, a text representation of the agent's speech is also published in sync with audio playback when the agent speaks. These features are both enabled by default when using <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">AgentSession</code>.
                </p>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  Transcriptions use the <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">lk-transcription</code> text stream topic. They include a <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">lk-transcribed_track_id</code> attribute and the sender identity is the transcribed participant.
                </p>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  To disable transcription output, set <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">transcription_enabled=False</code> in <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">RoomOutputOptions</code>.
                </p>
              </section>

              <section id="sync-forwarding" className="mb-12">
                <h2 className="text-2xl font-semibold text-[#f8fafc] mb-4">Synchronized transcription forwarding</h2>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  When using the default STT implementation, transcriptions are forwarded to the session in realtime as they are generated. This allows you to display live transcriptions as the user speaks.
                </p>

                <h3 id="text-input" className="text-xl font-semibold text-[#f8fafc] mb-3 mt-8">Text input</h3>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  You can send text input to an agent session using the <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">generate_reply</code> method.
                </p>

                <h3 id="sending-frontend" className="text-xl font-semibold text-[#f8fafc] mb-3 mt-8">Sending from frontend</h3>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  To send text from your frontend application, use the <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">sendText</code> method on the room.
                </p>

                <h3 id="manual-input" className="text-xl font-semibold text-[#f8fafc] mb-3 mt-8">Manual input</h3>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  For programmatic text input, you can call <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">session.generate_reply()</code> directly with text content.
                </p>

                <h3 id="text-sessions" className="text-xl font-semibold text-[#f8fafc] mb-3 mt-8">Text-only sessions</h3>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  You can disable audio for the entire session by setting <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">audio_enabled=False</code> in the room options.
                </p>

                <h4 id="toggle-audio" className="text-lg font-semibold text-[#f8fafc] mb-3 mt-8">Toggle audio input and output</h4>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  You can dynamically toggle audio input and output during a session using the room's audio control methods.
                </p>
              </section>

              <section id="frontend-rendering" className="mb-12">
                <h2 className="text-2xl font-semibold text-[#f8fafc] mb-4">Frontend rendering</h2>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  Display transcriptions in your UI by subscribing to the <code className="bg-[#1a1a1b] text-[#f8fafc] px-2 py-1 rounded border border-[#333333]">lk-transcription</code> text stream topic.
                </p>

                <h3 id="receiving-streams" className="text-xl font-semibold text-[#f8fafc] mb-3 mt-8">Receiving text streams</h3>
                <p className="text-[#cbd5e1] leading-relaxed mb-4">
                  Use the room's text stream API to receive and display text content in realtime.
                </p>
              </section>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Table of Contents */}
        <aside className="hidden xl:block w-64 p-4 border-l border-[#1a1a1b]">
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">
              On this page
            </h3>
            <nav className="space-y-1">
              {contentSections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left text-sm transition-colors ${
                    activeSection === item.id
                      ? 'text-[#2563eb] bg-[#2563eb]/10 rounded px-2 py-1'
                      : 'text-[#cbd5e1] hover:text-[#f8fafc] px-2 py-1'
                  }`}
                  style={{
                    paddingLeft: `${(item.level - 2) * 16 + 8}px`,
                  }}
                >
                  {item.title}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-[#262626]">
              <p className="text-sm text-[#94a3b8] mb-4">Is this page helpful?</p>
              <div className="flex gap-2">
                <button className="p-2 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e1e20] rounded transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 17v4m-7 0h18m-9 0v.01" />
                  </svg>
                </button>
                <button className="p-2 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e1e20] rounded transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 7v-4m7 0H3m9 0v.01" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}
