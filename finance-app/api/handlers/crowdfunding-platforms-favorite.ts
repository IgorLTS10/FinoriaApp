// API handler for platform favorites management
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { userPlatformFavorites } from "../../src/db/schema.js";
import { eq, and } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { method } = req;
    const userId = req.headers["x-user-id"] as string | undefined;
    const platformId = req.query.platformId as string | undefined;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!platformId) {
        return res.status(400).json({ error: "Platform ID is required" });
    }

    try {
        // POST /api/crowdfunding/platforms/[platformId]/favorite - Toggle favorite
        if (method === "POST") {
            // Check if already favorited
            const existing = await db
                .select()
                .from(userPlatformFavorites)
                .where(
                    and(
                        eq(userPlatformFavorites.userId, userId),
                        eq(userPlatformFavorites.platformId, platformId)
                    )
                );

            if (existing.length > 0) {
                // Already favorited, remove it
                await db
                    .delete(userPlatformFavorites)
                    .where(
                        and(
                            eq(userPlatformFavorites.userId, userId),
                            eq(userPlatformFavorites.platformId, platformId)
                        )
                    );

                return res.status(200).json({ isFavorite: false });
            } else {
                // Not favorited, add it
                await db
                    .insert(userPlatformFavorites)
                    .values({
                        userId,
                        platformId,
                    });

                return res.status(200).json({ isFavorite: true });
            }
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Error in platform favorites handler:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
