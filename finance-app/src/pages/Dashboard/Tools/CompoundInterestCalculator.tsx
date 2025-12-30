import { useState, useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import styles from "./CompoundInterestCalculator.module.css";

type FrequencyType = "monthly" | "quarterly" | "yearly";

export default function CompoundInterestCalculator() {
    const [principal, setPrincipal] = useState(10000);
    const [monthlyContribution, setMonthlyContribution] = useState(500);
    const [annualRate, setAnnualRate] = useState(5);
    const [years, setYears] = useState(10);
    const [frequency, setFrequency] = useState<FrequencyType>("monthly");

    // Calcul des intérêts composés
    const results = useMemo(() => {
        const r = annualRate / 100;
        const n = frequency === "monthly" ? 12 : frequency === "quarterly" ? 4 : 1;
        const t = years;
        const pmt = monthlyContribution;

        // Calcul du montant final avec contributions
        const compoundFactor = Math.pow(1 + r / n, n * t);
        const principalAmount = principal * compoundFactor;

        // Calcul de la valeur future des contributions mensuelles
        let contributionAmount = 0;
        if (pmt > 0) {
            contributionAmount = pmt * 12 * (((compoundFactor - 1) / (r / n)) / n);
        }

        const finalAmount = principalAmount + contributionAmount;
        const totalInvested = principal + (pmt * 12 * t);
        const totalInterest = finalAmount - totalInvested;

        // Données pour le graphique (année par année)
        const chartData = [];
        for (let year = 0; year <= years; year++) {
            const yearCompoundFactor = Math.pow(1 + r / n, n * year);
            const yearPrincipal = principal * yearCompoundFactor;

            let yearContribution = 0;
            if (pmt > 0 && year > 0) {
                yearContribution = pmt * 12 * (((yearCompoundFactor - 1) / (r / n)) / n);
            }

            const yearTotal = yearPrincipal + yearContribution;
            const yearInvested = principal + (pmt * 12 * year);
            const yearInterest = yearTotal - yearInvested;

            chartData.push({
                year: `Année ${year}`,
                invested: Math.round(yearInvested),
                interest: Math.round(yearInterest),
                total: Math.round(yearTotal),
            });
        }

        return {
            finalAmount: Math.round(finalAmount),
            totalInvested: Math.round(totalInvested),
            totalInterest: Math.round(totalInterest),
            chartData,
        };
    }, [principal, monthlyContribution, annualRate, years, frequency]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className={styles.tooltip}>
                <div className={styles.tooltipLabel}>{payload[0].payload.year}</div>
                <div className={styles.tooltipItem}>
                    <span className={styles.tooltipDot} style={{ backgroundColor: "#3b82f6" }}></span>
                    <span>Investi: {payload[0].value.toLocaleString("fr-FR")} €</span>
                </div>
                <div className={styles.tooltipItem}>
                    <span className={styles.tooltipDot} style={{ backgroundColor: "#10b981" }}></span>
                    <span>Intérêts: {payload[1].value.toLocaleString("fr-FR")} €</span>
                </div>
                <div className={styles.tooltipItem}>
                    <span className={styles.tooltipDot} style={{ backgroundColor: "#f59e0b" }}></span>
                    <span>Total: {payload[2].value.toLocaleString("fr-FR")} €</span>
                </div>
            </div>
        );
    };

    console.log("CompoundInterestCalculator rendering", { results, styles });

    return (
        <div className={styles.page} style={{ color: '#fff', minHeight: '100vh' }}>
            <div className={styles.header}>
                <h1 className={styles.title} style={{ color: '#fff', fontSize: '2rem' }}>Calculatrice d'Intérêts Composés</h1>
                <p className={styles.subtitle} style={{ color: '#9ca3af' }}>Simulez la croissance de votre capital avec les intérêts composés</p>
            </div>

            <div className={styles.container}>
                {/* Formulaire */}
                <div className={styles.formCard}>
                    <h2 className={styles.cardTitle}>Paramètres</h2>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            Montant initial
                            <span className={styles.value}>{principal.toLocaleString("fr-FR")} €</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100000"
                            step="1000"
                            value={principal}
                            onChange={(e) => setPrincipal(Number(e.target.value))}
                            className={styles.slider}
                        />
                        <input
                            type="number"
                            value={principal}
                            onChange={(e) => setPrincipal(Number(e.target.value))}
                            className={styles.numberInput}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            Contribution mensuelle
                            <span className={styles.value}>{monthlyContribution.toLocaleString("fr-FR")} €</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="5000"
                            step="50"
                            value={monthlyContribution}
                            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                            className={styles.slider}
                        />
                        <input
                            type="number"
                            value={monthlyContribution}
                            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                            className={styles.numberInput}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            Taux d'intérêt annuel
                            <span className={styles.value}>{annualRate} %</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            step="0.1"
                            value={annualRate}
                            onChange={(e) => setAnnualRate(Number(e.target.value))}
                            className={styles.slider}
                        />
                        <input
                            type="number"
                            value={annualRate}
                            onChange={(e) => setAnnualRate(Number(e.target.value))}
                            className={styles.numberInput}
                            step="0.1"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            Durée
                            <span className={styles.value}>{years} {years > 1 ? "ans" : "an"}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className={styles.slider}
                        />
                        <input
                            type="number"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className={styles.numberInput}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Fréquence de capitalisation</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                            className={styles.select}
                        >
                            <option value="monthly">Mensuelle</option>
                            <option value="quarterly">Trimestrielle</option>
                            <option value="yearly">Annuelle</option>
                        </select>
                    </div>
                </div>

                {/* Résultats */}
                <div className={styles.resultsCard}>
                    <h2 className={styles.cardTitle}>Résultats</h2>

                    <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                            <div className={styles.resultLabel}>Montant final</div>
                            <div className={styles.resultValue} style={{ color: "#f59e0b" }}>
                                {results.finalAmount.toLocaleString("fr-FR")} €
                            </div>
                        </div>

                        <div className={styles.resultItem}>
                            <div className={styles.resultLabel}>Total investi</div>
                            <div className={styles.resultValue} style={{ color: "#3b82f6" }}>
                                {results.totalInvested.toLocaleString("fr-FR")} €
                            </div>
                        </div>

                        <div className={styles.resultItem}>
                            <div className={styles.resultLabel}>Intérêts gagnés</div>
                            <div className={styles.resultValue} style={{ color: "#10b981" }}>
                                +{results.totalInterest.toLocaleString("fr-FR")} €
                            </div>
                        </div>

                        <div className={styles.resultItem}>
                            <div className={styles.resultLabel}>Rendement</div>
                            <div className={styles.resultValue} style={{ color: "#10b981" }}>
                                +{((results.totalInterest / results.totalInvested) * 100).toFixed(1)} %
                            </div>
                        </div>
                    </div>

                    {/* Graphique */}
                    <div className={styles.chartContainer}>
                        <h3 className={styles.chartTitle}>Évolution du capital</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <ComposedChart data={results.chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="year"
                                    stroke="#a0a0a0"
                                    style={{ fontSize: "0.85rem" }}
                                />
                                <YAxis
                                    stroke="#a0a0a0"
                                    style={{ fontSize: "0.85rem" }}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                                <Area
                                    type="monotone"
                                    dataKey="invested"
                                    fill="#3b82f6"
                                    fillOpacity={0.3}
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Investi"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="interest"
                                    fill="#10b981"
                                    fillOpacity={0.3}
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Intérêts"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ fill: "#f59e0b", r: 4 }}
                                    name="Total"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
