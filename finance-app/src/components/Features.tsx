import { motion } from "framer-motion";

const feats = [
  {
    icon: "🥇",
    t: "Métaux précieux",
    d: "Suivez vos investissements en or, argent, platine et palladium avec des prix en temps réel.",
  },
  {
    icon: "₿",
    t: "Cryptomonnaies",
    d: "Gérez votre portefeuille crypto avec des données de marché actualisées quotidiennement.",
  },
  {
    icon: "📈",
    t: "Actions & ETF",
    d: "Centralisez vos positions boursières et suivez leur évolution avec des graphiques détaillés.",
  },
  {
    icon: "🏢",
    t: "Crowdfunding immobilier",
    d: "Suivez vos projets de crowdfunding, dividendes et performances par plateforme.",
  },
  {
    icon: "💱",
    t: "Multi-devises",
    d: "Visualisez votre patrimoine en EUR, USD, PLN ou toute autre devise avec conversion automatique.",
  },
  {
    icon: "📊",
    t: "Graphiques interactifs",
    d: "Analysez l'évolution de votre portefeuille avec des visualisations claires et personnalisables.",
  },
];

export default function Features() {
  return (
    <div className="section">
      <motion.div
        className="section-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Tout ce dont vous avez besoin pour gérer vos investissements
      </motion.div>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Une plateforme complète pour suivre et analyser tous vos actifs
      </motion.p>
      <div className="features-grid">
        {feats.map((f, i) => (
          <motion.article
            key={f.t}
            className="feature-card"
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 120 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <div className="feature-ico">{f.icon}</div>
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
