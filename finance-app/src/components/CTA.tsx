import { motion } from "framer-motion";

export default function CTA() {
  return (
    <div className="section cta-card">
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        Prêt à propulser ta gestion d’investissements ?
      </motion.h2>
      <p>
        Crée un compte ou connecte-toi pour sauvegarder tes portefeuilles, simuler des stratégies et retrouver tes
        données partout.
      </p>
      <div className="cta-actions">
        <button className="btn btn-primary">Créer un compte</button>
        <button className="btn btn-ghost">Se connecter</button>
      </div>
    </div>
  );
}
