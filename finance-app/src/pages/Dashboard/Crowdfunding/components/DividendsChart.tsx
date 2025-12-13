import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Séparer les dividendes et l'investissement
    const invested = payload.find((p: any) => p.dataKey === "invested");
    const dividends = payload.filter((p: any) => p.dataKey !== "invested");

    // Calculer le total des dividendes
    const totalDividends = dividends.reduce((sum: number, p: any) => sum + (p.value || 0), 0);

    return (
        <div style={{
            background: "linear-gradient(135deg, #1a1d24 0%, #252932 100%)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            minWidth: "200px",
        }}>
            {/* Période */}
            <div style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}>
                {label}
            </div>

            {/* Investissement */}
            {invested && invested.value > 0 && (
                <div style={{
                    marginBottom: "12px",
                    padding: "8px",
                    background: "rgba(251, 191, 36, 0.1)",
                    borderRadius: "6px",
                    borderLeft: "3px solid #fbbf24",
                }}>
                    <div style={{ fontSize: "0.75rem", color: "#fbbf24", marginBottom: "4px" }}>
                        💰 Investi
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fbbf24" }}>
                        {invested.value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </div>
                </div>
            )}

            {/* Dividendes */}
            {dividends.length > 0 && (
                <div style={{
                    padding: "8px",
                    background: "rgba(59, 130, 246, 0.05)",
                    borderRadius: "6px",
                    borderLeft: "3px solid #3b82f6",
                }}>
                    <div style={{ fontSize: "0.75rem", color: "#60a5fa", marginBottom: "6px" }}>
                        📊 Dividendes reçus
                    </div>

                    {/* Total */}
                    <div style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#34d399",
                        marginBottom: "8px",
                    }}>
                        {totalDividends.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </div>

                    {/* Détail par plateforme */}
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "4px" }}>
                        Par plateforme :
                    </div>
                    {dividends.map((entry: any, index: number) => (
                        <div key={index} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                            fontSize: "0.8rem",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: entry.fill || entry.color,
                                }} />
                                <span style={{ color: "#d1d5db" }}>{entry.name}</span>
                            </div>
                            <span style={{ color: "#fff", fontWeight: 600 }}>
                                {entry.value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function DividendsChart({ projects, period }: Props) {
    // Grouper les dividendes par période et par plateforme
    const dividendsByPeriod: Record<string, Record<string, number>> = {};
    // Grouper les investissements par période
    const investmentsByPeriod: Record<string, number> = {};

    projects.forEach((project) => {
        // Traiter les dividendes
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

        // Traiter les investissements (date de début du projet)
        const startDate = new Date(project.startDate);
        const periodKey = getPeriodKey(startDate, period);

        if (!investmentsByPeriod[periodKey]) {
            investmentsByPeriod[periodKey] = 0;
        }
        investmentsByPeriod[periodKey] += project.amountInvested;
    });

    // Obtenir toutes les périodes (union des dividendes et investissements)
    const allPeriods = new Set([
        ...Object.keys(dividendsByPeriod),
        ...Object.keys(investmentsByPeriod)
    ]);

    // Convertir en format pour Recharts
    const chartData = Array.from(allPeriods)
        .sort((a, b) => a.localeCompare(b))
        .map((periodKey) => {
            return {
                period: formatPeriodLabel(periodKey, period),
                invested: investmentsByPeriod[periodKey] || 0,
                ...(dividendsByPeriod[periodKey] || {}),
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
            <h3 className={styles.title}>Dividendes et investissements par {period === "month" ? "mois" : period === "quarter" ? "trimestre" : "année"}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="period"
                        stroke="#a0a0a0"
                        style={{ fontSize: "0.85rem" }}
                    />
                    {/* Axe Y gauche pour les dividendes */}
                    <YAxis
                        yAxisId="left"
                        stroke="#a0a0a0"
                        style={{ fontSize: "0.85rem" }}
                        tickFormatter={(value) => `${value}€`}
                        label={{ value: 'Dividendes', angle: -90, position: 'insideLeft', style: { fill: '#a0a0a0' } }}
                    />
                    {/* Axe Y droit pour les investissements */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#fbbf24"
                        style={{ fontSize: "0.85rem" }}
                        tickFormatter={(value) => `${value}€`}
                        label={{ value: 'Investi', angle: 90, position: 'insideRight', style: { fill: '#fbbf24' } }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="circle"
                    />
                    {/* Barres empilées pour les dividendes par plateforme */}
                    {allPlatforms.map((platform, index) => (
                        <Bar
                            key={platform}
                            dataKey={platform}
                            stackId="a"
                            fill={getColorForPlatform(platform)}
                            radius={index === 0 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            name={platform}
                            yAxisId="left"
                        />
                    ))}
                    {/* Courbe pour les investissements */}
                    <Line
                        type="monotone"
                        dataKey="invested"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        dot={{ fill: "#fbbf24", r: 4 }}
                        name="Investi"
                        yAxisId="right"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
