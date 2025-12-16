# Guide de Tests pour FinoriaApp 🧪

Ce guide t'explique comment utiliser les tests dans ton projet FinoriaApp.

## Table des matières

1. [Démarrage rapide](#démarrage-rapide)
2. [Comprendre les types de tests](#comprendre-les-types-de-tests)
3. [Écrire des tests](#écrire-des-tests)
4. [Mocking (simulation)](#mocking-simulation)
5. [Couverture de code](#couverture-de-code)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Dépannage](#dépannage)

---

## Démarrage rapide

### Lancer les tests

```bash
# Lancer tous les tests (mode watch - se relance automatiquement)
npm test

# Lancer les tests une seule fois
npm test -- --run

# Lancer un fichier de test spécifique
npm test -- calculations.test.ts

# Lancer les tests avec l'interface visuelle
npm run test:ui

# Générer un rapport de couverture
npm run test:coverage
```

### Structure des fichiers

Les tests sont placés **à côté du code** qu'ils testent :

```
src/
  utils/
    calculations.ts          ← Code source
    calculations.test.ts     ← Tests
  components/
    MyComponent.tsx          ← Composant
    MyComponent.test.tsx     ← Tests du composant
```

---

## Comprendre les types de tests

### 1️⃣ Tests unitaires

**Quoi ?** Testent une fonction isolée.

**Quand ?** Pour les fonctions utilitaires, calculs, formatage.

**Exemple :**
```typescript
// calculations.test.ts
it('devrait calculer le ROI correctement', () => {
  const result = calculateROI(1000, 1200);
  expect(result).toBe(20); // +20% de ROI
});
```

**Avantages :**
- ✅ Très rapides
- ✅ Faciles à écrire
- ✅ Détectent les bugs dans la logique

---

### 2️⃣ Tests de composants

**Quoi ?** Testent qu'un composant React s'affiche correctement.

**Quand ?** Pour les composants UI, surtout ceux avec de la logique.

**Exemple :**
```typescript
// DividendsChart.test.tsx
it('devrait afficher le titre', () => {
  render(<DividendsChart projects={mockData} period="month" />);
  expect(screen.getByText(/Dividendes/i)).toBeInTheDocument();
});
```

**Avantages :**
- ✅ Testent du point de vue utilisateur
- ✅ Détectent les problèmes d'affichage
- ✅ Documentent comment utiliser le composant

---

### 3️⃣ Tests d'API

**Quoi ?** Testent les endpoints API (handlers Vercel).

**Quand ?** Pour les routes API qui traitent des données importantes.

**Exemple :**
```typescript
// stocks-search.test.ts
it('devrait retourner des résultats', async () => {
  await handleStockSearch(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(200);
});
```

**Avantages :**
- ✅ Vérifient la logique serveur
- ✅ Testent la gestion d'erreurs
- ✅ Garantissent la structure des réponses

---

## Écrire des tests

### Anatomie d'un test

```typescript
import { describe, it, expect } from 'vitest';

describe('Nom de la fonctionnalité', () => {
  it('devrait faire quelque chose de spécifique', () => {
    // 1. ARRANGE : Préparer les données
    const input = 100;
    
    // 2. ACT : Exécuter le code à tester
    const result = maFonction(input);
    
    // 3. ASSERT : Vérifier le résultat
    expect(result).toBe(200);
  });
});
```

### Matchers courants

```typescript
// Égalité stricte
expect(value).toBe(5);

// Égalité d'objets/tableaux
expect(obj).toEqual({ name: 'Test' });

// Vérifier qu'un élément existe
expect(screen.getByText('Hello')).toBeInTheDocument();

// Vérifier qu'une fonction a été appelée
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

// Tableaux
expect(array).toHaveLength(3);
expect(array).toContain('item');

// Nombres
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(100);

// Booléens
expect(value).toBeTruthy();
expect(value).toBeFalsy();
```

### Tester les composants React

```typescript
import { render, screen } from '@/test/test-utils';
import MyComponent from './MyComponent';

it('devrait afficher le composant', () => {
  // Render le composant
  render(<MyComponent title="Test" />);
  
  // Chercher des éléments (comme un utilisateur)
  const heading = screen.getByRole('heading', { name: /test/i });
  expect(heading).toBeInTheDocument();
  
  // Par texte
  expect(screen.getByText('Test')).toBeInTheDocument();
  
  // Par label (pour les inputs)
  const input = screen.getByLabelText('Email');
  expect(input).toBeInTheDocument();
});
```

---

## Mocking (simulation)

Le mocking permet de **simuler** des dépendances externes (API, modules, etc.).

### Pourquoi mocker ?

- 🚀 **Rapidité** : Pas besoin d'appeler de vraies API
- 🎯 **Contrôle** : On décide exactement ce qui est retourné
- 🔒 **Isolation** : On teste NOTRE code, pas les dépendances
- 💰 **Gratuit** : Pas de coûts d'API

### Mocker un module

```typescript
import { vi } from 'vitest';

// Remplacer tout le module
vi.mock('yahoo-finance2', () => ({
  default: {
    search: vi.fn(),
  },
}));

// Utiliser le mock dans les tests
import yahooFinance from 'yahoo-finance2';

it('test', () => {
  vi.mocked(yahooFinance.search).mockResolvedValue({ data: 'test' });
  // ... ton test
});
```

### Mocker une fonction

```typescript
const mockCallback = vi.fn();

// Définir ce que la fonction retourne
mockCallback.mockReturnValue(42);
mockCallback.mockResolvedValue('async result');

// Vérifier qu'elle a été appelée
expect(mockCallback).toHaveBeenCalled();
expect(mockCallback).toHaveBeenCalledTimes(2);
expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
```

---

## Couverture de code

La **couverture** mesure quel pourcentage de ton code est testé.

### Générer un rapport

```bash
npm run test:coverage
```

Cela crée un dossier `coverage/` avec un rapport HTML.

### Interpréter les résultats

- **Statements** : % de lignes exécutées
- **Branches** : % de conditions (if/else) testées
- **Functions** : % de fonctions appelées
- **Lines** : % de lignes de code testées

**Objectif réaliste :** 70-80% pour du code critique (calculs, API).

**Ne pas viser :** 100% partout (perte de temps sur du code trivial).

---

## Bonnes pratiques

### ✅ À faire

1. **Nommer clairement les tests**
   ```typescript
   ✅ it('devrait calculer le ROI avec des décimales')
   ❌ it('test ROI')
   ```

2. **Tester les cas limites**
   - Valeurs nulles, vides, négatives
   - Tableaux vides
   - Erreurs réseau

3. **Un test = une chose**
   ```typescript
   ✅ it('devrait formater en euros')
   ✅ it('devrait gérer les nombres négatifs')
   
   ❌ it('devrait formater et gérer les négatifs') // Trop de choses
   ```

4. **Utiliser des données réalistes**
   ```typescript
   ✅ const mockProject = { name: 'Immeuble Paris 15', invested: 1000 }
   ❌ const mockProject = { name: 'a', invested: 1 }
   ```

5. **Tester du point de vue utilisateur**
   ```typescript
   ✅ screen.getByText('Connexion')
   ❌ wrapper.find('.btn-login')
   ```

### ❌ À éviter

1. **Tester l'implémentation**
   ```typescript
   ❌ expect(component.state.count).toBe(5) // Détails internes
   ✅ expect(screen.getByText('5')).toBeInTheDocument() // Ce que voit l'utilisateur
   ```

2. **Tests trop fragiles**
   ```typescript
   ❌ expect(element.className).toBe('btn btn-primary') // Casse si CSS change
   ✅ expect(button).toBeEnabled()
   ```

3. **Dupliquer le code testé**
   ```typescript
   ❌ expect(calculateROI(1000, 1200)).toBe((1200 - 1000) / 1000 * 100)
   ✅ expect(calculateROI(1000, 1200)).toBe(20)
   ```

---

## Dépannage

### Problème : "Cannot find module '@/test/test-utils'"

**Solution :** Vérifie que `vitest.config.ts` a bien l'alias configuré :
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Problème : "document is not defined"

**Solution :** Assure-toi que `vitest.config.ts` utilise `environment: 'happy-dom'`.

### Problème : Les tests passent mais le code est cassé

**Cause :** Tests trop superficiels ou qui testent la mauvaise chose.

**Solution :** Vérifie que tu testes le **comportement**, pas l'implémentation.

### Problème : Les tests sont lents

**Solutions :**
- Utilise des mocks pour les appels API
- Évite de tester les bibliothèques externes (Recharts, etc.)
- Lance seulement les tests modifiés : `npm test -- --changed`

### Problème : "ReferenceError: describe is not defined"

**Solution :** Ajoute `globals: true` dans `vitest.config.ts` :
```typescript
test: {
  globals: true,
}
```

---

## Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Exemples dans ce projet](./src/utils/calculations.test.ts)

---

## Prochaines étapes

1. **Commence petit** : Teste d'abord les fonctions utilitaires
2. **Ajoute des tests pour les bugs** : Quand tu fixes un bug, écris un test
3. **Teste les composants critiques** : Ceux qui gèrent l'argent
4. **Automatise** : Configure les tests pour qu'ils tournent avant chaque commit

Bon testing ! 🚀
