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
  const { history } = usePortfolioHistory(userId);

  if (!rows || rows.length === 0) {
    return (
      <div className={styles.box}>
        <h3 className={styles.title}>Évolution du portefeuille</h3>
        <p style={{ opacity: 0.7 }}>Pas encore de données…</p>
      </div>
    );
  }

  // 1) Montants investis + valeur actuelle "as-if" par date d'achat
  const investDeltaByDate: Record<
    string,
    { invested: number; current: number }
  > = {};

  for (const r of rows) {
    const dateKey = r.dateAchat.slice(0, 10);

    const investedValue = convertForDisplay(r.prixAchat, r.deviseAchat);

    const metalCode = TYPE_TO_METAL_CODE[r.type];
    const pricePerOunce = convert(1, metalCode, displayCurrency);
    const pricePerGram = pricePerOunce / 31.1035;
    const weightG = normalizeWeightToGrams(r.poids, r.unite);
    const currentValue = weightG * pricePerGram;

    if (!investDeltaByDate[dateKey]) {
      investDeltaByDate[dateKey] = { invested: 0, current: 0 };
    }

    investDeltaByDate[dateKey].invested += investedValue;
    investDeltaByDate[dateKey].current += currentValue;
  }

  // 2) Série historique (valeur réelle par jour en EUR → convertie en displayCurrency)
  const historyByDate: Record<string, number> = {};
  for (const h of history) {
    const dateKey = h.date; // YYYY-MM-DD
    const valueDisplay = convert(h.valueEur, "EUR", displayCurrency);
    historyByDate[dateKey] = valueDisplay;
  }

  // 3) Union de toutes les dates (achats + historique)
  const allDatesSet = new Set<string>([
    ...Object.keys(investDeltaByDate),
    ...Object.keys(historyByDate),
  ]);
  const allDates = Array.from(allDatesSet).sort();

  // 4) Construire les séries cumulées
  let cumInvested = 0;
  let cumCurrent = 0;

  const data = allDates.map((d) => {
    const delta = investDeltaByDate[d];
    if (delta) {
      cumInvested += delta.invested;
      cumCurrent += delta.current;
    }

    const historyValue = historyByDate[d] ?? null;

    return {
      name: formatDateLabel(d),
      invested: Math.round(cumInvested),
      current: Math.round(cumCurrent),
      history: historyValue !== null ? Math.round(historyValue) : null,
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

          {/* Ligne investissement cumulé */}
          <Line
            type="monotone"
            dataKey="invested"
            name="Investi (cumulé)"
            stroke="#38bdf8"
            strokeWidth={3}
          />

          {/* Ligne valeur actuelle "as-if" (revalorisée au spot d'aujourd'hui) */}
          <Line
            type="monotone"
            dataKey="current"
            name="Valeur actuelle (spot du jour)"
            stroke="#10b981"
            strokeWidth={3}
          />

          {/* Ligne valeur historique réelle (avec prix des jours passés) */}
          <Line
            type="monotone"
            dataKey="history"
            name="Valeur historique (jour par jour)"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
