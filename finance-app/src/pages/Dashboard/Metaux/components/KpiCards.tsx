// src/pages/Dashboard/Metaux/components/KpiCards.tsx
import { useMemo } from "react";
import styles from "./KpiCards.module.css";
import { useFx } from "../hooks/useFx";
import { useUser } from "@stackframe/react";
import { useMetaux } from "../hooks/useMetaux";

type MetalType = "or" | "argent" | "platine" | "palladium";

const METALS: { key: MetalType; label: string; color: string }[] = [
  { key: "or", label: "Or", color: "#f8d44c" },
  { key: "argent", label: "Argent", color: "#d1d1d1" },
  { key: "platine", label: "Platine", color: "#8bc3ff" },
  { key: "palladium", label: "Palladium", color: "#ff9dbb" },
];

function normalizeWeightToGrams(poids: number, unite: "g" | "oz") {
  if (unite === "oz") return poids * 31.1035;
  return poids;
}

function formatWeight(weightG: number) {
  if (!Number.isFinite(weightG) || weightG === 0) return "-";
  if (weightG >= 1000) {
    const kg = weightG / 1000;
    return `${kg.toFixed(2)} kg`;
  }
  return `${weightG.toFixed(1)} g`;
}

type KpiCardsProps = {
  selectedMetal: MetalType;
  onMetalChange: (metal: MetalType) => void;
};

export default function KpiCards({ selectedMetal, onMetalChange }: KpiCardsProps) {
  const { displayCurrency, convertForDisplay } = useFx();
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);

  const {
    totalInvested,
    totalWeightG,
    count,
    avgPricePerGram,
  } = useMemo(() => {
    if (!rows || rows.length === 0) {
      return {
        totalInvested: 0,
        totalWeightG: 0,
        count: 0,
        avgPricePerGram: 0,
      };
    }

    const filtered = rows.filter((r) => r.type === selectedMetal);

    if (filtered.length === 0) {
      return {
        totalInvested: 0,
        totalWeightG: 0,
        count: 0,
        avgPricePerGram: 0,
      };
    }

    let invested = 0;
    let weightG = 0;

    for (const r of filtered) {
      invested += convertForDisplay(r.prixAchat, r.deviseAchat);
      weightG += normalizeWeightToGrams(r.poids, r.unite);
    }

    const avg = weightG > 0 ? invested / weightG : 0;

    return {
      totalInvested: invested,
      totalWeightG: weightG,
      count: filtered.length,
      avgPricePerGram: avg,
    };
  }, [rows, selectedMetal, convertForDisplay]);

  const formatterMoney = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  const formatterPricePerGram = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 2,
  });

  const items = [
    {
      label: "Montant investi",
      value: totalInvested,
      type: "money" as const,
      color: "#38bdf8",
    },
    {
      label: "Prix moyen / g",
      value: avgPricePerGram,
      type: "pricePerGram" as const,
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

  const selectedMeta = METALS.find((m) => m.key === selectedMetal);

  return (
    <div>
      {/* Petit sélecteur de métal discret au-dessus des cartes */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          fontSize: 12,
        }}
      >
        <span style={{ opacity: 0.7 }}>Métal analysé :</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {METALS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onMetalChange(m.key)}
              style={{
                borderRadius: 999,
                padding: "3px 9px",
                border:
                  m.key === selectedMetal
                    ? "1px solid rgba(148, 163, 184, 0.9)"
                    : "1px solid rgba(148, 163, 184, 0.25)",
                background:
                  m.key === selectedMetal
                    ? "rgba(15,23,42,0.9)"
                    : "rgba(15,23,42,0.4)",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tes cartes existantes */}
      <div className={styles.grid}>
        {items.map((it) => {
          let display: string;

          if (it.type === "money") {
            display = formatterMoney.format(it.value || 0);
          } else if (it.type === "weight") {
            display = formatWeight(it.value || 0);
          } else if (it.type === "pricePerGram") {
            display =
              it.value > 0
                ? `${formatterPricePerGram.format(it.value)} / g`
                : "-";
          } else {
            display = String(it.value || 0);
          }

          return (
            <div className={styles.card} key={it.label}>
              <div className={styles.label}>
                {it.label}
                {it.label === "Montant investi" && selectedMeta
                  ? ` (${selectedMeta.label})`
                  : null}
                {it.label === "Poids total" && selectedMeta
                  ? ` (${selectedMeta.label})`
                  : null}
                {it.label === "Prix moyen / g" && selectedMeta
                  ? ` (${selectedMeta.label})`
                  : null}
              </div>
              <div className={styles.value} style={{ color: it.color }}>
                {display}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
