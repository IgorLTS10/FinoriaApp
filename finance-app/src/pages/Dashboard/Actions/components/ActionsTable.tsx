// src/pages/Dashboard/Actions/components/ActionsTable.tsx
import styles from "./ActionsTable.module.css";
import { useFx } from "../../Metaux/hooks/useFx";
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

export default function ActionsTable({
  rows,
  prices,
  loading,
  error,
  onAddClick,
  onDelete,
}: ActionsTableProps) {
  const { displayCurrency, convert, convertForDisplay } = useFx();

  const formatter = new Intl.NumberFormat("fr-FR", {
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
            {loading && (
              <tr>
                <td colSpan={8}>Chargement...</td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8}>Aucune position pour l’instant.</td>
              </tr>
            )}

            {!loading &&
              rows.map((r: StockRow) => {
                const invested = convertForDisplay(r.buyTotal, r.buyCurrency);

                const price = prices[r.symbol]?.price ?? 0;
                const priceCurrency =
                  prices[r.symbol]?.currency || r.buyCurrency;

                const current = price
                  ? convert(price * r.quantity, priceCurrency, displayCurrency)
                  : 0;

                const pnl = current - invested;

                return (
                  <tr key={r.id}>
                    <td>
                      {r.logoUrl && (
                        <img
                          src={r.logoUrl}
                          alt={r.symbol}
                          className={styles.logo}
                        />
                      )}
                    </td>
                    <td>{r.symbol}</td>
                    <td>{r.name || "-"}</td>
                    <td>{r.quantity.toFixed(8)}</td>
                    <td>{formatter.format(invested)}</td>
                    <td>{formatter.format(current)}</td>
                    <td
                      style={{ color: pnl >= 0 ? "#22c55e" : "#f97373" }}
                    >
                      {formatter.format(pnl)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        title="Supprimer cette position"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Supprimer définitivement cette position ?"
                            )
                          ) {
                            onDelete(r.id);
                          }
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
