import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignIn, SignUp } from "@stackframe/react";
import { useAuthModal } from "../../state/authModal";
import SocialButtons from "./SocialButtons";
import styles from "./AuthModal.module.css";

export default function AuthModal({
  mode,
  onClose,
}: {
  mode: "signIn" | "signUp" | null;
  onClose: () => void;
}) {
  const { open } = useAuthModal();
  const modalRef = useRef<HTMLDivElement>(null);

  // Échap -> fermer
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // Clic extérieur -> fermer
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  // Cleanup UI interne (masque TOUT bouton non-submit, y compris l'œil,
  // et le texte "Ou continuer avec")
  useEffect(() => {
    if (!modalRef.current) return;
    const root = modalRef.current.querySelector(`.${styles.stackSurface}`) as HTMLElement | null;
    if (!root) return;

    const clean = () => {
      // 1) Masquer tous les boutons non-submit
      root.querySelectorAll<HTMLButtonElement>("button:not([type='submit'])").forEach((btn) => {
        btn.style.display = "none";
        const parent = btn.parentElement as HTMLElement | null;
        if (parent && parent.children.length === 1) parent.style.display = "none";
      });

      // 2) Masquer le libellé "Ou continuer avec"
      root.querySelectorAll<HTMLElement>("p, div, span").forEach((el) => {
        const txt = (el.textContent || "").trim().toLowerCase();
        if (txt === "ou continuer avec" || txt.startsWith("ou continuer avec")) {
          el.style.display = "none";
        }
      });
    };

    clean();
    const mo = new MutationObserver(() => clean());
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [mode]);

  return (
    <AnimatePresence>
      {mode && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className={styles.center}>
            <motion.div
              ref={modalRef}
              className={styles.authModal}
              role="dialog"
              aria-modal="true"
              initial={{ y: 14, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
            >
              <div className={styles.header}>
                <div className={styles.title}>
                  <span className={styles.dot} />
                  <h3>{mode === "signUp" ? "Créer un compte" : "Se connecter"}</h3>
                </div>

                <div className={styles.tabs}>
                  <button
                    className={`${styles.tab} ${mode === "signIn" ? styles.active : ""}`}
                    onClick={() => open("signIn")}
                  >
                    Connexion
                  </button>
                  <button
                    className={`${styles.tab} ${mode === "signUp" ? styles.active : ""}`}
                    onClick={() => open("signUp")}
                  >
                    Inscription
                  </button>
                </div>
              </div>

              <div className={styles.body}>
                {/* Boutons sociaux custom (les seuls visibles) */}
                <SocialButtons />

                {/* Composant Stack (email/password, submit, etc.) */}
                <div className={styles.stackSurface}>
                  {mode === "signIn" ? <SignIn fullPage={false} /> : <SignUp fullPage={false} />}
                </div>
              </div>

              <div className={styles.foot}>
                <span className={styles.tiny}>
                  Conseil : utilisez un mot de passe long (12+ caractères).
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
