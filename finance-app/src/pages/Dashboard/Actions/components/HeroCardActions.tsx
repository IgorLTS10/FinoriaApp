import styles from "./HeroCardActions.module.css";
import { motion } from "framer-motion";
import { useFx } from "../../Metaux/hooks/useFx";

import type { StockRow } from "../hooks/useStockPositions";
import type { StockPrice } from "../hooks/useStockPrices";

type HeroProps = {
  rows: StockRow[];
  prices: Record<string, StockPrice | null>;
};



export default function HeroCardActions({ rows, prices }: HeroProps) {
  const { convert, convertForDisplay, displayCurrency } = useFx();

  let totalInvested = 0;
  let totalCurrent = 0;

  for (const r of rows) {
    const invested = convertForDisplay(r.buyTotal, r.buyCurrency);
    totalInvested += invested;

    const priceSpot = prices[r.symbol]?.price ?? 0;
    const current = convert(priceSpot * Number(r.quantity), prices[r.symbol]?.currency || "USD", displayCurrency);
    totalCurrent += current;
  }

  const pnl = totalCurrent - totalInvested;
  const pnlPercentage = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  const color = pnl >= 0 ? "#10b981" : "#ef4444";

  const fmt = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.left}>
        <div className={styles.label}>Valeur totale actions</div>
        <div className={styles.value}>{fmt.format(totalCurrent)}</div>

        <div className={styles.delta} style={{ color }}>
          {pnl >= 0 ? "+" : ""}
          {pnlPercentage.toFixed(2)}% 
          {" "}({pnl >= 0 ? "+" : ""}
          {fmt.format(pnl)})
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.spark}>
          📈
        </div>
      </div>
    </motion.div>
  );
}
