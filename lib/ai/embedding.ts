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
const OVERLAP_SIZE = 200; // 50 tokens overlap (~200 chars)

/**
 * Detect if chunk contains code blocks
 */
function hasCodeBlock(text: string): boolean {
  return /```|`[^`]+`|function\s+\w+|class\s+\w+|\w+\s*\(.*\)\s*{/.test(text);
}

/**
 * Detect programming language in code block
 */
function detectLanguage(text: string): string | undefined {
  const langMatch = text.match(/```(\w+)/);
  if (langMatch) return langMatch[1];

  // Heuristic detection
  if (text.includes('import ') && text.includes('from ')) return 'typescript';
  if (text.includes('def ') && text.includes(':')) return 'python';
  if (text.includes('func ') && text.includes('{')) return 'swift';
  if (text.includes('fun ') && text.includes('{')) return 'kotlin';

  return undefined;
}

interface ChunkWithMetadata {
  content: string;
  metadata: {
    position: number;
    hasCode: boolean;
    language?: string;
  };
}

const generateChunks = (input: string): ChunkWithMetadata[] => {
  const text = input.trim();

  // If text is small enough, return as single chunk
  if (text.length <= MAX_CHUNK_SIZE) {
    return [{
      content: text,
      metadata: {
        position: 0,
        hasCode: hasCodeBlock(text),
        language: detectLanguage(text)
      }
    }];
  }

  const chunks: ChunkWithMetadata[] = [];
  let start = 0;
  let position = 0;

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

    // Extract chunk
    let chunkText: string;
    if (end - start < MIN_CHUNK_SIZE && start > 0) {
      const extendedStart = Math.max(0, end - MIN_CHUNK_SIZE);
      chunkText = text.slice(extendedStart, end);
    } else {
      chunkText = text.slice(start, end);
    }

    chunks.push({
      content: chunkText,
      metadata: {
        position,
        hasCode: hasCodeBlock(chunkText),
        language: detectLanguage(chunkText)
      }
    });

    // Move start forward with overlap (except for last chunk)
    if (end < text.length) {
      start = end - OVERLAP_SIZE;
    } else {
      start = end;
    }
    position++;
  }

  return chunks;
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string; metadata: { position: number; hasCode: boolean; language?: string } }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: chunks.map(c => c.content),
  });
  return embeddings.map((e, i) => ({
    content: chunks[i].content,
    embedding: e,
    metadata: chunks[i].metadata
  }));
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
      category: resources.category,
      sourceUrl: resources.sourceUrl,
      sourceTitle: resources.sourceTitle,
      resourceId: embeddings.resourceId
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

  console.log('📊 DB results:', JSON.stringify(similarGuides, null, 2));
  return similarGuides;
};

export const getFullDocument = async (resourceId: string) => {
  const chunks = await db
    .select({
      content: embeddings.content,
      sourceUrl: resources.sourceUrl,
      sourceTitle: resources.sourceTitle,
      category: resources.category
    })
    .from(embeddings)
    .leftJoin(resources, sql`${embeddings.resourceId} = ${resources.id}`)
    .where(sql`${embeddings.resourceId} = ${resourceId}`)
    .orderBy(embeddings.id);

  if (chunks.length === 0) {
    return null;
  }

  const fullContent = chunks.map(chunk => chunk.content).join('\n\n');

  return {
    content: fullContent,
    sourceUrl: chunks[0].sourceUrl,
    sourceTitle: chunks[0].sourceTitle,
    category: chunks[0].category,
    chunkCount: chunks.length
  };
};

export const findDocumentByUrl = async (url: string) => {
  try {
    // Parse URL and extract path
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Search for documents where sourceUrl contains the path
    const result = await db
      .select({
        id: resources.id,
        title: resources.sourceTitle,
        content: resources.content,
        url: resources.sourceUrl
      })
      .from(resources)
      .where(sql`${resources.sourceUrl} LIKE ${`%${path}%`}`)
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const doc = result[0];
    // Return title + first 400 chars
    const preview = doc.content.substring(0, 400);

    return {
      resourceId: doc.id,
      title: doc.title || 'Current Document',
      preview,
      url: doc.url
    };
  } catch (error) {
    console.error('Error finding document by URL:', error);
    return null;
  }
};
