import styles from "./ProjectCard.module.css";
import type { CrowdfundingProject } from "../hooks/useCrowdfunding";

type Props = {
    project: CrowdfundingProject;
    onAddTransaction: () => void;
    onViewDetails: () => void;
};

export default function ProjectCard({ project, onAddTransaction, onViewDetails }: Props) {
    const {
        name,
        platform,
        amountInvested,
        yieldPercent,
        startDate,
        durationMonths,
        received,
        refunded,
        status,
        imageUrl,
        transactions,
    } = project;

    // Calculs temporels
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + durationMonths);

    const now = new Date();
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    const remainingMonths = Math.max(0, durationMonths - Math.floor(elapsed / (1000 * 60 * 60 * 24 * 30)));

    // Calcul progression des dividendes
    const totalExpected = amountInvested * (yieldPercent / 100) * (durationMonths / 12);
    const dividendProgress = totalExpected > 0 ? Math.min(100, (received / totalExpected) * 100) : 0;
    const remainingDividends = Math.max(0, totalExpected - received);

    // Vérifier si un dividende a été reçu ce mois
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const hasDividendThisMonth = transactions.some((t) => {
        if (t.type !== "dividend") return false;
        const txDate = new Date(t.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const needsAlert = status === "active" && !hasDividendThisMonth;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.platformBadge}>{platform}</div>
                <div className={styles.badges}>
                    {needsAlert && (
                        <div className={styles.alertBadge} title="Aucun dividende reçu ce mois">
                            ⚠️
                        </div>
                    )}
                    <div className={`${styles.statusBadge} ${styles[status]}`}>
                        {status === "active" ? "En cours" : "Terminé"}
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {imageUrl && <img src={imageUrl} alt={name} className={styles.image} />}
                <h3 className={styles.name}>{name}</h3>
                <div className={styles.dateInfo}>
                    Début: {new Date(startDate).toLocaleDateString("fr-FR")}
                </div>

                <div className={styles.grid}>
                    <div className={styles.item}>
                        <span className={styles.label}>Investi</span>
                        <span className={styles.value}>{amountInvested.toLocaleString("fr-FR")} €</span>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.label}>Rendement</span>
                        <span className={styles.value}>{yieldPercent}%</span>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.label}>Reçu (Div.)</span>
                        <span className={`${styles.value} ${styles.green}`}>
                            +{received.toLocaleString("fr-FR")} €
                        </span>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.label}>Remboursé</span>
                        <span className={styles.value}>{refunded.toLocaleString("fr-FR")} €</span>
                    </div>
                </div>

                <div className={styles.progressSection}>
                    <div className={styles.progressLabels}>
                        <span>Temps ({Math.round(timeProgress)}%)</span>
                        <span>Reste {remainingMonths} mois</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${timeProgress}%` }} />
                    </div>
                </div>

                <div className={styles.progressSection}>
                    <div className={styles.progressLabels}>
                        <span>Dividendes ({Math.round(dividendProgress)}%)</span>
                        <span>Reste {remainingDividends.toFixed(0)} €</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={`${styles.progressFill} ${styles.green}`} style={{ width: `${dividendProgress}%` }} />
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button onClick={onViewDetails} className={styles.detailsButton}>
                    Détails
                </button>
                <button onClick={onAddTransaction} className={styles.addButton}>
                    + Transaction
                </button>
            </div>
        </div>
    );
}
