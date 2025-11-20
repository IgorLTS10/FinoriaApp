// api/stocks/prices.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client.js";         // ⚠️ bien garder le .js
import { stockPrices, stockPositions } from "../../src/db/schema.js"; // idem .js
import { desc, inArray, sql as rawSql } from "drizzle-orm";

// ===================== GET =====================
// GET /api/stocks/prices?symbols=AAPL,TSLA
// → utilisé par le FRONT pour lire les derniers prix
// ===============================================
async function handleGet(req: VercelRequest, res: VercelResponse) {
  const symbolsParam = (req.query.symbols as string | undefined) || "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return res.status(400).json({
      error: "Paramètre 'symbols' obligatoire, ex: ?symbols=AAPL,TSLA",
    });
  }

  // On récupère tous les enregistrements pour ces symboles
  const rows = await db
    .select()
    .from(stockPrices)
    .where(inArray(stockPrices.symbol, symbols))
    .orderBy(desc(stockPrices.asOf));

  // On garde seulement le plus récent par symbole
  const seen = new Set<string>();
  const latest: any[] = [];

  for (const r of rows) {
    if (!seen.has(r.symbol)) {
      seen.add(r.symbol);
      latest.push({
        symbol: r.symbol,
        currency: r.currency,
        price: Number(r.price),
        asOf: r.asOf.toISOString(),
      });
    }
  }

  return res.status(200).json({ data: latest });
}

// ===================== POST =====================
// POST /api/stocks/prices
// → utilisé par ton CRON GitHub pour rafraîchir les prix
// (je le laisse simple, même logique que crypto : on lit les symboles,
// on appelle un provider externe, on insère dans stock_prices)
// ===============================================
async function handlePost(req: VercelRequest, res: VercelResponse) {
  // 1) Symboles distincts présents dans stock_positions
  const distinctSymbols = await db.execute(
    rawSql`SELECT DISTINCT UPPER(symbol) AS symbol FROM stock_positions`
  );

  const symbols: string[] = (distinctSymbols.rows as any[])
    .map((r) => r.symbol as string)
    .filter(Boolean);

  if (symbols.length === 0) {
    return res.status(200).json({
      success: true,
      message: "Aucune position actions, rien à rafraîchir.",
    });
  }

  // ⚠️ Ici, branche ton provider de prix (Yahoo, TwelveData, etc.)
  // Pour l’instant, je laisse un stub pour ne pas casser ton app :
  // -> on renvoie juste un message explicatif, tu pourras compléter après.
  return res.status(200).json({
    success: true,
    message:
      "POST /api/stocks/prices est prévu pour être appelé par le cron (provider Yahoo/TwelveData à ajouter). Le GET pour le front, lui, est déjà opérationnel.",
    symbols,
  });
}

// ===================== HANDLER PRINCIPAL =====================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      return await handleGet(req, res);
    }
    if (req.method === "POST") {
      return await handlePost(req, res);
    }

    return res.status(405).json({
      error: `Method ${req.method} not allowed, use GET or POST.`,
    });
  } catch (err: any) {
    console.error("Error in /api/stocks/prices:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/stocks/prices",
    });
  }
}
