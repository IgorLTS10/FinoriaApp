// src/pages/Dashboard/Metaux/hooks/useFx.ts
import { useCurrency } from "./useCurrency";

type Rates = Record<string, number>;

// on considère que les valeurs sources sont en EUR
const BASE = "EUR";

// taux FX simplifiés base EUR (à ajuster plus tard)
const RATES_FROM_EUR: Rates = {
  USD: 1.08,
  PLN: 4.25,
  GBP: 0.86,
  CHF: 0.95,
  EUR: 1,
};

export function useFx() {
  const { currency: displayCurrency } = useCurrency(); // devise d'affichage

  function convert(amount: number, from: string, to: string): number {
    if (from === to) return amount;

    // on ne gère qu'une base EUR pour l'instant
    if (from === BASE && RATES_FROM_EUR[to]) {
      return amount * RATES_FROM_EUR[to];
    }

    if (to === BASE && RATES_FROM_EUR[from]) {
      return amount / RATES_FROM_EUR[from];
    }

    if (RATES_FROM_EUR[from] && RATES_FROM_EUR[to]) {
      const inBase = amount / RATES_FROM_EUR[from];
      return inBase * RATES_FROM_EUR[to];
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
  };
}
