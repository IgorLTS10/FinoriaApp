// src/pages/Dashboard/Metaux/components/AddMetalModal.tsx
import { useState } from "react";
import styles from "./AddMetalModal.module.css";
import type { NewMetalPayload } from "../hooks/useMetaux";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<NewMetalPayload, "userId">) => Promise<void> | void;
};

export default function AddMetalModal({ open, onClose, onSubmit }: Props) {
  const AVAILABLE = ["EUR", "USD", "PLN"];


  const [type, setType] = useState<NewMetalPayload["type"]>("or");
  const [poids, setPoids] = useState("");
  const [unite, setUnite] = useState<NewMetalPayload["unite"]>("g");
  const [prixAchat, setPrixAchat] = useState("");
  const [deviseAchat, setDeviseAchat] = useState("EUR");
  const [dateAchat, setDateAchat] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function parseNumber(input: string): number | null {
    if (!input) return null;
    const normalized = input.replace(",", ".").trim();
    const n = Number(normalized);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const p = parseNumber(poids);
    const pa = parseNumber(prixAchat);

    if (p === null || pa === null || !dateAchat) {
      let msg = "Merci de corriger les champs suivants : ";
      const parts: string[] = [];
      if (p === null) parts.push("poids");
      if (pa === null) parts.push("prix total");
      if (!dateAchat) parts.push("date d'achat");
      msg += parts.join(", ");
      setError(msg);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        type,
        poids: p,
        unite,
        prixAchat: pa,
        deviseAchat,
        dateAchat,
        fournisseur: fournisseur || undefined,
        notes: notes || undefined,
      });
      setSubmitting(false);
      onClose();
      setPoids("");
      setPrixAchat("");
      setDateAchat("");
      setFournisseur("");
      setNotes("");
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || "Erreur lors de l'ajout");
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>Ajouter un achat</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <label>
              Métal
              <select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="or">Or</option>
                <option value="argent">Argent</option>
                <option value="platine">Platine</option>
                <option value="palladium">Palladium</option>
              </select>
            </label>

            <label>
              Poids
              <div className={styles.inline}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={poids}
                  onChange={(e) => setPoids(e.target.value)}
                />
                <select value={unite} onChange={(e) => setUnite(e.target.value as any)}>
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </label>
          </div>

          <div className={styles.row}>
            <label>
              Prix total
              <input
                type="text"
                inputMode="decimal"
                value={prixAchat}
                onChange={(e) => setPrixAchat(e.target.value)}
              />
            </label>

            <label>
              Devise
              <select
                value={deviseAchat}
                onChange={(e) => setDeviseAchat(e.target.value)}
              >
                {AVAILABLE.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label>
              Date d'achat
              <input
                type="date"
                value={dateAchat}
                onChange={(e) => setDateAchat(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.row}>
            <label>
              Fournisseur
              <input
                type="text"
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                placeholder="Ex : Godot & Fils"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label>
              Notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Certificat, numéro de facture, rangement..."
              />
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.primary}
              disabled={submitting}
            >
              {submitting ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
