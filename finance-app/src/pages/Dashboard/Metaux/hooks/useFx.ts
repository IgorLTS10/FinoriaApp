// src/pages/Dashboard/Metaux/hooks/useFx.ts
import { usePreferences } from "../../../../state/PreferencesContext";
import { useEffect, useState } from "react";

type Rates = Record<string, number>;

const BASE = "EUR";

// Taux par défaut (fallback) si l'API n'a pas encore répondu
const DEFAULT_RATES_FROM_EUR: Rates = {
  EUR: 1,
  USD: 1.08,
  PLN: 4.25,
  GBP: 0.86,
  CHF: 0.95,

  // Métaux : valeurs approximatives juste pour ne pas avoir 0 si l'API n'a pas encore tourné
  XAU: 0.00028, // 1 EUR ≈ 0.00028 XAU (juste un ordre de grandeur)
  XAG: 0.02,    // 1 EUR ≈ 0.02 XAG
  XPT: 0.0009,
  XPD: 0.0007,
};

export function useFx() {
  const { currency: displayCurrency } = usePreferences();
  const [ratesFromEur, setRatesFromEur] =
    useState<Rates>(DEFAULT_RATES_FROM_EUR);
  const [fxReady, setFxReady] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadFx() {
      try {
        setFxError(null);

        const quotes = Object.keys(DEFAULT_RATES_FROM_EUR).join(","); // EUR,USD,PLN,GBP,CHF,XAU,XAG,XPT,XPD
        const res = await fetch(`/api/fx?base=${BASE}&quotes=${quotes}`);

        if (!res.ok) {
          throw new Error("Erreur lors du chargement des taux FX");
        }

        const json = await res.json();
        const apiRates = json.rates as
          | Record<
            string,
            { rate: number; base: string; quote: string; asOf: string }
          >
          | undefined;

        if (!apiRates) {
          throw new Error("Réponse FX invalide");
        }

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
          setFxReady(true); // on continue avec les valeurs par défaut
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

    // 1 EUR = rate * toCode
    if (fromCode === BASE && ratesFromEur[toCode]) {
      return amount * ratesFromEur[toCode];
    }

    // fromCode -> EUR
    if (toCode === BASE && ratesFromEur[fromCode]) {
      // si 1 EUR = r * fromCode, alors 1 fromCode = 1/r EUR
      return amount / ratesFromEur[fromCode];
    }

    // from -> EUR -> to
    if (ratesFromEur[fromCode] && ratesFromEur[toCode]) {
      const inBase = amount / ratesFromEur[fromCode];
      return inBase * ratesFromEur[toCode];
    }

    return amount;
  }

  function convertForDisplay(amount: number, originalCurrency: string): number {
    return convert(amount, originalCurrency, displayCurrency);
  }

  return {
    displayCurrency,
    convert,
    convertForDisplay,
    fxReady,
    fxError,
  };
}
