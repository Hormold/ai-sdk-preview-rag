import { embed, embedMany } from "ai";
import { cosineDistance, desc, gt, sql, inArray, and } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { resources } from "../db/schema/resources";
import { db } from "../db";
import { EMBEDDING_MODEL } from "../constants";

// Target chunk size: ~200-300 tokens (roughly 800-1200 characters)
// MINIMUM 200 tokens = ~800 characters
const TARGET_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 800; // Minimum 200 tokens
const MAX_CHUNK_SIZE = 2000;

const generateChunks = (input: string): string[] => {
  const text = input.trim();

  // If text is small enough, return as single chunk
  if (text.length <= MAX_CHUNK_SIZE) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + TARGET_CHUNK_SIZE, text.length);

    // Try to end at a natural break (sentence, line, or word boundary)
    if (end < text.length) {
      // Look for sentence endings first
      const sentenceEnd = text.lastIndexOf('.', end);
      if (sentenceEnd > start + MIN_CHUNK_SIZE) {
        end = sentenceEnd + 1;
      } else {
        // Look for line breaks
        const lineEnd = text.lastIndexOf('\n', end);
        if (lineEnd > start + MIN_CHUNK_SIZE) {
          end = lineEnd + 1;
        } else {
          // Look for word boundaries
          const wordEnd = text.lastIndexOf(' ', end);
          if (wordEnd > start + MIN_CHUNK_SIZE) {
            end = wordEnd;
          }
        }
      }
    }

    // Ensure minimum chunk size
    if (end - start < MIN_CHUNK_SIZE && start > 0) {
      // Extend backwards to meet minimum size
      const extendedStart = Math.max(0, end - MIN_CHUNK_SIZE);
      chunks.push(text.slice(extendedStart, end));
      start = end;
    } else {
      chunks.push(text.slice(start, end));
      start = end;
    }
  }

  return chunks;
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ");
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (
  userQuery: string,
  categories?: string[]
) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, userQueryEmbedded)})`;

  let query = db
    .select({
      name: embeddings.content,
      similarity,
      category: resources.category
    })
    .from(embeddings)
    .leftJoin(resources, sql`${embeddings.resourceId} = ${resources.id}`);

  const conditions = [gt(similarity, 0.3)];

  if (categories && categories.length > 0) {
    conditions.push(inArray(resources.category, categories));
  }

  const similarGuides = await query
    .where(and(...conditions))
    .orderBy((t) => desc(t.similarity))
    .limit(4);

  return similarGuides;
};
