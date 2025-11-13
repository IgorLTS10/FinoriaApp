// src/pages/Dashboard/Metaux/components/PieChartBox.tsx
import styles from "./PieChartBox.module.css";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useUser } from "@stackframe/react";
import { useMetaux } from "../hooks/useMetaux";
import { useFx } from "../hooks/useFx";

type MetalType = "or" | "argent" | "platine" | "palladium";

const COLORS: Record<MetalType, string> = {
  or: "#f8d44c",
  argent: "#d1d1d1",
  platine: "#8bc3ff",
  palladium: "#ff9dbb",
};

const LABELS: Record<MetalType, string> = {
  or: "Or",
  argent: "Argent",
  platine: "Platine",
  palladium: "Palladium",
};

export default function PieChartBox() {
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);
  const { convertForDisplay } = useFx();

  // Si pas de données → placeholder comme avant
  if (!rows || rows.length === 0) {
    const placeholder = [
      { name: "Or", value: 60, color: COLORS.or },
      { name: "Argent", value: 25, color: COLORS.argent },
      { name: "Platine", value: 10, color: COLORS.platine },
      { name: "Palladium", value: 5, color: COLORS.palladium },
    ];

    return (
      <div className={styles.box}>
        <h3 className={styles.title}>Répartition des métaux</h3>

        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={placeholder}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {placeholder.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Répartition réelle par valeur investie (dans la devise affichée)
  const map: Record<MetalType, number> = {
    or: 0,
    argent: 0,
    platine: 0,
    palladium: 0,
  };

  for (const r of rows) {
    const type = r.type as MetalType;
    if (!(type in map)) continue;

    const value = convertForDisplay(r.prixAchat, r.deviseAchat);
    map[type] += value;
  }

  const data = (Object.keys(map) as MetalType[])
    .map((key) => ({
      name: LABELS[key],
      value: map[key],
      color: COLORS[key],
    }))
    .filter((d) => d.value > 0);

  const finalData =
    data.length > 0
      ? data
      : [
          { name: "Or", value: 60, color: COLORS.or },
          { name: "Argent", value: 25, color: COLORS.argent },
          { name: "Platine", value: 10, color: COLORS.platine },
          { name: "Palladium", value: 5, color: COLORS.palladium },
        ];

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>Répartition des métaux</h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={finalData}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {finalData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
