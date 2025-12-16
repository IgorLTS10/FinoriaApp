// src/utils/calculations.ts
// Fonctions utilitaires pour les calculs financiers

/**
 * Calcule le total des dividendes à partir d'un tableau de transactions
 * @param dividends - Tableau d'objets contenant les montants de dividendes
 * @returns Le total des dividendes
 */
export function calculateTotalDividends(dividends: { amount: number }[]): number {
    return dividends.reduce((total, dividend) => total + dividend.amount, 0);
}

/**
 * Calcule le retour sur investissement (ROI) en pourcentage
 * @param invested - Montant investi
 * @param currentValue - Valeur actuelle
 * @returns Le ROI en pourcentage (ex: 15.5 pour 15.5%)
 */
export function calculateROI(invested: number, currentValue: number): number {
    if (invested === 0) {
        return 0;
    }
    return ((currentValue - invested) / invested) * 100;
}

/**
 * Formate un nombre en devise (euros)
 * @param amount - Montant à formater
 * @param decimals - Nombre de décimales (par défaut 2)
 * @returns Le montant formaté avec le symbole €
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
    return amount.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }) + ' €';
}

/**
 * Calcule le rendement annuel en pourcentage
 * @param dividends - Total des dividendes reçus
 * @param invested - Montant investi
 * @returns Le rendement en pourcentage
 */
export function calculateYield(dividends: number, invested: number): number {
    if (invested === 0) {
        return 0;
    }
    return (dividends / invested) * 100;
}
