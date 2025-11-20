import { useEffect, useState } from "react";

export function useMetalHistory(metal: "XAU" | "XAG" | "XPT" | "XPD") {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/metaux/history?metal=${metal}&days=365`);
        if (!res.ok) throw new Error("Erreur API");

        const json = await res.json();
        if (!ignore) setHistory(json.history || []);
      } catch (err: any) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [metal]);

  return { history, loading, error };
}
