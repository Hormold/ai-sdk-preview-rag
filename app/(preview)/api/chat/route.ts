import { createResource } from "@/lib/actions/resources";
import { findRelevantContent, getFullDocument, findDocumentByUrl } from "@/lib/ai/embedding";
import { BIG_AGENT_MODEL, SMALL_AGENT_MODEL, SUB_AGENT_MODEL } from "@/lib/constants";
import { convertToModelMessages, generateObject, stepCountIs, streamText, tool, UIMessage } from "ai";
import { z } from "zod";
import { fetchSDKChangelog, SDKName, getAvailableSDKs } from "@/lib/changelog/sdk-changelog";
import { searchFAQCache } from "@/lib/faq/faq-cache";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { createChatTools } from "@/lib/ai/tools";
import type { Message } from "@/components/chat/types";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model: selectedModel, currentUrl, effort, selectedCategories, talkWithPage }: { messages: Message[]; model?: "high" | "low"; currentUrl?: string; effort?: string; selectedCategories?: string[]; talkWithPage?: boolean } = await req.json();
  const model = selectedModel === "high" ? BIG_AGENT_MODEL : selectedModel === "low" ? SMALL_AGENT_MODEL : SUB_AGENT_MODEL;

  // Extract last user message for FAQ lookup
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userQuery = lastUserMessage?.parts.filter(p => p.type === 'text').map(p => p.text).join(' ') || '';

  // If talkWithPage mode - get full page content
  let pageContent = '';
  if (talkWithPage && currentUrl) {
    const doc = await findDocumentByUrl(currentUrl);
    if (doc) {
      const fullDoc = await getFullDocument(doc.resourceId);
      pageContent = fullDoc?.content || '';
    }
  }

  // Skip FAQ and doc context if talkWithPage mode
  let faqHint = '';
  let currentDocContext = '';

  if (!talkWithPage) {
    // Check FAQ cache for relevant hint
    if (userQuery) {
      const faqResult = await searchFAQCache(userQuery, 0.5);
      if (faqResult) {
        faqHint = `\n\n# Hint, similar question
**Q:** ${faqResult.question}
**A:** ${faqResult.answer}
This information might be relevant to the user's current query. Use it if applicable`;
        console.log(`💡 FAQ hint added (similarity: ${faqResult.similarity.toFixed(2)})`);
      }
    }

    // Find current document context if URL provided
    if (currentUrl) {
      const doc = await findDocumentByUrl(currentUrl);
      if (doc) {
        currentDocContext = `\n\n# Current Document Context\nThe user is currently reading: **${doc.title}**\nResource ID: ${doc.resourceId}\n\nDocument preview:\n${doc.preview}...\n\nUse this context to inform your responses - the user may be asking about content from this page.\nIf you need the full document text, use getFullDocument tool with resourceId: ${doc.resourceId}`;
      }
    }
  }

  console.log(`Call with:`, {
    selectedModel,
    currentUrl,
    effort,
    selectedCategories,
    talkWithPage,
    faqHintAdded: !!faqHint,
    pageContentLength: pageContent.length,
  });

  const result = streamText({
    stopWhen: stepCountIs(20),
    providerOptions: {
      openai: {
        reasoningEffort: effort || 'low',
      },
      xai: {
        //reasoningEffort: effort || 'low',
      },
    },
    model,
    messages: convertToModelMessages(messages),
    system: getSystemPrompt({
      currentUrl,
      selectedCategories,
      currentDocContext,
      faqHint,
      talkWithPage,
      pageContent,
    }),
    tools: talkWithPage ? {} : createChatTools(selectedCategories),
  });

  return result.toUIMessageStreamResponse();
}
