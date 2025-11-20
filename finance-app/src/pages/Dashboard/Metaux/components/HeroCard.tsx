// src/pages/Dashboard/Metaux/components/HeroCard.tsx
import styles from "./HeroCard.module.css";
import Sparkline from "./Sparkline";
import CurrencySelector from "./CurrencySelector";
import { useFx } from "../hooks/useFx";
import { useUser } from "@stackframe/react";
import { useMetaux } from "../hooks/useMetaux";

// pour convertir ton type → code métal FX
const TYPE_TO_METAL_CODE: Record<
  "or" | "argent" | "platine" | "palladium",
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

export default function HeroCard() {
  const { displayCurrency, convertForDisplay, convert } = useFx();
  const user = useUser();
  const userId = user?.id;
  const { rows } = useMetaux(userId);

  let totalInvested = 0;
  let totalCurrentValue = 0;

  if (rows && rows.length > 0) {
    for (const r of rows) {
      // montant investi
      totalInvested += convertForDisplay(r.prixAchat, r.deviseAchat);

      // valeur actuelle : poids × prix spot
      const metalCode = TYPE_TO_METAL_CODE[r.type];
      const pricePerOunce = convert(1, metalCode, displayCurrency);
      const pricePerGram = pricePerOunce / 31.1035;
      const weightG = normalizeWeightToGrams(r.poids, r.unite);
      totalCurrentValue += weightG * pricePerGram;
    }
  }

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  });

  // rentabilité % et €
  const pnlValue = totalCurrentValue - totalInvested;
  const pnlPercent =
    totalInvested > 0 ? (pnlValue / totalInvested) * 100 : 0;

  const pnlColor = pnlValue >= 0 ? "#10b981" : "#ef4444"; // vert / rouge

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.label}>Valeur totale du portefeuille</div>
        <div className={styles.value}>
          {formatter.format(totalCurrentValue)}
        </div>

        <div
          className={styles.delta}
          style={{ color: pnlColor }}
        >
          {pnlValue >= 0 ? "+" : ""}
          {pnlPercent.toFixed(2)}% (
          {pnlValue >= 0 ? "+" : ""}
          {formatter.format(pnlValue)})
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.currency}>
          <CurrencySelector compact />
        </div>
        <Sparkline />
      </div>
    </div>
  );
}
