// src/pages/Dashboard/Actions/hooks/useStockPositions.tsx
import { useCallback, useEffect, useState } from "react";

export type StockRow = {
  id: string;
  userId: string;
  symbol: string;
  name?: string | null;
  exchange?: string | null;
  logoUrl?: string | null;
  quantity: number;
  buyPrice: number;      // prix unitaire
  buyTotal: number;      // quantité * prix unitaire
  buyCurrency: string;
  buyDate: string;       // ISO
  notes?: string | null;
};

export type NewStockPayload = {
  userId: string;
  symbol: string;
  name?: string;
  exchange?: string;
  logoUrl?: string;
  quantity: number;
  buyPrice: number;      // prix unitaire
  buyCurrency: string;
  buyDate: string;
  notes?: string;
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

      const data = (json.data || []) as any[];

      const mapped: StockRow[] = data.map((r) => ({
        ...r,
        quantity: Number(r.quantity),
        buyPrice: Number(r.buyPrice),
        buyTotal: Number(r.buyTotal),
      }));

      setRows(mapped);
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
      } catch {
        json = null;
      }

      if (!res.ok) {
        const message =
          json?.error ||
          `Erreur HTTP ${res.status} : ${text?.slice(0, 120) || "Réponse vide"}`;
        throw new Error(message);
      }

      const inserted = json.row as any;
      const row: StockRow = {
        ...inserted,
        quantity: Number(inserted.quantity),
        buyPrice: Number(inserted.buyPrice),
        buyTotal: Number(inserted.buyTotal),
      };

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
      } catch {
        json = null;
      }

      if (!res.ok) {
        const message =
          json?.error ||
          `Erreur HTTP ${res.status} : ${text?.slice(0, 120) || "Réponse vide"}`;
        throw new Error(message);
      }

      setRows((prev) => prev.filter((r) => r.id !== id));
    },
    [userId]
  );

  return { rows, loading, error, refresh, addStock, deleteStock };
}
