import { motion } from "framer-motion";

const items = [
  { label: "Rendement simulé (YTD)", value: "+12.8%" },
  { label: "Latence moyenne UI", value: "18 ms" },
  { label: "Marchés supportés", value: "Crypto, Actions, ETF" },
  { label: "Langues", value: "FR / EN / PL" },
];

export default function Stats() {
  return (
    <div className="section">
      <div className="section-title">Indicateurs en temps réel (exemple)</div>
      <div className="stats-grid">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            className="stat-card"
            initial={{ y: 14, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <div className="stat-value">{it.value}</div>
            <div className="stat-label">{it.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
