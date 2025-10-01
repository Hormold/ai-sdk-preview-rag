import { openai } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";

export const EMBEDDING_MODEL = openai.embedding("text-embedding-ada-002")
export const SUB_AGENT_MODEL = openai("gpt-5")
export const SMALL_AGENT_MODEL = openai("gpt-5-mini")
export const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

export const BIG_AGENT_MODEL = xai('grok-4-fast-reasoning')//openai("gpt-5")
