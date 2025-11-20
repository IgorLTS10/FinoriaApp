// api/stocks/search.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = req.query.q as string | undefined;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Paramètre 'q' obligatoire" });
    }

    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      q
    )}&quotesCount=20`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(500).json({
        error: `Yahoo Finance error ${response.status} : ${response.statusText}`,
      });
    }

    const json = await response.json();

    const results =
      json.quotes
        ?.filter((r: any) => r.quoteType === "EQUITY")
        .map((r: any) => ({
          symbol: r.symbol,
          name: r.shortname || r.longname || r.symbol,
          exchange: r.exchange,
          // Logo via Clearbit (simple estimation)
          logoUrl:
            r.shortname || r.longname
              ? `https://logo.clearbit.com/${(
                  r.shortname || r.longname
                )
                  .toLowerCase()
                  .replace(/\s+/g, "")}.com`
              : null,
        }))
        .slice(0, 10) ?? [];

    return res.status(200).json({ results });
  } catch (err: any) {
    console.error("Error in /api/stocks/search:", err);
    return res.status(500).json({ error: err.message });
  }
}
