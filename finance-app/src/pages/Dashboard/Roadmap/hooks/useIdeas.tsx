import { useCallback, useEffect, useState } from "react";

export type IdeaRow = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
};

export function useIdeas(userId?: string) {
  const [rows, setRows] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // ⬇️ avant : /api/ideas/list
      const res = await fetch(`/api/ideas?userId=${userId}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des idées");
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

  const addIdea = useCallback(
    async (content: string) => {
      if (!userId) return;

      // ⬇️ avant : /api/ideas/create
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content }),
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

      const row = json.row as IdeaRow;
      setRows((prev) => [...prev, row]);
    },
    [userId]
  );

  return { rows, loading, error, refresh, addIdea };
}
