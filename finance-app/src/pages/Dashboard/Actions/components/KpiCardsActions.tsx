import styles from "./KpiCardsActions.module.css";
import { motion } from "framer-motion";
import { useFx } from "../../Metaux/hooks/useFx";
import type { StockRow } from "../hooks/useStockPositions";
import type { StockPrice } from "../hooks/useStockPrices";

type KpiProps = {
  rows: StockRow[];
  prices: Record<string, StockPrice | null>;
};

export default function KpiCardsActions({ rows, prices }: KpiProps) {
  const { convert, convertForDisplay, displayCurrency } = useFx();

  let totalInvested = 0;
  let totalCurrent = 0;
  let count = rows.length;

  for (const r of rows) {
    totalInvested += convertForDisplay(r.buyTotal, r.buyCurrency);
    const priceSpot = prices[r.symbol]?.price ?? 0;
    totalCurrent += convert(priceSpot * Number(r.quantity), prices[r.symbol]?.currency || "USD", displayCurrency);
  }

  const pnl = totalCurrent - totalInvested;

  const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: displayCurrency });

  const items = [
    { label: "Investi total", value: fmt.format(totalInvested), color: "#60a5fa" },
    { label: "Valeur actuelle", value: fmt.format(totalCurrent), color: "#34d399" },
    { label: "P&L global", value: fmt.format(pnl), color: pnl >= 0 ? "#10b981" : "#ef4444" },
    { label: "Positions", value: count, color: "#fbbf24" },
  ];

  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <motion.div
          key={i}
          className={styles.card}
          style={{ borderColor: item.color }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className={styles.label}>{item.label}</div>
          <div className={styles.value} style={{ color: item.color }}>
            {item.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
