import { useState } from "react";
import { useUser } from "@stackframe/react";
import styles from "./Crowdfunding.module.css";
import { useCrowdfunding } from "./hooks/useCrowdfunding";
import ProjectCard from "./components/ProjectCard";
import AddProjectModal from "./components/AddProjectModal";
import TransactionsModal from "./components/TransactionsModal";

export default function Crowdfunding() {
    const user = useUser();
    const userId = (user as any)?.id as string | undefined;

    const { projects, loading, error, addProject, addTransaction } = useCrowdfunding(userId);

    const [addProjectOpen, setAddProjectOpen] = useState(false);
    const [transactionModal, setTransactionModal] = useState<{ open: boolean; projectId: string; projectName: string } | null>(null);

    // Calculs globaux
    const totalInvested = (projects || []).reduce((sum, p) => sum + p.amountInvested, 0);
    const totalReceived = (projects || []).reduce((sum, p) => sum + p.received, 0);
    const totalRefunded = (projects || []).reduce((sum, p) => sum + p.refunded, 0);
    const activeProjects = (projects || []).filter(p => p.status === "active").length;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Crowdfunding</h1>
                    <p className={styles.subtitle}>Gérez vos investissements participatifs</p>
                </div>
                <button className={styles.addButton} onClick={() => setAddProjectOpen(true)}>
                    + Nouveau projet
                </button>
            </div>

            {/* KPIs */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total Investi</div>
                    <div className={styles.kpiValue}>{totalInvested.toLocaleString("fr-FR")} €</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total Reçu (Intérêts)</div>
                    <div className={`${styles.kpiValue} ${styles.green}`}>+{totalReceived.toLocaleString("fr-FR")} €</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total Remboursé</div>
                    <div className={styles.kpiValue}>{totalRefunded.toLocaleString("fr-FR")} €</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Projets Actifs</div>
                    <div className={styles.kpiValue}>{activeProjects}</div>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {loading && (!projects || projects.length === 0) ? (
                <div className={styles.loading}>Chargement...</div>
            ) : (
                <div className={styles.grid}>
                    {(projects || []).map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onAddTransaction={() => setTransactionModal({ open: true, projectId: project.id, projectName: project.name })}
                        />
                    ))}

                    {(!projects || projects.length === 0) && !loading && (
                        <div className={styles.emptyState}>
                            <p>Aucun projet pour le moment.</p>
                            <button onClick={() => setAddProjectOpen(true)}>Commencer</button>
                        </div>
                    )}
                </div>
            )}

            {userId && (
                <AddProjectModal
                    open={addProjectOpen}
                    onClose={() => setAddProjectOpen(false)}
                    onSubmit={addProject}
                    userId={userId}
                />
            )}

            {transactionModal && (
                <TransactionsModal
                    open={transactionModal.open}
                    onClose={() => setTransactionModal(null)}
                    onSubmit={addTransaction}
                    projectId={transactionModal.projectId}
                    projectName={transactionModal.projectName}
                />
            )}
        </div>
    );
}
