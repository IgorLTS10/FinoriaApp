// src/pages/Dashboard/Metaux/Metaux.tsx
import styles from "./Metaux.module.css";
import { useUser } from "@stackframe/react";

import HeroCard from "./components/HeroCard";
import KpiCards from "./components/KpiCards";
import LineChartBox from "./components/LineChartBox";
import PieChartBox from "./components/PieChartBox";
import MetalsTable from "./components/MetalsTable";
import AddMetalModal from "./components/AddMetalModal";
import { useMetaux } from "./hooks/useMetaux";
import { useState } from "react";

type MetalType = "or" | "argent" | "platine" | "palladium";

export default function Metaux() {
  const user = useUser();
  const userId = (user as any)?.id as string | undefined;

  const { rows, loading, error, addMetal, deleteMetal } = useMetaux(userId);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState<MetalType>("or");

  return (
    <div className={styles.page}>
      <HeroCard />
      <KpiCards
        selectedMetal={selectedMetal}
        onMetalChange={setSelectedMetal}
      />

      <div className={styles.charts}>
        <LineChartBox selectedMetal={selectedMetal} />
        <PieChartBox />
      </div>

      <MetalsTable
        rows={rows}
        loading={loading}
        error={error || undefined}
        onAddClick={() => setModalOpen(true)}
        onDelete={async (id) => {
          try {
            await deleteMetal(id);
          } catch (err: any) {
            console.error(err);
            alert(err.message || "Erreur lors de la suppression");
          }
        }}
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
  );
}
