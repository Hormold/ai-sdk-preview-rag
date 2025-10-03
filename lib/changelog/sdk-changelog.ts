/**
 * SDK Changelog Service
 * Fetches and caches changelogs from LiveKit GitHub repositories
 * Supports both CHANGELOG.md files and GitHub Releases Atom feeds
 */

import { SDK_SOURCES } from "../constants";

export enum SDKName {
  JS_SDK = "JavaScript SDK",
  REACT = "React Components",
  REACT_NATIVE = "React Native SDK",
  SWIFT_IOS = "Swift SDK (iOS/macOS)",
  ANDROID = "Android SDK (Kotlin)",
  FLUTTER = "Flutter SDK",
  UNITY = "Unity SDK",
  RUST = "Rust SDK",
  PYTHON_AGENTS = "Python Agents SDK",
  SERVER_SDK_NODE = "Server SDK (Node.js)",
  SERVER_SDK_GO = "Server SDK (Go)",
  SERVER_SDK_PYTHON = "Server SDK (Python)",
  SERVER_SDK_RUBY = "Server SDK (Ruby)",
  SERVER_SDK_KOTLIN = "Server SDK (Kotlin)",
  COMPONENTS_ANDROID = "Android Components",
  COMPONENTS_FLUTTER = "Flutter Components",
  TRACK_PROCESSORS_JS = "Track Processors JS",
}

export interface SDKSource {
  url: string;
  type: 'changelog' | 'releases_atom';
}


interface CachedChangelog {
  content: string;
  fetchedAt: number;
}

// In-memory cache with 24h TTL (survives across requests in same instance)
const changelogCache = new Map<SDKName, CachedChangelog>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RELEASES = 20; // For Atom feeds

/**
 * Parse GitHub Releases Atom feed XML
 */
function parseReleasesAtom(xml: string): string {
  const entries: string[] = [];

  // Extract all <entry> blocks
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null && entries.length < MAX_RELEASES) {
    const entry = match[1];

    // Extract title (version)
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace('Release ', '') : 'Unknown Version';

    // Extract updated date
    const dateMatch = entry.match(/<updated>(.*?)<\/updated>/);
    const date = dateMatch ? dateMatch[1].split('T')[0] : '';

    // Extract content (HTML-encoded)
    const contentMatch = entry.match(/<content type="html">([\s\S]*?)<\/content>/);
    let content = contentMatch ? contentMatch[1] : '';

    // Decode HTML entities
    content = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    // Strip HTML tags to get plain text
    content = content.replace(/<[^>]+>/g, '').trim();

    // Format entry
    entries.push(`## ${title} (${date})\n${content}\n`);
  }

  return entries.join('\n---\n\n');
}

/**
 * Fetch changelog for a specific SDK
 * Supports both CHANGELOG.md and GitHub Releases Atom feeds
 */
export async function fetchSDKChangelog(sdk: SDKName): Promise<{changelog: string, link: string}> {
  // Check cache (note: in serverless, cache is per-instance)
  const cached = changelogCache.get(sdk);
  const now = Date.now();
   const source = SDK_SOURCES[sdk];

  if (cached && (now - cached.fetchedAt) < CACHE_TTL) {
    console.log(`📦 Using cached changelog for ${sdk}`);
    return {changelog: cached.content, link: source.url};
  }

  try {
    const response = await fetch(source.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const rawContent = await response.text();
    let formattedContent: string;

    if (source.type === 'releases_atom') {
      // Parse Atom feed XML
      formattedContent = parseReleasesAtom(rawContent);
      console.log(`✅ Parsed ${MAX_RELEASES} releases from Atom feed`);
    } else {
      // Plain CHANGELOG.md - take last 1000 lines
      const lines = rawContent.split('\n');
      formattedContent = lines.slice(-1000).join('\n');
      console.log(`✅ Fetched ${lines.length} lines from CHANGELOG.md`);
    }

    // Cache the result
    changelogCache.set(sdk, {
      content: formattedContent,
      fetchedAt: now
    });

    return {changelog: formattedContent, link: source.url};
  } catch (error) {
    console.error(`❌ Failed to fetch changelog for ${sdk}:`, error);

    // Fallback to stale cache if available
    if (cached) {
      console.log(`⚠️ Returning stale cache as fallback`);
      return {changelog: cached.content, link: source.url};
    }

    throw new Error(`Unable to fetch changelog for ${sdk}`);
  }
}

/**
 * Get all available SDK names
 */
export function getAvailableSDKs(): SDKName[] {
  return Object.values(SDKName);
}

/**
 * Clear cache (useful for testing)
 */
export function clearChangelogCache(sdk?: SDKName): void {
  if (sdk) {
    changelogCache.delete(sdk);
  } else {
    changelogCache.clear();
  }
}
