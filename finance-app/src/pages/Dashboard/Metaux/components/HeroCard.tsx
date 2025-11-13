// src/pages/Dashboard/Metaux/components/HeroCard.tsx
import styles from "./HeroCard.module.css";
import Sparkline from "./Sparkline";
import CurrencySelector from "./CurrencySelector";
import { useFx } from "../hooks/useFx";
import { useUser } from "@stackframe/react";
import { useMetaux } from "../hooks/useMetaux";

export default function HeroCard() {
  const { displayCurrency, convertForDisplay } = useFx();
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);

  let total = 0;
  if (rows && rows.length > 0) {
    for (const r of rows) {
      total += convertForDisplay(r.prixAchat, r.deviseAchat);
    }
  }

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.label}>Valeur totale du portefeuille</div>
        <div className={styles.value}>{formatter.format(total)}</div>
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
