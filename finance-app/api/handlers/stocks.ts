// api/handlers/stocks.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client.js";
import { stockPositions, stockPrices } from "../../src/db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";
import yahooFinance from "yahoo-finance2";

export async function handleStocks(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const userId = req.query.userId as string | undefined;
            if (!userId) {
                return res.status(400).json({ error: "Paramètre userId obligatoire" });
            }

            const rows = await db
                .select()
                .from(stockPositions)
                .where(eq(stockPositions.userId, userId))
                .orderBy(desc(stockPositions.buyDate), desc(stockPositions.createdAt));

            const mapped = rows.map((r) => ({
                ...r,
                quantity: Number(r.quantity),
                buyPrice: Number(r.buyPrice),
                buyTotal: Number(r.buyTotal),
            }));

            return res.status(200).json({ data: mapped });
        }

        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { userId, symbol, name, exchange, logoUrl, quantity, buyPrice, buyCurrency, buyDate, notes } = body;

            if (!userId || !symbol || !quantity || !buyPrice || !buyCurrency || !buyDate) {
                return res.status(400).json({
                    error: "Champs manquants : userId, symbol, quantity, buyPrice, buyCurrency, buyDate",
                });
            }

            const qty = Number(quantity);
            const priceUnit = Number(buyPrice);
            const total = qty * priceUnit;

            const [inserted] = await db
                .insert(stockPositions)
                .values({
                    userId,
                    symbol: String(symbol).toUpperCase(),
                    name: name || null,
                    exchange: exchange || null,
                    logoUrl: logoUrl || null,
                    quantity: qty.toString(),
                    buyPrice: priceUnit.toString(),
                    buyTotal: total.toString(),
                    buyCurrency,
                    buyDate,
                    notes: notes || null,
                })
                .returning();

            return res.status(200).json({
                success: true,
                row: {
                    ...inserted,
                    quantity: Number(inserted.quantity),
                    buyPrice: Number(inserted.buyPrice),
                    buyTotal: Number(inserted.buyTotal),
                },
            });
        }

        if (req.method === "DELETE") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const { id, userId } = body;

            if (!id || !userId) {
                return res.status(400).json({ error: "Champs id et userId obligatoires" });
            }

            await db
                .delete(stockPositions)
                .where(and(eq(stockPositions.id, id), eq(stockPositions.userId, userId)));

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in stocks:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}

// GET /api/stocks/prices?symbols=AAPL,MSFT,GOOGL
export async function handleStockPrices(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const symbolsParam = req.query.symbols as string | undefined;
            if (!symbolsParam) {
                return res.status(400).json({ error: "Paramètre symbols obligatoire" });
            }

            const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase());

            // Récupérer les prix depuis la base de données
            const prices = await db
                .select()
                .from(stockPrices)
                .where(inArray(stockPrices.symbol, symbols))
                .orderBy(desc(stockPrices.asOf));

            // Grouper par symbol et prendre le plus récent
            const latestPrices = new Map();
            for (const price of prices) {
                if (!latestPrices.has(price.symbol)) {
                    latestPrices.set(price.symbol, {
                        symbol: price.symbol,
                        price: Number(price.price),
                        currency: price.currency,
                        asOf: price.asOf?.toISOString() || new Date().toISOString(),
                    });
                }
            }

            return res.status(200).json({ data: Array.from(latestPrices.values()) });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in stock prices:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}

// POST /api/stocks/prices/refresh
export async function handleStockPricesRefresh(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "POST") {
            // Récupérer tous les symboles uniques des positions
            const positions = await db.select().from(stockPositions);
            const symbols = Array.from(new Set(positions.map(p => p.symbol)));

            if (symbols.length === 0) {
                return res.status(200).json({ message: "Aucun symbole à rafraîchir", updated: 0 });
            }

            console.log(`Refreshing prices for ${symbols.length} symbols:`, symbols);

            const results = [];
            const errors = [];

            // Récupérer les prix depuis Yahoo Finance
            for (const symbol of symbols) {
                try {
                    const quote = await yahooFinance.quote(symbol);

                    if (quote && quote.regularMarketPrice) {
                        // Insérer le nouveau prix dans la base
                        await db.insert(stockPrices).values({
                            symbol: symbol,
                            price: quote.regularMarketPrice.toString(),
                            currency: quote.currency || "USD",
                            asOf: new Date(),
                        });

                        results.push({
                            symbol,
                            price: quote.regularMarketPrice,
                            currency: quote.currency || "USD",
                        });
                    } else {
                        errors.push({ symbol, error: "No price data" });
                    }
                } catch (err: any) {
                    console.error(`Error fetching ${symbol}:`, err.message);
                    errors.push({ symbol, error: err.message });
                }
            }

            return res.status(200).json({
                message: "Prix rafraîchis",
                updated: results.length,
                failed: errors.length,
                results,
                errors: errors.length > 0 ? errors : undefined,
            });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in stock prices refresh:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
