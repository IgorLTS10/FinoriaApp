// api/ideas.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// ---- DB client ----
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Configure-la dans les variables d'environnement Vercel."
  );
}

const sql = neon(connectionString);
const db = drizzle(sql);

// ---- Table ideas ----
const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 🟦 GET = LIST des idées d'un user
    if (req.method === "GET") {
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
    }

    // 🟩 POST = CREATE d'une nouvelle idée
    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { userId, content } = body;

      if (!userId || !content || !String(content).trim()) {
        return res.status(400).json({
          error: "Champs manquants : userId et content sont obligatoires.",
        });
      }

      const [inserted] = await db
        .insert(ideas)
        .values({
          userId,
          content: String(content).trim(),
        })
        .returning();

      return res.status(200).json({
        success: true,
        row: inserted,
      });
    }

    // Autres méthodes non supportées
    return res
      .status(405)
      .json({ error: `Method ${req.method} not allowed, use GET/POST` });
  } catch (err: any) {
    console.error("Error in /api/ideas:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/ideas",
    });
  }
}
