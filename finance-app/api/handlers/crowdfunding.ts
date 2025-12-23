// api/handlers/crowdfunding.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import { crowdfundingProjects, crowdfundingTransactions } from "../../src/db/schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);
const db = drizzle(sql);

export async function handleCrowdfundingProjects(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const userId = req.query.userId as string | undefined;
            if (!userId) {
                return res.status(400).json({ error: "userId est obligatoire" });
            }

            const projects = await db
                .select()
                .from(crowdfundingProjects)
                .where(eq(crowdfundingProjects.userId, userId))
                .orderBy(desc(crowdfundingProjects.startDate));

            const projectIds = projects.map((p) => p.id);
            let transactions: any[] = [];

            if (projectIds.length > 0) {
                const { inArray } = await import("drizzle-orm");
                transactions = await db
                    .select()
                    .from(crowdfundingTransactions)
                    .where(inArray(crowdfundingTransactions.projectId, projectIds));
            }

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
                    transactions: projectTx.map(t => ({
                        ...t,
                        amount: Number(t.amount)
                    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                };
            });

            return res.status(200).json({ data });
        }

        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { userId, name, platformId, amountInvested, yieldPercent, startDate, durationMonths, imageUrl, contractUrl } = body;

            // Debug logging
            console.log("Received body:", JSON.stringify(body));
            console.log("platformId:", platformId, "imageUrl:", imageUrl, "contractUrl:", contractUrl);

            if (!userId || !name || !platformId || !amountInvested || !startDate || !durationMonths) {
                return res.status(400).json({ error: "Champs obligatoires manquants" });
            }

            const insertValues = {
                userId,
                name,
                platformId, // Use platformId instead of platform
                amountInvested: String(amountInvested),
                yieldPercent: String(yieldPercent || 0),
                startDate,
                durationMonths: Number(durationMonths),
                status: "active" as const,
                imageUrl: imageUrl || null,
                contractUrl: contractUrl || null,
            };

            console.log("Insert values:", JSON.stringify(insertValues));

            const [inserted] = await db
                .insert(crowdfundingProjects)
                .values(insertValues)
                .returning();

            return res.status(200).json({ success: true, project: inserted });
        }

        if (req.method === "PATCH") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { id, userId, ...updates } = body;

            if (!id || !userId) {
                return res.status(400).json({ error: "id et userId sont obligatoires" });
            }

            const updateData: any = {};
            if (updates.name !== undefined) updateData.name = updates.name;
            if (updates.platform !== undefined) updateData.platform = updates.platform;
            if (updates.amountInvested !== undefined) updateData.amountInvested = String(updates.amountInvested);
            if (updates.yieldPercent !== undefined) updateData.yieldPercent = String(updates.yieldPercent);
            if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
            if (updates.durationMonths !== undefined) updateData.durationMonths = Number(updates.durationMonths);
            if (updates.status !== undefined) updateData.status = updates.status;
            if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
            if (updates.contractUrl !== undefined) updateData.contractUrl = updates.contractUrl;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: "Aucun champ à mettre à jour" });
            }

            const [updated] = await db
                .update(crowdfundingProjects)
                .set(updateData)
                .where(eq(crowdfundingProjects.id, id))
                .returning();

            return res.status(200).json({ success: true, project: updated });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (err: any) {
        console.error("Error in crowdfunding/projects:", err);
        return res.status(500).json({ error: err.message });
    }
}

export async function handleCrowdfundingTransactions(req: VercelRequest, res: VercelResponse) {
    try {
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

        if (req.method === "DELETE") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { id } = body;

            if (!id) {
                return res.status(400).json({ error: "id est obligatoire" });
            }

            await db
                .delete(crowdfundingTransactions)
                .where(eq(crowdfundingTransactions.id, id));

            return res.status(200).json({ success: true });
        }

        if (req.method === "PATCH") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { id, type, amount, date } = body;

            if (!id) {
                return res.status(400).json({ error: "id est obligatoire" });
            }

            const updateData: any = {};
            if (type !== undefined) {
                if (!["dividend", "refund"].includes(type)) {
                    return res.status(400).json({ error: "Type invalide" });
                }
                updateData.type = type;
            }
            if (amount !== undefined) updateData.amount = String(amount);
            if (date !== undefined) updateData.date = date;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: "Aucun champ à mettre à jour" });
            }

            const [updated] = await db
                .update(crowdfundingTransactions)
                .set(updateData)
                .where(eq(crowdfundingTransactions.id, id))
                .returning();

            return res.status(200).json({ success: true, transaction: updated });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (err: any) {
        console.error("Error in crowdfunding/transactions:", err);
        return res.status(500).json({ error: err.message });
    }
}
