import { motion } from "framer-motion";
import { useAuthModal } from "../state/authModal";

export default function Hero() {
  const { open } = useAuthModal();

  const handleGetStarted = () => {
    open("signUp");
  };

  const handleViewFeatures = () => {
    const el = document.getElementById("features");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="hero-wrap">
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7 }}
      >
        Suivez <span className="glow">tous vos investissements</span> en un seul endroit
      </motion.h1>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        Métaux précieux, cryptomonnaies, actions, crowdfunding immobilier —
        Finoria centralise votre patrimoine et vous aide à prendre de meilleures décisions d'investissement.
      </motion.p>

      <motion.div
        className="hero-buttons"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button className="btn btn-primary" onClick={handleGetStarted}>
          Commencer gratuitement
        </button>
        <button className="btn btn-ghost" onClick={handleViewFeatures}>
          Découvrir les fonctionnalités
        </button>
      </motion.div>

      <motion.div
        className="hero-preview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        {/* Aperçu du graphique avec données factices */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Évolution du portefeuille</span>
            <span className="chart-value">+24.5%</span>
          </div>

          {/* SVG Chart avec courbe factice */}
          <svg
            viewBox="0 0 800 240"
            style={{
              width: '100%',
              height: 'calc(100% - 40px)',
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Grille de fond */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(106, 227, 255, 0.3)" />
                <stop offset="100%" stopColor="rgba(106, 227, 255, 0.05)" />
              </linearGradient>
            </defs>

            {/* Lignes de grille horizontales */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`h-${i}`}
                x1="40"
                y1={40 + i * 40}
                x2="760"
                y2={40 + i * 40}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            ))}

            {/* Lignes de grille verticales */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line
                key={`v-${i}`}
                x1={40 + i * 120}
                y1="40"
                x2={40 + i * 120}
                y2="200"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            ))}

            {/* Courbe de croissance factice */}
            <motion.path
              d="M 40,160 Q 160,140 280,120 T 520,80 T 760,60"
              fill="none"
              stroke="url(#chartGradient)"
              strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.8 }}
            />

            {/* Ligne principale */}
            <motion.path
              d="M 40,160 Q 160,140 280,120 T 520,80 T 760,60"
              fill="none"
              stroke="#6ae3ff"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.8 }}
            />

            {/* Points de données */}
            {[
              { x: 40, y: 160 },
              { x: 160, y: 140 },
              { x: 280, y: 120 },
              { x: 400, y: 100 },
              { x: 520, y: 80 },
              { x: 640, y: 70 },
              { x: 760, y: 60 },
            ].map((point, i) => (
              <motion.circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#6ae3ff"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
              />
            ))}
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

