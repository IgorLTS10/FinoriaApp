import { motion } from "framer-motion";
import { useAuthModal } from "../state/authModal";

export default function CTA() {
  const { open } = useAuthModal();

  return (
    <div className="section cta-card">
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        Prêt à gérer vos investissements intelligemment ?
      </motion.h2>
      <p>
        Créez un compte gratuitement et commencez à suivre tous vos actifs en un seul endroit.
        Métaux, crypto, actions, crowdfunding — tout votre patrimoine centralisé.
      </p>
      <div className="cta-actions">
        <button className="btn btn-primary" onClick={() => open("signUp")}>
          Créer un compte
        </button>
        <button className="btn btn-ghost" onClick={() => open("signIn")}>
          Se connecter
        </button>
      </div>
    </div>
  );
}
