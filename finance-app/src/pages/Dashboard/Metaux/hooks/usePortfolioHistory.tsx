// src/pages/Dashboard/Metaux/hooks/usePortfolioHistory.tsx
import { useEffect, useState } from "react";

export type PortfolioHistoryPoint = {
  date: string;     // YYYY-MM-DD
  valueEur: number; // valeur du portefeuille ce jour-là en EUR
};

export function usePortfolioHistory(userId?: string, metalType?: string) {
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = `/api/metaux/portfolio-history?userId=${userId}${metalType ? `&metalType=${metalType}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement de l'historique portefeuille");
        }

        const json = await res.json();
        if (!ignore) {
          const data = (json.data || []).map((d: any) => ({
            date: d.date as string,
            valueEur: Number(d.valueEur),
          }));
          setHistory(data);
        }
      } catch (err: any) {
        if (!ignore) setError(err.message || "Erreur inconnue");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [userId, metalType]);

  return { history, loading, error };
}
