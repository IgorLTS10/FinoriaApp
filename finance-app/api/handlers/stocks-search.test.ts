// api/handlers/stocks-search.test.ts
// Tests pour l'API handler de recherche d'actions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleStockSearch } from './stocks-search';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * EXPLICATION DES TESTS D'API :
 * 
 * Les tests d'API vérifient que les endpoints répondent correctement aux requêtes.
 * On doit "mocker" (simuler) les dépendances externes comme Yahoo Finance.
 * 
 * Concepts importants :
 * - vi.fn() : Crée une fonction "mock" qu'on peut contrôler
 * - vi.mock() : Remplace un module entier par une version mockée
 * - beforeEach() : Code exécuté avant chaque test (pour réinitialiser)
 */

// Mock de Yahoo Finance
// On remplace le vrai module par une version contrôlée
vi.mock('yahoo-finance2', () => ({
    default: {
        search: vi.fn(),
    },
}));

// Import du mock pour pouvoir le contrôler dans les tests
import yahooFinance from 'yahoo-finance2';

describe('handleStockSearch API', () => {
    // Variables pour simuler req et res
    let mockReq: Partial<VercelRequest>;
    let mockRes: Partial<VercelResponse>;
    let jsonMock: ReturnType<typeof vi.fn>;
    let statusMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Réinitialiser les mocks avant chaque test
        vi.clearAllMocks();

        // Créer des mocks pour la réponse
        jsonMock = vi.fn();
        statusMock = vi.fn(() => ({ json: jsonMock }));

        mockRes = {
            status: statusMock as any,
            json: jsonMock,
        };
    });

    it('devrait retourner des résultats pour une recherche valide', async () => {
        // Arrange : Préparer la requête et la réponse mockée de Yahoo Finance
        mockReq = {
            method: 'GET',
            query: { q: 'AAPL' },
        };

        // Simuler la réponse de Yahoo Finance
        const mockYahooResponse = {
            quotes: [
                {
                    symbol: 'AAPL',
                    longname: 'Apple Inc.',
                    shortname: 'Apple',
                    quoteType: 'EQUITY',
                    exchange: 'NASDAQ',
                },
            ],
        };

        vi.mocked(yahooFinance.search).mockResolvedValue(mockYahooResponse as any);

        // Act : Appeler le handler
        await handleStockSearch(mockReq as VercelRequest, mockRes as VercelResponse);

        // Assert : Vérifier la réponse
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            results: expect.arrayContaining([
                expect.objectContaining({
                    symbol: 'AAPL',
                    name: 'Apple Inc.',
                    exchange: 'NASDAQ',
                }),
            ]),
        });
    });

    it('devrait retourner un tableau vide pour une recherche vide', async () => {
        mockReq = {
            method: 'GET',
            query: { q: '' },
        };

        await handleStockSearch(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ results: [] });
    });

    it('devrait retourner 405 pour une méthode non-GET', async () => {
        mockReq = {
            method: 'POST',
            query: { q: 'AAPL' },
        };

        await handleStockSearch(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(statusMock).toHaveBeenCalledWith(405);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Method POST not allowed' });
    });

    it('devrait gérer les erreurs de Yahoo Finance', async () => {
        mockReq = {
            method: 'GET',
            query: { q: 'INVALID' },
        };

        // Simuler une erreur de Yahoo Finance
        vi.mocked(yahooFinance.search).mockRejectedValue(new Error('API Error'));

        await handleStockSearch(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'API Error' });
    });

    it('devrait filtrer pour ne garder que les EQUITY et ETF', async () => {
        mockReq = {
            method: 'GET',
            query: { q: 'TEST' },
        };

        const mockYahooResponse = {
            quotes: [
                { symbol: 'TEST1', quoteType: 'EQUITY', longname: 'Test Equity' },
                { symbol: 'TEST2', quoteType: 'ETF', longname: 'Test ETF' },
                { symbol: 'TEST3', quoteType: 'INDEX', longname: 'Test Index' }, // Devrait être filtré
                { symbol: 'TEST4', quoteType: 'CURRENCY', longname: 'Test Currency' }, // Devrait être filtré
            ],
        };

        vi.mocked(yahooFinance.search).mockResolvedValue(mockYahooResponse as any);

        await handleStockSearch(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(jsonMock).toHaveBeenCalledWith({
            results: expect.arrayContaining([
                expect.objectContaining({ symbol: 'TEST1' }),
                expect.objectContaining({ symbol: 'TEST2' }),
            ]),
        });

        // Vérifier que les résultats ne contiennent que 2 éléments
        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.results).toHaveLength(2);
    });

    it('devrait limiter les résultats à 10', async () => {
        mockReq = {
            method: 'GET',
            query: { q: 'A' },
        };

        // Créer 15 résultats mockés
        const mockQuotes = Array.from({ length: 15 }, (_, i) => ({
            symbol: `STOCK${i}`,
            quoteType: 'EQUITY',
            longname: `Stock ${i}`,
        }));

        vi.mocked(yahooFinance.search).mockResolvedValue({ quotes: mockQuotes } as any);

        await handleStockSearch(mockReq as VercelRequest, mockRes as VercelResponse);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.results).toHaveLength(10);
    });
});

/**
 * BONNES PRATIQUES DÉMONTRÉES :
 * 
 * 1. Mocking : Simuler les dépendances externes (Yahoo Finance)
 * 2. beforeEach : Réinitialiser l'état avant chaque test
 * 3. Tests des cas d'erreur : Vérifier la gestion des erreurs
 * 4. Tests de validation : Vérifier les validations (méthode, query vide)
 * 5. Tests de logique métier : Vérifier le filtrage et la limitation
 * 
 * POURQUOI MOCKER ?
 * 
 * - Rapidité : Pas besoin d'appeler la vraie API (lent, coûteux)
 * - Fiabilité : Les tests ne dépendent pas d'un service externe
 * - Contrôle : On peut simuler des erreurs, des cas limites
 * - Isolation : On teste NOTRE code, pas Yahoo Finance
 */
