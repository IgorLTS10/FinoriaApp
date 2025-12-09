// api/handlers/fx.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client.js";
import { fxRates, metaux, metalPricesHistory } from "../../src/db/schema.js";
import { sql as rawSql, and, desc, eq } from "drizzle-orm";

const EXCHANGE_API_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json";

type ExchangeApiResponse = {
    date: string;
    eur: Record<string, number>;
};

const TYPE_TO_METAL_CODE: Record<string, string> = {
    or: "xau",
    argent: "xag",
    platine: "xpt",
    palladium: "xpd",
};

const FX_CURRENCY_CODES = ["usd", "pln", "chf", "gbp"];

export async function handleFx(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const base = ((req.query.base as string) || "EUR").toUpperCase();
            const quotesParam = (req.query.quotes as string | undefined) || "";
            const wantedQuotes = quotesParam
                .split(",")
                .map((q) => q.trim().toUpperCase())
                .filter(Boolean);

            const rows = await db
                .select()
                .from(fxRates)
                .where(eq(fxRates.base, base))
                .orderBy(desc(fxRates.asOf));

            const rates: Record<string, { rate: number; base: string; quote: string; asOf: string }> = {};

            for (const row of rows) {
                const quote = row.quote.toUpperCase();
                if (wantedQuotes.length > 0 && !wantedQuotes.includes(quote)) continue;
                if (!rates[quote]) {
                    rates[quote] = {
                        rate: Number(row.rate),
                        base: row.base,
                        quote: row.quote,
                        asOf: row.asOf.toISOString(),
                    };
                }
            }

            return res.status(200).json({ base, rates });
        }

        if (req.method === "POST") {
            const BASE = "EUR";

            const distinctTypes = await db.execute(rawSql`SELECT DISTINCT type FROM metaux`);
            const types: string[] = (distinctTypes.rows as any[])
                .map((r) => (r.type as string)?.toLowerCase())
                .filter(Boolean);

            const metalCodes = types.map((t) => TYPE_TO_METAL_CODE[t]).filter(Boolean);
            const neededCodes = Array.from(new Set([...FX_CURRENCY_CODES, ...metalCodes]));

            if (neededCodes.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "Aucun taux à rafraîchir.",
                });
            }

            const response = await fetch(EXCHANGE_API_URL);
            if (!response.ok) {
                throw new Error(`exchange-api error: HTTP ${response.status}`);
            }

            const json = (await response.json()) as ExchangeApiResponse;
            if (!json.eur) {
                throw new Error("Réponse exchange-api invalide");
            }

            const eurRates = json.eur;
            const now = new Date();

            const toInsert = [];
            const missingCodes: string[] = [];

            for (const code of neededCodes) {
                const lower = code.toLowerCase();
                const value = eurRates[lower];

                if (!value || !Number.isFinite(value)) {
                    missingCodes.push(code);
                    continue;
                }

                toInsert.push({
                    base: BASE,
                    quote: code.toUpperCase(),
                    rate: value.toString(),
                    asOf: now,
                });
            }

            const quotesToUpdate = Array.from(new Set(toInsert.map((x) => x.quote)));

            for (const q of quotesToUpdate) {
                await db.delete(fxRates).where(and(eq(fxRates.base, BASE), eq(fxRates.quote, q)));
            }

            await db.insert(fxRates).values(toInsert);

            const METAL_CODES = ["XAU", "XAG", "XPT", "XPD"];
            const metalInserts = [];

            for (const code of METAL_CODES) {
                const lower = code.toLowerCase();
                const rate = eurRates[lower];

                if (!rate || !Number.isFinite(rate)) continue;

                const pricePerOunceEur = 1 / rate;
                const pricePerGramEur = pricePerOunceEur / 31.1034768;

                metalInserts.push({
                    metal: code,
                    pricePerOunceEur: pricePerOunceEur.toString(),
                    pricePerGramEur: pricePerGramEur.toString(),
                    asOf: now,
                });
            }

            if (metalInserts.length > 0) {
                await db.insert(metalPricesHistory).values(metalInserts);
            }

            return res.status(200).json({
                success: true,
                base: BASE,
                updated: toInsert.length,
                missingCodes,
                metalsInserted: metalInserts.length,
            });
        }

        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    } catch (err: any) {
        console.error("Error in fx:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
