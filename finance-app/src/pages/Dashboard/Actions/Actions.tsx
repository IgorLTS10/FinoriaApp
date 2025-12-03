import { useUser } from "@stackframe/react";
import { useState, useMemo } from "react";
import styles from "./Actions.module.css";

import { useStockPositions } from "./hooks/useStockPositions";
import { useStockPrices } from "./hooks/useStockPrices";

import HeroCardActions from "./components/HeroCardActions";
import KpiCardsActions from "./components/KpiCardsActions";
import ActionsTable from "./components/ActionsTable";
import AddStockModal from "./components/AddStockModal";

export default function Actions() {
  const user = useUser();
  const userId = (user as any)?.id;

  const { rows, loading, error, addStock, deleteStock } =
    useStockPositions(userId);

  const symbols = useMemo(
    () => Array.from(new Set(rows.map((r) => r.symbol))),
    [rows]
  );

  const { prices } = useStockPrices(symbols);

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className={styles.page}>
      <HeroCardActions rows={rows} prices={prices} />
      <KpiCardsActions rows={rows} prices={prices} />
      <ActionsTable
        rows={rows}
        prices={prices}
        loading={loading}
        error={error}
        onAddClick={() => setModalOpen(true)}
        onDelete={deleteStock}
      />
      <AddStockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={addStock}
      />
    </div>
  );
}
