import { LineChart, Line, ResponsiveContainer } from 'recharts';
import styles from './MiniChart.module.css';

interface MiniChartProps {
    data: number[];
    color?: string;
    height?: number;
}

export default function MiniChart({ data, color, height = 60 }: MiniChartProps) {
    if (!data || data.length === 0) {
        return <div className={styles.noData}>—</div>;
    }

    // Determine trend (positive or negative)
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const isPositive = lastValue >= firstValue;

    // Format data for Recharts
    const chartData = data.map((value, index) => ({
        index,
        value,
    }));

    // Auto color based on trend if not provided
    const lineColor = color || (isPositive ? '#10b981' : '#ef4444');

    return (
        <div className={styles.container} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={lineColor}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={800}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
