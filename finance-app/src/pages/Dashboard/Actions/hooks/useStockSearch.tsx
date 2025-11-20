import { useEffect, useState } from "react";

export type StockSearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  logoUrl: string | null;
};

export function useStockSearch(query: string) {
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults([]);
      return;
    }

    let active = true;

    async function fetchResults() {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;

        const json = await res.json();
        if (active) setResults(json.results || []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchResults();

    return () => {
      active = false;
    };
  }, [query]);

  return { results, loading };
}
