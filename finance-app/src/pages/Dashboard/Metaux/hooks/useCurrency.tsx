// src/pages/Dashboard/Metaux/hooks/useCurrency.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const AVAILABLE = ["EUR", "USD", "PLN", "GBP", "CHF"];

type CurrencyCtx = {
  currency: string;
  setCurrency: (c: string) => void;
};

const CurrencyContext = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("EUR");

  // init depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem("finoria_currency");
    if (stored && AVAILABLE.includes(stored)) setCurrency(stored);
  }, []);

  // persistance
  useEffect(() => {
    localStorage.setItem("finoria_currency", currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return { ...ctx, AVAILABLE };
}
