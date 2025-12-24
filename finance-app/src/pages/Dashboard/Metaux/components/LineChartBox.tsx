// src/pages/Dashboard/Metaux/components/LineChartBox.tsx
import styles from "./LineChartBox.module.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useFx } from "../hooks/useFx";
import { useUser } from "@stackframe/react";
import { useMetaux } from "../hooks/useMetaux";
import { usePortfolioHistory } from "../hooks/usePortfolioHistory";

type MetalType = "or" | "argent" | "platine" | "palladium";

function formatDateLabel(isoDate: string) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className={styles.tooltipItem} style={{ color: entry.color }}>
          <span className={styles.tooltipLabel}>{entry.name}:</span>
          <span className={styles.tooltipValue}>
            {entry.value.toLocaleString("fr-FR")} {currency}
          </span>
        </p>
      ))}
    </div>
  );
}

type LineChartBoxProps = {
  selectedMetal: MetalType;
};

export default function LineChartBox({ selectedMetal }: LineChartBoxProps) {
  const { convertForDisplay, convert, displayCurrency } = useFx();
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);
  const { history } = usePortfolioHistory(userId);

  // Filter rows by selected metal type
  const filteredRows = rows?.filter((r) => r.type === selectedMetal) || [];

  if (!rows || rows.length === 0) {
    return (
      <div className={styles.box}>
        <h3 className={styles.title}>Évolution du portefeuille</h3>
        <p style={{ opacity: 0.7 }}>Pas encore de données…</p>
      </div>
    );
  }

  // 1) Montants investis par date d'achat
  const investDeltaByDate: Record<string, number> = {};

  for (const r of filteredRows) {
    const dateKey = r.dateAchat.slice(0, 10);
    const investedValue = convertForDisplay(r.prixAchat, r.deviseAchat);

    if (!investDeltaByDate[dateKey]) {
      investDeltaByDate[dateKey] = 0;
    }

    investDeltaByDate[dateKey] += investedValue;
  }

  // 2) Série historique hebdomadaire (valeur réelle par lundi en EUR → convertie en displayCurrency)
  const historyByDate: Record<string, number> = {};
  for (const h of history) {
    const dateKey = h.date; // YYYY-MM-DD
    const valueDisplay = convert(h.valueEur, "EUR", displayCurrency);
    historyByDate[dateKey] = valueDisplay;
  }

  // 3) Union de toutes les dates (achats + historique hebdomadaire)
  const allDatesSet = new Set<string>([
    ...Object.keys(investDeltaByDate),
    ...Object.keys(historyByDate),
  ]);
  const allDates = Array.from(allDatesSet).sort();

  // 4) Construire les séries cumulées
  let cumInvested = 0;

  const data = allDates.map((d) => {
    const delta = investDeltaByDate[d];
    if (delta) {
      cumInvested += delta;
    }

    const weeklyValue = historyByDate[d] ?? null;

    return {
      name: formatDateLabel(d),
      invested: Math.round(cumInvested),
      weekly: weeklyValue !== null ? Math.round(weeklyValue) : null,
    };
  });

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>Évolution du portefeuille</h3>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis
            stroke="#ccc"
            tickFormatter={(v) =>
              Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 0 })
            }
          />
          <Tooltip content={<CustomTooltip currency={displayCurrency} />} />
          <Legend />

          {/* Ligne investissement cumulé */}
          <Line
            type="monotone"
            dataKey="invested"
            name="Investi (cumulé)"
            stroke="#38bdf8"
            strokeWidth={3}
          />

          {/* Ligne valeur hebdomadaire (chaque lundi) */}
          <Line
            type="monotone"
            dataKey="weekly"
            name="Valeur (hebdomadaire)"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
