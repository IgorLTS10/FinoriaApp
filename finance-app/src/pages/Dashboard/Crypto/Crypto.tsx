// src/pages/Dashboard/Crypto/Crypto.tsx
import React, { useMemo, useState, useRef } from "react";
import { useUser } from "@stackframe/react";
import styles from "./Crypto.module.css";
import { useCryptoPositions } from "./hooks/useCryptoPositions";
import type { CryptoPositionRow, NewCryptoPayload } from "./hooks/useCryptoPositions";
import { useCryptoPrices } from "./hooks/useCryptoPrices";
import { usePreferences } from "../../../state/PreferencesContext";

/** Vue agrégée par symbole pour les cartes */
type AggregatedCrypto = {
  symbol: string;
  name?: string | null;
  logoUrl?: string | null;
  totalQuantity: number;
  costBasis: number;        // somme des buyTotal
  currentPrice?: number;    // prix actuel
  currentValue?: number;
  pnlAbs?: number;
  pnlPct?: number;
};

type PricesBySymbol = Record<string, number>;

/** Helper : agrège les lignes par symbole + calcule perf si prix dispo */
function aggregateBySymbol(
  rows: CryptoPositionRow[],
  prices: PricesBySymbol
): AggregatedCrypto[] {
  const map = new Map<string, AggregatedCrypto>();

  for (const row of rows) {
    const key = row.symbol.toUpperCase();
    const existing = map.get(key);
    const rowCost = row.buyTotal || 0;

    if (!existing) {
      map.set(key, {
        symbol: key,
        name: row.name,
        logoUrl: row.logoUrl,
        totalQuantity: row.quantity,
        costBasis: rowCost,
      });
    } else {
      existing.totalQuantity += row.quantity;
      existing.costBasis += rowCost;
    }
  }

  for (const agg of map.values()) {
    const price = prices[agg.symbol];
    if (price) {
      const currentValue = agg.totalQuantity * price;
      const pnlAbs = currentValue - agg.costBasis;
      const pnlPct = agg.costBasis > 0 ? (currentValue / agg.costBasis - 1) * 100 : undefined;
      agg.currentPrice = price;
      agg.currentValue = currentValue;
      agg.pnlAbs = pnlAbs;
      agg.pnlPct = pnlPct;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0)
  );
}

export default function Crypto() {
  const user = useUser();
  const userId = (user as any)?.id as string | undefined;
  const { currency } = usePreferences();

  const { rows, loading, error, addPosition, deletePosition } = useCryptoPositions(userId);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const symbols = useMemo(
    () => Array.from(new Set(rows.map((r) => r.symbol.toUpperCase()))),
    [rows]
  );

  const {
    pricesBySymbol,
    loading: loadingPrices,
    error: errorPrices,
  } = useCryptoPrices(symbols, currency);

  const aggregated = useMemo(
    () => aggregateBySymbol(rows, pricesBySymbol),
    [rows, pricesBySymbol]
  );

  const totalCostBasis = useMemo(
    () => aggregated.reduce((acc, c) => acc + c.costBasis, 0),
    [aggregated]
  );
  const totalCurrentValue = useMemo(
    () => aggregated.reduce((acc, c) => acc + (c.currentValue ?? 0), 0),
    [aggregated]
  );
  const totalPnlAbs = totalCurrentValue - totalCostBasis;
  const totalPnlPct =
    totalCostBasis > 0 ? (totalCurrentValue / totalCostBasis - 1) * 100 : 0;

  const bestAsset = useMemo(() => {
    return aggregated
      .filter((a) => typeof a.pnlPct === "number")
      .sort((a, b) => (b.pnlPct! - a.pnlPct!))[0];
  }, [aggregated]);

  const worstAsset = useMemo(() => {
    return aggregated
      .filter((a) => typeof a.pnlPct === "number")
      .sort((a, b) => (a.pnlPct! - b.pnlPct!))[0];
  }, [aggregated]);

  return (
    <div className={styles.page}>
      {/* HERO / RÉSUMÉ */}
      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>Portefeuille Crypto</h1>
          <p className={styles.subtitle}>
            Suis tes positions crypto, visualise tes performances et garde une vue claire de ton
            exposition.
          </p>
        </div>

        <button
          className={styles.addButton}
          type="button"
          onClick={() => setAddModalOpen(true)}
        >
          + Ajouter une position
        </button>
      </section>

      {/* KPIs principaux */}
      <section className={styles.kpis}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Valeur d&apos;achat</div>
          <div className={styles.kpiValue}>
            {totalCostBasis ? `${totalCostBasis.toFixed(2)} €` : "—"}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Valeur actuelle</div>
          <div className={styles.kpiValue}>
            {totalCurrentValue ? `${totalCurrentValue.toFixed(2)} €` : "—"}
          </div>
          <div className={styles.kpiHint}>
            {symbols.length === 0
              ? "Ajoute des positions pour voir la valeur de ton portefeuille."
              : loadingPrices
                ? "Mise à jour des prix en cours..."
                : "Prix basés sur la dernière mise à jour en base."}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Performance globale</div>
          <div
            className={`${styles.kpiValue} ${totalPnlAbs > 0 ? styles.positive : totalPnlAbs < 0 ? styles.negative : ""
              }`}
          >
            {totalCurrentValue
              ? `${totalPnlAbs >= 0 ? "+" : ""}${totalPnlAbs.toFixed(2)} € (${totalPnlPct.toFixed(
                2
              )} %)`
              : "—"}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Meilleure / Pire perf</div>
          <div className={styles.kpiBadgeRow}>
            {bestAsset ? (
              <span className={`${styles.badge} ${styles.badgePositive}`}>
                {bestAsset.symbol} {bestAsset.pnlPct!.toFixed(1)} %
              </span>
            ) : (
              <span className={styles.badge}>—</span>
            )}
            {worstAsset ? (
              <span className={`${styles.badge} ${styles.badgeNegative}`}>
                {worstAsset.symbol} {worstAsset.pnlPct!.toFixed(1)} %
              </span>
            ) : (
              <span className={styles.badge}>—</span>
            )}
          </div>
        </div>
      </section>

      {errorPrices && (
        <div className={styles.errorBox}>
          Impossible de charger certains prix crypto : {errorPrices}
        </div>
      )}

      {/* LISTE DES ASSETS SOUS FORME DE CARTES */}
      <section className={styles.cardsSection}>
        <h2 className={styles.sectionTitle}>Vue par crypto</h2>
        {aggregated.length === 0 && (
          <div className={styles.emptyState}>
            Aucune position enregistrée pour l&apos;instant. Ajoute ta première crypto pour voir ton
            portefeuille prendre vie ✨
          </div>
        )}

        <div className={styles.cardsGrid}>
          {aggregated.map((asset) => (
            <article key={asset.symbol} className={styles.assetCard}>
              <div className={styles.assetHeader}>
                <div className={styles.assetIdentity}>
                  {asset.logoUrl ? (
                    <img
                      src={asset.logoUrl}
                      alt={asset.symbol}
                      className={styles.assetLogo}
                    />
                  ) : (
                    <div className={styles.assetLogoPlaceholder}>
                      {asset.symbol[0] ?? "?"}
                    </div>
                  )}
                  <div>
                    <div className={styles.assetSymbol}>{asset.symbol}</div>
                    {asset.name && (
                      <div className={styles.assetName}>{asset.name}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.assetBody}>
                <div className={styles.assetRow}>
                  <span>Quantité</span>
                  <span>{asset.totalQuantity}</span>
                </div>
                <div className={styles.assetRow}>
                  <span>Montant investi</span>
                  <span>{asset.costBasis.toFixed(2)} €</span>
                </div>
                <div className={styles.assetRow}>
                  <span>Valeur actuelle</span>
                  <span>
                    {asset.currentValue != null
                      ? `${asset.currentValue.toFixed(2)} €`
                      : "—"}
                  </span>
                </div>
                <div className={styles.assetRow}>
                  <span>Performance</span>
                  <span
                    className={
                      asset.pnlAbs != null
                        ? asset.pnlAbs > 0
                          ? styles.positive
                          : asset.pnlAbs < 0
                            ? styles.negative
                            : ""
                        : styles.muted
                    }
                  >
                    {asset.pnlAbs != null && asset.pnlPct != null
                      ? `${asset.pnlAbs >= 0 ? "+" : ""}${asset.pnlAbs.toFixed(
                        2
                      )} € (${asset.pnlPct.toFixed(1)} %)`
                      : "—"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* TABLEAU DÉTAILLÉ DES LIGNES */}
      <section className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>Lignes d&apos;achat</h2>

        {error && <div className={styles.errorBox}>{error}</div>}
        {loading && <div className={styles.loadingBox}>Chargement...</div>}

        {!loading && rows.length === 0 && (
          <div className={styles.emptyStateSmall}>
            Tu n&apos;as pas encore enregistré de ligne d&apos;achat.
          </div>
        )}

        {rows.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Crypto</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Montant total</th>
                  <th>Valeur actuelle</th>
                  <th>Performance</th>
                  <th>Date d&apos;achat</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  // Calculer la valeur actuelle et la performance
                  const currentPrice = pricesBySymbol[row.symbol.toUpperCase()];
                  const currentValue = currentPrice ? row.quantity * currentPrice : undefined;
                  const pnl = currentValue !== undefined ? currentValue - row.buyTotal : undefined;
                  const pnlPct = pnl !== undefined && row.buyTotal > 0 ? (pnl / row.buyTotal) * 100 : undefined;

                  return (
                    <tr key={row.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.tableCryptoCell}>
                          {row.logoUrl ? (
                            <img
                              src={row.logoUrl}
                              alt={row.symbol}
                              className={styles.tableCryptoLogo}
                            />
                          ) : (
                            <div className={styles.tableCryptoLogoPlaceholder}>
                              {row.symbol[0] ?? "?"}
                            </div>
                          )}
                          <div className={styles.tableCryptoInfo}>
                            <span className={styles.tableCryptoSymbol}>{row.symbol}</span>
                            {row.name && (
                              <span className={styles.tableCryptoName}>{row.name}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.quantityBadge}>{row.quantity}</span>
                      </td>
                      <td>{row.buyPriceUnit.toFixed(4)} {row.buyCurrency}</td>
                      <td>
                        <span className={styles.amountValue}>{row.buyTotal.toFixed(2)} {row.buyCurrency}</span>
                      </td>
                      <td>
                        {currentValue !== undefined ? (
                          <span className={styles.currentValue}>
                            {currentValue.toFixed(2)} {currency}
                          </span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        {pnl !== undefined && pnlPct !== undefined ? (
                          <div className={styles.performanceCell}>
                            <span className={`${styles.performanceValue} ${pnl > 0 ? styles.positive : pnl < 0 ? styles.negative : styles.neutral}`}>
                              {pnl >= 0 ? '↗' : '↘'} {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} {currency}
                            </span>
                            <span className={`${styles.performancePct} ${pnl > 0 ? styles.positive : pnl < 0 ? styles.negative : styles.neutral}`}>
                              ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.dateValue}>{row.buyDate}</span>
                      </td>
                      <td className={styles.tableNotes}>
                        {row.notes || <span className={styles.muted}>—</span>}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={async () => {
                            if (!window.confirm("Supprimer cette ligne ?")) return;
                            try {
                              await deletePosition(row.id);
                            } catch (err: any) {
                              console.error(err);
                              alert(err.message || "Erreur lors de la suppression");
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
        )}
      </section>

      {addModalOpen && (
        <AddCryptoModal
          defaultCurrency={currency}
          onClose={() => setAddModalOpen(false)}
          onSubmit={async (payload) => {
            try {
              await addPosition(payload);
            } catch (err: any) {
              console.error(err);
              alert(err.message || "Erreur lors de l’ajout de la position");
            }
          }}
        />
      )}
    </div>
  );
}

/* =====================================================
 *  Modal d'ajout de position crypto + autocomplete symbole
 * ===================================================== */

type AddCryptoModalProps = {
  onClose: () => void;
  onSubmit: (payload: NewCryptoPayload) => Promise<void> | void;
  defaultCurrency?: string;
};

type CoinSuggestion = {
  symbol: string;
  name: string;
  logoUrl?: string;
};

function AddCryptoModal({ onClose, onSubmit, defaultCurrency = "EUR" }: AddCryptoModalProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState("");
  const [buyPriceUnit, setBuyPriceUnit] = useState("");
  const [buyTotal, setBuyTotal] = useState("");
  const [buyCurrency, setBuyCurrency] = useState(defaultCurrency);
  const [buyDate, setBuyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<CoinSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const symbolInputRef = useRef<HTMLInputElement | null>(null); // 👈 nouveau

  function handleSymbolChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSymbol(value.toUpperCase());
    setSearchError(null);
    setLogoUrl(undefined);

    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // On va rouvrir la liste parce qu'on tape
    setShowSuggestions(true);

    // Debounce
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await fetch(`/api/crypto/search?q=${encodeURIComponent(value)}`);
        if (!res.ok) throw new Error("Erreur lors de la recherche de cryptos");
        const json = await res.json();
        const list = (json.suggestions || []) as CoinSuggestion[];
        setSuggestions(list);
      } catch (err: any) {
        console.error(err);
        setSearchError(err.message || "Erreur lors de la recherche");
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250) as unknown as number;
  }

  function handleSuggestionClick(s: CoinSuggestion) {
    setSymbol(s.symbol.toUpperCase());
    setName(s.name);
    setLogoUrl(s.logoUrl);
    setSuggestions([]);
    setSearchError(null);
    setShowSuggestions(false);

    // 👇 On enlève le focus du champ pour éviter la réouverture
    if (symbolInputRef.current) {
      symbolInputRef.current.blur();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity.replace(",", "."));
    const unit = buyPriceUnit ? Number(buyPriceUnit.replace(",", ".")) : undefined;
    const total = buyTotal ? Number(buyTotal.replace(",", ".")) : undefined;

    if (!symbol.trim() || !Number.isFinite(qty) || qty <= 0 || !buyCurrency || !buyDate) {
      alert("Merci de vérifier les champs obligatoires (crypto, quantité, devise, date).");
      return;
    }

    try {
      setLoading(true);

      const payload: NewCryptoPayload = {
        symbol: symbol.trim().toUpperCase(),
        name: name.trim() || undefined,
        logoUrl,
        quantity: qty,
        buyPriceUnit: unit,
        buyTotal: total,
        buyCurrency,
        buyDate,
        notes: notes.trim() || undefined,
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Ajouter une position crypto</h2>
        <p className={styles.modalSubtitle}>
          Renseigne une nouvelle ligne d&apos;achat. Le montant total ou le prix unitaire
          peut être calculé automatiquement.
        </p>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>
              Crypto (symbole)
              <div className={styles.symbolWrapper}>
                <input
                  ref={symbolInputRef}
                  className={styles.modalInput}
                  placeholder="BTC, ETH, SOL..."
                  value={symbol}
                  onChange={handleSymbolChange}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
                {showSuggestions && (
                  <div className={styles.symbolSuggestions}>
                    {searchLoading && (
                      <div className={styles.suggestionEmpty}>Recherche...</div>
                    )}
                    {searchError && (
                      <div className={styles.suggestionEmpty}>
                        {searchError}
                      </div>
                    )}
                    {!searchLoading &&
                      !searchError &&
                      suggestions.map((s) => (
                        <div
                          key={`${s.symbol}-${s.name}`}
                          className={styles.suggestionItem}
                          onClick={() => handleSuggestionClick(s)}
                        >
                          {s.logoUrl && (
                            <img
                              src={s.logoUrl}
                              alt={s.symbol}
                              className={styles.suggestionLogo}
                            />
                          )}
                          <div>
                            <div className={styles.suggestionSymbol}>{s.symbol}</div>
                            <div className={styles.suggestionName}>{s.name}</div>
                          </div>
                        </div>
                      ))}
                    {!searchLoading &&
                      !searchError &&
                      suggestions.length === 0 &&
                      symbol.trim() && (
                        <div className={styles.suggestionEmpty}>
                          Aucune crypto trouvée pour &quot;{symbol}&quot;
                        </div>
                      )}
                  </div>
                )}
              </div>
            </label>

            <label className={styles.modalLabel}>
              Nom
              <input
                className={styles.modalInput}
                placeholder="Bitcoin, Ethereum..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>
              Quantité
              <input
                className={styles.modalInput}
                type="number"
                step="0.00000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>

            <label className={styles.modalLabel}>
              Devise d&apos;achat
              <input
                className={styles.modalInput}
                value={buyCurrency}
                onChange={(e) => setBuyCurrency(e.target.value.toUpperCase())}
              />
            </label>

            <label className={styles.modalLabel}>
              Date d&apos;achat
              <input
                className={styles.modalInput}
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>
              Prix unitaire
              <input
                className={styles.modalInput}
                type="number"
                step="0.00000001"
                placeholder="Laisse vide si tu préfères saisir le montant total"
                value={buyPriceUnit}
                onChange={(e) => setBuyPriceUnit(e.target.value)}
              />
            </label>

            <label className={styles.modalLabel}>
              Montant total
              <input
                className={styles.modalInput}
                type="number"
                step="0.01"
                placeholder="Laisse vide si tu préfères saisir le prix unitaire"
                value={buyTotal}
                onChange={(e) => setBuyTotal(e.target.value)}
              />
            </label>
          </div>

          <label className={styles.modalLabel}>
            Notes (optionnel)
            <textarea
              className={styles.modalTextarea}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

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
              disabled={loading || !symbol.trim() || !quantity}
            >
              {loading ? "Ajout..." : "Ajouter la position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
