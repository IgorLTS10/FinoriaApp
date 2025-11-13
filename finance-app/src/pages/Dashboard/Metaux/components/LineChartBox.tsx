import styles from "./LineChartBox.module.css";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, YAxis, CartesianGrid } from "recharts";
import { useFx } from "../hooks/useFx";

const baseData = [
  { name: "Jan", value: 9000 },
  { name: "Fév", value: 10050 },
  { name: "Mar", value: 11200 },
  { name: "Avr", value: 11800 },
  { name: "Mai", value: 12450 },
];

export default function LineChartBox() {
  const { convertForDisplay } = useFx();
  const data = baseData.map((p) => ({
    ...p,
    value: convertForDisplay(p.value, "EUR"),
  }));

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>Évolution du portefeuille</h3>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
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
