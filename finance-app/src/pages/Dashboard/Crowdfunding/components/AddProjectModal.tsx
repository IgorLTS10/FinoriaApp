import { useState } from "react";
import styles from "./AddProjectModal.module.css";
import type { NewProjectPayload } from "../hooks/useCrowdfunding";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: NewProjectPayload) => Promise<void> | void;
    userId: string;
};

export default function AddProjectModal({ open, onClose, onSubmit, userId }: Props) {
    const [name, setName] = useState("");
    const [platform, setPlatform] = useState("");
    const [amount, setAmount] = useState("");
    const [yieldPercent, setYieldPercent] = useState("");
    const [startDate, setStartDate] = useState("");
    const [duration, setDuration] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [contractUrl, setContractUrl] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name || !platform || !amount || !startDate || !duration) {
            setError("Merci de remplir les champs obligatoires (*)");
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                userId,
                name,
                platform,
                amountInvested: Number(amount),
                yieldPercent: Number(yieldPercent || 0),
                startDate,
                durationMonths: Number(duration),
                imageUrl: imageUrl || undefined,
                contractUrl: contractUrl || undefined,
            });
            onClose();
            // Reset form
            setName("");
            setPlatform("");
            setAmount("");
            setYieldPercent("");
            setStartDate("");
            setDuration("");
            setImageUrl("");
            setContractUrl("");
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'ajout");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Nouveau projet Crowdfunding</h2>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.row}>
                        <label>
                            Nom du projet *
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Immeuble Paris 16"
                            />
                        </label>
                        <label>
                            Plateforme *
                            <input
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                placeholder="Ex: Bricks, Bienpreter"
                            />
                        </label>
                    </div>

                    <div className={styles.row}>
                        <label>
                            Montant investi (€) *
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </label>
                        <label>
                            Rendement cible (%)
                            <input
                                type="number"
                                step="0.01"
                                value={yieldPercent}
                                onChange={(e) => setYieldPercent(e.target.value)}
                                placeholder="Ex: 10"
                            />
                        </label>
                    </div>

                    <div className={styles.row}>
                        <label>
                            Date de début *
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>
                        <label>
                            Durée (mois) *
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="Ex: 24"
                            />
                        </label>
                    </div>

                    <div className={styles.row}>
                        <label>
                            Image URL (optionnel)
                            <input
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </label>
                    </div>

                    <div className={styles.row}>
                        <label>
                            Lien contrat (optionnel)
                            <input
                                value={contractUrl}
                                onChange={(e) => setContractUrl(e.target.value)}
                                placeholder="https://..."
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
