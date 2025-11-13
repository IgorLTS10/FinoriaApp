// api/ideas/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use GET` });
    }

    const userId = req.query.userId as string | undefined;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Paramètre userId obligatoire dans la query string." });
    }

    const rows = await db
      .select()
      .from(ideas)
      .where(eq(ideas.userId, userId))
      .orderBy(ideas.createdAt);

    return res.status(200).json({ data: rows });
  } catch (err: any) {
    console.error("Error in /api/ideas/list:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/ideas/list",
    });
  }
}
