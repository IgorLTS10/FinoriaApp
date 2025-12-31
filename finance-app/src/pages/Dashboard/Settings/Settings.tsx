import { useUser } from "@stackframe/react";
import { usePreferences } from "../../../state/PreferencesContext";
import styles from "./Settings.module.css";
import { useState } from "react";
import ImageCropper from "./ImageCropper";

export default function Settings() {
    const { currency, setCurrency, language, setLanguage } = usePreferences();
    const user = useUser();

    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const handleSaveProfile = async () => {
        if (!user) return;

        setIsSaving(true);
        setSaveMessage("");

        try {
            // Update user profile using Stack Auth API
            await user.update({
                displayName: displayName || undefined,
                profileImageUrl: profileImageUrl || undefined,
            });

            setSaveMessage("✓ Profil mis à jour avec succès");
            setIsEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            setSaveMessage("✗ Erreur lors de la mise à jour du profil");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setDisplayName(user?.displayName || "");
        setProfileImageUrl(user?.profileImageUrl || "");
        setIsEditing(false);
        setSaveMessage("");
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageToCrop(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImageUrl: string) => {
        setProfileImageUrl(croppedImageUrl);
        setImageToCrop(null);
    };

    const handleCropCancel = () => {
        setImageToCrop(null);
    };

    // Password change state
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    const handlePasswordChange = async () => {
        setPasswordMessage("");

        // Check if user is using OAuth (Google/GitHub) - they don't have a password to change
        if (user?.primaryEmail && !user?.hasPassword) {
            setPasswordMessage("✗ Vous êtes connecté via Google/GitHub. Vous ne pouvez pas changer de mot de passe.");
            return;
        }

        // Validation
        if (!newPassword || !confirmPassword) {
            setPasswordMessage("✗ Veuillez remplir tous les champs");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage("✗ Les mots de passe ne correspondent pas");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage("✗ Le mot de passe doit contenir au moins 8 caractères");
            return;
        }

        setIsPasswordSaving(true);

        try {
            // Get the access token from Stack Auth
            const authJson = await user?.getAuthJson();
            const accessToken = authJson?.accessToken;

            if (!accessToken) {
                throw new Error('No access token available');
            }

            // Use Stack Auth's setPassword method
            const response = await fetch('https://api.stack-auth.com/api/v1/auth/password/set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-stack-project-id': import.meta.env.VITE_STACK_PROJECT_ID!,
                    'x-stack-publishable-client-key': import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY!,
                    'x-stack-access-token': accessToken,
                },
                body: JSON.stringify({
                    password: newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update password');
            }

            setPasswordMessage("✓ Mot de passe mis à jour avec succès");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setIsChangingPassword(false);

            // Clear success message after 3 seconds
            setTimeout(() => setPasswordMessage(""), 3000);
        } catch (error: any) {
            console.error("Error updating password:", error);
            setPasswordMessage(`✗ ${error.message || 'Erreur lors de la mise à jour du mot de passe'}`);
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleCancelPasswordChange = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMessage("");
        setIsChangingPassword(false);
    };

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
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Mon Profil</h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className={styles.editButton}
                            >
                                ✏️ Modifier
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
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
                    ) : (
                        <div className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nom d'affichage</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Entrez votre nom"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Photo de profil</label>
                                <div className={styles.imageUploadContainer}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className={styles.fileInput}
                                        id="profile-image-upload"
                                    />
                                    <label htmlFor="profile-image-upload" className={styles.uploadButton}>
                                        📷 Choisir une image
                                    </label>
                                    <p className={styles.formHint}>
                                        Sélectionnez une image depuis votre ordinateur
                                    </p>
                                </div>
                            </div>

                            {profileImageUrl && (
                                <div className={styles.imagePreview}>
                                    <label className={styles.formLabel}>Aperçu</label>
                                    <div className={styles.avatar}>
                                        <img src={profileImageUrl} alt="Preview" onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }} />
                                    </div>
                                </div>
                            )}

                            <div className={styles.formActions}>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className={styles.saveButton}
                                >
                                    {isSaving ? "Enregistrement..." : "💾 Enregistrer"}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className={styles.cancelButton}
                                >
                                    Annuler
                                </button>
                            </div>

                            {saveMessage && (
                                <div className={saveMessage.includes("✓") ? styles.successMessage : styles.errorMessage}>
                                    {saveMessage}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Password Change Section - Only for email/password users */}
            {user && user.hasPassword && (
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Sécurité</h3>
                        {!isChangingPassword && (
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className={styles.editButton}
                            >
                                🔒 Changer le mot de passe
                            </button>
                        )}
                    </div>

                    {isChangingPassword ? (
                        <div className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mot de passe actuel</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Entrez votre mot de passe actuel"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 8 caractères"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Confirmer le nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Retapez le nouveau mot de passe"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={isPasswordSaving}
                                    className={styles.saveButton}
                                >
                                    {isPasswordSaving ? "Enregistrement..." : "💾 Enregistrer"}
                                </button>
                                <button
                                    onClick={handleCancelPasswordChange}
                                    disabled={isPasswordSaving}
                                    className={styles.cancelButton}
                                >
                                    Annuler
                                </button>
                            </div>

                            {passwordMessage && (
                                <div className={passwordMessage.includes("✓") ? styles.successMessage : styles.errorMessage}>
                                    {passwordMessage}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className={styles.infoText}>
                            Cliquez sur "Changer le mot de passe" pour modifier votre mot de passe
                        </p>
                    )}
                </section>
            )}

            {/* Image Cropper Modal */}
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            {/* AccountSettings removed as per user request */}
        </div>
    );
}
