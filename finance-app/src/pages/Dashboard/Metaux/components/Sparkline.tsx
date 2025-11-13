import { ResponsiveContainer, LineChart, Line } from "recharts";

const data = [
  { v: 9000 },
  { v: 10050 },
  { v: 11200 },
  { v: 11800 },
  { v: 12450 },
];

export default function Sparkline() {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke="var(--accent2)"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
