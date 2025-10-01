import { runLiveKitDocsIndexer } from "@/lib/indexer/livekit-docs-indexer";

// Allow longer execution time for indexing
export const maxDuration = 300; // 5 minutes

export async function POST() {
  try {
    console.log("🔄 Starting document indexing via API...");

    // Run the indexer in the background to avoid blocking
    const indexingPromise = runLiveKitDocsIndexer();

    // Don't await here - let it run in background
    indexingPromise.catch((error) => {
      console.error("❌ Background indexing failed:", error);
    });

    return new Response(
      JSON.stringify({
        message: "Indexing started in background",
        status: "running"
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("💥 API indexing failed:", error);
    return new Response(
      JSON.stringify({
        error: "Indexing failed",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
