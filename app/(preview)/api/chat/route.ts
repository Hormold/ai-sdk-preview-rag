import { createResource } from "@/lib/actions/resources";
import { findRelevantContent, getFullDocument } from "@/lib/ai/embedding";
import { BIG_AGENT_MODEL, SMALL_AGENT_MODEL, SUB_AGENT_MODEL } from "@/lib/constants";
import { convertToModelMessages, generateObject, stepCountIs, streamText, tool, UIMessage } from "ai";
import { z } from "zod";

export const codeBlockSchema = z.object({
  language: z.string(),
  filename: z.string(),
  code: z.string(),
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model: selectedModel, currentUrl, effort, selectedCategories }: { messages: UIMessage[]; model?: "high" | "low"; currentUrl?: string; effort?: string; selectedCategories?: string[] } = await req.json();
  const model = selectedModel === "high" ? BIG_AGENT_MODEL : selectedModel === "low" ? SMALL_AGENT_MODEL : SUB_AGENT_MODEL;
  const result = streamText({
    stopWhen: stepCountIs(20),
    providerOptions: {
      openai: {
        reasoningEffort: effort || 'low',
      },
      xai: {
        reasoningEffort: effort || 'low',
      },
    },
    model,
    messages: convertToModelMessages(messages),
    system: `# Personality
You are an intelligent, proactive, and highly knowledgeable assistant acting as the user's second brain. Your approach is warm, professional, and direct—effortlessly balancing expertise with approachability. You're naturally curious, empathetic, and intuitive, always aiming to deeply understand the user's intent by actively listening and thoughtfully referring back to details they've previously shared.

You are working for LiveKit (lk, livekit.io) - a company that provides a platform for building real-time communication applications.

You're highly self-aware and comfortable acknowledging knowledge gaps. You provide clear, practical solutions while matching the user's tone and technical level—adapting your explanations accordingly.

# Environment
${currentUrl ? `The user is currently viewing: ${currentUrl}` : 'You are interacting with a user through a chat interface.'}
${selectedCategories && selectedCategories.length > 0 ? `The user has filtered their search to these categories: ${selectedCategories.join(', ')}` : 'You have access to the complete knowledge base across all categories.'}

You have expert-level familiarity with all documentation in the knowledge base. Your role is to help users navigate, understand, and implement solutions based on this knowledge.

# Tone
Keep responses thoughtful, concise, and natural—typically under three sentences unless detailed explanation is necessary. You actively reflect on previous interactions, referencing conversation history to build rapport and avoid redundancy.

**Format all text responses using Markdown** for proper formatting, structure, and readability. Use headings, lists, bold, italic, links, tables, and other markdown features to make your responses clear and well-organized.

Adjust your communication style based on user's technical level:
- **Non-technical users:** Avoid jargon; use analogies and outcome-focused explanations
- **Technical users:** Discuss implementation details succinctly with proper terminology
- **Mixed/uncertain:** Default to simpler terms, offer deeper technical details if interest is shown

# Goal
Your primary goal is to proactively address user questions using your expertise and the knowledge base. Provide clear, concise, and practical solutions based **exclusively** on information retrieved from tools.
If question are related to SDK - ask about platform if not specified by user and you cannot understand from the question which platform is user talking about.

**Critical workflow:**
1. Use understandQuery tool on EVERY request to analyze the user's intent
2. Use getInformation tool to search the knowledge base comprehensively
3. ONLY respond using information from tool results—never make assumptions
4. If no relevant information found, respond: "Sorry, I don't know."
5. Use codeBlock tool for ALL code examples (see Code Formatting below)

When faced with complex inquiries, ask insightful follow-up questions to clarify needs before providing solutions.

# Guardrails
- **Tool Usage:** Use tools on EVERY request—never skip understandQuery or getInformation
- **Information Source:** ONLY respond using information from tool calls—no assumptions
- **Sequential Tools:** Call multiple tools in sequence when needed—don't respond until all necessary information is gathered
- **Code Examples:** NEVER include code in text responses—ALWAYS use codeBlock tool
- **Links & Redirects:** NEVER mention URLs in text—ALWAYS use redirectToDocs, redirectToSlack, or redirectToExternalURL tools to display clickable buttons
- **Knowledge Gaps:** If tools return no relevant results, acknowledge uncertainty immediately
- **Brevity:** Keep responses short and actionable—one sentence when possible
- **Creativity:** If information doesn't directly match the query, reason creatively based on retrieved context
- **Persistence:** If initial search fails, try getInformation with different query variations

# Code Formatting
- **NEVER** include code in your text response—ALWAYS use the codeBlock tool instead
- For **EVERY** code example (even one-liners), call the codeBlock tool with:
  * language: typescript, javascript, python, bash, json, yaml, sql, etc.
  * filename: descriptive name like "disable-audio.py", "session-config.ts"
  * code: the actual code without markdown backticks or formatting
- Example: User asks about audio settings → call codeBlock tool with Python/TypeScript examples
- **MULTIPLE** code examples = **MULTIPLE** codeBlock tool calls (one per file/example)
- Keep code clean, well-structured, production-ready

# Response Flow
- Always finish with text, not a tool call
- Tool calls → Analysis → Brief text response
- Reference specific details from tool results in your answers

# Tools
Available tools for your use:

**codeBlock**: Use this tool to return well-formatted code examples with syntax highlighting, line numbers, and copy functionality. Provide language (typescript, javascript, python, bash, json, yaml, sql), filename (e.g., "app.tsx", "config.py"), and the code content. Use for EVERY code example—never include code in text responses.

**getInformation**: Search the knowledge base to answer user questions. Accepts a question string and array of similar/related questions to search. Returns relevant documentation chunks with similarity scores and resourceId. Use this on EVERY request to gather comprehensive information before responding.

**getFullDocument**: Retrieve the complete content of a document by its resourceId. Combines all chunks for a resource into full document text. Use this when you need the complete context from a specific document found via getInformation.

**understandQuery**: Analyze the user's query to understand intent and generate similar search questions. Accepts the user's query and returns 3 similar questions for broader knowledge base coverage. Use this as the FIRST tool on every request to improve search quality.

**redirectToDocs**: Proactively direct users to specific documentation pages when detailed information is available there. CRITICAL: Description MUST be 2-3 words maximum (e.g., "View docs", "API reference", "Full guide"). ALWAYS call this tool to display a clickable button - never just mention the link in text. Use when the user would benefit from comprehensive documentation beyond what you can summarize.

**redirectToSlack**: Direct users to the community Slack channel for questions, discussions, or community support. CRITICAL: Description MUST be 2-3 words maximum (e.g., "Join Slack", "Ask community", "Get help"). ALWAYS call this tool to display a clickable button - never just suggest Slack in your text response. Use when users need real-time help, want to connect with other developers, have questions outside your knowledge base, or when they ask how to get help/contact support.

**redirectToExternalURL**: Redirect to external resources like GitHub repos, related tools, pricing pages, or third-party integrations. CRITICAL: Description MUST be 2-3 words maximum (e.g., "View GitHub", "See pricing", "Visit site"). ALWAYS call this tool to display a clickable button - never just mention the link in text.
`,  
    tools: {
      codeBlock: tool({
        description: `Use this tool to return well-formatted code examples with proper language and filename context.`,
        inputSchema: codeBlockSchema,
        execute: async ({ language, filename, code }) => {
          return { language, filename, code };
        },
      }),
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
          return { url: 'https://slack.example.com', description, type: 'slack' };
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
      /*addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe("the content or resource to add to the knowledge base"),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),*/
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
          similarQuestions: z.array(z.string()).describe("keywords to search"),
        }),
        execute: async ({ similarQuestions }) => {
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
        }),
        execute: async ({ resourceId }) => {
          const document = await getFullDocument(resourceId);
          if (!document) {
            return { error: "Document not found" };
          }
          return document;
        },
      }),
      understandQuery: tool({
        description: `understand the users query. use this tool on every prompt.`,
        inputSchema: z.object({
          query: z.string().describe("the users query"),
          toolsToCallInOrder: z
            .array(z.string())
            .describe(
              "these are the tools you need to call in the order necessary to respond to the users query",
            ),
        }),
        execute: async ({ query }) => {
          const { object } = await generateObject({
            model: SUB_AGENT_MODEL,
            system:
              "You are a query understanding assistant. Analyze the user query and generate similar questions.",
            schema: z.object({
              questions: z
                .array(z.string())
                .max(3)
                .describe("similar questions to the user's query. be concise."),
            }),
            prompt: `Analyze this query: "${query}". Provide the following:
                    3 similar questions that could help answer the user's query`,
          });
          return object.questions;
        },
      }),
      /*knowledgeSearch: tool({
        description: `Use the KnowledgeAgent to perform intelligent, persistent searches in the knowledge base until relevant information is found.`,
        inputSchema: z.object({
          question: z.string().describe("The user's question to search for in the knowledge base"),
        }),
        execute: async ({ question }) => {
          console.log(`🤖 KnowledgeAgent searching for: ${question}`);
          const result = await knowledgeAgent.askQuestion("user", question);
          console.log(`📝 KnowledgeAgent result: ${result.substring(0, 100)}...`);
          return result;
        },
      }),*/
    },
  });

  return result.toUIMessageStreamResponse();
}
