import { db } from "../db";
import { faq } from "../db/schema/faq";
import { eq, sql } from "drizzle-orm";

/**
 * Calculate Levenshtein distance between two strings
 * Returns normalized distance (0 = identical, 1 = completely different)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  const len1 = s1.length;
  const len2 = s2.length;

  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  // Normalize by max length
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 0 : matrix[len1][len2] / maxLen;
}

/**
 * Search FAQ cache for similar questions
 * @param userQuery - User's question
 * @param threshold - Maximum Levenshtein distance (0 = exact match, 1 = completely different)
 *                    Default 0.3 means 70% similarity required
 *                    Use 0.5 for looser matching (50% similarity) - good for hints
 * @returns FAQ result with question, answer, and similarity score (0-1, higher is better)
 */
export async function searchFAQCache(
  userQuery: string,
  threshold: number = 0.3
): Promise<{ question: string; answer: string; similarity: number } | null> {
  try {
    // Fetch all FAQ entries (we'll do fuzzy matching in-memory)
    // For production with many FAQs, consider using PostgreSQL pg_trgm extension
    const allFaqs = await db.select().from(faq);

    if (allFaqs.length === 0) return null;

    // Find best match
    let bestMatch: { question: string; answer: string; id: string; distance: number } | null = null;

    for (const faqEntry of allFaqs) {
      const distance = levenshteinDistance(userQuery, faqEntry.question);

      if (distance <= threshold && (!bestMatch || distance < bestMatch.distance)) {
        bestMatch = {
          question: faqEntry.question,
          answer: faqEntry.answer,
          id: faqEntry.id,
          distance
        };
      }
    }

    if (bestMatch) {
      // Update hits and lastUsed
      await db
        .update(faq)
        .set({
          hits: sql`${faq.hits} + 1`,
          lastUsed: new Date()
        })
        .where(eq(faq.id, bestMatch.id));

      return {
        question: bestMatch.question,
        answer: bestMatch.answer,
        similarity: 1 - bestMatch.distance
      };
    }

    return null;
  } catch (error) {
    console.error("FAQ cache search failed:", error);
    return null;
  }
}

/**
 * Add new FAQ entry
 */
export async function addFAQ(params: {
  question: string;
  answer: string;
  category?: string;
}) {
  return await db.insert(faq).values(params).returning();
}

/**
 * Seed initial FAQ entries
 */
export async function seedFAQs() {
  const initialFAQs = [
    {
      question: "how to mute audio",
      answer: "Use `track.setEnabled(false)` to mute an audio track, or `localParticipant.setMicrophoneEnabled(false)` to mute your microphone.",
      category: "Audio"
    },
    {
      question: "how to disable video",
      answer: "Use `track.setEnabled(false)` for a video track, or `localParticipant.setCameraEnabled(false)` to turn off your camera.",
      category: "Video"
    },
    {
      question: "how to join a room",
      answer: "Use `room.connect(url, token)` to join a LiveKit room with your connection URL and access token.",
      category: "Connection"
    },
    {
      question: "what is a track",
      answer: "A Track represents a media stream (audio or video) that can be published to or subscribed from a Room. Tracks can be local (your media) or remote (other participants' media).",
      category: "Concepts"
    },
    {
      question: "how to publish a track",
      answer: "Use `localParticipant.publishTrack(track)` to publish a local track to the room for other participants to receive.",
      category: "Publishing"
    },
    {
      question: "how to subscribe to a track",
      answer: "Track subscription happens automatically. Listen to the `TrackSubscribed` event to handle newly subscribed tracks from other participants.",
      category: "Subscribing"
    },
    {
      question: "how to screen share",
      answer: "Use `localParticipant.setScreenShareEnabled(true)` to start screen sharing, or create a screen capture track and publish it.",
      category: "Screen Share"
    },
    {
      question: "what are agents",
      answer: "LiveKit Agents are programmable participants that can join rooms to perform tasks like transcription, AI responses, or media processing. Build them using the Agents SDK (Python or Node.js).",
      category: "Agents"
    },
    {
      question: "how to get token",
      answer: "Access tokens are generated server-side using LiveKit's token generation libraries. Tokens grant permissions and identify participants. Never generate tokens client-side in production.",
      category: "Authentication"
    },
    {
      question: "what sdks are available",
      answer: "LiveKit provides SDKs for: JavaScript/TypeScript, React, React Native, Swift (iOS/macOS), Kotlin (Android), Flutter, Unity, Python Agents, and Node.js Agents.",
      category: "SDKs"
    }
  ];

  for (const faqData of initialFAQs) {
    await addFAQ(faqData);
  }

  console.log(`✅ Seeded ${initialFAQs.length} FAQ entries`);
}
