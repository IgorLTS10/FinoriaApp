// api/crypto/search.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SEARCH_URL = "https://api.coingecko.com/api/v3/search";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed, use GET` });
    }

    const q = (req.query.q as string | undefined) || "";
    const query = q.trim();

    if (!query) {
      return res.status(200).json({ suggestions: [] });
    }

    const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}`;
    const apiRes = await fetch(url);

    if (!apiRes.ok) {
      return res
        .status(502)
        .json({ error: `Erreur provider search: HTTP ${apiRes.status}` });
    }

    const json = await apiRes.json() as {
      coins: {
        id: string;
        name: string;
        symbol: string;
        thumb: string;
        large: string;
      }[];
    };

    const suggestions = (json.coins || []).slice(0, 10).map((c) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      logoUrl: c.large || c.thumb || undefined,
    }));

    return res.status(200).json({ suggestions });
  } catch (err: any) {
    console.error("Error in /api/crypto/search:", err);
    return res.status(500).json({
      error: err?.message || "Erreur serveur /api/crypto/search",
    });
  }
}
