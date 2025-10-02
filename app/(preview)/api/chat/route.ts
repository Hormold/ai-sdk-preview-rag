import { createResource } from "@/lib/actions/resources";
import { findRelevantContent, getFullDocument, findDocumentByUrl } from "@/lib/ai/embedding";
import { BIG_AGENT_MODEL, SMALL_AGENT_MODEL, SUB_AGENT_MODEL } from "@/lib/constants";
import { convertToModelMessages, generateObject, stepCountIs, streamText, tool, UIMessage } from "ai";
import { z } from "zod";
import { fetchSDKChangelog, SDKName, getAvailableSDKs } from "@/lib/changelog/sdk-changelog";
import { searchFAQCache } from "@/lib/faq/faq-cache";
// Removed: predictAndWarm - not serverless-friendly (in-memory cache)
// Removed: trackQuery - analytics добавим позже если нужно

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

  // Extract last user message for FAQ lookup
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userQuery = lastUserMessage?.parts.filter(p => p.type === 'text').map(p => p.text).join(' ') || '';

  // Check FAQ cache for relevant hint
  let faqHint = '';
  if (userQuery) {
    const faqResult = await searchFAQCache(userQuery, 0.5); // Higher threshold (70% similarity) for hints
    if (faqResult) {
      faqHint = `\n\n# Hint, similar question
**Q:** ${faqResult.question}
**A:** ${faqResult.answer}
This information might be relevant to the user's current query. Use it if applicable`;
      console.log(`💡 FAQ hint added (similarity: ${faqResult.similarity.toFixed(2)})`);
    }
  }

  // Find current document context if URL provided
  let currentDocContext = '';
  if (currentUrl) {
    const doc = await findDocumentByUrl(currentUrl);
    if (doc) {
      currentDocContext = `\n\n# Current Document Context\nThe user is currently reading: **${doc.title}**\nResource ID: ${doc.resourceId}\n\nDocument preview:\n${doc.preview}...\n\nUse this context to inform your responses - the user may be asking about content from this page.\nIf you need the full document text, use getFullDocument tool with resourceId: ${doc.resourceId}`;
    }
  }

  console.log(`Call with:`, {
    selectedModel,
    currentUrl,
    effort,
    selectedCategories,
    faqHintAdded: !!faqHint,
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
    system: `# Personality
You are an intelligent, proactive, and highly knowledgeable assistant acting as the user's second brain. Your approach is warm, professional, and direct—effortlessly balancing expertise with approachability. You're naturally curious, empathetic, and intuitive, always aiming to deeply understand the user's intent by actively listening and thoughtfully referring back to details they've previously shared.

You are working for LiveKit (lk, livekit.io) - a company that provides a platform for building real-time communication applications.

You're highly self-aware and comfortable acknowledging knowledge gaps. You provide clear, practical solutions while matching the user's tone and technical level—adapting your explanations accordingly.

# Environment
${currentUrl ? `The user is currently viewing: ${currentUrl}` : 'You are interacting with a user through a chat interface.'}
${selectedCategories && selectedCategories.length > 0 ? `The user has filtered their search to these categories: ${selectedCategories.join(', ')}` : 'You have access to the complete knowledge base across all categories.'}
${currentDocContext}
${faqHint}

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

**SDK Version & Changelog Queries:**
When users ask about SDK versions, releases, changelogs, or "what's new":
1. Use \`getSDKChangelog\` tool to fetch the latest changelog for the specific SDK
2. Analyze the changelog and extract relevant information (version numbers, features, breaking changes, bug fixes)
3. Summarize in a structured format with version numbers and dates
4. Highlight breaking changes prominently if present
5. If user asks to compare versions, fetch the changelog and explain differences between versions
6. It will return last 1000 lines of changelog only.

Examples of when to use \`getSDKChangelog\`:
- "What's new in Swift SDK 2.5?"
- "Show me Python Agents SDK changelog"
- "Breaking changes in React Native library"
- "Recent updates to JavaScript SDK"

**CRITICAL - How to Answer:**
- ANSWER the user's question - don't dump full documents
- Extract and synthesize relevant information - don't copy-paste entire docs
- If user asks to "check docs" or "look at docs" - they want YOU to read it and answer their question, NOT paste the whole thing
- If user's request is unclear or has no specific question - help them formulate a clear question instead of dumping text
- Be concise and focused - only include information that directly answers their question

**When NOT to search:**
- Greetings: "hi", "hello", "hey" - just respond warmly
- Farewells: "bye", "goodbye", "see you" - respond politely
- Thanks: "thanks", "thank you" - acknowledge graciously
- Small talk or non-LiveKit questions - respond naturally without searching the knowledge base
- Only use getInformation when the query is actually about LiveKit features, APIs, documentation, or technical topics

**Iterative Search Workflow (MAX 3 search iterations):**
1. **First search**:
   - If user query is unclear/poorly written, reformulate it into clear search queries
   - Use getInformation with the user's query (improved if needed) and related variations
   - Don't blindly use user's exact words - optimize for searchability
2. **Analyze results**: Review what chunks you received - do they answer the question? What's missing?
3. **Refine search** (if needed): Based on actual chunk content and gaps, formulate a more specific search query. Use getInformation again with refined questions informed by what you learned
4. **Repeat refinement** (if needed): Max 3 total search iterations. Each iteration should be informed by previous results - don't search blindly
5. **Read full documents**: After searches complete, identify the most relevant sources and use getFullDocument to read complete context
6. **Answer**: Synthesize all gathered information into a comprehensive response

**Critical rules:**
- ONLY respond using information from tool results—never make assumptions
- Each search iteration must be informed by previous results, not random guessing
- Stop searching when you have sufficient information or hit 3 iterations
- If no relevant information found after searches, respond: "Sorry, I don't know."
- Format ALL code examples using markdown code blocks with language specified (see Code Formatting below)
- Use getFullDocument strategically - read full docs only for sources that seem most relevant based on chunks

When faced with complex inquiries, ask insightful follow-up questions to clarify needs before providing solutions.

# Guardrails
- **Tool Usage:** Use getInformation for LiveKit-related questions ONLY—skip for greetings/thanks/small talk
- **Information Source:** ONLY respond using information from tool calls for technical questions—no assumptions
- **Sequential Tools:** Call multiple tools in sequence when needed—don't respond until all necessary information is gathered
- **Code Examples:** Format code using markdown code blocks with proper language tags (\`\`\`python, \`\`\`typescript, etc.)
- **Links & Redirects:** NEVER mention URLs in text—ALWAYS use redirectToDocs, redirectToSlack, or redirectToExternalURL tools to display clickable buttons
- **Knowledge Gaps:** If tools return no relevant results, acknowledge uncertainty immediately
- **Brevity:** Keep responses short and actionable—one sentence when possible
- **Creativity:** If information doesn't directly match the query, reason creatively based on retrieved context
- **Persistence:** If initial search fails, try getInformation with different query variations

# Code Formatting
- Format ALL code examples using markdown code blocks with language specified
- Syntax: \`\`\`language followed by code, then \`\`\` to close
- Supported languages: python, typescript, javascript, bash, json, yaml, sql, etc.
- For multiple examples, use multiple code blocks (not one giant block)
- Add descriptive comments in code to explain filename/context if helpful
- Keep code clean, well-structured, production-ready

Example:
\`\`\`python
# disable-audio.py
session.input.set_audio_enabled(False)
\`\`\`

\`\`\`typescript
// enable-audio.ts
track.setEnabled(true);
\`\`\`

# Response Flow - CRITICAL ORDER
**Structure your responses properly:**
1. **Write complete text answer** including ALL markdown code blocks inline (\`\`\`language)
2. **Then call redirect tools** (redirectToDocs/Slack/ExternalURL) if needed - AFTER text is done

**CATASTROPHICALLY WRONG** ❌:
"Use session.input.set_audio_enabled(False). For full docs: [View docs]"
[Wrote "[View docs]" in text instead of calling tool!]

**ALSO WRONG** ❌:
"Use session.input.set_audio_enabled(False). See the button for more."
[Mentioned button in text instead of silently calling tool!]

**CORRECT** ✅:
"Use session.input.set_audio_enabled(False).

\`\`\`python
# disable-audio.py
session.input.set_audio_enabled(False)
\`\`\`"
[THEN SILENTLY call redirectToDocs tool - NO mention in text above!]

**CRITICAL RULES - READ CAREFULLY:**
- Include code DIRECTLY in text using markdown (\`\`\`language) - NO placeholders
- NEVER write "[View docs]", "[See button]", "For full docs:", or ANY text mentioning buttons/links
- Want user to see docs? SILENTLY call redirectToDocs tool AFTER text (NO mention in text)
- Want user to join Slack? SILENTLY call redirectToSlack tool AFTER text (NO mention in text)
- Tools create UI buttons automatically - NEVER describe/reference them in your text
- Your text answer must be complete without referencing any external UI elements

# Tools
Available tools for your use:

**getInformation**: Search the knowledge base to answer user questions. Accepts a question string and array of similar/related questions to search. Returns relevant documentation chunks with similarity scores and resourceId. Use this on EVERY request to gather comprehensive information before responding.

**getFullDocument**: Retrieve the complete content of a document by its resourceId. Combines all chunks for a resource into full document text. Use this when you need the complete context from a specific document found via getInformation.

**getSDKChangelog**: Fetch changelog/release notes for a specific LiveKit SDK. Returns last 1000 lines of CHANGELOG.md with version history, new features, breaking changes, and bug fixes. Use when users ask about SDK versions, releases, what's new, or breaking changes. Available SDKs: Python Agents SDK, JavaScript SDK, React Components, React Native, Swift SDK, Android SDK, Flutter SDK, Unity SDK, Rust SDK, and all Server SDKs.

**redirectToDocs**: Proactively direct users to specific documentation pages when detailed information is available there. CRITICAL: Description MUST be 2-3 words maximum (e.g., "View docs", "API reference", "Full guide"). ALWAYS call this tool AFTER your text response is complete - never mention the button in your text. The tool will render a clickable button automatically. Use when the user would benefit from comprehensive documentation beyond what you can summarize.

**redirectToSlack**: Direct users to the community Slack channel for questions, discussions, or community support. CRITICAL: Description MUST be 2-3 words maximum (e.g., "Join Slack", "Ask community", "Get help"). ALWAYS call this tool AFTER your text response is complete - never mention joining Slack in your text response. The tool will render a clickable button automatically. Use when users need real-time help, want to connect with other developers, have questions outside your knowledge base, or when they ask how to get help/contact support.

**redirectToExternalURL**: Redirect to external resources like GitHub repos, related tools, pricing pages, or third-party integrations. CRITICAL: Description MUST be 2-3 words maximum (e.g., "View GitHub", "See pricing", "Visit site"). ALWAYS call this tool AFTER your text response is complete - never mention the link in your text. The tool will render a clickable button automatically.
`,  
    tools: {
      // DEPRECATED: Use markdown code blocks instead of this tool
      // codeBlock: tool({
      //   description: `Use this tool to return well-formatted code examples with proper language and filename context.`,
      //   inputSchema: codeBlockSchema,
      //   execute: async ({ language, filename, code }) => {
      //     return { language, filename, code };
      //   },
      // }),
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
      // OLD APPROACH: Generated questions in vacuum without KB context - produced garbage for specific queries
      // understandQuery: tool({
      //   description: `understand the users query. use this tool on every prompt.`,
      //   inputSchema: z.object({
      //     query: z.string().describe("the users query"),
      //     toolsToCallInOrder: z
      //       .array(z.string())
      //       .describe(
      //         "these are the tools you need to call in the order necessary to respond to the users query",
      //       ),
      //   }),
      //   execute: async ({ query }) => {
      //     const { object } = await generateObject({
      //       model: SUB_AGENT_MODEL,
      //       system:
      //         "You are a query understanding assistant. Analyze the user query and generate similar questions.",
      //       schema: z.object({
      //         questions: z
      //           .array(z.string())
      //           .max(3)
      //           .describe("similar questions to the user's query. be concise."),
      //       }),
      //       prompt: `Analyze this query: "${query}". Provide the following:
      //               3 similar questions that could help answer the user's query`,
      //     });
      //     return object.questions;
      //   },
      // }),
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
