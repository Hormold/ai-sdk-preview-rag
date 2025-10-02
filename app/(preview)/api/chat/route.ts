import { createResource } from "@/lib/actions/resources";
import { findRelevantContent, getFullDocument, findDocumentByUrl } from "@/lib/ai/embedding";
import { BIG_AGENT_MODEL, SMALL_AGENT_MODEL, SUB_AGENT_MODEL } from "@/lib/constants";
import { convertToModelMessages, generateObject, stepCountIs, streamText, tool, UIMessage } from "ai";
import { z } from "zod";
import { fetchSDKChangelog, SDKName, getAvailableSDKs } from "@/lib/changelog/sdk-changelog";
import { searchFAQCache } from "@/lib/faq/faq-cache";
import { getSystemPrompt } from "@/lib/ai/system-prompts";

export const codeBlockSchema = z.object({
  language: z.string(),
  filename: z.string(),
  code: z.string(),
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model: selectedModel, currentUrl, effort, selectedCategories, talkWithPage }: { messages: UIMessage[]; model?: "high" | "low"; currentUrl?: string; effort?: string; selectedCategories?: string[]; talkWithPage?: boolean } = await req.json();
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
    tools: talkWithPage ? {} : {
      redirectToDocs: tool({
        description: `Direct users to specific documentation pages for comprehensive details.`,
        inputSchema: z.object({
          url: z.string().describe("The documentation URL to redirect to"),
          description: z.string().describe("Brief description of what they'll find (e.g., 'Complete API reference')"),
        }),
        execute: async ({ url, description }) => {
          return { url, description, type: 'docs' };
        },
      }),
      redirectToSlack: tool({
        description: `Direct users to the community Slack channel for real-time help and discussions.`,
        inputSchema: z.object({
          description: z.string().describe("Why they should join Slack (e.g., 'Get help from the community')"),
        }),
        execute: async ({ description }) => {
          return { url: 'https://livekit-users.slack.com', description, type: 'slack' };
        },
      }),
      redirectToExternalURL: tool({
        description: `Redirect to external resources like GitHub, pricing, or third-party tools.`,
        inputSchema: z.object({
          url: z.string().describe("The external URL to redirect to"),
          description: z.string().describe("Clear description of the resource"),
        }),
        execute: async ({ url, description }) => {
          return { url, description, type: 'external' };
        },
      }),
      openTester: tool({
        description: `Open LiveKit connection tester when users have connection issues, want to test their setup, or debug WebRTC/signaling problems. Use this when they mention connection timeouts, firewall issues, or want to verify their LiveKit configuration.`,
        inputSchema: z.object({
          description: z.string().describe("Button text (e.g., 'Test Your Connection', 'Open Connection Tester')"),
        }),
        execute: async ({ description }) => {
          return { description };
        },
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe("the users question (english only)"),
          similarQuestions: z.array(z.string()).describe("keywords to search for also (english only)"),
        }),
        execute: async ({ question, similarQuestions }) => {
          const results = await Promise.all(
            similarQuestions.map(
              async (question: string) => await findRelevantContent(question, selectedCategories),
            ),
          );
          // Flatten and remove duplicates based on resourceId
          const uniqueResults = Array.from(
            new Map(results.flat().map((item) => [item?.resourceId || item?.name, item])).values(),
          );
          console.log('🔍 getInformation results:', uniqueResults);
          return uniqueResults;
        },
      }),
      getFullDocument: tool({
        description: `retrieve the complete content of a document by resourceId. Use this when you need full context from a specific document.`,
        inputSchema: z.object({
          resourceId: z.string().describe("the resource ID from getInformation results"),
          title: z.string().describe("just plain description of document to display in status, can be anything"),
        }),
        execute: async ({ resourceId }) => {
          const document = await getFullDocument(resourceId);
          if (!document) {
            return { error: "Document not found" };
          }
          return document;
        },
      }),
      getSDKChangelog: tool({
        description: `Fetch the changelog (release notes) for a specific LiveKit SDK. Returns the last 1000 lines of the CHANGELOG.md file, which includes recent versions and changes. Use this when users ask about SDK versions, what's new, breaking changes, or release history.`,
        inputSchema: z.object({
          sdk: z.enum(SDKName).describe(
            `The SDK to fetch changelog for`
          ),
        }),
        execute: async ({ sdk }) => {
          try {
            const changelog = await fetchSDKChangelog(sdk);
            return {
              sdk,
              changelog,
              note: "This is the last 1000 lines of the CHANGELOG.md file. Analyze and summarize the relevant parts for the user's question."
            };
          } catch (error) {
            return {
              error: `Failed to fetch changelog for ${sdk}: ${error instanceof Error ? error.message : String(error)}`
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
