CREATE TABLE "feedback" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"message_id" varchar(191) NOT NULL,
	"rating" varchar(20) NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
