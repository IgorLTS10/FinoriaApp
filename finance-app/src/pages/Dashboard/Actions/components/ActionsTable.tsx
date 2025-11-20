import styles from "./ActionsTable.module.css";
import { motion } from "framer-motion";
import { useFx } from "../../Metaux/hooks/useFx"

import type { StockRow } from "../hooks/useStockPositions";
import type { StockPrice } from "../hooks/useStockPrices";

type ActionsTableProps = {
  rows: StockRow[];
  prices: Record<string, StockPrice | null>;
  loading: boolean;
  error: string | null;
  onAddClick: () => void;
  onDelete: (id: string) => void;
};

export default function ActionsTable({ rows, prices, error, onAddClick, onDelete }: ActionsTableProps) {
  const { convert, convertForDisplay, displayCurrency } = useFx();

  const fmt = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 2,
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Vos actions</h3>
        <button className={styles.addButton} onClick={onAddClick}>
          + Ajouter une action
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>Symbole</th>
              <th>Nom</th>
              <th>Quantité</th>
              <th>Achat</th>
              <th>Actuel</th>
              <th>P&L</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const priceSpot = prices[r.symbol]?.price ?? 0;
              const currentValue = convert(priceSpot * Number(r.quantity), prices[r.symbol]?.currency || "USD", displayCurrency);
              const invested = convertForDisplay(r.buyTotal, r.buyCurrency);

              const pnl = currentValue - invested;
              const pnlColor = pnl >= 0 ? "#10b981" : "#ef4444";

              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <td>
                    {r.logoUrl && <img src={r.logoUrl} className={styles.logo} />}
                  </td>
                  <td>{r.symbol}</td>
                  <td>{r.name}</td>
                  <td>{r.quantity}</td>
                  <td>{fmt.format(invested)}</td>
                  <td>{fmt.format(currentValue)}</td>
                  <td style={{ color: pnlColor }}>{fmt.format(pnl)}</td>
                  <td>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(r.id)}
                    >
                      🗑
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
