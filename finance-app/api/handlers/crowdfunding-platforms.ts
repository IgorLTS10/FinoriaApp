// API handler for crowdfunding platforms management
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { crowdfundingPlatforms, userPlatformFavorites } from "../../src/db/schema.js";
import { eq, and, desc } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Helper to generate random pastel color
function generateRandomColor(): string {
    const r = Math.floor(Math.random() * 127 + 128);
    const g = Math.floor(Math.random() * 127 + 128);
    const b = Math.floor(Math.random() * 127 + 128);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { method } = req;
    const userId = req.headers["x-user-id"] as string | undefined;

    try {
        // GET /api/crowdfunding/platforms - List all platforms with user favorites
        if (method === "GET") {
            // Fetch all platforms
            const platforms = await db
                .select()
                .from(crowdfundingPlatforms)
                .orderBy(desc(crowdfundingPlatforms.createdAt));

            // If user is authenticated, fetch their favorites
            let favorites: string[] = [];
            if (userId) {
                const userFavorites = await db
                    .select({ platformId: userPlatformFavorites.platformId })
                    .from(userPlatformFavorites)
                    .where(eq(userPlatformFavorites.userId, userId));

                favorites = userFavorites.map(f => f.platformId);
            }

            // Add isFavorite flag to each platform
            const platformsWithFavorites = platforms.map(p => ({
                ...p,
                isFavorite: favorites.includes(p.id),
            }));

            // Sort: favorites first, then alphabetically
            platformsWithFavorites.sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.name.localeCompare(b.name);
            });

            return res.status(200).json({ platforms: platformsWithFavorites });
        }

        // POST /api/crowdfunding/platforms - Create new platform
        if (method === "POST") {
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { name } = req.body;

            if (!name || typeof name !== "string" || name.trim().length === 0) {
                return res.status(400).json({ error: "Platform name is required" });
            }

            // Check if platform already exists
            const existing = await db
                .select()
                .from(crowdfundingPlatforms)
                .where(eq(crowdfundingPlatforms.name, name.trim()));

            if (existing.length > 0) {
                return res.status(409).json({
                    error: "Platform already exists",
                    platform: existing[0]
                });
            }

            // Generate random color
            const color = generateRandomColor();

            // Create platform
            const [newPlatform] = await db
                .insert(crowdfundingPlatforms)
                .values({
                    name: name.trim(),
                    color,
                    createdBy: userId,
                })
                .returning();

            return res.status(201).json({ platform: newPlatform });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Error in platforms handler:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
