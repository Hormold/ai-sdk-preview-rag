import { tool } from "ai";
import { z } from "zod";
import { findRelevantContent, getFullDocument } from "@/lib/ai/embedding";
import { fetchSDKChangelog, SDKName } from "@/lib/changelog/sdk-changelog";

export const createChatTools = (selectedCategories?: string[]) => ({
  redirectToDocs: tool({
    description: `Direct users to specific documentation pages for comprehensive details.`,
    inputSchema: z.object({
      url: z.string().describe("The documentation URL to redirect to"),
      description: z.string().describe("Brief description of what they'll find (e.g., 'Complete API reference')"),
    }),
    execute: async ({ url, description }) => {
      return { url, description, type: 'docs' as const };
    },
  }),
  redirectToSlack: tool({
    description: `Direct users to the community Slack channel for real-time help and discussions.`,
    inputSchema: z.object({
      description: z.string().describe("Why they should join Slack (e.g., 'Get help from the community')"),
    }),
    execute: async ({ description }) => {
      return { url: 'https://livekit-users.slack.com', description, type: 'slack' as const };
    },
  }),
  redirectToExternalURL: tool({
    description: `Redirect to external resources like GitHub, pricing, or third-party tools.`,
    inputSchema: z.object({
      url: z.string().describe("The external URL to redirect to"),
      description: z.string().describe("Clear description of the resource"),
    }),
    execute: async ({ url, description }) => {
      return { url, description, type: 'external' as const };
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
        return { error: "Document not found, check resourceId" };
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
        const {changelog, link} = await fetchSDKChangelog(sdk);
        return {
          sdk,
          link,
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
});

export type ChatTools = ReturnType<typeof createChatTools>;

// Data types for UI message parts
export type ChatDataTypes = {
  codeBlock: {
    language: string;
    filename: string;
    code: string;
  };
};

