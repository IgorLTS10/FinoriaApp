import { useUser } from "@stackframe/react";
import { usePreferences } from "../../../state/PreferencesContext";
import styles from "./Settings.module.css";

export default function Settings() {
    const { currency, setCurrency, language, setLanguage } = usePreferences();
    const user = useUser();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Paramètres</h2>
                <p className={styles.subtitle}>Gérez vos préférences et votre compte</p>
            </div>

            <section className={styles.card}>
                <h3 className={styles.cardTitle}>Préférences</h3>

                <div className={styles.row}>
                    <label htmlFor="language-select" className={styles.label}>Langue de l'interface</label>
                    <div className={styles.selectWrapper}>
                        <select
                            id="language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className={styles.select}
                        >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="pl">Polski</option>
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    <label htmlFor="currency-select" className={styles.label}>Devise principale</label>
                    <div className={styles.selectWrapper}>
                        <select
                            id="currency-select"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as any)}
                            className={styles.select}
                        >
                            <option value="EUR">Euro (€)</option>
                            <option value="USD">Dollar ($)</option>
                            <option value="PLN">Złoty (zł)</option>
                        </select>
                    </div>
                </div>
            </section>

            {user && (
                <section className={styles.card}>
                    <h3 className={styles.cardTitle}>Mon Profil</h3>
                    <div className={styles.profileHeader}>
                        <div className={styles.avatar}>
                            {user.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt={user.displayName || "User"} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {(user.displayName || "U").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className={styles.profileInfo}>
                            <div className={styles.profileName}>{user.displayName || "Utilisateur sans nom"}</div>
                            <div className={styles.profileEmail}>{user.primaryEmail || "Aucun email"}</div>
                        </div>
                    </div>
                </section>
            )}

            {/* AccountSettings removed as per user request */}
        </div>
    );
}
