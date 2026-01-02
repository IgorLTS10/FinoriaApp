import { useState, useEffect } from 'react';

type MarketData = {
    change24h: number;
    priceHistory: number[];
};

type MarketDataMap = Record<string, MarketData>;

// Cache for symbol to coin ID mappings to avoid repeated API calls
const coinIdCache: Record<string, string> = {};

/**
 * Automatically find the CoinGecko coin ID for a given symbol
 */
async function findCoinId(symbol: string): Promise<string | null> {
    const upperSymbol = symbol.toUpperCase();

    // Check cache first
    if (coinIdCache[upperSymbol]) {
        console.log(`[findCoinId] Cache hit for ${upperSymbol}: ${coinIdCache[upperSymbol]}`);
        return coinIdCache[upperSymbol];
    }

    try {
        console.log(`[findCoinId] Searching for ${symbol}...`);
        // Use CoinGecko search API
        const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`;
        const response = await fetch(searchUrl);

        if (!response.ok) {
            console.error(`[findCoinId] Search failed for ${symbol}: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Find exact symbol match in coins
        const coin = data.coins?.find((c: any) => c.symbol.toUpperCase() === upperSymbol);

        if (coin?.id) {
            // Cache the result
            coinIdCache[upperSymbol] = coin.id;
            console.log(`[findCoinId] Found ${upperSymbol} -> ${coin.id}`);
            return coin.id;
        }

        console.warn(`[findCoinId] No match found for ${symbol}`);
        return null;
    } catch (err) {
        console.error(`Failed to find coin ID for ${symbol}:`, err);
        return null;
    }
}

/**
 * Hook to fetch crypto market data (24h change and 7-day price history)
 * Uses CoinGecko API with automatic symbol-to-ID mapping
 */
export function useCryptoMarketData(symbols: string[]): {
    data: MarketDataMap;
    loading: boolean;
    error: string | null;
} {
    const [data, setData] = useState<MarketDataMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (symbols.length === 0) {
            setData({});
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('[useCryptoMarketData] Fetching data for symbols:', symbols);

                // Map symbols to coin IDs (with automatic lookup)
                const coinIdPromises = symbols.map(symbol => findCoinId(symbol));
                const resolvedCoinIds = await Promise.all(coinIdPromises);

                // Filter out nulls and create symbol-to-coinId map
                const symbolToCoinId: Record<string, string> = {};
                const validCoinIds: string[] = [];

                symbols.forEach((symbol, index) => {
                    const coinId = resolvedCoinIds[index];
                    if (coinId) {
                        symbolToCoinId[symbol.toUpperCase()] = coinId;
                        validCoinIds.push(coinId);
                    }
                });

                console.log('[useCryptoMarketData] Valid coin IDs:', validCoinIds);

                if (validCoinIds.length === 0) {
                    console.warn('[useCryptoMarketData] No valid coin IDs found');
                    setData({});
                    setLoading(false);
                    return;
                }

                // Fetch market data (includes 24h change)
                const marketUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${validCoinIds.join(',')}&price_change_percentage=24h`;
                console.log('[useCryptoMarketData] Fetching market data...');
                const marketResponse = await fetch(marketUrl);

                if (!marketResponse.ok) {
                    throw new Error(`Failed to fetch market data: ${marketResponse.status}`);
                }

                const marketJson = await marketResponse.json();
                console.log('[useCryptoMarketData] Market data received:', marketJson.length, 'coins');

                // Fetch 7-day sparkline data for each coin
                console.log('[useCryptoMarketData] Fetching sparkline data...');
                const sparklinePromises = validCoinIds.map(async (coinId) => {
                    try {
                        const sparklineUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=eur&days=7&interval=daily`;
                        const response = await fetch(sparklineUrl);

                        if (!response.ok) {
                            console.error(`[Sparkline] Failed for ${coinId}: ${response.status}`);
                            return null;
                        }

                        const json = await response.json();
                        // Extract prices from the response (returns array of [timestamp, price])
                        const prices = json.prices?.map((p: [number, number]) => p[1]) || [];

                        console.log(`[Sparkline] ${coinId}: ${prices.length} data points`);
                        return { coinId, prices };
                    } catch (err) {
                        console.error(`Failed to fetch sparkline for ${coinId}:`, err);
                        return null;
                    }
                });

                const sparklineResults = await Promise.all(sparklinePromises);

                // Build the market data map
                const marketDataMap: MarketDataMap = {};

                marketJson.forEach((coin: any) => {
                    const symbol = coin.symbol.toUpperCase();
                    const change24h = coin.price_change_percentage_24h || 0;

                    // Find corresponding sparkline data
                    const sparklineData = sparklineResults.find(r => r?.coinId === coin.id);
                    const priceHistory = sparklineData?.prices || [];

                    console.log(`[${symbol}] Change 24h: ${change24h.toFixed(2)}%, Price history: ${priceHistory.length} points`);

                    marketDataMap[symbol] = {
                        change24h,
                        priceHistory,
                    };
                });

                console.log('[useCryptoMarketData] Final data:', Object.keys(marketDataMap));
                setData(marketDataMap);
            } catch (err: any) {
                console.error('[useCryptoMarketData] Error:', err);
                setError(err.message || 'Failed to fetch market data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbols.join(',')]);

    return { data, loading, error };
}
