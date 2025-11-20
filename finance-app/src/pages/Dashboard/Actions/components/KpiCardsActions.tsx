// src/pages/Dashboard/Actions/components/KpiCardsActions.tsx
import styles from "./KpiCardsActions.module.css";
import { useFx } from "../../Metaux/hooks/useFx";
import type { StockRow } from "../hooks/useStockPositions";
import type { StockPrice } from "../hooks/useStockPrices";

type KpiProps = {
  rows: StockRow[];
  prices: Record<string, StockPrice | null>;
};

export default function KpiCardsActions({ rows, prices }: KpiProps) {
  const { displayCurrency, convert, convertForDisplay } = useFx();

  let invested = 0;
  let current = 0;

  for (const r of rows) {
    invested += convertForDisplay(r.buyTotal, r.buyCurrency);

    const p = prices[r.symbol];
    if (p && Number.isFinite(p.price)) {
      current += convert(p.price * r.quantity, p.currency, displayCurrency);
    }
  }

  const pnl = current - invested;


  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 2,
  });

  const items = [
    {
      label: "Investi total",
      value: invested,
    },
    {
      label: "Valeur actuelle",
      value: current,
    },
    {
      label: "P&L global",
      value: pnl,
    },
    {
      label: "Positions",
      value: rows.length,
      isCount: true,
    },
  ];

  return (
    <div className={styles.grid}>
      {items.map((it) => (
        <div className={styles.card} key={it.label}>
          <div className={styles.label}>{it.label}</div>
          <div className={styles.value}>
            {it.isCount
              ? it.value
              : formatter.format(typeof it.value === "number" ? it.value : 0)}
          </div>
        </div>
      ))}
    </div>
  );
}
