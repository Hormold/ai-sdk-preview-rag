import { db } from "../db";
import { analytics, AnalyticsEvent } from "../db/schema/analytics";
import { sql } from "drizzle-orm";

interface QueryMetrics {
  userQuery: string;
  queryComplexity?: "simple" | "medium" | "complex";
  responseTimeMs: number;
  totalTokens?: number;
  faqCacheHit?: boolean;
  changelogCacheHit?: boolean;
  queryResultsCacheHit?: boolean;
  toolCallsCount?: number;
  toolsUsed?: string[];
  searchIterations?: number;
  chunksRetrieved?: number;
  chunksAfterCompression?: number;
  model?: string;
  categories?: string[];
}

/**
 * Track a query and its metrics
 */
export async function trackQuery(metrics: QueryMetrics): Promise<void> {
  try {
    await db.insert(analytics).values({
      userQuery: metrics.userQuery,
      queryComplexity: metrics.queryComplexity,
      responseTimeMs: metrics.responseTimeMs,
      totalTokens: metrics.totalTokens,
      faqCacheHit: metrics.faqCacheHit ? 1 : 0,
      changelogCacheHit: metrics.changelogCacheHit ? 1 : 0,
      queryResultsCacheHit: metrics.queryResultsCacheHit ? 1 : 0,
      toolCallsCount: metrics.toolCallsCount || 0,
      toolsUsed: metrics.toolsUsed,
      searchIterations: metrics.searchIterations || 0,
      chunksRetrieved: metrics.chunksRetrieved || 0,
      chunksAfterCompression: metrics.chunksAfterCompression,
      model: metrics.model,
      categories: metrics.categories,
    });
  } catch (error) {
    // Don't fail the request if analytics tracking fails
    console.error("Failed to track analytics:", error);
  }
}

/**
 * Get performance statistics
 */
export async function getPerformanceStats(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db
    .select({
      avgResponseTime: sql<number>`AVG(${analytics.responseTimeMs})`,
      p50ResponseTime: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${analytics.responseTimeMs})`,
      p95ResponseTime: sql<number>`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${analytics.responseTimeMs})`,
      avgTokens: sql<number>`AVG(${analytics.totalTokens})`,
      totalQueries: sql<number>`COUNT(*)`,
    })
    .from(analytics)
    .where(sql`${analytics.createdAt} >= ${since}`);

  return results[0];
}

/**
 * Get cache hit rates
 */
export async function getCacheHitRates(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db
    .select({
      totalQueries: sql<number>`COUNT(*)`,
      faqHits: sql<number>`SUM(${analytics.faqCacheHit})`,
      changelogHits: sql<number>`SUM(${analytics.changelogCacheHit})`,
      queryResultsHits: sql<number>`SUM(${analytics.queryResultsCacheHit})`,
    })
    .from(analytics)
    .where(sql`${analytics.createdAt} >= ${since}`);

  const data = results[0];

  return {
    totalQueries: Number(data.totalQueries),
    faqHitRate: Number(data.faqHits) / Number(data.totalQueries),
    changelogHitRate: Number(data.changelogHits) / Number(data.totalQueries),
    queryResultsHitRate: Number(data.queryResultsHits) / Number(data.totalQueries),
  };
}

/**
 * Get most used tools
 */
export async function getToolUsageStats(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db
    .select({
      toolsUsed: analytics.toolsUsed,
    })
    .from(analytics)
    .where(sql`${analytics.createdAt} >= ${since} AND ${analytics.toolsUsed} IS NOT NULL`);

  // Count tool occurrences
  const toolCounts = new Map<string, number>();

  for (const row of results) {
    if (row.toolsUsed) {
      for (const tool of row.toolsUsed) {
        toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
      }
    }
  }

  return Array.from(toolCounts.entries())
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get query complexity distribution
 */
export async function getComplexityDistribution(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db
    .select({
      complexity: analytics.queryComplexity,
      count: sql<number>`COUNT(*)`,
    })
    .from(analytics)
    .where(sql`${analytics.createdAt} >= ${since}`)
    .groupBy(analytics.queryComplexity);

  return results;
}

/**
 * Track user feedback/rating
 */
export async function trackUserRating(queryId: string, rating: number): Promise<void> {
  try {
    await db
      .update(analytics)
      .set({ userRating: rating })
      .where(sql`${analytics.id} = ${queryId}`);
  } catch (error) {
    console.error("Failed to track user rating:", error);
  }
}
