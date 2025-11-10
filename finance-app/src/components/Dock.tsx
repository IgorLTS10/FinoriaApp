import { motion } from "framer-motion";

const items = [
  { id: "home", label: "Accueil" },
  { id: "stats", label: "Stats" },
  { id: "portfolio", label: "Portefeuille" },
  { id: "features", label: "Fonctions" },
  { id: "cta", label: "Go" },
];

export default function Dock() {
  const onNav = (id: string) =>
    window.dispatchEvent(new CustomEvent("finoria:navigate", { detail: { targetId: id } }));

  return (
    <motion.nav
      className="dock"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
    >
      {items.map((it) => (
        <button key={it.id} className="dock-btn" onClick={() => onNav(it.id)}>
          <span className="dot" />
          {it.label}
        </button>
      ))}
    </motion.nav>
  );
}
