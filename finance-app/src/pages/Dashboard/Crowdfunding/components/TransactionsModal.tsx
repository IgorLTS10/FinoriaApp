import { useState } from "react";
import styles from "./TransactionsModal.module.css";
import type { NewTransactionPayload } from "../hooks/useCrowdfunding";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: NewTransactionPayload) => Promise<void> | void;
    projectId: string;
    projectName: string;
};

export default function TransactionsModal({ open, onClose, onSubmit, projectId, projectName }: Props) {
    const [type, setType] = useState<"dividend" | "refund">("dividend");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!amount || !date) {
            setError("Merci de remplir tous les champs");
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                projectId,
                type,
                amount: Number(amount),
                date,
            });
            onClose();
            // Reset
            setAmount("");
            setDate(new Date().toISOString().slice(0, 10));
            setType("dividend");
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'ajout");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Ajouter une transaction</h2>
                <p className={styles.subtitle}>Pour le projet : <strong>{projectName}</strong></p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.row}>
                        <label>
                            Type
                            <select value={type} onChange={(e) => setType(e.target.value as any)}>
                                <option value="dividend">Dividende (Intérêts)</option>
                                <option value="refund">Remboursement (Capital)</option>
                            </select>
                        </label>
                    </div>

                    <div className={styles.row}>
                        <label>
                            Montant (€)
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                autoFocus
                            />
                        </label>
                    </div>

                    <div className={styles.row}>
                        <label>
                            Date
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </label>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.secondary} disabled={loading}>
                            Annuler
                        </button>
                        <button type="submit" className={styles.primary} disabled={loading}>
                            {loading ? "Ajout..." : "Ajouter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
