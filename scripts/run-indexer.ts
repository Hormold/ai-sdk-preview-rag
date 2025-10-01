#!/usr/bin/env tsx

import { runLiveKitDocsIndexer } from "../lib/indexer/livekit-docs-indexer";

async function main() {
  try {
    console.log("🚀 Starting LiveKit documentation indexer...");
    await runLiveKitDocsIndexer();
    console.log("🎉 Indexing completed successfully!");
  } catch (error) {
    console.error("💥 Indexing failed:", error);
    process.exit(1);
  }
}

main();
