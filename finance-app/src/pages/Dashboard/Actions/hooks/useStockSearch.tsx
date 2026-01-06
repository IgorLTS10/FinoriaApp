import { useEffect, useState } from "react";

export type StockSearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  logoUrl: string | null;
};

// Cache pour éviter les recherches répétées
const searchCache = new Map<string, StockSearchResult[]>();

export function useStockSearch(query: string) {
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Minimum 2 caractères pour chercher
    if (!query || query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    // Vérifier le cache d'abord
    const cached = searchCache.get(query.toLowerCase());
    if (cached) {
      setResults(cached);
      setError(null);
      return;
    }

    let active = true;

    // Debounce: attendre 600ms après que l'utilisateur arrête de taper
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Erreur ${res.status}`);
        }

        const json = await res.json();
        const searchResults = json.results || [];

        if (active) {
          setResults(searchResults);
          // Mettre en cache
          searchCache.set(query.toLowerCase(), searchResults);
        }
      } catch (err: any) {
        console.error("Search error:", err);
        if (active) {
          setResults([]);
          setError(err.message || "Erreur de recherche");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 600); // Attendre 600ms

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [query]);

  return { results, loading, error };
}
