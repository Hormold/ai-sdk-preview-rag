import { sql } from "drizzle-orm";
import { text, varchar, timestamp, integer, real, jsonb, pgTable } from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";

export const analytics = pgTable("analytics", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),

  // Query info
  userQuery: text("user_query").notNull(),
  queryComplexity: varchar("query_complexity", { length: 50 }), // simple, medium, complex

  // Performance metrics
  responseTimeMs: integer("response_time_ms").notNull(),
  totalTokens: integer("total_tokens"),

  // Cache hits
  faqCacheHit: integer("faq_cache_hit").default(0), // 1 if FAQ cache was used, 0 otherwise
  changelogCacheHit: integer("changelog_cache_hit").default(0),
  queryResultsCacheHit: integer("query_results_cache_hit").default(0),

  // Tool usage
  toolCallsCount: integer("tool_calls_count").default(0),
  toolsUsed: jsonb("tools_used").$type<string[]>(), // ["getInformation", "getFullDocument", etc.]

  // Search metrics
  searchIterations: integer("search_iterations").default(0),
  chunksRetrieved: integer("chunks_retrieved").default(0),
  chunksAfterCompression: integer("chunks_after_compression"),

  // User satisfaction (if implemented)
  userRating: integer("user_rating"), // 1-5 stars, thumbs up/down, etc.

  // Metadata
  model: varchar("model", { length: 100 }),
  categories: jsonb("categories").$type<string[]>(),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

export type AnalyticsEvent = typeof analytics.$inferInsert;
