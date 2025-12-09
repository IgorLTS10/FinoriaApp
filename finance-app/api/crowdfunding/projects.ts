import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import { crowdfundingProjects, crowdfundingTransactions } from "../../src/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);
const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // GET: Récupérer les projets avec totaux
        if (req.method === "GET") {
            const userId = req.query.userId as string | undefined;
            if (!userId) {
                return res.status(400).json({ error: "userId est obligatoire" });
            }

            // On récupère les projets
            const projects = await db
                .select()
                .from(crowdfundingProjects)
                .where(eq(crowdfundingProjects.userId, userId))
                .orderBy(desc(crowdfundingProjects.startDate));

            // On récupère toutes les transactions liées à ces projets
            // (Optimisation possible : faire un join + group by, mais ici on reste simple)
            const projectIds = projects.map((p) => p.id);
            let transactions: any[] = [];

            if (projectIds.length > 0) {
                // On ne peut pas faire "inArray" facilement si la liste est vide ou trop grande
                // On va plutôt tout récupérer pour le user (via join) ou juste itérer.
                // Ici on va faire simple : on récupère TOUTES les transactions des projets trouvés.
                // Drizzle `inArray` est le mieux.

                // Import dynamique pour éviter l'erreur si inArray n'est pas importé en haut
                const { inArray } = await import("drizzle-orm");

                transactions = await db
                    .select()
                    .from(crowdfundingTransactions)
                    .where(inArray(crowdfundingTransactions.projectId, projectIds));
            }

            // On aggrège en JS
            const data = projects.map((p) => {
                const projectTx = transactions.filter((t) => t.projectId === p.id);

                const received = projectTx
                    .filter((t) => t.type === "dividend")
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                const refunded = projectTx
                    .filter((t) => t.type === "refund")
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                return {
                    ...p,
                    amountInvested: Number(p.amountInvested),
                    yieldPercent: Number(p.yieldPercent),
                    received,
                    refunded,
                };
            });

            return res.status(200).json({ data });
        }

        // POST: Créer un projet
        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const {
                userId,
                name,
                platform,
                amountInvested,
                yieldPercent,
                startDate,
                durationMonths,
                imageUrl,
                contractUrl,
            } = body;

            if (!userId || !name || !platform || !amountInvested || !startDate || !durationMonths) {
                return res.status(400).json({ error: "Champs obligatoires manquants" });
            }

            const [inserted] = await db
                .insert(crowdfundingProjects)
                .values({
                    userId,
                    name,
                    platform,
                    amountInvested: String(amountInvested),
                    yieldPercent: String(yieldPercent || 0),
                    startDate,
                    durationMonths: Number(durationMonths),
                    imageUrl: imageUrl || null,
                    contractUrl: contractUrl || null,
                    status: "active",
                })
                .returning();

            return res.status(200).json({ success: true, project: inserted });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (err: any) {
        console.error("Error in /api/crowdfunding/projects:", err);
        return res.status(500).json({ error: err.message });
    }
}
