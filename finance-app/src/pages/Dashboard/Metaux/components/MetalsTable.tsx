// src/pages/Dashboard/Metaux/components/MetalsTable.tsx
import styles from "./MetalsTable.module.css";
import type { MetalRow } from "../hooks/useMetaux";
import { useFx } from "../hooks/useFx";

type Props = {
  rows: MetalRow[];
  loading: boolean;
  error?: string;
  onAddClick: () => void;
  onDelete: (id: string) => void;
};

const TYPE_TO_METAL_CODE: Record<
  MetalRow["type"],
  "XAU" | "XAG" | "XPT" | "XPD"
> = {
  or: "XAU",
  argent: "XAG",
  platine: "XPT",
  palladium: "XPD",
};

function normalizeWeightToGrams(poids: number, unite: "g" | "oz") {
  return unite === "oz" ? poids * 31.1035 : poids;
}

export default function MetalsTable({
  rows,
  loading,
  error,
  onAddClick,
  onDelete,
}: Props) {
  const { displayCurrency, convert, convertForDisplay } = useFx();

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Vos positions</h3>
        <button className={styles.addButton} onClick={onAddClick}>
          + Ajouter un achat
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Métal</th>
              <th>Poids</th>
              <th>Prix d’achat</th>
              <th>Valeur (actuelle)</th>
              <th>Devise d’origine</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6}>Chargement...</td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6}>Aucune position pour l’instant.</td>
              </tr>
            )}

            {!loading &&
              rows.map((r) => {
                const metalCode = TYPE_TO_METAL_CODE[r.type];

                let currentValueDisplay = 0;

                if (metalCode) {
                  // prix d’1 once du métal dans la devise d’affichage
                  const pricePerOunceInDisplay = convert(
                    1,
                    metalCode,
                    displayCurrency
                  );
                  const weightG = normalizeWeightToGrams(r.poids, r.unite);
                  const pricePerGramInDisplay =
                    pricePerOunceInDisplay / 31.1035;

                  currentValueDisplay = weightG * pricePerGramInDisplay;
                } else {
                  // fallback : on affiche au moins le montant investi converti
                  currentValueDisplay = convertForDisplay(
                    r.prixAchat,
                    r.deviseAchat
                  );
                }

                return (
                  <tr key={r.id}>
                    <td>{labelForMetal(r.type)}</td>
                    <td>
                      {r.poids} {r.unite}
                    </td>
                    <td>
                      {r.prixAchat.toFixed(2)} {r.deviseAchat}
                    </td>
                    <td>{formatter.format(currentValueDisplay)}</td>
                    <td>{r.deviseAchat}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        title="Supprimer cet achat"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Supprimer définitivement cet achat ?"
                            )
                          ) {
                            onDelete(r.id);
                          }
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

function labelForMetal(t: MetalRow["type"]) {
  switch (t) {
    case "or":
      return "Or";
    case "argent":
      return "Argent";
    case "platine":
      return "Platine";
    case "palladium":
      return "Palladium";
    default:
      return t;
  }
}
