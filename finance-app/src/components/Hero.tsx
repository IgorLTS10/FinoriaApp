import { motion } from "framer-motion";

export default function Hero() {
  return (
    <div className="hero-wrap">
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7 }}
      >
        Pilote tes <span className="glow">investissements</span> à la vitesse de la lumière
      </motion.h1>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        Un cockpit futuriste pour suivre ton portefeuille, simuler des stratégies et visualiser tes performances —
        le tout en multi-langue.
      </motion.p>

      <motion.div
        className="hero-buttons"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button className="btn btn-primary">Essayer la démo</button>
        <button className="btn btn-ghost">Voir les fonctionnalités</button>
      </motion.div>

      <div className="hero-preview">
        {/* Faux aperçu d’un “graph” stylisé */}
        <div className="chart-card">
          <div className="chart-lines">
            <span className="line l1" />
            <span className="line l2" />
            <span className="line l3" />
          </div>
          <div className="axis x" />
          <div className="axis y" />
        </div>
      </div>
    </div>
  );
}
