// src/pages/Dashboard/Metaux/components/HeroCard.tsx
import styles from "./HeroCard.module.css";
import Sparkline from "./Sparkline";
import CurrencySelector from "./CurrencySelector";
import { useFx } from "../hooks/useFx";

export default function HeroCard() {
  const { displayCurrency, convertForDisplay } = useFx();

  // Valeur totale du portefeuille en EUR (placeholder)
  const baseValueEUR = 12450;
  const converted = convertForDisplay(baseValueEUR, "EUR");

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.label}>Valeur totale du portefeuille</div>
        <div className={styles.value}>{formatter.format(converted)}</div>
        <div className={styles.delta}>+3.4% cette semaine</div>
      </div>

      <div className={styles.right}>
        <div className={styles.currency}>
          <CurrencySelector compact />
        </div>
        <Sparkline />
      </div>
    </div>
  );
}
