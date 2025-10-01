ALTER TABLE "feedback" ADD COLUMN "messages" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "user_ip" varchar(100);--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "page_url" text;--> statement-breakpoint
ALTER TABLE "feedback" DROP COLUMN "message_id";