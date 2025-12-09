import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCryptoPositions, handleCryptoPrices, handleCryptoSearch } from "./handlers/crypto.js";
import { handleStocks, handleStockPrices, handleStockPricesRefresh } from "./handlers/stocks.js";
import { handleMetaux } from "./handlers/metaux.js";
import { handleCrowdfundingProjects, handleCrowdfundingTransactions } from "./handlers/crowdfunding.js";
import { handleFx } from "./handlers/fx.js";
import { handleIdeas } from "./handlers/ideas.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Extract the path from the URL
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const path = url.pathname;

    try {
        // Crypto routes
        if (path === "/api/crypto/positions") {
            return await handleCryptoPositions(req, res);
        }
        if (path === "/api/crypto/prices") {
            return await handleCryptoPrices(req, res);
        }
        if (path === "/api/crypto/search") {
            return await handleCryptoSearch(req, res);
        }

        // Stocks routes
        if (path === "/api/stocks") {
            return await handleStocks(req, res);
        }
        if (path === "/api/stocks/prices") {
            return await handleStockPrices(req, res);
        }
        if (path === "/api/stocks/prices/refresh") {
            return await handleStockPricesRefresh(req, res);
        }

        // Metaux route
        if (path === "/api/metaux") {
            return await handleMetaux(req, res);
        }

        // Crowdfunding routes
        if (path === "/api/crowdfunding/projects") {
            return await handleCrowdfundingProjects(req, res);
        }
        if (path === "/api/crowdfunding/transactions") {
            return await handleCrowdfundingTransactions(req, res);
        }

        // FX route
        if (path === "/api/fx") {
            return await handleFx(req, res);
        }

        // Ideas route
        if (path === "/api/ideas") {
            return await handleIdeas(req, res);
        }

        // Route not found
        return res.status(404).json({ error: "API route not found", path });
    } catch (err: any) {
        console.error("Error in unified router:", err);
        return res.status(500).json({ error: err?.message || "Internal server error" });
    }
}
