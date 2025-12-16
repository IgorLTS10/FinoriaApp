// src/utils/calculations.test.ts
// Tests unitaires pour les fonctions de calcul financier

import { describe, it, expect } from 'vitest';
import {
    calculateTotalDividends,
    calculateROI,
    formatCurrency,
    calculateYield,
} from './calculations';

/**
 * EXPLICATION DES TESTS UNITAIRES :
 * 
 * Les tests unitaires vérifient qu'une fonction fait exactement ce qu'elle doit faire.
 * Structure d'un test :
 * - describe() : Groupe les tests d'une même fonctionnalité
 * - it() ou test() : Définit un cas de test spécifique
 * - expect() : Vérifie que le résultat correspond à ce qu'on attend
 */

describe('calculateTotalDividends', () => {
    it('devrait calculer correctement le total des dividendes', () => {
        // Arrange : Préparer les données de test
        const dividends = [
            { amount: 100 },
            { amount: 50 },
            { amount: 25.50 },
        ];

        // Act : Exécuter la fonction à tester
        const result = calculateTotalDividends(dividends);

        // Assert : Vérifier le résultat
        expect(result).toBe(175.50);
    });

    it('devrait retourner 0 pour un tableau vide', () => {
        const result = calculateTotalDividends([]);
        expect(result).toBe(0);
    });

    it('devrait gérer les montants négatifs', () => {
        const dividends = [
            { amount: 100 },
            { amount: -20 }, // Frais ou correction
        ];
        const result = calculateTotalDividends(dividends);
        expect(result).toBe(80);
    });
});

describe('calculateROI', () => {
    it('devrait calculer le ROI positif correctement', () => {
        // Investi 1000€, vaut maintenant 1200€ = +20% ROI
        const result = calculateROI(1000, 1200);
        expect(result).toBe(20);
    });

    it('devrait calculer le ROI négatif correctement', () => {
        // Investi 1000€, vaut maintenant 800€ = -20% ROI
        const result = calculateROI(1000, 800);
        expect(result).toBe(-20);
    });

    it('devrait retourner 0 si investissement initial est 0', () => {
        // Évite la division par zéro
        const result = calculateROI(0, 100);
        expect(result).toBe(0);
    });

    it('devrait gérer les décimales correctement', () => {
        // Investi 1000€, vaut 1155€ = +15.5% ROI
        const result = calculateROI(1000, 1155);
        expect(result).toBe(15.5);
    });
});

describe('formatCurrency', () => {
    it('devrait formater un nombre en euros avec 2 décimales par défaut', () => {
        const result = formatCurrency(1234.56);
        // En français, on utilise l'espace insécable étroit (U+202F) comme séparateur de milliers
        expect(result).toBe('1 234,56 €');
    });

    it('devrait formater avec le nombre de décimales spécifié', () => {
        const result = formatCurrency(1234.5678, 3);
        expect(result).toBe('1 234,568 €');
    });

    it('devrait gérer les nombres négatifs', () => {
        const result = formatCurrency(-500);
        expect(result).toBe('-500,00 €');
    });

    it('devrait arrondir correctement', () => {
        const result = formatCurrency(10.999);
        // Arrondi à 2 décimales = 11.00
        expect(result).toBe('11,00 €');
    });
});

describe('calculateYield', () => {
    it('devrait calculer le rendement correctement', () => {
        // 50€ de dividendes sur 1000€ investi = 5% de rendement
        const result = calculateYield(50, 1000);
        expect(result).toBe(5);
    });

    it('devrait retourner 0 si investissement est 0', () => {
        const result = calculateYield(50, 0);
        expect(result).toBe(0);
    });

    it('devrait gérer les petits rendements avec précision', () => {
        // 12.50€ de dividendes sur 1000€ = 1.25%
        const result = calculateYield(12.50, 1000);
        expect(result).toBe(1.25);
    });
});

/**
 * BONNES PRATIQUES DÉMONTRÉES :
 * 
 * 1. Nommage clair : Les noms de tests décrivent ce qui est testé
 * 2. Arrange-Act-Assert : Structure claire de chaque test
 * 3. Cas limites : Tester les valeurs 0, négatives, vides
 * 4. Précision : Vérifier les calculs avec décimales
 * 5. Isolation : Chaque test est indépendant
 */
