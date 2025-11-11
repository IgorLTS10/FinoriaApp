import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const title = useMemo(() => {
    if (pathname === "/dashboard" || pathname === "/dashboard/") return "Aperçu";
    const seg = pathname.split("/").filter(Boolean).at(-1) ?? "";
    const map: Record<string, string> = {
      metaux: "Métaux",
      crowdfunding: "Crowdfunding",
      actions: "Actions",
      etf: "ETF",
      crypto: "Crypto",
      immobilier: "Immobilier (SCPI)",
      "private-equity": "Private Equity",
      parametres: "Paramètres",
    };
    return map[seg] ?? "Dashboard";
  }, [pathname]);

  return (
    <header className={styles.top}>
      <div className={styles.left}>
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.center}>
        <input
          className={styles.search}
          placeholder="Rechercher un investissement, un ticker, une note…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) navigate(`/dashboard?search=${encodeURIComponent(q)}`);
            }
          }}
        />
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.ghost}`}
          onClick={() => navigate("/dashboard/import")}
          title="Importer des positions (CSV, API, etc.)"
        >
          Importer
        </button>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => navigate("/dashboard/nouvel-investissement")}
          title="Ajouter un investissement"
        >
          + Investissement
        </button>
      </div>
    </header>
  );
}
