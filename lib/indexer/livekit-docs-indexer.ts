import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { resources } from "../db/schema/resources";

// Simple in-memory cache to avoid re-downloading files
const downloadedContent = new Map<string, string>();
// Track processed URLs to avoid infinite loops
const processedUrls = new Set<string>();
// Queue of URLs to process
const urlQueue: string[] = [];

interface ParsedMarkdown {
  content: string;
  category: string;
  title: string;
  sourceUrl: string;
}

export class LiveKitDocsIndexer {
  private baseUrl = "https://docs.livekit.io";
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private concurrency = 10; // Number of parallel threads

  async indexDocs(): Promise<void> {
    console.log("🚀 Starting LiveKit docs indexing...");

    try {
      // Clean up existing data first
      await this.cleanupDatabase();
      console.log("🧹 Database cleaned up");

      // 1. Fetch llms.txt and extract initial links
      const llmsContent = await this.fetchWithRetry(`${this.baseUrl}/llms.txt`);
      console.log("✅ Fetched llms.txt");

      const initialLinks = this.extractMdLinks(llmsContent);
      console.log(`📋 Found ${initialLinks.length} initial .md files to index`);

      // 2. Add initial links to queue
      for (const link of initialLinks) {
        if (!processedUrls.has(link)) {
          urlQueue.push(link);
        }
      }

      // 3. Process all URLs recursively
      console.log(`🔄 Starting recursive processing of ${urlQueue.length} URLs...`);
      await this.processUrlsRecursively();

      console.log(`🎉 Successfully indexed all LiveKit documentation!`);

    } catch (error) {
      console.error("💥 Indexing failed:", error);
      throw error;
    }
  }

  private extractMdLinks(content: string): string[] {
    // Match both markdown links [text](url) and plain URLs
    const markdownRegex = /\[([^\]]+)\]\((https:\/\/docs\.livekit\.io[^\)]+\.md)\)/g;
    const plainUrlRegex = /https:\/\/docs\.livekit\.io\/[^\s\)\]]+\.md/g;

    const links = new Set<string>();

    // Extract from markdown links
    let match;
    while ((match = markdownRegex.exec(content)) !== null) {
      links.add(match[2]); // The URL is in the second capture group
    }

    // Extract plain URLs
    const plainMatches = content.match(plainUrlRegex) || [];
    plainMatches.forEach(url => links.add(url));

    return [...links];
  }

  private async fetchWithRetry(url: string, retries = this.maxRetries): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);

        // If 404 and URL ends with .md, try without .md extension (HTML page)
        if (response.status === 404 && url.endsWith('.md')) {
          console.log(`📄 .md not found, trying HTML version: ${url.replace(/\.md$/, '')}`);
          const htmlUrl = url.replace(/\.md$/, '');
          const htmlResponse = await fetch(htmlUrl);

          if (!htmlResponse.ok) {
            throw new Error(`HTTP ${htmlResponse.status}: ${htmlResponse.statusText}`);
          }

          const html = await htmlResponse.text();
          return this.stripHtmlTags(html);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Retry ${i + 1}/${retries} for ${url}`);
        await this.delay(this.retryDelay * (i + 1));
      }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
  }

  private stripHtmlTags(html: string): string {
    // Extract content from #main-content div
    const mainContentMatch = html.match(/<div[^>]*id=["']main-content["'][^>]*>([\s\S]*?)<\/div>/i);
    let content = mainContentMatch ? mainContentMatch[1] : html;

    // Remove script and style tags with their content
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/&amp;/g, '&');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&#39;/g, "'");

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return content;
  }

  private async processMdFile(url: string): Promise<ParsedMarkdown | null> {
    try {
      // Check cache first
      if (downloadedContent.has(url)) {
        return this.parseMarkdown(url, downloadedContent.get(url)!);
      }

      // Download content
      const content = await this.fetchWithRetry(url);

      // Cache the content
      downloadedContent.set(url, content);

      const parsedMarkdown = this.parseMarkdown(url, content);

      // Extract new links from the content and add to queue
      const newLinks = this.extractMdLinks(content);
      for (const link of newLinks) {
        if (!processedUrls.has(link) && !urlQueue.includes(link)) {
          urlQueue.push(link);
          console.log(`🔗 Found new link: ${link}`);
        }
      }

      return parsedMarkdown;
    } catch (error) {
      console.error(`Failed to process ${url}:`, error);
      return null;
    }
  }

  private parseMarkdown(url: string, content: string): ParsedMarkdown {
    // Extract category from breadcrumb (first meaningful part after "LiveKit Docs ›")
    const breadcrumbMatch = content.match(/LiveKit Docs › ([^›]+) ›/);
    const category = breadcrumbMatch ? breadcrumbMatch[1].trim() : "General";

    // Extract title (usually the first heading or the URL path)
    const titleMatch = content.match(/# ([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : this.extractTitleFromUrl(url);

    // Clean up content - remove frontmatter and excessive whitespace
    let cleanedContent = content
      .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter
      .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
      .trim();

    return {
      content: cleanedContent,
      category,
      title,
      sourceUrl: url.replace('.md', '') // Remove .md extension for web URL
    };
  }

  private extractTitleFromUrl(url: string): string {
    const pathParts = url.replace(this.baseUrl, '').split('/');
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart.replace(/\.md$/, '').replace(/[-_]/g, ' ');
  }


  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async cleanupDatabase(): Promise<void> {
    try {
      console.log("🗑️ Clearing existing embeddings and resources...");
      // Delete all embeddings first (due to foreign key constraints)
      await db.delete(embeddingsTable);
      // Then delete all resources
      await db.delete(resources);
      console.log("✅ Database cleanup completed");
    } catch (error) {
      console.error("❌ Failed to cleanup database:", error);
      throw error;
    }
  }

  private async processUrlsRecursively(): Promise<void> {
    let processedCount = 0;

    while (urlQueue.length > 0) {
      // Process multiple URLs in parallel
      const batchSize = Math.min(this.concurrency, urlQueue.length);
      const currentBatch = urlQueue.splice(0, batchSize);

      console.log(`🔄 Processing batch of ${currentBatch.length} URLs (${processedCount + currentBatch.length}/${processedCount + urlQueue.length + currentBatch.length})...`);

      const batchPromises = currentBatch.map(async (url) => {
        processedUrls.add(url);

        try {
          const result = await this.processMdFile(url);
          if (result) {
            await this.storeSingleDocument(result);
            processedCount++;
            console.log(`✅ Processed: ${result.category} - ${result.title}`);
            return result;
          }
        } catch (error) {
          console.error(`❌ Failed to process ${url}:`, error);
        }
        return null;
      });

      // Wait for all URLs in this batch to complete
      await Promise.all(batchPromises);

      // Small delay between batches to be respectful to the server
      if (urlQueue.length > 0) {
        await this.delay(200);
      }
    }

    console.log(`🎉 Finished processing all URLs. Total processed: ${processedCount}`);
  }

  private async storeSingleDocument(doc: ParsedMarkdown): Promise<void> {
    try {
      // Create resource
      const [resource] = await db
        .insert(resources)
        .values({
          content: doc.content,
          category: doc.category,
          sourceUrl: doc.sourceUrl,
          sourceTitle: doc.title
        })
        .returning();

      // Generate and store embeddings
      const embeddings = await generateEmbeddings(doc.content);
      await db.insert(embeddingsTable).values(
        embeddings.map((embedding) => ({
          resourceId: resource.id,
          ...embedding,
        })),
      );

    } catch (error) {
      console.error(`Failed to store document "${doc.title}":`, error);
      throw error; // Re-throw so the calling function knows it failed
    }
  }
}

// Export a simple function to run the indexer
export async function runLiveKitDocsIndexer(): Promise<void> {
  const indexer = new LiveKitDocsIndexer();
  await indexer.indexDocs();
}
