// src/pages/Dashboard/Metaux/components/KpiCards.tsx
import styles from "./KpiCards.module.css";
import { useFx } from "../hooks/useFx";
import { useUser } from "@stackframe/react";
import { useMetaux } from "../hooks/useMetaux";

function normalizeWeightToGrams(poids: number, unite: "g" | "oz") {
  if (unite === "oz") return poids * 31.1035;
  return poids;
}

function formatWeight(weightG: number) {
  if (!Number.isFinite(weightG)) return "-";
  if (weightG >= 1000) {
    const kg = weightG / 1000;
    return `${kg.toFixed(2)} kg`;
  }
  return `${weightG.toFixed(1)} g`;
}

export default function KpiCards() {
  const { displayCurrency, convertForDisplay } = useFx();
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);

  let totalInvested = 0;
  let totalWeightG = 0;
  let count = 0;

  if (rows && rows.length > 0) {
    count = rows.length;
    for (const r of rows) {
      totalInvested += convertForDisplay(r.prixAchat, r.deviseAchat);
      totalWeightG += normalizeWeightToGrams(r.poids, r.unite);
    }
  }

  const avgTicket = count > 0 ? totalInvested / count : 0;

  const formatterMoney = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  const items = [
    {
      label: "Montant investi",
      value: totalInvested,
      type: "money" as const,
      color: "#38bdf8",
    },
    {
      label: "Ticket moyen",
      value: avgTicket,
      type: "money" as const,
      color: "#f97316",
    },
    {
      label: "Poids total",
      value: totalWeightG,
      type: "weight" as const,
      color: "#22c55e",
    },
    {
      label: "Nombre d'achats",
      value: count,
      type: "count" as const,
      color: "#eab308",
    },
  ];

  return (
    <div className={styles.grid}>
      {items.map((it) => {
        let display: string;

        if (it.type === "money") {
          display = formatterMoney.format(it.value || 0);
        } else if (it.type === "weight") {
          display = formatWeight(it.value || 0);
        } else {
          display = String(it.value || 0);
        }

        return (
          <div className={styles.card} key={it.label}>
            <div className={styles.label}>{it.label}</div>
            <div className={styles.value} style={{ color: it.color }}>
              {display}
            </div>
          </div>
        );
      })}
    </div>
  );
}
