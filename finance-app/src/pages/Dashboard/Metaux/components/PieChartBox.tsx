import styles from "./PieChartBox.module.css";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Or", value: 60, color: "#f8d44c" },
  { name: "Argent", value: 25, color: "#d1d1d1" },
  { name: "Platine", value: 10, color: "#8bc3ff" },
  { name: "Palladium", value: 5, color: "#ff9dbb" },
];

export default function PieChartBox() {
  return (
    <div className={styles.box}>
      <h3 className={styles.title}>Répartition des métaux</h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
