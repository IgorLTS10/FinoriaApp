import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './AllocationChart.module.css';

interface AllocationData {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

interface AllocationChartProps {
    data: AllocationData[];
}

// Modern gradient color palette
const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Green
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className={styles.tooltip}>
                <div className={styles.tooltipHeader}>
                    <div
                        className={styles.tooltipColor}
                        style={{ backgroundColor: data.color }}
                    />
                    <div className={styles.tooltipName}>{data.name}</div>
                </div>
                <div className={styles.tooltipValue}>
                    {data.value.toFixed(2)} €
                </div>
                <div className={styles.tooltipPercentage}>
                    {data.percentage.toFixed(1)}% du portfolio
                </div>
            </div>
        );
    }
    return null;
};

export default function AllocationChart({ data }: AllocationChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={styles.emptyState}>
                Aucune donnée de répartition disponible
            </div>
        );
    }

    // Add colors to data
    const chartData = data.map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length],
    }));

    return (
        <div className={styles.container}>
            <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                    <defs>
                        {chartData.map((entry, index) => (
                            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                            </linearGradient>
                        ))}
                    </defs>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={140}
                        innerRadius={85}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1000}
                        animationBegin={0}
                        paddingAngle={2}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#gradient-${index})`}
                                stroke="rgba(0,0,0,0.3)"
                                strokeWidth={2}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className={styles.customLegend}>
                {chartData.map((entry, index) => (
                    <div key={`legend-${index}`} className={styles.legendItem}>
                        <div
                            className={styles.legendColor}
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className={styles.legendText}>
                            {entry.name} <span className={styles.legendPercent}>({entry.percentage.toFixed(1)}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
