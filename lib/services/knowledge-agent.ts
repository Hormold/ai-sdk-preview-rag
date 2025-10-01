import { generateText, stepCountIs, tool } from "ai";
import { findRelevantContent } from "../ai/embedding";
import { z } from "zod";
import { SUB_AGENT_MODEL } from "../constants";

interface AgentKnowledgeConstraints {
  knowledgeAccessMode?: "all" | "tagged" | "none";
  knowledgeAccessTags?: string[];
}

export class KnowledgeAgent {
  async askQuestion(
    userId: string,
    question: string,
    agentConstraints?: AgentKnowledgeConstraints,
  ): Promise<string> {
    try {
      const { text: result } = await generateText({
        model: SUB_AGENT_MODEL,
        tools: {
          retriever: tool({
            description:
              'Using semantic similarity, retrieves some documents from the knowledge base that have the closest embeddings to the input query.',
            inputSchema: z.object({
              query: z
                .string()
                .describe(
                  'The query to perform. This should be semantically close to your target documents. Use the affirmative form rather than a question.',
                ),
            }),
            execute: async ({query}) => {
              console.log(`🔍 Searching knowledge base for: ${query}`);

              const knowledge = await findRelevantContent(query);

              console.log(`📚 Found ${knowledge.length} relevant documents`);

              return knowledge.map(doc => ({
                name: doc.name,
                similarity: doc.similarity,
                content: doc.name // Return the document name for now
              }));
            },
          }),
        },
        stopWhen: stepCountIs(10),
        prompt: `Using the information contained in your knowledge base, which you can access with the 'retriever' tool,
give a comprehensive answer to the question below.
Respond only to the question asked, response should be concise and relevant to the question.
If you cannot find information, do not give up and try calling your retriever again with different arguments! Max - 4 attempts.
Make sure to have covered the question completely by calling the retriever tool several times with semantically different queries.
If no clear answer on first attempt, try calling the retriever tool again with different arguments.
Your queries should not be questions but affirmative form sentences: e.g. rather than "How do I load a model from the Hub in bf16?", query should be "load a model from the Hub bf16 weights".

Question:
${question}`,
      });

      return result;
    } catch (error) {
      console.error(`Failed to generate knowledge search response: ${error}`);
      // Provide sensible defaults if the LLM fails
      return `Information not found in the knowledge base.`;
    }
  }

  async searchKnowledge(
    userId: string,
    query: string,
    fileTypes?: string[],
    tags?: string[],
    agentConstraints?: AgentKnowledgeConstraints,
  ): Promise<any[]> {
    console.log(`🔍 KnowledgeAgent searching for: ${query}`);

    // Use the existing findRelevantContent function
    const results = await findRelevantContent(query);

    console.log(`📚 KnowledgeAgent found ${results.length} results`);

    return results.map(result => ({
      name: result.name,
      similarity: result.similarity,
      content: result.name
    }));
  }
}

// Export singleton instance
export const knowledgeAgent = new KnowledgeAgent();
