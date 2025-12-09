// api/handlers/metaux.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { metaux } from "../../src/db/schema.js";
import { and, eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);
const db = drizzle(sql);

export async function handleMetaux(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const userId = req.query.userId as string | undefined;
            if (!userId) {
                return res.status(400).json({ error: "userId est obligatoire" });
            }

            const rows = await db
                .select()
                .from(metaux)
                .where(eq(metaux.userId, userId));

            return res.status(200).json({
                data: rows.map((r) => ({
                    ...r,
                    poids: Number(r.poids),
                    prixAchat: Number(r.prixAchat),
                })),
            });
        }

        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { userId, type, poids, unite, prixAchat, deviseAchat, dateAchat, fournisseur, notes } = body;

            if (!userId || !type || !poids || !prixAchat || !deviseAchat || !dateAchat) {
                return res.status(400).json({
                    error: "Champs manquants : userId, type, poids, prixAchat, deviseAchat, dateAchat",
                });
            }

            const [inserted] = await db
                .insert(metaux)
                .values({
                    userId,
                    type,
                    poids: poids.toString(),
                    unite,
                    prixAchat: prixAchat.toString(),
                    deviseAchat,
                    dateAchat,
                    fournisseur: fournisseur || null,
                    notes: notes || null,
                })
                .returning();

            return res.status(200).json({
                success: true,
                row: {
                    ...inserted,
                    poids: Number(inserted.poids),
                    prixAchat: Number(inserted.prixAchat),
                },
            });
        }

        if (req.method === "DELETE") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { id, userId } = body;

            if (!id || !userId) {
                return res.status(400).json({ error: "id et userId sont obligatoires" });
            }

            await db
                .delete(metaux)
                .where(and(eq(metaux.id, id), eq(metaux.userId, userId)));

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in metaux:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
