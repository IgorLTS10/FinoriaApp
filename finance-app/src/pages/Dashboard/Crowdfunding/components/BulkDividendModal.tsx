import { useState, useMemo } from "react";
import styles from "./BulkDividendModal.module.css";
import type { CrowdfundingProject } from "../hooks/useCrowdfunding";

type Props = {
    open: boolean;
    onClose: () => void;
    projects: CrowdfundingProject[];
    onSaveDividends: (dividends: Array<{ projectId: string; amount: number; date: string }>) => Promise<void>;
};

type DividendRow = {
    projectId: string;
    amount: string;
    date: string;
};

export default function BulkDividendModal({ open, onClose, projects, onSaveDividends }: Props) {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    // Filter projects without dividend this month
    const eligibleProjects = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return projects.filter(project => {
            if (project.status !== 'active') return false;

            const hasDividendThisMonth = project.transactions.some(t => {
                if (t.type !== 'dividend') return false;
                const txDate = new Date(t.date);
                return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            });

            return !hasDividendThisMonth;
        });
    }, [projects]);

    // Initialize rows with empty amounts and today's date
    const [rows, setRows] = useState<Record<string, DividendRow>>(() => {
        const initialRows: Record<string, DividendRow> = {};
        eligibleProjects.forEach(project => {
            initialRows[project.id] = {
                projectId: project.id,
                amount: '',
                date: today
            };
        });
        return initialRows;
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAmountChange = (projectId: string, value: string) => {
        // Allow only numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setRows(prev => ({
                ...prev,
                [projectId]: { ...prev[projectId], amount: value }
            }));
        }
    };

    const handleDateChange = (projectId: string, value: string) => {
        setRows(prev => ({
            ...prev,
            [projectId]: { ...prev[projectId], date: value }
        }));
    };

    const handleSave = async () => {
        setError(null);

        // Filter rows with amounts
        const filledRows = Object.values(rows).filter(row => {
            const amount = parseFloat(row.amount);
            return !isNaN(amount) && amount > 0;
        });

        if (filledRows.length === 0) {
            setError("Aucun dividende à enregistrer");
            return;
        }

        try {
            setSaving(true);
            const dividends = filledRows.map(row => ({
                projectId: row.projectId,
                amount: parseFloat(row.amount),
                date: row.date
            }));

            await onSaveDividends(dividends);
            onClose();
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const filledCount = Object.values(rows).filter(row => {
        const amount = parseFloat(row.amount);
        return !isNaN(amount) && amount > 0;
    }).length;

    if (!open) return null;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Ajouter des dividendes en masse</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {eligibleProjects.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Tous vos projets ont déjà reçu un dividende ce mois-ci ! 🎉</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.info}>
                            <p>
                                {eligibleProjects.length} projet{eligibleProjects.length > 1 ? 's' : ''} sans dividende ce mois-ci
                                {filledCount > 0 && ` • ${filledCount} dividende${filledCount > 1 ? 's' : ''} à enregistrer`}
                            </p>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Projet</th>
                                        <th>Plateforme</th>
                                        <th>Investi</th>
                                        <th>Rendement</th>
                                        <th>Montant dividende</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eligibleProjects.map((project) => {
                                        const row = rows[project.id];
                                        return (
                                            <tr key={project.id}>
                                                <td className={styles.projectName}>{project.name}</td>
                                                <td>
                                                    <span className={styles.platformBadge}>
                                                        {project.platform || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className={styles.amount}>
                                                    {project.amountInvested.toLocaleString('fr-FR')} €
                                                </td>
                                                <td className={styles.yield}>
                                                    {project.yieldPercent}%
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.input}
                                                        placeholder="0.00"
                                                        value={row.amount}
                                                        onChange={(e) => handleAmountChange(project.id, e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        className={styles.dateInput}
                                                        value={row.date}
                                                        onChange={(e) => handleDateChange(project.id, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.footer}>
                            <button
                                className={styles.cancelBtn}
                                onClick={onClose}
                                disabled={saving}
                            >
                                Annuler
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSave}
                                disabled={saving || filledCount === 0}
                            >
                                {saving ? "Enregistrement..." : `Enregistrer ${filledCount > 0 ? `(${filledCount})` : ''}`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
