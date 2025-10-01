import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { sql, count } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categoryCounts = await db
      .select({
        category: resources.category,
        count: count(),
      })
      .from(resources)
      .where(sql`${resources.category} IS NOT NULL`)
      .groupBy(resources.category);

    const categoriesWithCounts = categoryCounts
      .filter((c) => c.category !== null)
      .map((c) => ({
        name: c.category as string,
        count: Number(c.count),
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
