// api/stocks/prices.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Use GET" });
    }

    const symbolsParam = (req.query.symbols as string | undefined) || "";
    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return res.status(400).json({ error: 'Paramètre "symbols" manquant' });
    }

    const query = symbols.join(",");
    const url =
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(query)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Yahoo Finance HTTP ${response.status}`);
    }

    const json = await response.json();

    const results = (json.quoteResponse?.result || []).map((r: any) => ({
      symbol: r.symbol,
      price: Number(r.regularMarketPrice ?? 0),
      currency: r.currency || "USD",
      name: r.longName || r.shortName || null,
      exchange: r.fullExchangeName || r.exchange || null,
      logoUrl: r.logo_url || null,
    }));

    return res.status(200).json({ data: results });
  } catch (err: any) {
    console.error("Error in /api/stocks/prices:", err);
    return res.status(500).json({ error: err.message });
  }
}
