// api/handlers/stocks-search.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import YahooFinanceModule from "yahoo-finance2";

const yahooFinance = new YahooFinanceModule();

export type StockSearchResult = {
    symbol: string;
    name: string;
    exchange: string;
    logoUrl: string | null;
};

// Handler for /api/stocks/search
export async function handleStockSearch(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }

        const q = (req.query.q as string | undefined) || "";
        const query = q.trim();

        if (!query) {
            return res.status(200).json({ results: [] });
        }

        // Utiliser Yahoo Finance pour rechercher des actions
        const searchResults = await yahooFinance.search(query) as any;

        if (!searchResults || !searchResults.quotes || searchResults.quotes.length === 0) {
            return res.status(200).json({ results: [] });
        }

        // Filtrer pour ne garder que les actions (pas les ETFs, indices, etc.)
        const stocks = searchResults.quotes
            .filter((quote: any) => quote.quoteType === "EQUITY" || quote.quoteType === "ETF")
            .slice(0, 10);

        const results: StockSearchResult[] = stocks.map((quote: any) => {
            const symbol = quote.symbol || "";
            const name = quote.longname || quote.shortname || "";
            const exchange = quote.exchange || quote.exchDisp || "";

            // Générer l'URL du logo via Clearbit (comme pour les cryptos)
            // On extrait le domaine de l'entreprise à partir du nom ou du symbole
            let logoUrl: string | null = null;

            // Pour les actions américaines, on peut essayer de deviner le domaine
            // Exemple: AAPL -> apple.com, MSFT -> microsoft.com
            const cleanSymbol = symbol.replace(/[^A-Z]/g, "").toLowerCase();
            if (cleanSymbol && exchange.includes("NAS") || exchange.includes("NYS") || exchange.includes("NYSE")) {
                // Essayer avec Clearbit logo API
                logoUrl = `https://logo.clearbit.com/${cleanSymbol}.com`;
            }

            return {
                symbol,
                name,
                exchange,
                logoUrl,
            };
        });

        return res.status(200).json({ results });
    } catch (err: any) {
        console.error("Error in stocks/search:", err);
        return res.status(500).json({ error: err?.message || "Erreur serveur" });
    }
}
