// src/components/dashboard/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { stackClientApp } from "../../auth/stack"; // garde si tu as ce fichier

export default function Sidebar() {
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      // Tentative douce : si une méthode de signOut existe côté runtime, on l’appelle.
      const maybe = stackClientApp as unknown as { signOut?: () => Promise<void> | void };
      if (maybe && typeof maybe.signOut === "function") {
        await maybe.signOut();
      }
    } catch {
      // noop
    } finally {
      // Fallback universel : purge locale et reload
      try {
        // nettoie un éventuel cookie custom
        document.cookie = "user-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
        // nettoie éventuels tokens locaux (si tu en stockes)
        localStorage.removeItem("stack-session");
        sessionStorage.clear();
      } catch {
        /* noop */
      }
      navigate("/?signedOut=1", { replace: true });
      // force un reload pour que le provider Stack recalcule l’état
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
        </NavLink>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Investissements</div>
        <NavLink to="/dashboard/metaux" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>Métaux</NavLink>
        <NavLink to="/dashboard/crowdfunding" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>Crowdfunding</NavLink>
        <NavLink to="/dashboard/actions" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>Actions</NavLink>
        <NavLink to="/dashboard/etf" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>ETF</NavLink>
        <NavLink to="/dashboard/crypto" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>Crypto</NavLink>
        <NavLink to="/dashboard/immobilier" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>Immobilier (SCPI)</NavLink>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Système</div>
        <NavLink to="/dashboard/parametres" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>Paramètres</NavLink>

        {/* Déconnexion (rouge) */}
        <button className={`${styles.item} ${styles.danger}`} onClick={handleSignOut}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
