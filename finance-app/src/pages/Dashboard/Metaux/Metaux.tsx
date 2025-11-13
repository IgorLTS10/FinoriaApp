// src/pages/Dashboard/Metaux/Metaux.tsx
import styles from "./Metaux.module.css";
import { CurrencyProvider } from "./hooks/useCurrency";
import { useUser } from "@stackframe/react";

import HeroCard from "./components/HeroCard";
import KpiCards from "./components/KpiCards";
import LineChartBox from "./components/LineChartBox";
import PieChartBox from "./components/PieChartBox";
import MetalsTable from "./components/MetalsTable";
import AddMetalModal from "./components/AddMetalModal";
import { useMetaux } from "./hooks/useMetaux";
import { useState } from "react";

export default function Metaux() {
  const user = useUser();
  const userId = (user as any)?.id as string | undefined;

  const { rows, loading, error, addMetal } = useMetaux(userId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <CurrencyProvider>
      <div className={styles.page}>
        <HeroCard />
        <KpiCards />

        <div className={styles.charts}>
          <LineChartBox />
          <PieChartBox />
        </div>

        <MetalsTable
          rows={rows}
          loading={loading}
          error={error || undefined}
          onAddClick={() => setModalOpen(true)}
        />

        <AddMetalModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={async (payload) => {
            if (!userId) return;
            await addMetal(payload);
          }}
        />
      </div>
    </CurrencyProvider>
  );
}
