import { motion } from "framer-motion";

const feats = [
  {
    t: "Stratégies",
    d: "Backtests rapides, rééquilibrage, DCA, alertes de drawdown.",
  },
  {
    t: "Visualisations",
    d: "Charts haute fidélité, heatmaps de performance, corrélations.",
  },
  {
    t: "Ouverture",
    d: "API publique, import CSV/Excel, export JSON, webhooks.",
  },
  {
    t: "Sécurité",
    d: "Chiffrement local, rôles, journaux d’audit (bientôt).",
  },
];

export default function Features() {
  return (
    <div className="section">
      <div className="section-title">Fonctionnalités clés</div>
      <div className="features-grid">
        {feats.map((f, i) => (
          <motion.article
            key={f.t}
            className="feature-card"
            initial={{ scale: 0.96, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 120 }}
          >
            <div className="feature-ico" aria-hidden />
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
