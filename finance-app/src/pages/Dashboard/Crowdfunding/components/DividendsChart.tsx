import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { CrowdfundingProject } from "../hooks/useCrowdfunding";
import styles from "./DividendsChart.module.css";

type Props = {
    projects: CrowdfundingProject[];
    period: "month" | "quarter" | "year";
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

const getQuarter = (month: number): number => {
    return Math.floor(month / 3) + 1;
};

const getPeriodKey = (date: Date, period: "month" | "quarter" | "year"): string => {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (period === "year") {
        return `${year}`;
    } else if (period === "quarter") {
        const quarter = getQuarter(month);
        return `${year}-Q${quarter}`;
    } else {
        return `${year}-${String(month + 1).padStart(2, "0")}`;
    }
};

const formatPeriodLabel = (periodKey: string, period: "month" | "quarter" | "year"): string => {
    if (period === "year") {
        return periodKey;
    } else if (period === "quarter") {
        return periodKey;
    } else {
        const date = new Date(periodKey + "-01");
        return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
    }
};

export default function DividendsChart({ projects, period }: Props) {
    // Grouper les dividendes par période et par plateforme
    const dividendsByPeriod: Record<string, Record<string, number>> = {};

    projects.forEach((project) => {
        project.transactions
            .filter((t) => t.type === "dividend")
            .forEach((tx) => {
                const date = new Date(tx.date);
                const periodKey = getPeriodKey(date, period);

                if (!dividendsByPeriod[periodKey]) {
                    dividendsByPeriod[periodKey] = {};
                }

                if (!dividendsByPeriod[periodKey][project.platform]) {
                    dividendsByPeriod[periodKey][project.platform] = 0;
                }

                dividendsByPeriod[periodKey][project.platform] += tx.amount;
            });
    });

    // Convertir en format pour Recharts
    const chartData = Object.entries(dividendsByPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periodKey, platforms]) => {
            return {
                period: formatPeriodLabel(periodKey, period),
                ...platforms,
            };
        });

    // Obtenir toutes les plateformes uniques et les trier par montant total (décroissant)
    const platformTotals = projects.reduce((acc, p) => {
        const total = p.transactions
            .filter((t) => t.type === "dividend")
            .reduce((sum, t) => sum + t.amount, 0);
        acc[p.platform] = (acc[p.platform] || 0) + total;
        return acc;
    }, {} as Record<string, number>);

    const allPlatforms = Object.entries(platformTotals)
        .sort(([, a], [, b]) => b - a) // Trier par montant décroissant (plus gros en premier = en bas du stack)
        .map(([platform]) => platform);

    if (chartData.length === 0) {
        return (
            <div className={styles.empty}>
                <p>Aucune donnée de dividendes à afficher</p>
            </div>
        );
    }

    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.title}>Dividendes par {period === "month" ? "mois" : period === "quarter" ? "trimestre" : "année"} et plateforme</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="period"
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
                    {allPlatforms.map((platform, index) => (
                        <Bar
                            key={platform}
                            dataKey={platform}
                            stackId="a"
                            fill={getColorForPlatform(platform)}
                            radius={index === 0 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            name={platform}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
