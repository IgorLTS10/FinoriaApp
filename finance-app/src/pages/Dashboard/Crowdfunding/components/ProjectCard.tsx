import styles from "./ProjectCard.module.css";
import type { CrowdfundingProject } from "../hooks/useCrowdfunding";

type Props = {
    project: CrowdfundingProject;
    onAddTransaction: () => void;
};

export default function ProjectCard({ project, onAddTransaction }: Props) {
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
    } = project;

    // Calculs
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + durationMonths);

    const now = new Date();
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    const remainingMonths = Math.max(0, durationMonths - Math.floor(elapsed / (1000 * 60 * 60 * 24 * 30)));

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.platformBadge}>{platform}</div>
                <div className={`${styles.statusBadge} ${styles[status]}`}>
                    {status === "active" ? "En cours" : "Terminé"}
                </div>
            </div>

            <div className={styles.content}>
                {imageUrl && <img src={imageUrl} alt={name} className={styles.image} />}
                <h3 className={styles.name}>{name}</h3>

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
                        <span>Progression ({Math.round(progress)}%)</span>
                        <span>Reste {remainingMonths} mois</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button onClick={onAddTransaction} className={styles.addButton}>
                    + Transaction
                </button>
            </div>
        </div>
    );
}
