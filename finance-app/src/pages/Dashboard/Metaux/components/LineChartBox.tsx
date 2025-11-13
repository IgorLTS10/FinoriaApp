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
} from "recharts";
import { useFx } from "../hooks/useFx";
import { useUser } from "@stackframe/react";
import { useMetaux } from "../hooks/useMetaux";

const baseData = [
  { name: "Jan", value: 9000 },
  { name: "Fév", value: 10050 },
  { name: "Mar", value: 11200 },
  { name: "Avr", value: 11800 },
  { name: "Mai", value: 12450 },
];

function formatDateLabel(isoDate: string) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function LineChartBox() {
  const { convertForDisplay } = useFx();
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);

  let data = baseData.map((p) => ({
    ...p,
    value: convertForDisplay(p.value, "EUR"),
  }));

  // Si on a des achats, on calcule l'évolution cumulée réelle
  if (rows && rows.length > 0) {
    const byDate: Record<string, number> = {};

    for (const r of rows) {
      const dateKey = r.dateAchat.slice(0, 10); // YYYY-MM-DD
      const value = convertForDisplay(r.prixAchat, r.deviseAchat);
      byDate[dateKey] = (byDate[dateKey] || 0) + value;
    }

    const sortedDates = Object.keys(byDate).sort();
    let cumulative = 0;

    data = sortedDates.map((d) => {
      cumulative += byDate[d];
      return {
        name: formatDateLabel(d),
        value: cumulative,
      };
    });
  }

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
          <Tooltip
            formatter={(v: any) =>
              Number(v).toLocaleString("fr-FR", {
                maximumFractionDigits: 0,
              })
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent2)"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
