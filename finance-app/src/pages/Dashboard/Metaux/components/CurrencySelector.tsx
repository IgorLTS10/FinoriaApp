// src/pages/Dashboard/Metaux/components/CurrencySelector.tsx
import { useState } from "react";
import styles from "./CurrencySelector.module.css";
import { usePreferences } from "../../../../state/PreferencesContext";

type Props = {
  compact?: boolean;
};

export default function CurrencySelector({ compact }: Props) {
  const { currency, setCurrency } = usePreferences();
  const AVAILABLE = ["EUR", "USD", "PLN"];
  const [open, setOpen] = useState(false);

  function handleSelect(c: string) {
    setCurrency(c as "EUR" | "USD" | "PLN");
    setOpen(false);
  }

  return (
    <div
      className={`${styles.wrapper} ${compact ? styles.compact : ""}`}
      tabIndex={0}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
      >
        {!compact && <span className={styles.label}>Devise</span>}
        <span className={styles.value}>{currency}</span>
        <span className={styles.chevron}>▾</span>
      </button>

      {open && (
        <div className={styles.menu}>
          {AVAILABLE.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.option} ${c === currency ? styles.optionActive : ""
                }`}
              onMouseDown={(e) => {
                // évite de déclencher le blur avant le click
                e.preventDefault();
                handleSelect(c);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
