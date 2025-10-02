CREATE TABLE "analytics" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_query" text NOT NULL,
	"query_complexity" varchar(50),
	"response_time_ms" integer NOT NULL,
	"total_tokens" integer,
	"faq_cache_hit" integer DEFAULT 0,
	"changelog_cache_hit" integer DEFAULT 0,
	"query_results_cache_hit" integer DEFAULT 0,
	"tool_calls_count" integer DEFAULT 0,
	"tools_used" jsonb,
	"search_iterations" integer DEFAULT 0,
	"chunks_retrieved" integer DEFAULT 0,
	"chunks_after_compression" integer,
	"user_rating" integer,
	"model" varchar(100),
	"categories" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(255),
	"hits" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "metadata" jsonb;