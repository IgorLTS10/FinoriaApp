// src/pages/Dashboard/Crowdfunding/components/DividendsChart.test.tsx
// Tests de composant pour DividendsChart

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DividendsChart from './DividendsChart';
import type { CrowdfundingProject } from '../hooks/useCrowdfunding';

// Mock platform colors for tests
const mockPlatformColors: Record<string, string> = {
    "Bricks": "#f59e0b",
    "Bienpreter": "#8b5cf6",
    "Anaxago": "#10b981",
};

/**
 * EXPLICATION DES TESTS DE COMPOSANTS :
 * 
 * Les tests de composants vérifient que l'interface utilisateur se comporte correctement.
 * On teste du point de vue de l'utilisateur, pas de l'implémentation.
 * 
 * Outils utilisés :
 * - render() : Affiche le composant dans un DOM virtuel
 * - screen : Permet de chercher des éléments comme le ferait un utilisateur
 * - expect() : Vérifie que l'élément existe, contient du texte, etc.
 */

// Données de test (mock data)
const mockProjects: CrowdfundingProject[] = [
    {
        id: '1',
        userId: 'test-user',
        name: 'Projet Test Bricks',
        platform: 'Bricks',
        amountInvested: 1000,
        yieldPercent: 8,
        startDate: '2024-01-15',
        durationMonths: 24,
        status: 'active',
        createdAt: '2024-01-15T00:00:00Z',
        received: 100,
        refunded: 0,
        transactions: [
            {
                id: 't1',
                projectId: '1',
                type: 'dividend',
                amount: 50,
                date: '2024-02-01',
                createdAt: '2024-02-01T00:00:00Z',
            },
            {
                id: 't2',
                projectId: '1',
                type: 'dividend',
                amount: 50,
                date: '2024-03-01',
                createdAt: '2024-03-01T00:00:00Z',
            },
        ],
    },
    {
        id: '2',
        userId: 'test-user',
        name: 'Projet Test Anaxago',
        platform: 'Anaxago',
        amountInvested: 500,
        yieldPercent: 10,
        startDate: '2024-02-10',
        durationMonths: 18,
        status: 'active',
        createdAt: '2024-02-10T00:00:00Z',
        received: 25,
        refunded: 0,
        transactions: [
            {
                id: 't3',
                projectId: '2',
                type: 'dividend',
                amount: 25,
                date: '2024-03-01',
                createdAt: '2024-03-01T00:00:00Z',
            },
        ],
    },
];

describe('DividendsChart', () => {
    it('devrait afficher le titre du graphique', () => {
        // Render : Affiche le composant
        render(
            <DividendsChart
                projects={mockProjects}
                period="month"
                platformColors={mockPlatformColors}
            />
        );

        // Assert : Vérifie que le titre est présent
        // On utilise une regex pour être flexible avec le texte exact
        expect(screen.getByText(/Dividendes et investissements par mois/i)).toBeInTheDocument();
    });

    it('devrait afficher un message quand il n\'y a pas de données', () => {
        // Cas limite : tableau vide
        render(
            <DividendsChart
                projects={[]}
                period="month"
                platformColors={mockPlatformColors}
            />
        );

        // Vérifie que le message "Aucune donnée" est affiché
        expect(screen.getByText(/Aucune donnée de dividendes à afficher/i)).toBeInTheDocument();
    });

    it('devrait afficher le graphique avec des données', () => {
        render(
            <DividendsChart
                projects={mockProjects}
                period="month"
                platformColors={mockPlatformColors}
            />
        );

        // Vérifie que le conteneur du graphique existe (pas le message d'erreur)
        // On ne teste pas le rendu interne de Recharts, juste que le composant ne crash pas
        expect(screen.queryByText(/Aucune donnée de dividendes à afficher/i)).not.toBeInTheDocument();

        // Vérifie que le titre est présent (donc le graphique est affiché)
        expect(screen.getByText(/Dividendes et investissements/i)).toBeInTheDocument();
    });

    it('devrait changer le titre selon la période sélectionnée', () => {
        // Test avec période "quarter"
        render(
            <DividendsChart
                projects={mockProjects}
                period="quarter"
                platformColors={mockPlatformColors}
            />
        );

        expect(screen.getByText(/par trimestre/i)).toBeInTheDocument();

        // Rerender avec période "year"
        render(
            <DividendsChart
                projects={mockProjects}
                period="year"
                platformColors={mockPlatformColors}
            />
        );

        expect(screen.getByText(/par année/i)).toBeInTheDocument();
    });

    it('devrait filtrer les données selon les dates fournies', () => {
        // Test avec filtre de dates
        render(
            <DividendsChart
                projects={mockProjects}
                period="month"
                startDate="2024-01-01"
                endDate="2024-06-30"
                platformColors={mockPlatformColors}
            />
        );

        // Le graphique devrait s'afficher (même avec filtres)
        expect(screen.getByText(/Dividendes et investissements/i)).toBeInTheDocument();
    });
});

/**
 * BONNES PRATIQUES DÉMONTRÉES :
 * 
 * 1. Mock data réaliste : Données de test qui ressemblent aux vraies données
 * 2. Tests du comportement : On teste ce que l'utilisateur voit, pas le code
 * 3. Cas limites : Tester avec données vides, différentes périodes
 * 4. Queries accessibles : Utiliser getByText, getByRole (comme un utilisateur)
 * 5. Isolation : Chaque test est indépendant
 * 
 * LIMITATIONS DE CES TESTS :
 * 
 * - On ne teste pas les interactions (clics, hover)
 * - On ne teste pas le rendu exact du graphique Recharts (bibliothèque externe)
 * - On se concentre sur la logique du composant et l'affichage conditionnel
 * 
 * Pour des tests plus avancés, on pourrait :
 * - Tester les tooltips avec userEvent.hover()
 * - Vérifier les couleurs des plateformes
 * - Tester le tri des données
 */
