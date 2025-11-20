import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./AddStockModal.module.css";
import type { NewStockPayload } from "../hooks/useStockPositions";
import { useStockSearch } from "../hooks/useStockSearch";

type AddStockModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    payload: Omit<NewStockPayload, "userId">
  ) => Promise<void> | void;
};

const BUY_CURRENCIES = ["USD", "EUR", "PLN"];

export default function AddStockModal({
  open,
  onClose,
  onSubmit,
}: AddStockModalProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [exchange, setExchange] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyCurrency, setBuyCurrency] = useState("USD");
  const [buyDate, setBuyDate] = useState("");
  const [notes, setNotes] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const { results, loading: searchLoading } = useStockSearch(searchQuery);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // reset du formulaire à l'ouverture
  useEffect(() => {
    if (!open) return;
    setSymbol("");
    setName(null);
    setExchange(null);
    setLogoUrl(null);
    setQuantity("");
    setBuyPrice("");
    setBuyCurrency("USD");
    setBuyDate(new Date().toISOString().slice(0, 10)); // date du jour
    setNotes("");
    setSearchQuery("");
    setError(null);
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!symbol || !quantity || !buyPrice || !buyCurrency || !buyDate) return;

    const quantityNum = Number(quantity);
    const buyPriceNum = Number(buyPrice);

    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      setError("Quantité invalide.");
      return;
    }
    if (!Number.isFinite(buyPriceNum) || buyPriceNum <= 0) {
      setError("Prix d’achat invalide.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onSubmit({
        symbol: symbol.toUpperCase(),
        name: name || undefined,
        exchange: exchange || undefined,
        logoUrl: logoUrl || undefined,
        quantity: quantityNum,
        buyPrice: buyPriceNum,
        buyCurrency,
        buyDate,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l’enregistrement.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectSearchResult(r: {
    symbol: string;
    name: string;
    exchange: string;
    logoUrl: string | null;
  }) {
    setSymbol(r.symbol);
    setName(r.name);
    setExchange(r.exchange);
    setLogoUrl(r.logoUrl || null);
    // on vide la recherche pour masquer la dropdown
    setSearchQuery("");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            <div className={styles.header}>
              <h2>Ajouter une action</h2>
              <p>
                Recherche une action par symbole ou nom, indique ta quantité et ton prix
                d’achat. On calculera automatiquement la performance à partir des prix
                spot quotidiens.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Ligne symbole + nom */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Symbole</label>
                  <div className={styles.symbolWrapper}>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSymbol(v.toUpperCase());
                        setSearchQuery(v);
                      }}
                      placeholder="Ex. AAPL, TSLA..."
                      className={styles.input}
                    />
                    {/* Dropdown de recherche */}
                    {searchQuery.trim().length > 0 && (
                      <div className={styles.searchDropdown}>
                        {searchLoading && (
                          <div className={styles.searchItemMuted}>
                            Recherche en cours...
                          </div>
                        )}
                        {!searchLoading && results.length === 0 && (
                          <div className={styles.searchItemMuted}>
                            Aucune action trouvée pour "{searchQuery}"
                          </div>
                        )}
                        {!searchLoading &&
                          results.map((r) => (
                            <button
                              key={r.symbol}
                              type="button"
                              className={styles.searchItem}
                              onClick={() => handleSelectSearchResult(r)}
                            >
                              <div className={styles.searchItemLeft}>
                                {r.logoUrl && (
                                  <img
                                    src={r.logoUrl}
                                    alt={r.symbol}
                                    className={styles.searchLogo}
                                  />
                                )}
                                <div>
                                  <div className={styles.searchSymbol}>
                                    {r.symbol}
                                  </div>
                                  <div className={styles.searchName}>
                                    {r.name}
                                  </div>
                                </div>
                              </div>
                              <div className={styles.searchExchange}>
                                {r.exchange}
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Nom</label>
                  <input
                    type="text"
                    value={name ?? ""}
                    onChange={(e) => setName(e.target.value || null)}
                    placeholder="Ex. Apple Inc."
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Ligne quantité / prix / devise */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Quantité</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex. 3"
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Prix unitaire</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Ex. 175"
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Devise</label>
                  <select
                    value={buyCurrency}
                    onChange={(e) => setBuyCurrency(e.target.value)}
                    className={styles.input}
                  >
                    {BUY_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date d'achat */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Date d’achat</label>
                  <input
                    type="date"
                    value={buyDate}
                    onChange={(e) => setBuyDate(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label>Place/Exchange</label>
                  <input
                    type="text"
                    value={exchange ?? ""}
                    onChange={(e) => setExchange(e.target.value || null)}
                    placeholder="Ex. NASDAQ"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className={styles.field}>
                <label>Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Objectif, stratégie, contexte de l'achat, etc."
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.actions}>
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
                  disabled={
                    submitting ||
                    !symbol ||
                    !quantity ||
                    !buyPrice ||
                    !buyCurrency ||
                    !buyDate
                  }
                >
                  {submitting ? "Enregistrement..." : "Ajouter l’action"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
