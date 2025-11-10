import { motion } from "framer-motion";
import { MOCK_POSITIONS } from "../data/mock";

export default function PortfolioPreview() {
  return (
    <div className="section">
      <div className="section-title">Aperçu du portefeuille (mock)</div>

      <div className="portfolio-list">
        {MOCK_POSITIONS.map((p, idx) => (
          <motion.div
            key={p.symbol}
            className="position-card"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.06 }}
          >
            <div className="position-head">
              <span className="badge">{p.symbol}</span>
              <span className={`pct ${p.pnlPct >= 0 ? "up" : "down"}`}>
                {p.pnlPct >= 0 ? "+" : ""}
                {p.pnlPct.toFixed(2)}%
              </span>
            </div>
            <div className="position-row">
              <span>Quantité</span>
              <span>{p.qty}</span>
            </div>
            <div className="position-row">
              <span>Prix moyen</span>
              <span>{p.avgPrice.toLocaleString()} €</span>
            </div>
            <div className="position-row">
              <span>Valeur</span>
              <span>{(p.qty * p.last).toLocaleString()} €</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
