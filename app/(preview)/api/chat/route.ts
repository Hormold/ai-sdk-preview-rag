import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import { BIG_AGENT_MODEL, SMALL_AGENT_MODEL, SUB_AGENT_MODEL } from "@/lib/constants";
import { convertToModelMessages, generateObject, stepCountIs, streamText, tool, UIMessage } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model: selectedModel, currentUrl, effort, selectedCategories }: { messages: UIMessage[]; model?: string; currentUrl?: string; effort?: string; selectedCategories?: string[] } = await req.json();
  const model = selectedModel === "gpt-5" ? BIG_AGENT_MODEL : selectedModel === "gpt-5-mini" ? SMALL_AGENT_MODEL : SUB_AGENT_MODEL;
  const result = streamText({
    stopWhen: stepCountIs(20),
    providerOptions: {
      openai: {
        reasoningEffort: effort || 'low',
      },
    },
    model,
    messages: convertToModelMessages(messages),
    system: `You are a helpful assistant acting as the users' second brain.
    ${currentUrl ? `The user is currently on this page: ${currentUrl}` : ''}
    ${selectedCategories && selectedCategories.length > 0 ? `Focus your search on these categories: ${selectedCategories.join(', ')}` : ''}
    Use tools on every request, especially the knowledgeSearch tool for finding information.
    Be sure to use knowledgeSearch before answering any questions to get comprehensive information from the knowledge base.
    If the user presents information about themselves, use the addResource tool to store it.
    If a response requires multiple tools, call one tool after another without responding to the user.
    If a response requires information from an additional tool to generate a response, call the appropriate tools in order before responding to the user.
    ONLY respond to questions using information from tool calls, especially knowledgeSearch results.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."
    Be sure to adhere to any instructions in tool calls ie. if they say to respond like "...", do exactly that.
    If the relevant information is not a direct match to the users prompt, you can be creative in deducing the answer.
    Keep responses short and concise. Answer in a single sentence where possible.
    If you are unsure, use the knowledgeSearch tool multiple times with different queries and you can use common sense to reason based on the information you do have.
    Use your abilities as a reasoning machine to answer questions based on the information you do have.


    ## How to finish the response
    - Only finish response with text, not a tool call.
`,  
    tools: {
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
          // Flatten the array of arrays and remove duplicates based on 'name'
          const uniqueResults = Array.from(
            new Map(results.flat().map((item) => [item?.name, item])).values(),
          );
          return uniqueResults;
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
