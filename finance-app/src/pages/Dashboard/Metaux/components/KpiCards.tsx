// src/pages/Dashboard/Metaux/components/KpiCards.tsx
import styles from "./KpiCards.module.css";
import { useFx } from "../hooks/useFx";

const items = [
  { label: "Or", eur: 8200, color: "#f8d44c" },
  { label: "Argent", eur: 1450, color: "#d1d1d1" },
  { label: "Platine", eur: 1020, color: "#8bc3ff" },
  { label: "Palladium", eur: 780, color: "#ff9dbb" },
];

export default function KpiCards() {
  const { displayCurrency, convertForDisplay } = useFx();

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  return (
    <div className={styles.grid}>
      {items.map((it) => {
        const converted = convertForDisplay(it.eur, "EUR");

        return (
          <div className={styles.card} key={it.label}>
            <div className={styles.label}>{it.label}</div>
            <div className={styles.value} style={{ color: it.color }}>
              {formatter.format(converted)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
