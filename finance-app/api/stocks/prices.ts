// api/stocks/prices.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/client.js";
import { stockPositions, stockPrices } from "../../src/db/schema.js";
import { sql } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed, use POST" });
    }

    // 1. Récupérer les symboles distincts
    const rows = await db.execute(
      sql`SELECT DISTINCT symbol FROM stock_positions`
    );

    const symbols: string[] = (rows.rows as any[]).map((r) => r.symbol);

    if (symbols.length === 0) {
      return res.status(200).json({ updated: 0, message: "Aucune action en base" });
    }

    const now = new Date();
    const inserts: {
      symbol: string;
      price: string;
      currency: string;
      asOf: Date;
    }[] = [];

    // 2. Appel Yahoo pour chaque ticker
    for (const symbol of symbols) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;

      const response = await fetch(url);
      if (!response.ok) continue;

      const json = await response.json();
      const result = json.chart?.result?.[0];
      if (!result) continue;

      const price = result.meta?.regularMarketPrice;
      const currency = result.meta?.currency || "USD";

      if (!price) continue;

      inserts.push({
        symbol,
        price: price.toString(),
        currency,
        asOf: now,
      });
    }

    // 3. Insert des prix du jour
    if (inserts.length > 0) {
      await db.insert(stockPrices).values(inserts);
    }

    return res.status(200).json({
      updated: inserts.length,
      symbols: inserts.map((i) => i.symbol),
    });
  } catch (err: any) {
    console.error("Error in /api/stocks/prices:", err);
    return res.status(500).json({ error: err.message });
  }
}
