// api/handlers/user-preferences.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function handleUserPreferences(req: VercelRequest, res: VercelResponse) {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // GET - Récupérer les préférences
        if (req.method === "GET") {
            const result = await sql`
                SELECT preferences 
                FROM user_preferences 
                WHERE user_id = ${userId}
            `;

            if (result.length === 0) {
                // Retourner les préférences par défaut
                return res.status(200).json({
                    preferences: {
                        actions: true,
                        crypto: true,
                        etf: true,
                        crowdfunding: true,
                        metaux: true,
                        immobilier: true,
                    }
                });
            }

            return res.status(200).json({ preferences: result[0].preferences });
        }

        // POST - Sauvegarder les préférences
        if (req.method === "POST") {
            const { preferences } = req.body;

            if (!preferences || typeof preferences !== 'object') {
                return res.status(400).json({ error: "Invalid preferences" });
            }

            // Upsert (insert ou update)
            await sql`
                INSERT INTO user_preferences (user_id, preferences, updated_at)
                VALUES (${userId}, ${JSON.stringify(preferences)}, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    preferences = ${JSON.stringify(preferences)},
                    updated_at = NOW()
            `;

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("[UserPreferences] Error:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
