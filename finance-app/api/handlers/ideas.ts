// api/handlers/ideas.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { ideas } from "../../src/db/schema.js";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);
const db = drizzle(sql);

export async function handleIdeas(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const userId = req.query.userId as string | undefined;

            if (!userId) {
                return res.status(400).json({ error: "Paramètre userId obligatoire" });
            }

            const rows = await db
                .select()
                .from(ideas)
                .where(eq(ideas.userId, userId))
                .orderBy(ideas.createdAt);

            return res.status(200).json({ data: rows });
        }

        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
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

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in ideas:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
