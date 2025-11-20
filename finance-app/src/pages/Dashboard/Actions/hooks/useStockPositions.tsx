import { useCallback, useEffect, useState } from "react";

export type StockRow = {
  id: string;
  userId: string;
  symbol: string;
  name?: string | null;
  exchange?: string | null;
  logoUrl?: string | null;

  quantity: number;
  buyPrice: number;
  buyTotal: number;
  buyCurrency: string;
  buyDate: string;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type NewStockPayload = {
  userId: string;

  symbol: string;
  name?: string | null;
  exchange?: string | null;
  logoUrl?: string | null;

  quantity: number;
  buyPrice: number;
  buyCurrency: string;
  buyDate: string;
  notes?: string | null;
};

export function useStockPositions(userId?: string) {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stocks?userId=${userId}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des actions");
      const json = await res.json();
      setRows(json.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const addStock = useCallback(
    async (payload: Omit<NewStockPayload, "userId">) => {
      if (!userId) return;

      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userId }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        throw new Error(json?.error || "Erreur lors de l’ajout de l’action");
      }

      const row = json.row as StockRow;
      setRows((prev) => [...prev, row]);
    },
    [userId]
  );

  const deleteStock = useCallback(
    async (id: string) => {
      if (!userId) return;

      const res = await fetch("/api/stocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        throw new Error(
          json?.error || "Erreur lors de la suppression de l’action"
        );
      }

      setRows((prev) => prev.filter((r) => r.id !== id));
    },
    [userId]
  );

  return {
    rows,
    loading,
    error,
    refresh,
    addStock,
    deleteStock,
  };
}
