import { useState } from "react";
import styles from "./AddProjectModal.module.css";
import type { NewProjectPayload } from "../hooks/useCrowdfunding";
import { usePlatforms, type Platform } from "../hooks/usePlatforms";
import PlatformSelector from "./PlatformSelector";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: NewProjectPayload) => Promise<void> | void;
    userId: string;
};

export default function AddProjectModal({ open, onClose, onSubmit, userId }: Props) {
    const [name, setName] = useState("");
    const [platformId, setPlatformId] = useState("");
    const [amount, setAmount] = useState("");
    const [yieldPercent, setYieldPercent] = useState("");
    const [startDate, setStartDate] = useState("");
    const [duration, setDuration] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [contractUrl, setContractUrl] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Platform management
    const { platforms, loading: loadingPlatforms, createPlatform } = usePlatforms(userId);
    const [showNewPlatformInput, setShowNewPlatformInput] = useState(false);
    const [newPlatformName, setNewPlatformName] = useState("");
    const [creatingPlatform, setCreatingPlatform] = useState(false);

    if (!open) return null;

    async function handleCreatePlatform() {
        if (!newPlatformName.trim()) {
            setError("Veuillez entrer un nom de plateforme");
            return;
        }

        try {
            setCreatingPlatform(true);
            setError(null);
            const newPlatform = await createPlatform(newPlatformName.trim());
            setPlatformId(newPlatform.id);
            setNewPlatformName("");
            setShowNewPlatformInput(false);
        } catch (err: any) {
            setError(err.message || "Erreur lors de la création de la plateforme");
        } finally {
            setCreatingPlatform(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name || !platformId || !amount || !startDate || !duration) {
            setError("Merci de remplir les champs obligatoires (*)");
            return;
        }

        // Find platform name from ID
        const selectedPlatform = platforms.find((p: Platform) => p.id === platformId);
        if (!selectedPlatform) {
            setError("Plateforme invalide");
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                userId,
                name,
                platform: selectedPlatform.name, // Still send name for now (backend will be updated later)
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
            setPlatformId("");
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
                            {!showNewPlatformInput ? (
                                <PlatformSelector
                                    platforms={platforms}
                                    selectedId={platformId}
                                    onSelect={setPlatformId}
                                    onCreateNew={() => setShowNewPlatformInput(true)}
                                    disabled={loadingPlatforms}
                                />
                            ) : (
                                <div className={styles.newPlatformInput}>
                                    <input
                                        value={newPlatformName}
                                        onChange={(e) => setNewPlatformName(e.target.value)}
                                        placeholder="Nom de la nouvelle plateforme"
                                        disabled={creatingPlatform}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreatePlatform}
                                        disabled={creatingPlatform}
                                        className={styles.createBtn}
                                    >
                                        {creatingPlatform ? "..." : "✓"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewPlatformInput(false);
                                            setNewPlatformName("");
                                        }}
                                        disabled={creatingPlatform}
                                        className={styles.cancelBtn}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
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
