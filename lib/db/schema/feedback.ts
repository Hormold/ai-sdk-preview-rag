import { pgTable, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";

export const feedback = pgTable("feedback", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  rating: varchar("rating", { length: 20 }).notNull(), // 'positive' or 'negative'
  comment: text("comment"),
  messages: jsonb("messages").notNull(), // Full message history
  userIp: varchar("user_ip", { length: 100 }),
  userAgent: text("user_agent"),
  pageUrl: text("page_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
