import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './AllocationChart.module.css';

interface AllocationData {
    name: string;
    value: number;
    percentage: number;
    color: string;
    logoUrl?: string | null;
}

interface AllocationChartProps {
    data: AllocationData[];
}

// Couleurs spécifiques par crypto (couleurs officielles)
const CRYPTO_COLORS: Record<string, string> = {
    'BTC': '#F7931A',     // Bitcoin orange
    'ETH': '#627EEA',     // Ethereum bleu
    'USDT': '#26A17B',    // Tether vert
    'BNB': '#F3BA2F',     // Binance jaune
    'SOL': '#14F195',     // Solana vert/cyan
    'XRP': '#23292F',     // Ripple noir/gris
    'ADA': '#0033AD',     // Cardano bleu
    'DOGE': '#C2A633',    // Dogecoin jaune/or
    'DOT': '#E6007A',     // Polkadot rose
    'MATIC': '#8247E5',   // Polygon violet
    'POL': '#8247E5',     // Polygon violet (nouveau symbole)
    'SHIB': '#FFA409',    // Shiba orange
    'AVAX': '#E84142',    // Avalanche rouge
    'LINK': '#2A5ADA',    // Chainlink bleu
    'UNI': '#FF007A',     // Uniswap rose
    'ATOM': '#2E3148',    // Cosmos gris foncé
};

// Couleurs de fallback si crypto inconnue
const FALLBACK_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#06b6d4', '#f97316', '#6366f1',
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className={styles.tooltip}>
                <div className={styles.tooltipHeader}>
                    {data.logoUrl && (
                        <img src={data.logoUrl} alt={data.name} className={styles.tooltipLogo} />
                    )}
                    <div
                        className={styles.tooltipColor}
                        style={{ backgroundColor: data.color }}
                    />
                    <div className={styles.tooltipName}>{data.name}</div>
                </div>
                <div className={styles.tooltipValue}>
                    {data.value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </div>
                <div className={styles.tooltipPercentage}>
                    {data.percentage.toFixed(1)}% du portfolio
                </div>
            </div>
        );
    }
    return null;
};

// Fonction pour afficher le logo dans le pie chart
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
    // Afficher le logo seulement si la section fait plus de 10%
    if ((percent * 100) < 10 || !payload.logoUrl) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <image
            x={x - 15}
            y={y - 15}
            width={30}
            height={30}
            xlinkHref={payload.logoUrl}
            style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                borderRadius: '50%'
            }}
        />
    );
};

export default function AllocationChart({ data }: AllocationChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={styles.emptyState}>
                Aucune donnée de répartition disponible
            </div>
        );
    }

    // Assigner les couleurs spécifiques aux cryptos
    const chartData = data.map((item, index) => ({
        ...item,
        color: CRYPTO_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
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
                        label={renderCustomLabel}
                        outerRadius={140}
                        innerRadius={85}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1000}
                        animationBegin={0}
                        paddingAngle={2}
                    >
                        {chartData.map((_, index) => (
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
                        {entry.logoUrl && (
                            <img src={entry.logoUrl} alt={entry.name} className={styles.legendLogo} />
                        )}
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
