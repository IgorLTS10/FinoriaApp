import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { INVESTMENT_CATEGORIES } from '../../config/investmentCategories';
import styles from './InvestmentSettingsModal.module.css';

interface InvestmentSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    preferences: Record<string, boolean>;
    onSave: (preferences: Record<string, boolean>) => Promise<void>;
}

export default function InvestmentSettingsModal({
    isOpen,
    onClose,
    preferences,
    onSave,
}: InvestmentSettingsModalProps) {
    const [localPreferences, setLocalPreferences] = useState(preferences);
    const [saving, setSaving] = useState(false);

    // Synchroniser les préférences locales quand les props changent
    useEffect(() => {
        setLocalPreferences(preferences);
    }, [preferences]);

    if (!isOpen) return null;

    const handleToggle = (categoryId: string) => {
        setLocalPreferences((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    const handleSelectAll = () => {
        const allEnabled: Record<string, boolean> = {};
        INVESTMENT_CATEGORIES.forEach((cat) => {
            allEnabled[cat.id] = true;
        });
        setLocalPreferences(allEnabled);
    };

    const handleDeselectAll = () => {
        const allDisabled: Record<string, boolean> = {};
        INVESTMENT_CATEGORIES.forEach((cat) => {
            allDisabled[cat.id] = false;
        });
        setLocalPreferences(allDisabled);
    };

    const handleSave = async () => {
        console.log('[Modal] handleSave called with preferences:', localPreferences);
        const hasSelected = Object.values(localPreferences).some((v) => v);
        if (!hasSelected) {
            alert('Vous devez sélectionner au moins une catégorie');
            return;
        }

        setSaving(true);
        try {
            console.log('[Modal] Calling onSave...');
            await onSave(localPreferences);
            console.log('[Modal] onSave completed successfully');
            onClose();
        } catch (err) {
            console.error('Error saving preferences:', err);
            alert('Erreur lors de la sauvegarde des préférences');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setLocalPreferences(preferences);
        onClose();
    };

    return createPortal(
        <div className={styles.overlay} onClick={handleCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Configuration des investissements</h2>
                    <button className={styles.closeButton} onClick={handleCancel}>✕</button>
                </div>

                <div className={styles.content}>
                    <p className={styles.description}>
                        Sélectionnez les catégories d'investissement que vous souhaitez afficher dans la sidebar.
                    </p>

                    <div className={styles.actions}>
                        <button className={styles.actionButton} onClick={handleSelectAll}>
                            Tout sélectionner
                        </button>
                        <button className={styles.actionButton} onClick={handleDeselectAll}>
                            Tout désélectionner
                        </button>
                    </div>

                    <div className={styles.categoriesList}>
                        {INVESTMENT_CATEGORIES.map((category) => (
                            <label key={category.id} className={styles.categoryItem}>
                                <input
                                    type="checkbox"
                                    checked={localPreferences[category.id]}
                                    onChange={() => handleToggle(category.id)}
                                    className={styles.checkbox}
                                />
                                <span className={styles.categoryIcon}>{category.icon}</span>
                                <span className={styles.categoryName}>{category.name}</span>
                                <span
                                    className={styles.statusDot}
                                    data-status={category.status}
                                    title={
                                        category.status === 'green' ? 'Fonctionnel' :
                                            category.status === 'orange' ? 'En développement' :
                                                'Non disponible'
                                    }
                                />
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={handleCancel}>
                        Annuler
                    </button>
                    <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
