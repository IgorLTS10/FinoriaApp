// api/fx.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../src/db/client.js";          // ⚠️ garde bien le .js
import { fxRates, metaux } from "../src/db/schema.js";
import { sql as rawSql, and, desc, eq } from "drizzle-orm";

// API gratuite FX + métaux (sans clé, daily)
// Doc: https://github.com/fawazahmed0/exchange-api
const EXCHANGE_API_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json";

type ExchangeApiResponse = {
  date: string;
  eur: Record<string, number>; // ex: { "usd": 1.07, "pln": 4.31, "xau": 0.00028, ... }
};

// mapping type de ta table -> code métal de l'API
const TYPE_TO_METAL_CODE: Record<string, string> = {
  or: "xau",
  argent: "xag",
  platine: "xpt",
  palladium: "xpd",
};

// devises FX que tu veux suivre en plus des métaux
const FX_CURRENCY_CODES = ["usd", "pln"]; // rajoute "chf", "gbp", etc. si besoin

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // =====================================================
    // GET : lire les derniers taux FX + métaux
    // GET /api/fx?base=EUR&quotes=USD,PLN,XAU,XAG
    // =====================================================
    if (req.method === "GET") {
      const base = ((req.query.base as string) || "EUR").toUpperCase();
      const quotesParam = (req.query.quotes as string | undefined) || "";
      const wantedQuotes = quotesParam
        .split(",")
        .map((q) => q.trim().toUpperCase())
        .filter(Boolean);

      // on récupère tous les taux pour cette base
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

        // si un filtre quotes est fourni → on saute ce qui ne matche pas
        if (wantedQuotes.length > 0 && !wantedQuotes.includes(quote)) continue;

        // on ne garde que le plus récent par quote
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

    // =====================================================
    // POST : rafraîchir FX + métaux
    // - appelé par GitHub Actions chaque nuit
    // - regarde ce qu'il y a dans metaux → types distincts
    // - déduit les codes métaux nécessaires (XAU/XAG/...)
    // - ajoute quelques devises FIAT (USD/PLN/...)
    // - appelle UN SEUL endpoint externe
    // - supprime les anciens taux concerné
    // - insère les nouveaux dans fx_rates
    // =====================================================
    if (req.method === "POST") {
      const BASE = "EUR";

      // 1) Types distincts présents dans la table metaux
      const distinctTypes = await db.execute(
        rawSql`SELECT DISTINCT type FROM metaux`
      );

      const types: string[] = (distinctTypes.rows as any[])
        .map((r) => (r.type as string)?.toLowerCase())
        .filter(Boolean);

      // métaux utiles à partir des types réellement utilisés
      const metalCodes = types
        .map((t) => TYPE_TO_METAL_CODE[t])
        .filter((c): c is string => Boolean(c));

      // set pour éviter les doublons
      const neededCodes = Array.from(
        new Set([...FX_CURRENCY_CODES, ...metalCodes])
      ); // ex: ["usd","pln","xau","xag"]

      if (neededCodes.length === 0) {
        return res.status(200).json({
          success: true,
          message:
            "Aucun taux à rafraîchir (ni FX configuré, ni type de métal présent en base).",
        });
      }

      // 2) Appel à l'API centrale
      const externalRes = await fetch(EXCHANGE_API_URL);
      if (!externalRes.ok) {
        throw new Error(
          `Erreur exchange-api: HTTP ${externalRes.status} ${externalRes.statusText}`
        );
      }
      const json = (await externalRes.json()) as ExchangeApiResponse;

      if (!json.eur) {
        throw new Error("Réponse exchange-api invalide: pas de clé 'eur'.");
      }

      const eurRates = json.eur; // ex: { usd: 1.07, pln: 4.31, xau: 0.00028, ... }
      const now = new Date();

      // 3) Construire les valeurs à insérer
      // Convention: rate = nombre d'unités de "quote" pour 1 EUR
      // ex: EUR->USD: 1 EUR = 1.07 USD
      //     EUR->XAU: 1 EUR = 0.00028 XAU (pour connaître le prix de 1 XAU en EUR: 1 / rate)
      const toInsert: {
        base: string;
        quote: string;
        rate: string;
        asOf: Date;
      }[] = [];

      const missingCodes: string[] = [];

      for (const code of neededCodes) {
        const lower = code.toLowerCase();
        const value = eurRates[lower];

        if (!value || !Number.isFinite(value)) {
          missingCodes.push(code.toUpperCase());
          continue;
        }

        toInsert.push({
          base: BASE,
          quote: code.toUpperCase(), // ex: USD, PLN, XAU, XAG, ...
          rate: value.toString(),
          asOf: now,
        });
      }

      if (toInsert.length === 0) {
        return res.status(200).json({
          success: false,
          message:
            "Aucun taux exploitable renvoyé par l'API pour les codes demandés.",
          missingCodes,
        });
      }

      // 4) éviter les doublons: on supprime les anciens taux pour (base, quote) concernés
      const quotesToUpdate = Array.from(
        new Set(toInsert.map((v) => v.quote))
      );

      for (const quote of quotesToUpdate) {
        await db
          .delete(fxRates)
          .where(
            and(eq(fxRates.base, BASE), eq(fxRates.quote, quote))
          );
      }

      // 5) on insère les nouveaux taux
      await db.insert(fxRates).values(toInsert);

      return res.status(200).json({
        success: true,
        base: BASE,
        updated: toInsert.length,
        quotes: quotesToUpdate,
        missingCodes,
      });
    }

    // Méthodes non gérées
    return res.status(405).json({
      error: `Method ${req.method} not allowed, use GET/POST`,
    });
  } catch (err: any) {
    console.error("Error in /api/fx:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/fx",
    });
  }
}
