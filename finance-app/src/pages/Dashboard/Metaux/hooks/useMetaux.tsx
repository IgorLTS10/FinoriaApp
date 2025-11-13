// src/pages/Dashboard/Metaux/hooks/useMetaux.tsx
import { useCallback, useEffect, useState } from "react";

export type MetalRow = {
  id: string;
  userId: string;
  type: "or" | "argent" | "platine" | "palladium";
  poids: number;
  unite: "g" | "oz";
  prixAchat: number;
  deviseAchat: string;
  dateAchat: string;
  fournisseur?: string | null;
  notes?: string | null;
};

export type NewMetalPayload = {
  userId: string;
  type: MetalRow["type"];
  poids: number;
  unite: MetalRow["unite"];
  prixAchat: number;
  deviseAchat: string;
  dateAchat: string;
  fournisseur?: string;
  notes?: string;
};

export function useMetaux(userId?: string) {
  const [rows, setRows] = useState<MetalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metaux/list?userId=${userId}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
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

  const addMetal = useCallback(
    async (payload: Omit<MetalRow, "id" | "userId">) => {
      if (!userId) return;

      const res = await fetch("/api/metaux/create", {
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

      const row = json.row as MetalRow;
      setRows((prev) => [...prev, row]);
    },
    [userId]
  );

  const deleteMetal = useCallback(
    async (id: string) => {
      if (!userId) return;
      const res = await fetch("/api/metaux/delete", {
        method: "POST",
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

  return { rows, loading, error, refresh, addMetal, deleteMetal };
}
