// src/pages/Dashboard/Crypto/hooks/useCryptoPositions.tsx
import { useCallback, useEffect, useState } from "react";

export type CryptoPositionRow = {
  id: string;
  userId: string;

  symbol: string;      // "BTC"
  name?: string | null; // "Bitcoin"
  logoUrl?: string | null;

  quantity: number;
  buyPriceUnit: number; // prix unitaire dans la devise d’achat
  buyTotal: number;     // montant total payé
  buyCurrency: string;  // "EUR"
  buyDate: string;      // ISO date (yyyy-mm-dd)

  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type NewCryptoPayload = {
  symbol: string;
  name?: string;
  logoUrl?: string;
  quantity: number;
  buyPriceUnit?: number; // optionnel : on peut laisser vide et calculer via buyTotal
  buyTotal?: number;     // optionnel : on peut laisser vide et calculer via buyPriceUnit
  buyCurrency: string;
  buyDate: string;
  notes?: string;
};

export function useCryptoPositions(userId?: string) {
  const [rows, setRows] = useState<CryptoPositionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crypto/positions?userId=${userId}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des positions crypto");
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

  const addPosition = useCallback(
    async (payload: NewCryptoPayload) => {
      if (!userId) return;

      const res = await fetch("/api/crypto/positions", {
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

      const row = json.row as CryptoPositionRow;
      setRows((prev) => [...prev, row]);
    },
    [userId]
  );

  const deletePosition = useCallback(
    async (id: string) => {
      if (!userId) return;

      const res = await fetch("/api/crypto/positions", {
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

  return { rows, loading, error, refresh, addPosition, deletePosition };
}
