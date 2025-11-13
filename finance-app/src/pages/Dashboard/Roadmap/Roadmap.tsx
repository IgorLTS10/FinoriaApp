// src/pages/Dashboard/Roadmap/Roadmap.tsx
import { useState } from "react";
import { useUser } from "@stackframe/react";
import styles from "./Roadmap.module.css";
import { useIdeas } from "./hooks/useIdeas";

type RoadmapItem = {
  title: string;
  label: string;
  quarter: string;
  status: "active" | "planned" | "idea";
  description: string;
};

const roadmapColumns: {
  title: string;
  key: "active" | "planned" | "idea";
  items: RoadmapItem[];
}[] = [
  {
    title: "En cours",
    key: "active",
    items: [
      {
        title: "Page Mes comptes bancaires",
        label: "Core app",
        quarter: "Q4 2025",
        status: "active",
        description:
          "Création / édition des comptes, affichage du solde et première vue d’ensemble du patrimoine.",
      },
      {
        title: "Suivi des paiements récurrents",
        label: "Cashflow",
        quarter: "Q4 2025",
        status: "active",
        description:
          "Abonnements, loyers, charges : visualisation des sorties fixes mois par mois.",
      },
    ],
  },
  {
    title: "À venir",
    key: "planned",
    items: [
      {
        title: "Budgets mensuels intelligents",
        label: "Budgeting",
        quarter: "Q1 2026",
        status: "planned",
        description:
          "Budgets par catégorie, suivi du reste à dépenser et alertes en cas de dépassement.",
      },
      {
        title: "Rapports d’investissement",
        label: "Invest",
        quarter: "Q1 2026",
        status: "planned",
        description:
          "Vue consolidée des performances (ETF, actions, crowdfunding, métaux, crypto…).",
      },
    ],
  },
  {
    title: "Idées & explorations",
    key: "idea",
    items: [
      {
        title: "Mode coaching financier",
        label: "Expérimental",
        quarter: "Backlog",
        status: "idea",
        description:
          "Scénarios d’épargne, recommandations d’allocation et objectifs personnalisés.",
      },
      {
        title: "App mobile dédiée",
        label: "Mobile",
        quarter: "Backlog",
        status: "idea",
        description:
          "Version iOS/Android avec notifications pour les dépenses, objectifs et alertes.",
      },
    ],
  },
];

export default function Roadmap() {
  const user = useUser();
  const userId = (user as any)?.id as string | undefined;
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);

  const { addIdea } = useIdeas(userId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Roadmap produit</h1>
          <p className={styles.subtitle}>
            Vision globale de l’évolution de Finoria. Cette liste est indicative et peut évoluer.
          </p>
        </div>

        <div className={styles.chips}>
          <span className={`${styles.chip} ${styles.chipActive}`}>En cours</span>
          <span className={`${styles.chip} ${styles.chipPlanned}`}>À venir</span>
          <span className={`${styles.chip} ${styles.chipIdea}`}>Idées</span>
        </div>
      </header>

      <section className={styles.meta}>
        <div className={styles.metaCard}>
          <div className={styles.metaLabel}>Dernière mise à jour</div>
          <div className={styles.metaValue}>Novembre 2025</div>
        </div>
        <div className={styles.metaCard}>
          <div className={styles.metaLabel}>Objectif</div>
          <div className={styles.metaValue}>
            Construire un outil simple, clair et motivant pour piloter ses finances personnelles.
          </div>
        </div>
      </section>

      <section className={styles.columns}>
        {roadmapColumns.map((column) => (
          <div key={column.title} className={styles.column}>
            <div className={styles.columnHeader}>
              <h2 className={styles.columnTitle}>{column.title}</h2>
              <span className={styles.columnCount}>{column.items.length} éléments</span>
            </div>

            <div className={styles.columnBody}>
              {column.items.map((item) => (
                <article key={item.title} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardLabel}>{item.label}</span>
                    <span
                      className={`${styles.cardStatus} ${
                        item.status === "active"
                          ? styles.statusActive
                          : item.status === "planned"
                          ? styles.statusPlanned
                          : styles.statusIdea
                      }`}
                    >
                      {item.quarter}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDescription}>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        <p>
          Tu as une idée à proposer ou un besoin spécifique ?<br />
          <button
            type="button"
            className={styles.footerHighlightButton}
            onClick={() => setIdeaModalOpen(true)}
          >
            Ajoute-la à la backlog ou note-la dans ta zone “Idées” personnelle.
          </button>
        </p>
      </footer>

      {ideaModalOpen && (
        <IdeaModal
          onClose={() => setIdeaModalOpen(false)}
          onSubmit={addIdea}
          hasUser={!!userId}
        />
      )}
    </div>
  );
}

/** ===========================================
 *  Modal d'ajout d'idée
 *  =========================================== */
type IdeaModalProps = {
  onClose: () => void;
  onSubmit: (content: string) => Promise<void> | void;
  hasUser: boolean;
};

function IdeaModal({ onClose, onSubmit, hasUser }: IdeaModalProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;

    if (!hasUser) {
      alert("Tu dois être connecté pour enregistrer une idée.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(value.trim());
      setValue("");
      onClose();
      alert("Merci ! Ton idée a été ajoutée à la backlog ✅");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l’envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Ajouter une idée / un bug</h2>
        <p className={styles.modalSubtitle}>
          Décris rapidement ton idée ou le problème rencontré.
        </p>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <textarea
            className={styles.modalTextarea}
            rows={5}
            placeholder="Exemple : Ajouter une vue calendrier des dépenses, bug sur la page Métaux, etc."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalSecondary}
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.modalPrimary}
              disabled={loading || !value.trim()}
            >
              {loading ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
