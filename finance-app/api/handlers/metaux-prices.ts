// api/handlers/metaux-prices.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { metalPricesHistory, metaux } from "../../src/db/schema.js";
import { eq, and, desc, gte, lte } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);
const db = drizzle(sql);

// Codes métaux pour l'API
const METAL_CODES = {
    or: "XAU",
    argent: "XAG",
    platine: "XPT",
    palladium: "XPD",
} as const;

// API pour récupérer les prix des métaux (metals-api.com ou similaire)
async function fetchMetalPrices() {
    const apiKey = process.env.METALS_API_KEY;
    if (!apiKey) {
        throw new Error("METALS_API_KEY not configured");
    }

    // Utiliser metals-api.com ou une API similaire
    const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=EUR&symbols=XAU,XAG,XPT,XPD`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Metals API error: ${response.status}`);
    }

    const data = await response.json();

    // L'API retourne les prix en EUR par once troy
    // On doit inverser car l'API donne EUR/XAU, on veut XAU/EUR
    return {
        XAU: 1 / data.rates.XAU, // Prix de l'or par once en EUR
        XAG: 1 / data.rates.XAG, // Prix de l'argent par once en EUR
        XPT: 1 / data.rates.XPT, // Prix du platine par once en EUR
        XPD: 1 / data.rates.XPD, // Prix du palladium par once en EUR
    };
}

// POST /api/metaux/prices/refresh - Rafraîchir les prix (appelé par le cron)
export async function handleMetalPricesRefresh(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }

        console.log("Refreshing metal prices...");

        // Récupérer les prix actuels
        const prices = await fetchMetalPrices();
        const now = new Date();

        // Insérer dans la base de données
        const inserted = [];
        for (const [metal, pricePerOunce] of Object.entries(prices)) {
            const pricePerGram = pricePerOunce / 31.1035; // 1 once troy = 31.1035 grammes

            await db.insert(metalPricesHistory).values({
                metal,
                pricePerOunceEur: pricePerOunce.toString(),
                pricePerGramEur: pricePerGram.toString(),
                asOf: now,
            });

            inserted.push({
                metal,
                pricePerOunce: pricePerOunce.toFixed(2),
                pricePerGram: pricePerGram.toFixed(2),
            });
        }

        return res.status(200).json({
            success: true,
            message: "Prix des métaux rafraîchis",
            inserted,
            timestamp: now.toISOString(),
        });
    } catch (err: any) {
        console.error("Error refreshing metal prices:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}

// Fonction utilitaire pour obtenir tous les lundis entre deux dates
function getAllMondays(startDate: Date, endDate: Date): string[] {
    const mondays: string[] = [];
    const current = new Date(startDate);

    // Trouver le premier lundi
    while (current.getDay() !== 1) {
        current.setDate(current.getDate() + 1);
    }

    // Ajouter tous les lundis
    while (current <= endDate) {
        mondays.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 7);
    }

    return mondays;
}

// GET /api/metaux/portfolio-history?userId=xxx&metalType=or
export async function handleMetalPortfolioHistory(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }

        const userId = req.query.userId as string | undefined;
        const metalType = req.query.metalType as string | undefined;

        if (!userId) {
            return res.status(400).json({ error: "userId est obligatoire" });
        }

        // Récupérer tous les achats de l'utilisateur
        let purchases = await db
            .select()
            .from(metaux)
            .where(eq(metaux.userId, userId));

        // Filtrer par type de métal si spécifié
        if (metalType) {
            purchases = purchases.filter((p) => p.type === metalType);
        }

        if (purchases.length === 0) {
            return res.status(200).json({ data: [] });
        }

        // Trouver la date du premier achat
        const firstPurchaseDate = new Date(
            Math.min(...purchases.map((p) => new Date(p.dateAchat).getTime()))
        );

        // Générer tous les lundis depuis le premier achat jusqu'à aujourd'hui
        const today = new Date();
        const allMondays = getAllMondays(firstPurchaseDate, today);

        const weeklyData = [];

        for (const monday of allMondays) {
            // Achats effectués avant ou le jour de ce lundi
            const relevantPurchases = purchases.filter((p) => p.dateAchat <= monday);

            if (relevantPurchases.length === 0) {
                continue; // Pas encore d'achats à cette date
            }

            // Récupérer les prix des métaux pour ce lundi (ou le plus proche)
            const mondayDate = new Date(monday);
            const nextMonday = new Date(mondayDate);
            nextMonday.setDate(nextMonday.getDate() + 7);

            // Récupérer les prix de la semaine
            const pricesForWeek = await db
                .select()
                .from(metalPricesHistory)
                .where(
                    and(
                        gte(metalPricesHistory.asOf, mondayDate),
                        lte(metalPricesHistory.asOf, nextMonday)
                    )
                )
                .orderBy(desc(metalPricesHistory.asOf));

            // Grouper par métal et prendre le plus récent
            const pricesByMetal: Record<string, number> = {};
            for (const price of pricesForWeek) {
                if (!pricesByMetal[price.metal]) {
                    pricesByMetal[price.metal] = Number(price.pricePerGramEur);
                }
            }

            // Si pas de prix pour cette semaine, passer
            if (Object.keys(pricesByMetal).length === 0) {
                continue;
            }

            // Calculer la valeur totale du portefeuille
            let totalValueEur = 0;
            for (const purchase of relevantPurchases) {
                const metalCode = METAL_CODES[purchase.type as keyof typeof METAL_CODES];
                const pricePerGram = pricesByMetal[metalCode];

                if (!pricePerGram) {
                    continue; // Pas de prix pour ce métal
                }

                // Convertir le poids en grammes
                const weightG = purchase.unite === "oz"
                    ? Number(purchase.poids) * 31.1035
                    : Number(purchase.poids);

                totalValueEur += weightG * pricePerGram;
            }

            weeklyData.push({
                date: monday,
                valueEur: totalValueEur,
            });
        }

        return res.status(200).json({ data: weeklyData });
    } catch (err: any) {
        console.error("Error in portfolio history:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
