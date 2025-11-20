import { useEffect, useState } from "react";

export type StockPrice = {
  symbol: string;
  price: number;
  currency: string;
  asOf: string;
};

export function useStockPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, StockPrice | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbols || symbols.length === 0) {
      setPrices({});
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/stocks/prices?symbols=${symbols.join(",")}`
        );
        if (!res.ok) return;

        const json = await res.json();
        const map: Record<string, StockPrice | null> = {};

        for (const p of json.data || []) {
          map[p.symbol] = {
            symbol: p.symbol,
            price: Number(p.price),
            currency: p.currency,
            asOf: p.asOf,
          };
        }

        setPrices(map);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [symbols]);

  return { prices, loading };
}
