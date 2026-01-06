// api/handlers/stocks-search.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export type StockSearchResult = {
    symbol: string;
    name: string;
    exchange: string;
    logoUrl: string | null;
};

// Cache pour éviter les requêtes répétées (expire après 1 heure)
const searchCache = new Map<string, { results: StockSearchResult[], timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

// Handler for /api/stocks/search
export async function handleStockSearch(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }

        const q = (req.query.q as string | undefined) || "";
        const query = q.trim();

        if (!query || query.length < 2) {
            return res.status(200).json({ results: [] });
        }

        // Vérifier le cache
        const cached = searchCache.get(query.toLowerCase());
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log(`[Finnhub] Cache hit for: ${query}`);
            return res.status(200).json({ results: cached.results });
        }

        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) {
            console.error("[Finnhub] API key not configured");
            return res.status(500).json({ error: "API key not configured" });
        }

        // Recherche de symboles avec Finnhub
        console.log(`[Finnhub] Searching for: ${query}`);
        const searchUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`;
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
            console.error(`[Finnhub] Search failed: ${searchResponse.status}`);
            return res.status(searchResponse.status).json({
                error: `Finnhub API error: ${searchResponse.statusText}`
            });
        }

        const searchData = await searchResponse.json();

        if (!searchData.result || searchData.result.length === 0) {
            console.log(`[Finnhub] No results for: ${query}`);
            return res.status(200).json({ results: [] });
        }

        // Limiter à 10 résultats et filtrer les actions US
        const topResults = searchData.result
            .filter((item: any) => item.type === "Common Stock" || item.type === "ETP")
            .slice(0, 10);

        // Récupérer les profils avec logos pour chaque symbole
        const results: StockSearchResult[] = await Promise.all(
            topResults.map(async (item: any) => {
                const symbol = item.symbol || item.displaySymbol;
                const name = item.description || "";

                // Récupérer le profil pour obtenir le logo
                let logoUrl: string | null = null;
                try {
                    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
                    const profileResponse = await fetch(profileUrl);

                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        logoUrl = profileData.logo || null;
                    }
                } catch (err) {
                    console.warn(`[Finnhub] Failed to fetch logo for ${symbol}:`, err);
                }

                return {
                    symbol,
                    name,
                    exchange: item.type || "",
                    logoUrl,
                };
            })
        );

        // Mettre en cache
        searchCache.set(query.toLowerCase(), {
            results,
            timestamp: Date.now(),
        });

        console.log(`[Finnhub] Found ${results.length} results for: ${query}`);
        return res.status(200).json({ results });
    } catch (err: any) {
        console.error("[Finnhub] Error in stocks/search:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
