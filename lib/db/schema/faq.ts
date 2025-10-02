import { sql } from "drizzle-orm";
import { text, varchar, timestamp, integer, pgTable } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "@/lib/utils";

export const faq = pgTable("faq", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 255 }),
  hits: integer("hits").notNull().default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const insertFaqSchema = createSelectSchema(faq)
  .extend({
    category: z.string().optional(),
  })
  .omit({
    id: true,
    hits: true,
    lastUsed: true,
    createdAt: true,
    updatedAt: true,
  });

export type NewFaqParams = z.infer<typeof insertFaqSchema>;
