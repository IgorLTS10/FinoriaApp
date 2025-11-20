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

// map metal type → code métal (FX)
const TYPE_TO_METAL_CODE: Record<
  "or" | "argent" | "platine" | "palladium",
  "XAU" | "XAG" | "XPT" | "XPD"
> = {
  or: "XAU",
  argent: "XAG",
  platine: "XPT",
  palladium: "XPD",
};

function normalizeWeightToGrams(poids: number, unite: "g" | "oz") {
  return unite === "oz" ? poids * 31.1035 : poids;
}

function formatDateLabel(isoDate: string) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function LineChartBox() {
  const { convertForDisplay, convert, displayCurrency } = useFx();
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);

  // Si aucune donnée → placeholder
  if (!rows || rows.length === 0) {
    return (
      <div className={styles.box}>
        <h3 className={styles.title}>Évolution du portefeuille</h3>
        <p style={{ opacity: 0.7 }}>Pas encore de données…</p>
      </div>
    );
  }

  // 1. Grouper par date d'achat
  const byDate: Record<
    string,
    { invested: number; current: number }
  > = {};

  for (const r of rows) {
    const dateKey = r.dateAchat.slice(0, 10);

    // montant investi ce jour-là
    const investedValue = convertForDisplay(r.prixAchat, r.deviseAchat);

    // valeur réelle spot
    const metalCode = TYPE_TO_METAL_CODE[r.type];
    const pricePerOunce = convert(1, metalCode, displayCurrency);
    const pricePerGram = pricePerOunce / 31.1035;
    const weightG = normalizeWeightToGrams(r.poids, r.unite);
    const currentValue = weightG * pricePerGram;

    if (!byDate[dateKey]) {
      byDate[dateKey] = { invested: 0, current: 0 };
    }

    byDate[dateKey].invested += investedValue;
    byDate[dateKey].current += currentValue;
  }

  // 2. Générer la timeline cumulée
  const sortedDates = Object.keys(byDate).sort();

  let cumInvested = 0;
  let cumCurrent = 0;

  const data = sortedDates.map((d) => {
    cumInvested += byDate[d].invested;
    cumCurrent += byDate[d].current;

    return {
      name: formatDateLabel(d),
      invested: Math.round(cumInvested),
      current: Math.round(cumCurrent),
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
          <Tooltip />
          <Legend />

          {/* Ligne investissement */}
          <Line
            type="monotone"
            dataKey="invested"
            name="Investi"
            stroke="#38bdf8" // bleu
            strokeWidth={3}
          />

          {/* Ligne valeur réelle */}
          <Line
            type="monotone"
            dataKey="current"
            name="Valeur réelle"
            stroke="#10b981" // vert
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
