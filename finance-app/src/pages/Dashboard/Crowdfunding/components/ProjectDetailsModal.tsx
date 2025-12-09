import { useState } from "react";
import styles from "./ProjectDetailsModal.module.css";
import type { CrowdfundingProject, Transaction } from "../hooks/useCrowdfunding";

type Props = {
    open: boolean;
    onClose: () => void;
    project: CrowdfundingProject;
    userId: string;
    onUpdateProject: (id: string, userId: string, updates: any) => Promise<void>;
    onUpdateTransaction: (id: string, updates: any) => Promise<void>;
    onDeleteTransaction: (id: string) => Promise<void>;
    onAddTransaction: () => void;
};

export default function ProjectDetailsModal({
    open,
    onClose,
    project,
    userId,
    onUpdateProject,
    onUpdateTransaction,
    onDeleteTransaction,
    onAddTransaction,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: project.name,
        platform: project.platform,
        amountInvested: project.amountInvested,
        yieldPercent: project.yieldPercent,
        startDate: project.startDate,
        durationMonths: project.durationMonths,
    });
    const [editingTx, setEditingTx] = useState<string | null>(null);

    if (!open) return null;

    const handleSaveProject = async () => {
        try {
            await onUpdateProject(project.id, userId, editData);
            setEditing(false);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteTx = async (txId: string) => {
        if (!confirm("Supprimer cette transaction ?")) return;
        try {
            await onDeleteTransaction(txId);
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{project.name}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                <div className={styles.content}>
                    {/* Project Details */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3>Détails du projet</h3>
                            {!editing && (
                                <button onClick={() => setEditing(true)} className={styles.editBtn}>
                                    Modifier
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <div className={styles.form}>
                                <label>
                                    Nom
                                    <input
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    />
                                </label>
                                <label>
                                    Plateforme
                                    <input
                                        value={editData.platform}
                                        onChange={(e) => setEditData({ ...editData, platform: e.target.value })}
                                    />
                                </label>
                                <label>
                                    Montant investi (€)
                                    <input
                                        type="number"
                                        value={editData.amountInvested}
                                        onChange={(e) => setEditData({ ...editData, amountInvested: Number(e.target.value) })}
                                    />
                                </label>
                                <label>
                                    Rendement (%)
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editData.yieldPercent}
                                        onChange={(e) => setEditData({ ...editData, yieldPercent: Number(e.target.value) })}
                                    />
                                </label>
                                <label>
                                    Date de début
                                    <input
                                        type="date"
                                        value={editData.startDate}
                                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                    />
                                </label>
                                <label>
                                    Durée (mois)
                                    <input
                                        type="number"
                                        value={editData.durationMonths}
                                        onChange={(e) => setEditData({ ...editData, durationMonths: Number(e.target.value) })}
                                    />
                                </label>
                                <div className={styles.formActions}>
                                    <button onClick={() => setEditing(false)} className={styles.cancelBtn}>
                                        Annuler
                                    </button>
                                    <button onClick={handleSaveProject} className={styles.saveBtn}>
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.details}>
                                <div className={styles.detailRow}>
                                    <span>Plateforme:</span>
                                    <strong>{project.platform}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Montant investi:</span>
                                    <strong>{project.amountInvested.toLocaleString("fr-FR")} €</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Rendement:</span>
                                    <strong>{project.yieldPercent}%</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Date de début:</span>
                                    <strong>{new Date(project.startDate).toLocaleDateString("fr-FR")}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Durée:</span>
                                    <strong>{project.durationMonths} mois</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Statut:</span>
                                    <strong>{project.status === "active" ? "En cours" : "Terminé"}</strong>
                                </div>
                                {project.imageUrl && (
                                    <div className={styles.detailRow}>
                                        <span>Image:</span>
                                        <a href={project.imageUrl} target="_blank" rel="noopener noreferrer">Voir</a>
                                    </div>
                                )}
                                {project.contractUrl && (
                                    <div className={styles.detailRow}>
                                        <span>Contrat:</span>
                                        <a href={project.contractUrl} target="_blank" rel="noopener noreferrer">Télécharger</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Transactions History */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3>Historique des transactions</h3>
                            <button onClick={onAddTransaction} className={styles.addBtn}>
                                + Ajouter
                            </button>
                        </div>

                        <div className={styles.transactions}>
                            {project.transactions.length === 0 ? (
                                <p className={styles.empty}>Aucune transaction</p>
                            ) : (
                                project.transactions.map((tx) => (
                                    <div key={tx.id} className={styles.txRow}>
                                        <div className={styles.txInfo}>
                                            <span className={`${styles.txType} ${styles[tx.type]}`}>
                                                {tx.type === "dividend" ? "Dividende" : "Remboursement"}
                                            </span>
                                            <span className={styles.txDate}>
                                                {new Date(tx.date).toLocaleDateString("fr-FR")}
                                            </span>
                                            <span className={styles.txAmount}>
                                                {tx.amount.toLocaleString("fr-FR")} €
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTx(tx.id)}
                                            className={styles.deleteBtn}
                                            title="Supprimer"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className={styles.summary}>
                        <div className={styles.summaryItem}>
                            <span>Total reçu (dividendes):</span>
                            <strong className={styles.green}>+{project.received.toLocaleString("fr-FR")} €</strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Total remboursé:</span>
                            <strong>{project.refunded.toLocaleString("fr-FR")} €</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
