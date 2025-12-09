import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { CrowdfundingProject } from "../hooks/useCrowdfunding";
import styles from "./DividendsChart.module.css";

type Props = {
    projects: CrowdfundingProject[];
};

// Couleurs par plateforme
const PLATFORM_COLORS: Record<string, string> = {
    "Bricks": "#3b82f6",
    "Bienpreter": "#8b5cf6",
    "Anaxago": "#10b981",
    "Fundimmo": "#f59e0b",
    "Homunity": "#ef4444",
    "Raizers": "#ec4899",
};

const getColorForPlatform = (platform: string): string => {
    return PLATFORM_COLORS[platform] || "#6b7280";
};

export default function DividendsChart({ projects }: Props) {
    // Grouper les dividendes par mois et par plateforme
    const dividendsByMonth: Record<string, Record<string, number>> = {};

    projects.forEach((project) => {
        project.transactions
            .filter((t) => t.type === "dividend")
            .forEach((tx) => {
                const date = new Date(tx.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

                if (!dividendsByMonth[monthKey]) {
                    dividendsByMonth[monthKey] = {};
                }

                if (!dividendsByMonth[monthKey][project.platform]) {
                    dividendsByMonth[monthKey][project.platform] = 0;
                }

                dividendsByMonth[monthKey][project.platform] += tx.amount;
            });
    });

    // Convertir en format pour Recharts
    const chartData = Object.entries(dividendsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, platforms]) => {
            const monthDate = new Date(month + "-01");
            return {
                month: monthDate.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
                ...platforms,
            };
        });

    // Obtenir toutes les plateformes uniques
    const allPlatforms = Array.from(
        new Set(projects.map((p) => p.platform))
    );

    if (chartData.length === 0) {
        return (
            <div className={styles.empty}>
                <p>Aucune donnée de dividendes à afficher</p>
            </div>
        );
    }

    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.title}>Dividendes par mois et plateforme</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="month"
                        stroke="#a0a0a0"
                        style={{ fontSize: "0.85rem" }}
                    />
                    <YAxis
                        stroke="#a0a0a0"
                        style={{ fontSize: "0.85rem" }}
                        tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1a1d24",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}€`, ""]}
                        labelStyle={{ color: "#a0a0a0" }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="circle"
                    />
                    {allPlatforms.map((platform) => (
                        <Bar
                            key={platform}
                            dataKey={platform}
                            fill={getColorForPlatform(platform)}
                            radius={[4, 4, 0, 0]}
                            name={platform}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
