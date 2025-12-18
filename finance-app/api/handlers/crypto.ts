// api/handlers/crypto.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { cryptoPositions, cryptoPrices, fxRates } from "../../src/db/schema.js";
import { sql as rawSql, and, desc, eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);
const db = drizzle(sql);

const PROVIDER_MARKETS_URL = "https://api.coingecko.com/api/v3/coins/markets";
const PROVIDER_SEARCH_URL = "https://api.coingecko.com/api/v3/search";

type CoinSearchItem = {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    large?: string;
};

type MarketItem = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
};

// Handler for /api/crypto/positions
export async function handleCryptoPositions(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const userId = req.query.userId as string | undefined;
            if (!userId) {
                return res.status(400).json({ error: "userId est obligatoire" });
            }

            const rows = await db
                .select()
                .from(cryptoPositions)
                .where(eq(cryptoPositions.userId, userId));

            return res.status(200).json({
                data: rows.map((r) => ({
                    ...r,
                    quantity: Number(r.quantity),
                    buyPriceUnit: Number(r.buyPriceUnit),
                    buyTotal: Number(r.buyTotal),
                })),
            });
        }

        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
            const {
                userId,
                symbol,
                name,
                logoUrl,
                quantity,
                buyPriceUnit,
                buyTotal,
                buyCurrency,
                buyDate,
                notes,
            } = body;

            if (!userId || !symbol || !quantity || !buyCurrency || !buyDate) {
                return res.status(400).json({
                    error: "Champs manquants : userId, symbol, quantity, buyCurrency, buyDate sont obligatoires.",
                });
            }

            const qty = Number(quantity);
            const unit = buyPriceUnit ? Number(buyPriceUnit) : undefined;
            const total = buyTotal ? Number(buyTotal) : undefined;

            let computedUnit = unit;
            let computedTotal = total;

            if (computedUnit == null && computedTotal != null && qty > 0) {
                computedUnit = computedTotal / qty;
            } else if (computedTotal == null && computedUnit != null && qty > 0) {
                computedTotal = computedUnit * qty;
            }

            if (computedUnit == null || computedTotal == null) {
                return res.status(400).json({
                    error: "Merci de renseigner soit le prix unitaire, soit le montant total (ou les deux).",
                });
            }

            const [inserted] = await db
                .insert(cryptoPositions)
                .values({
                    userId,
                    symbol,
                    name: name || null,
                    logoUrl: logoUrl || null,
                    quantity: qty.toString(),
                    buyPriceUnit: computedUnit.toString(),
                    buyTotal: computedTotal.toString(),
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
                    buyPriceUnit: Number(inserted.buyPriceUnit),
                    buyTotal: Number(inserted.buyTotal),
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
                .delete(cryptoPositions)
                .where(and(eq(cryptoPositions.id, id), eq(cryptoPositions.userId, userId)));

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in crypto/positions:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}

// Handler for /api/crypto/prices
export async function handleCryptoPrices(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const currency = ((req.query.currency as string) || "EUR").toUpperCase();
            const symbolsParam = (req.query.symbols as string | undefined) || "";

            let symbols: string[] = [];

            if (symbolsParam.trim()) {
                symbols = symbolsParam
                    .split(",")
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean);
            } else {
                const distinct = await db.execute(
                    rawSql`SELECT DISTINCT UPPER(symbol) as symbol FROM crypto_positions`
                );
                symbols = (distinct.rows as any[]).map((r) => r.symbol as string);
            }

            if (symbols.length === 0) {
                return res.status(200).json({ prices: {} });
            }

            const pricesBySymbol: Record<string, { price: number; currency: string; asOf: string }> = {};

            // Récupérer le taux de change EUR -> currency si nécessaire
            let fxRate = 1;
            if (currency !== "EUR") {
                const fxRows = await db
                    .select()
                    .from(fxRates)
                    .where(and(eq(fxRates.base, "EUR"), eq(fxRates.quote, currency)))
                    .orderBy(desc(fxRates.asOf))
                    .limit(1);

                if (fxRows[0]) {
                    fxRate = Number(fxRows[0].rate);
                } else {
                    console.warn(`No FX rate found for EUR -> ${currency}, using 1`);
                }
            }

            for (const symbol of symbols) {
                // Toujours récupérer les prix en EUR (qui sont stockés en base)
                const rows = await db
                    .select()
                    .from(cryptoPrices)
                    .where(and(eq(cryptoPrices.symbol, symbol), eq(cryptoPrices.currency, "EUR")))
                    .orderBy(desc(cryptoPrices.asOf))
                    .limit(1);

                const row = rows[0];
                if (row) {
                    // Convertir le prix EUR vers la devise demandée
                    const priceEur = Number(row.price);
                    const priceConverted = priceEur * fxRate;

                    pricesBySymbol[symbol] = {
                        price: priceConverted,
                        currency: currency, // Retourner la devise demandée
                        asOf: row.asOf.toISOString(),
                    };
                }
            }

            return res.status(200).json({ prices: pricesBySymbol });
        }

        if (req.method === "POST") {
            const distinctSymbols = await db.execute(
                rawSql`SELECT DISTINCT UPPER(symbol) as symbol FROM crypto_positions`
            );

            const symbols: string[] = (distinctSymbols.rows as any[]).map((r) => r.symbol as string);

            if (symbols.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "Aucune position crypto, rien à rafraîchir.",
                });
            }

            const mapped: { symbol: string; providerId: string }[] = [];
            const unmapped: string[] = [];

            for (const symbol of symbols) {
                const searchUrl = `${PROVIDER_SEARCH_URL}?query=${encodeURIComponent(symbol)}`;
                const searchRes = await fetch(searchUrl);

                if (!searchRes.ok) {
                    console.warn(`Search API error for ${symbol}: ${searchRes.status}`);
                    unmapped.push(symbol);
                    continue;
                }

                const json = (await searchRes.json()) as { coins: CoinSearchItem[] };
                const coins = json.coins || [];
                if (coins.length === 0) {
                    unmapped.push(symbol);
                    continue;
                }

                const lowerSymbol = symbol.toLowerCase();
                let best = coins.find((c) => c.symbol.toLowerCase() === lowerSymbol);
                if (!best) best = coins[0];

                if (!best) {
                    unmapped.push(symbol);
                    continue;
                }

                mapped.push({ symbol, providerId: best.id });
            }

            if (mapped.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "Aucun symbole mappé.",
                    unmapped,
                });
            }

            const idsParam = mapped.map((m) => m.providerId).join(",");
            const vsCurrency = "eur";

            const url = `${PROVIDER_MARKETS_URL}?vs_currency=${encodeURIComponent(
                vsCurrency
            )}&ids=${encodeURIComponent(idsParam)}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;

            const priceRes = await fetch(url);
            if (!priceRes.ok) {
                throw new Error(`Erreur provider prix: HTTP ${priceRes.status}`);
            }

            const data = (await priceRes.json()) as MarketItem[];
            const now = new Date();

            const valuesToInsert: { symbol: string; currency: string; price: string; asOf: Date }[] = [];

            for (const m of mapped) {
                const market = data.find((d) => d.id === m.providerId);
                if (!market || !market.current_price || !Number.isFinite(market.current_price)) {
                    continue;
                }

                valuesToInsert.push({
                    symbol: m.symbol,
                    currency: vsCurrency.toUpperCase(),
                    price: market.current_price.toString(),
                    asOf: now,
                });

                await db
                    .update(cryptoPositions)
                    .set({
                        name: market.name,
                        logoUrl: market.image,
                        updatedAt: now,
                    })
                    .where(eq(cryptoPositions.symbol, m.symbol));
            }

            if (valuesToInsert.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "Aucun prix valide reçu.",
                    unmapped,
                });
            }

            const affectedSymbols = Array.from(new Set(valuesToInsert.map((v) => v.symbol)));

            for (const sym of affectedSymbols) {
                await db
                    .delete(cryptoPrices)
                    .where(and(eq(cryptoPrices.symbol, sym), eq(cryptoPrices.currency, vsCurrency.toUpperCase())));
            }

            await db.insert(cryptoPrices).values(valuesToInsert);

            return res.status(200).json({
                success: true,
                inserted: valuesToInsert.length,
                symbols: valuesToInsert.map((v) => v.symbol),
                unmapped,
            });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in crypto/prices:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}

// Handler for /api/crypto/search
export async function handleCryptoSearch(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }

        const q = (req.query.q as string | undefined) || "";
        const query = q.trim();

        if (!query) {
            return res.status(200).json({ suggestions: [] });
        }

        const url = `${PROVIDER_SEARCH_URL}?query=${encodeURIComponent(query)}`;
        const apiRes = await fetch(url);

        if (!apiRes.ok) {
            return res.status(502).json({ error: `Erreur provider search: HTTP ${apiRes.status}` });
        }

        const json = (await apiRes.json()) as { coins: CoinSearchItem[] };

        const suggestions = (json.coins || []).slice(0, 10).map((c) => ({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            logoUrl: c.large || c.thumb || undefined,
        }));

        return res.status(200).json({ suggestions });
    } catch (err: any) {
        console.error("Error in crypto/search:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
