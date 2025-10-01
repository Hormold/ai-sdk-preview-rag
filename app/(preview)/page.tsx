"use client";

import { Input } from "@/components/ui/input";
import { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { Options } from "react-markdown";
import React from "react";
import ProjectOverview from "@/components/project-overview";
import { LoadingIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function Main() {
  return (
    <div>
      <Link href="/demo">Demo</Link>
    </div>
  );
}
