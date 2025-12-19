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

// Configuration des couleurs et icônes par métal
const METAL_CONFIG = {
  or: { label: "Or", color: "#FDB931", bg: "rgba(253, 185, 49, 0.15)", gradient: "linear-gradient(135deg, rgba(253, 185, 49, 0.3), rgba(253, 185, 49, 0.1))" },
  argent: { label: "Argent", color: "#C0C0C0", bg: "rgba(192, 192, 192, 0.15)", gradient: "linear-gradient(135deg, rgba(192, 192, 192, 0.3), rgba(192, 192, 192, 0.1))" },
  platine: { label: "Platine", color: "#8C92AC", bg: "rgba(140, 146, 172, 0.15)", gradient: "linear-gradient(135deg, rgba(140, 146, 172, 0.3), rgba(140, 146, 172, 0.1))" },
  palladium: { label: "Palladium", color: "#A8A9AD", bg: "rgba(168, 169, 173, 0.15)", gradient: "linear-gradient(135deg, rgba(168, 169, 173, 0.3), rgba(168, 169, 173, 0.1))" },
};

function normalizeWeightToGrams(poids: number, unite: "g" | "oz") {
  return unite === "oz" ? poids * 31.1035 : poids;
}

// Composant Chip pour afficher le type de métal
function MetalChip({ type }: { type: MetalRow["type"] }) {
  const config = METAL_CONFIG[type];

  return (
    <span
      className={styles.metalChip}
      style={{
        color: config.color,
        background: config.gradient,
        borderColor: config.color,
        boxShadow: `0 2px 8px ${config.color}40`
      }}
    >
      <span className={styles.metalDot} style={{ background: config.color }}></span>
      <span className={styles.metalLabel}>{config.label}</span>
    </span>
  );
}

// Composant pour afficher le gain/perte
function GainLossIndicator({ buyPrice, currentValue }: { buyPrice: number; currentValue: number }) {
  const diff = currentValue - buyPrice;
  const percent = ((diff / buyPrice) * 100).toFixed(1);

  const isPositive = diff > 0;
  const isNeutral = Math.abs(diff) < 0.01;

  return (
    <div className={styles.gainLoss}>
      <span className={isPositive ? styles.positive : isNeutral ? styles.neutral : styles.negative}>
        {isPositive ? "↗" : isNeutral ? "➡" : "↘"} {percent}%
      </span>
    </div>
  );
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
              <th>Prix d'achat</th>
              <th>Valeur actuelle</th>
              <th>Performance</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5}>Chargement...</td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5}>Aucune position pour l'instant.</td>
              </tr>
            )}

            {!loading &&
              rows.map((r) => {
                const metalCode = TYPE_TO_METAL_CODE[r.type];

                let currentValueDisplay = 0;

                if (metalCode) {
                  // prix d'1 once du métal dans la devise d'affichage
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

                const buyPriceConverted = convertForDisplay(r.prixAchat, r.deviseAchat);

                return (
                  <tr key={r.id}>
                    <td>
                      <MetalChip type={r.type} />
                    </td>
                    <td>
                      {r.poids} {r.unite}
                    </td>
                    <td>
                      {formatter.format(buyPriceConverted)}
                    </td>
                    <td>{formatter.format(currentValueDisplay)}</td>
                    <td>
                      <GainLossIndicator
                        buyPrice={buyPriceConverted}
                        currentValue={currentValueDisplay}
                      />
                    </td>
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
