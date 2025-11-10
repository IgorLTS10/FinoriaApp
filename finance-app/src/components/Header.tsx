import { motion } from "framer-motion";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButtons from "./auth/AuthButtons";

export default function Header() {
  return (
    <motion.header
      className="header-glass"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="logo-mark">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0" stopColor="#6ae3ff" />
              <stop offset="1" stopColor="#b6e1ff" />
            </linearGradient>
          </defs>
          <path fill="url(#g)" d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z" />
        </svg>
        <span>Finoria</span>
      </div>

      <div className="header-actions">
        <LanguageSwitcher />
        <AuthButtons />
      </div>
    </motion.header>
  );
}
