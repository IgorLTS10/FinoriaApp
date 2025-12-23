import { useState, useRef } from "react";
import styles from "./BulkImportModal.module.css";
import type { NewProjectPayload } from "../hooks/useCrowdfunding";

type Props = {
    open: boolean;
    onClose: () => void;
    onImport: (projects: NewProjectPayload[]) => Promise<void>;
    userId: string;
};

type CSVRow = {
    nom: string;
    plateforme: string;
    montant_investi: string;
    rendement_pourcent: string;
    date_debut: string;
    duree_mois: string;
};

type ParsedProject = {
    data: NewProjectPayload;
    errors: string[];
    rowNumber: number;
};

export default function BulkImportModal({ open, onClose, onImport, userId }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedProjects, setParsedProjects] = useState<ParsedProject[]>([]);
    const [importing, setImporting] = useState(false);
    const [importComplete, setImportComplete] = useState(false);
    const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!open) return null;

    const downloadTemplate = () => {
        const template = `nom,plateforme,montant_investi,rendement_pourcent,date_debut,duree_mois
Projet Example 1,Anaxago,10000,8.5,2024-01-15,24
Projet Example 2,Homunity,5000,7.2,2024-02-01,18`;

        const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "template_import_crowdfunding.csv";
        link.click();
    };

    const validateProject = (row: CSVRow, rowNumber: number): ParsedProject => {
        const errors: string[] = [];

        // Validate required fields
        if (!row.nom?.trim()) errors.push("Nom manquant");
        if (!row.plateforme?.trim()) errors.push("Plateforme manquante");
        if (!row.montant_investi?.trim()) errors.push("Montant investi manquant");
        if (!row.date_debut?.trim()) errors.push("Date de début manquante");
        if (!row.duree_mois?.trim()) errors.push("Durée manquante");

        // Validate number formats
        const amount = parseFloat(row.montant_investi);
        if (isNaN(amount) || amount <= 0) {
            errors.push("Montant investi invalide (doit être > 0)");
        }

        const yieldPercent = row.rendement_pourcent ? parseFloat(row.rendement_pourcent) : 0;
        if (isNaN(yieldPercent) || yieldPercent < 0) {
            errors.push("Rendement invalide (doit être >= 0)");
        }

        const duration = parseInt(row.duree_mois);
        if (isNaN(duration) || duration <= 0) {
            errors.push("Durée invalide (doit être > 0)");
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row.date_debut)) {
            errors.push("Date invalide (format attendu: YYYY-MM-DD)");
        }

        return {
            data: {
                userId,
                name: row.nom?.trim() || "",
                platform: row.plateforme?.trim() || "",
                amountInvested: amount || 0,
                yieldPercent: yieldPercent || 0,
                startDate: row.date_debut?.trim() || "",
                durationMonths: duration || 0,
                imageUrl: "",
                contractUrl: "",
            },
            errors,
            rowNumber,
        };
    };

    const parseCSV = (text: string): CSVRow[] => {
        const lines = text.split("\n").filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const rows: CSVRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",");
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || "";
            });
            rows.push(row as CSVRow);
        }

        return rows;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith(".csv")) {
            alert("Veuillez sélectionner un fichier CSV");
            return;
        }

        setFile(selectedFile);
        setImportComplete(false);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = parseCSV(text);
            const parsed = rows.map((row, index) => validateProject(row, index + 2)); // +2 because row 1 is header
            setParsedProjects(parsed);
        };
        reader.readAsText(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith(".csv")) {
            const fakeEvent = {
                target: { files: [droppedFile] }
            } as any;
            handleFileChange(fakeEvent);
        }
    };

    const handleImport = async () => {
        const validProjects = parsedProjects.filter(p => p.errors.length === 0);
        if (validProjects.length === 0) {
            alert("Aucun projet valide à importer");
            return;
        }

        try {
            setImporting(true);
            let success = 0;
            let failed = 0;

            for (const project of validProjects) {
                try {
                    await onImport([project.data]);
                    success++;
                } catch (err) {
                    failed++;
                    console.error(`Erreur import projet ligne ${project.rowNumber}:`, err);
                }
            }

            setImportResults({ success, failed });
            setImportComplete(true);
        } catch (err: any) {
            alert(err.message || "Erreur lors de l'import");
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedProjects([]);
        setImportComplete(false);
        setImportResults({ success: 0, failed: 0 });
        onClose();
    };

    const validCount = parsedProjects.filter(p => p.errors.length === 0).length;
    const invalidCount = parsedProjects.length - validCount;

    return (
        <div className={styles.backdrop} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Import en masse de projets</h2>

                {!importComplete ? (
                    <>
                        <div className={styles.instructions}>
                            <p>1. Téléchargez le template CSV</p>
                            <p>2. Remplissez-le avec vos projets</p>
                            <p>3. Importez le fichier complété</p>
                        </div>

                        <button onClick={downloadTemplate} className={styles.downloadBtn}>
                            📥 Télécharger le template CSV
                        </button>

                        <div
                            className={styles.dropZone}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                            {file ? (
                                <div className={styles.fileInfo}>
                                    <span>📄 {file.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            setParsedProjects([]);
                                        }}
                                        className={styles.removeFileBtn}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.dropText}>
                                    <p>📁 Glissez-déposez votre fichier CSV ici</p>
                                    <p>ou cliquez pour sélectionner</p>
                                </div>
                            )}
                        </div>

                        {parsedProjects.length > 0 && (
                            <>
                                <div className={styles.summary}>
                                    <span className={styles.valid}>✓ {validCount} valide{validCount > 1 ? "s" : ""}</span>
                                    {invalidCount > 0 && (
                                        <span className={styles.invalid}>✗ {invalidCount} invalide{invalidCount > 1 ? "s" : ""}</span>
                                    )}
                                </div>

                                <div className={styles.previewContainer}>
                                    <h3>Prévisualisation</h3>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.previewTable}>
                                            <thead>
                                                <tr>
                                                    <th>Ligne</th>
                                                    <th>Nom</th>
                                                    <th>Plateforme</th>
                                                    <th>Montant</th>
                                                    <th>Rendement</th>
                                                    <th>Date</th>
                                                    <th>Durée</th>
                                                    <th>Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedProjects.map((project, index) => (
                                                    <tr key={index} className={project.errors.length > 0 ? styles.errorRow : styles.validRow}>
                                                        <td>{project.rowNumber}</td>
                                                        <td>{project.data.name}</td>
                                                        <td>{project.data.platform}</td>
                                                        <td>{project.data.amountInvested.toLocaleString("fr-FR")} €</td>
                                                        <td>{project.data.yieldPercent}%</td>
                                                        <td>{project.data.startDate}</td>
                                                        <td>{project.data.durationMonths} mois</td>
                                                        <td>
                                                            {project.errors.length === 0 ? (
                                                                <span className={styles.validBadge}>✓ Valide</span>
                                                            ) : (
                                                                <span className={styles.errorBadge} title={project.errors.join(", ")}>
                                                                    ✗ {project.errors.length} erreur{project.errors.length > 1 ? "s" : ""}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button onClick={handleClose} className={styles.cancelBtn} disabled={importing}>
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        className={styles.importBtn}
                                        disabled={importing || validCount === 0}
                                    >
                                        {importing ? "Import en cours..." : `Importer ${validCount} projet${validCount > 1 ? "s" : ""}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className={styles.results}>
                        <div className={styles.resultsIcon}>
                            {importResults.failed === 0 ? "✅" : "⚠️"}
                        </div>
                        <h3>Import terminé</h3>
                        <div className={styles.resultsStats}>
                            <p className={styles.successStat}>✓ {importResults.success} projet{importResults.success > 1 ? "s" : ""} importé{importResults.success > 1 ? "s" : ""}</p>
                            {importResults.failed > 0 && (
                                <p className={styles.failedStat}>✗ {importResults.failed} échec{importResults.failed > 1 ? "s" : ""}</p>
                            )}
                        </div>
                        <button onClick={handleClose} className={styles.closeBtn}>
                            Fermer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
