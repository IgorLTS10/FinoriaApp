// src/pages/Dashboard/Metaux/hooks/useFx.ts
import { useEffect, useState } from "react";
import { useCurrency } from "./useCurrency";

type Rates = Record<string, number>;

// on considère que les valeurs sources sont en EUR
const BASE = "EUR";

// Taux par défaut (fallback) si l'API n'a pas encore répondu
const DEFAULT_RATES_FROM_EUR: Rates = {
  EUR: 1,
  USD: 1.08,
  PLN: 4.25,
  GBP: 0.86,
  CHF: 0.95,
};

export function useFx() {
  const { currency: displayCurrency } = useCurrency(); // devise d'affichage

  const [ratesFromEur, setRatesFromEur] =
    useState<Rates>(DEFAULT_RATES_FROM_EUR);
  const [fxReady, setFxReady] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadFx() {
      try {
        setFxError(null);

        // On demande à l'API les mêmes devises que nos defaults
        const quotes = Object.keys(DEFAULT_RATES_FROM_EUR).join(",");
        const res = await fetch(`/api/fx?base=${BASE}&quotes=${quotes}`);

        if (!res.ok) {
          throw new Error("Erreur lors du chargement des taux FX");
        }

        const json = await res.json();
        const apiRates = json.rates as
          | Record<string, { rate: number; base: string; quote: string; asOf: string }>
          | undefined;

        if (!apiRates) {
          throw new Error("Réponse FX invalide");
        }

        // On part des defaults et on écrase avec les valeurs venant de l'API
        const next: Rates = { ...DEFAULT_RATES_FROM_EUR };

        for (const [quote, data] of Object.entries(apiRates)) {
          const upperQuote = quote.toUpperCase();
          if (typeof data.rate === "number" && Number.isFinite(data.rate)) {
            next[upperQuote] = data.rate;
          }
        }

        if (!ignore) {
          setRatesFromEur(next);
          setFxReady(true);
        }
      } catch (err: any) {
        console.error("useFx loadFx error:", err);
        if (!ignore) {
          setFxError(err?.message || "Erreur inconnue lors du chargement FX");
          setFxReady(true); // on passe quand même à true mais avec les defaults
        }
      }
    }

    loadFx();

    return () => {
      ignore = true;
    };
  }, []);

  function convert(amount: number, from: string, to: string): number {
    if (!Number.isFinite(amount)) return 0;
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    if (fromCode === toCode) return amount;

    // Cas simples : EUR -> X ou X -> EUR
    if (fromCode === BASE && ratesFromEur[toCode]) {
      return amount * ratesFromEur[toCode];
    }

    if (toCode === BASE && ratesFromEur[fromCode]) {
      // on a stocké "1 EUR = rate * X", donc "1 X = 1/rate EUR"
      return amount / ratesFromEur[fromCode];
    }

    // Conversion croisée: from -> EUR -> to
    if (ratesFromEur[fromCode] && ratesFromEur[toCode]) {
      const inBase = amount / ratesFromEur[fromCode]; // from -> EUR
      return inBase * ratesFromEur[toCode]; // EUR -> to
    }

    // fallback : pas de taux connu → on renvoie tel quel
    return amount;
  }

  function convertForDisplay(amount: number, originalCurrency: string): number {
    return convert(amount, originalCurrency, displayCurrency);
  }

  return {
    displayCurrency,
    convert,
    convertForDisplay,
    fxReady,  // si tu veux afficher un skeleton plus tard
    fxError,  // si tu veux afficher un message d’erreur discret
  };
}
