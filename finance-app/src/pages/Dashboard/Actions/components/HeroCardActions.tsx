// src/pages/Dashboard/Actions/components/HeroCardActions.tsx
import styles from "./HeroCardActions.module.css";
import CurrencySelector from "../../Metaux/components/CurrencySelector";
import { useFx } from "../../Metaux/hooks/useFx";
import type { StockRow } from "../hooks/useStockPositions";
import type { StockPrice } from "../hooks/useStockPrices";

type HeroProps = {
  rows: StockRow[];
  prices: Record<string, StockPrice | null>;
};

export default function HeroCardActions({ rows, prices }: HeroProps) {
  const { displayCurrency, convert, convertForDisplay } = useFx();

  let invested = 0;
  let current = 0;

  for (const r of rows) {
    invested += convertForDisplay(r.buyTotal, r.buyCurrency);

    const p = prices[r.symbol];
    if (p && Number.isFinite(p.price)) {
      const cur = convert(p.price * r.quantity, p.currency, displayCurrency);
      current += cur;
    }
  }

  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  const formatterPnl = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  const pnlColor = pnl >= 0 ? "#22c55e" : "#f97373";

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.label}>Valeur totale actions</div>
        <div className={styles.value}>{formatter.format(current)}</div>
        <div className={styles.delta} style={{ color: pnlColor }}>
          {pnlPct.toFixed(2)}% ({formatterPnl.format(pnl)})
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.currency}>
          <CurrencySelector compact />
        </div>
        <div className={styles.spark}>📈</div>
      </div>
    </div>
  );
}
