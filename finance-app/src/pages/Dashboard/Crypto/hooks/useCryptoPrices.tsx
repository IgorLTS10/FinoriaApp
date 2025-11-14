// src/pages/Dashboard/Crypto/hooks/useCryptoPrices.tsx
import { useEffect, useMemo, useState } from "react";

export type PricesBySymbol = Record<string, number>;

/**
 * Récupère les prix crypto depuis /api/crypto/prices/list,
 * basés sur les snapshots stockés en base.
 *
 * - symbols : liste des symboles (BTC, ETH...)
 * - currency : devise (EUR par défaut)
 * - reloadKey : permet de forcer un refetch (ex: après /refresh)
 */
export function useCryptoPrices(
  symbols: string[],
  currency: string = "EUR",
  reloadKey: number = 0
) {
  const [pricesBySymbol, setPricesBySymbol] = useState<PricesBySymbol>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clé de mémoisation pour éviter de refetch pour rien
  const key = useMemo(() => {
    const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase()))).sort();
    return unique.join(",") + "|" + currency.toUpperCase() + "|" + reloadKey;
  }, [symbols, currency, reloadKey]);

  useEffect(() => {
    const [symbolsPart] = key.split("|");
    if (!symbolsPart) {
      setPricesBySymbol({});
      return;
    }

    const abort = new AbortController();

    async function fetchPrices() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
            `/api/crypto/prices?symbols=${encodeURIComponent(
                symbolsPart
            )}&currency=${encodeURIComponent(currency)}`,
            { signal: abort.signal }
            );

        if (!res.ok) throw new Error("Erreur lors du chargement des prix crypto");

        const json = await res.json();
        const prices = json.prices as Record<
          string,
          { price: number; currency: string; asOf: string }
        >;

        const mapped: PricesBySymbol = {};
        for (const [sym, info] of Object.entries(prices)) {
          mapped[sym.toUpperCase()] = info.price;
        }

        setPricesBySymbol(mapped);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();

    return () => abort.abort();
  }, [key, currency]);

  return { pricesBySymbol, loading, error };
}
