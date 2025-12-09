import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import { crowdfundingTransactions, crowdfundingProjects } from "../../src/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);
const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // POST: Ajouter une transaction (dividende ou remboursement)
        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { projectId, type, amount, date } = body;

            if (!projectId || !type || !amount || !date) {
                return res.status(400).json({ error: "Champs obligatoires manquants" });
            }

            if (!["dividend", "refund"].includes(type)) {
                return res.status(400).json({ error: "Type invalide (dividend ou refund attendu)" });
            }

            const [inserted] = await db
                .insert(crowdfundingTransactions)
                .values({
                    projectId,
                    type,
                    amount: String(amount),
                    date,
                })
                .returning();

            return res.status(200).json({ success: true, transaction: inserted });
        }

        // DELETE: Supprimer une transaction
        if (req.method === "DELETE") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { id } = body;

            if (!id) {
                return res.status(400).json({ error: "id est obligatoire" });
            }

            // On pourrait vérifier que le user est bien le propriétaire du projet lié,
            // mais pour l'instant on fait confiance à l'ID (MVP).
            // Idéalement : join projects on transactions.projectId = projects.id where projects.userId = ...

            await db
                .delete(crowdfundingTransactions)
                .where(eq(crowdfundingTransactions.id, id));

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (err: any) {
        console.error("Error in /api/crowdfunding/transactions:", err);
        return res.status(500).json({ error: err.message });
    }
}
