// api/fx.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../src/db/client.js"; // garder .js
import {
  fxRates,
  metaux,
  metalPricesHistory,
} from "../src/db/schema.js";
import { sql as rawSql, and, desc, eq } from "drizzle-orm";

// API gratuite FX + métaux
const EXCHANGE_API_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json";

type ExchangeApiResponse = {
  date: string;
  eur: Record<string, number>;
};

// mapping type -> code métal de l'API
const TYPE_TO_METAL_CODE: Record<string, string> = {
  or: "xau",
  argent: "xag",
  platine: "xpt",
  palladium: "xpd",
};

// devises fiat à suivre
const FX_CURRENCY_CODES = ["usd", "pln", "chf", "gbp"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // =====================================================================
    // GET — retourne les derniers taux FX
    // =====================================================================
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

      const rates: Record<
        string,
        { rate: number; base: string; quote: string; asOf: string }
      > = {};

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

    // =====================================================================
    // POST — rafraîchir FX + métaux (appelé par GitHub Actions)
    // =====================================================================
    if (req.method === "POST") {
      const BASE = "EUR";

      // 1) Types distincts réellement utilisés
      const distinctTypes = await db.execute(
        rawSql`SELECT DISTINCT type FROM metaux`
      );

      const types: string[] = (distinctTypes.rows as any[])
        .map((r) => (r.type as string)?.toLowerCase())
        .filter(Boolean);

      const metalCodes = types
        .map((t) => TYPE_TO_METAL_CODE[t])
        .filter(Boolean);

      const neededCodes = Array.from(
        new Set([...FX_CURRENCY_CODES, ...metalCodes])
      );

      if (neededCodes.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Aucun taux à rafraîchir.",
        });
      }

      // 2) Appel API externe
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

      // 3) Construire les valeurs FX à insérer
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

      // 4) Nettoyer les anciens taux
      const quotesToUpdate = Array.from(
        new Set(toInsert.map((x) => x.quote))
      );

      for (const q of quotesToUpdate) {
        await db.delete(fxRates).where(
          and(eq(fxRates.base, BASE), eq(fxRates.quote, q))
        );
      }

      // 5) Insérer les nouveaux taux
      await db.insert(fxRates).values(toInsert);

      // =====================================================================
      // 🔥 6) Enregistrer le SNAPSHOT des prix des métaux (historique)
      // =====================================================================
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

    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
    });
  } catch (err: any) {
    console.error("Error in /api/fx:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/fx",
    });
  }
}
