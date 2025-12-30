// src/components/dashboard/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { stackClientApp } from "../../auth/stack"; // garde si tu as ce fichier

export default function Sidebar() {
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      const maybe = stackClientApp as unknown as { signOut?: () => Promise<void> | void };
      if (maybe && typeof maybe.signOut === "function") {
        await maybe.signOut();
      }
    } catch {
      // noop
    } finally {
      try {
        document.cookie = "user-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
        localStorage.removeItem("stack-session");
        sessionStorage.clear();
      } catch {
        /* noop */
      }
      navigate("/?signedOut=1", { replace: true });
      setTimeout(() => window.location.reload(), 0);
    }
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.brand} onClick={() => navigate("/")}>
        <div className={styles.logoDot} /> Finoria
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Général</div>
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Aperçu
          <span className={styles.statusDot} data-status="red"></span>
        </NavLink>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Investissements</div>
        <NavLink
          to="/dashboard/metaux"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Métaux
          <span className={styles.statusDot} data-status="green"></span>
        </NavLink>
        <NavLink
          to="/dashboard/crowdfunding"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Crowdfunding
          <span className={styles.statusDot} data-status="green"></span>
        </NavLink>
        <NavLink
          to="/dashboard/actions"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Actions
          <span className={styles.statusDot} data-status="orange"></span>
        </NavLink>
        <NavLink
          to="/dashboard/etf"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          ETF
          <span className={styles.statusDot} data-status="red"></span>
        </NavLink>
        <NavLink
          to="/dashboard/crypto"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Crypto
          <span className={styles.statusDot} data-status="orange"></span>
        </NavLink>
        <NavLink
          to="/dashboard/immobilier"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Immobilier (SCPI)
          <span className={styles.statusDot} data-status="red"></span>
        </NavLink>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Outils</div>
        <NavLink
          to="/dashboard/outils/interets-composes"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Calculatrice d'intérêts
          <span className={styles.statusDot} data-status="green"></span>
        </NavLink>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Système</div>

        {/* ✅ Nouveau lien Roadmap */}
        <NavLink
          to="/dashboard/roadmap"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Roadmap
          <span className={styles.statusDot} data-status="green"></span>
        </NavLink>

        <NavLink
          to="/dashboard/parametres"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          Paramètres
          <span className={styles.statusDot} data-status="orange"></span>
        </NavLink>

        {/* Déconnexion (rouge) */}
        <button className={`${styles.item} ${styles.danger}`} onClick={handleSignOut}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
