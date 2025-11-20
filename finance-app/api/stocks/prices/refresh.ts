// api/stocks/prices/refresh.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../src/db/client.js";
import { stockPositions, stockPrices } from "../../../src/db/schema.js";
import { sql as rawSql, eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    // 1. Symbols uniques enregistrés
    const distinct = await db.execute(
      rawSql`SELECT DISTINCT UPPER(symbol) AS symbol FROM stock_positions`
    );

    const symbols = (distinct.rows as any[]).map((r) => r.symbol);

    if (symbols.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Aucune action en portefeuille",
      });
    }

    // 2. Appel Yahoo Finance
    const query = symbols.join(",");
    const url =
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Yahoo Finance HTTP ${response.status}`);
    }

    const json = await response.json();
    const items = json.quoteResponse?.result || [];

    const now = new Date();

    const inserts = [];

    for (const r of items) {
      if (!r.symbol || !r.regularMarketPrice) continue;

      inserts.push({
        symbol: r.symbol,
        price: r.regularMarketPrice.toString(),
        currency: r.currency || "USD",
        asOf: now,
      });

      // bonus : update du nom / exchange si vide
      await db
        .update(stockPositions)
        .set({
          name: r.longName || r.shortName || null,
          exchange: r.fullExchangeName || r.exchange || null,
        })
        .where(eq(stockPositions.symbol, r.symbol));
    }

    // 3. Clean anciens prix
    const uniqueSymbols = Array.from(new Set(inserts.map((i) => i.symbol)));

    for (const s of uniqueSymbols) {
      await db
        .delete(stockPrices)
        .where(eq(stockPrices.symbol, s));
    }

    // 4. Insert nouveaux prix
    if (inserts.length > 0) {
      await db.insert(stockPrices).values(inserts);
    }

    return res.status(200).json({
      success: true,
      updated: inserts.length,
      symbols: uniqueSymbols,
    });
  } catch (err: any) {
    console.error("Error in /api/stocks/prices/refresh:", err);
    return res.status(500).json({ error: err.message });
  }
}
