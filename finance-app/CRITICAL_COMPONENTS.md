# Composants Critiques à Tester - FinoriaApp 🎯

Ce document identifie les parties de l'application qui **doivent absolument** être testées en priorité, car elles gèrent des données financières critiques.

## Priorités de test

### 🔴 PRIORITÉ HAUTE (À tester en premier)

Ces composants gèrent de l'argent ou des calculs financiers critiques.

#### 1. Calculs financiers

**Fichiers :**
- `src/utils/calculations.ts` ✅ **Déjà testé**

**Pourquoi ?**
- Calculs d'argent = zéro tolérance pour les erreurs
- Bugs = perte financière ou mauvaises décisions

**À tester :**
- ✅ ROI (Return on Investment)
- ✅ Rendement (Yield)
- ✅ Formatage de devises
- ✅ Totaux de dividendes

---

#### 2. Hooks de données Crowdfunding

**Fichier :** `src/pages/Dashboard/Crowdfunding/hooks/useCrowdfunding.ts`

**Pourquoi ?**
- Gère les investissements et dividendes
- Calcule les totaux et rendements

**À tester :**
- Ajout/suppression de projets
- Calcul du total investi
- Calcul du total des dividendes
- Filtrage par plateforme
- Calcul du rendement moyen

**Exemple de test à créer :**
```typescript
// useCrowdfunding.test.ts
it('devrait calculer le total investi correctement', () => {
  const { result } = renderHook(() => useCrowdfunding());
  
  // Ajouter des projets
  act(() => {
    result.current.addProject({ invested: 1000, ... });
    result.current.addProject({ invested: 500, ... });
  });
  
  expect(result.current.totalInvested).toBe(1500);
});
```

---

#### 3. Hooks de prix des actions

**Fichiers :**
- `src/pages/Dashboard/Actions/hooks/useStockPrices.tsx`
- `src/pages/Dashboard/Actions/hooks/useStockPositions.tsx`

**Pourquoi ?**
- Calcule la valeur du portefeuille
- Gère les gains/pertes

**À tester :**
- Calcul de la valeur totale du portefeuille
- Calcul des gains/pertes
- Mise à jour des prix
- Gestion des devises

---

#### 4. API Handlers

**Fichiers :**
- `api/handlers/stocks-search.ts` ✅ **Déjà testé**
- `api/handlers/stocks.ts`
- `api/handlers/crowdfunding.ts`
- `api/handlers/crypto.ts`

**Pourquoi ?**
- Point d'entrée des données
- Gestion des erreurs critiques
- Validation des données

**À tester :**
- Validation des paramètres
- Gestion des erreurs API
- Format des réponses
- Filtrage des données

---

### 🟡 PRIORITÉ MOYENNE (Tester ensuite)

#### 5. Composants de graphiques

**Fichiers :**
- `src/pages/Dashboard/Crowdfunding/components/DividendsChart.tsx` ✅ **Déjà testé**
- `src/pages/Dashboard/Metaux/components/LineChartBox.tsx`
- `src/pages/Dashboard/Metaux/components/PieChartBox.tsx`

**Pourquoi ?**
- Affichent des données financières
- Logique de groupement/agrégation

**À tester :**
- Affichage avec données vides
- Groupement par période (mois, trimestre, année)
- Filtrage par dates
- Calculs d'agrégation

---

#### 6. Hooks de métaux précieux

**Fichiers :**
- `src/pages/Dashboard/Metaux/hooks/useMetaux.tsx`
- `src/pages/Dashboard/Metaux/hooks/usePortfolioHistory.tsx`
- `src/pages/Dashboard/Metaux/hooks/useFx.ts`

**Pourquoi ?**
- Calculs de valeur avec conversion de devises
- Historique de performance

**À tester :**
- Conversion de devises
- Calcul de la valeur totale
- Historique de performance
- Gestion des taux de change

---

#### 7. Hooks de crypto

**Fichiers :**
- `src/pages/Dashboard/Crypto/hooks/useCryptoPositions.tsx`
- `src/pages/Dashboard/Crypto/hooks/useCryptoPrices.tsx`

**Pourquoi ?**
- Calculs de valeur volatile
- Gestion de multiples cryptos

**À tester :**
- Calcul de la valeur totale
- Mise à jour des prix
- Calcul des gains/pertes

---

### 🟢 PRIORITÉ BASSE (Optionnel)

#### 8. Composants UI simples

**Fichiers :**
- `src/pages/Dashboard/Metaux/components/KpiCards.tsx`
- `src/pages/Dashboard/Actions/components/KpiCardsActions.tsx`
- `src/pages/Dashboard/Metaux/components/Sparkline.tsx`

**Pourquoi ?**
- Affichage simple sans logique complexe
- Faciles à vérifier visuellement

**À tester (si temps disponible) :**
- Affichage des valeurs
- Formatage correct
- Gestion des valeurs nulles

---

#### 9. Modals et formulaires

**Fichiers :**
- `src/pages/Dashboard/Crowdfunding/components/AddProjectModal.tsx`
- `src/pages/Dashboard/Actions/components/AddStockModal.tsx`
- `src/pages/Dashboard/Metaux/components/AddMetalModal.tsx`

**Pourquoi ?**
- Validation des formulaires
- Saisie utilisateur

**À tester (si temps disponible) :**
- Validation des champs
- Soumission du formulaire
- Gestion des erreurs

---

## Plan d'action recommandé

### Phase 1 : Les essentiels (1-2 semaines)

1. ✅ **Calculs financiers** - `calculations.ts` (FAIT)
2. **Hooks Crowdfunding** - `useCrowdfunding.ts`
3. **Hooks Actions** - `useStockPositions.tsx`, `useStockPrices.tsx`
4. ✅ **API Stocks** - `stocks-search.ts` (FAIT)
5. **API Crowdfunding** - `crowdfunding.ts`

**Objectif :** Couvrir 80% des calculs financiers critiques.

---

### Phase 2 : Consolidation (2-3 semaines)

1. **Hooks Métaux** - `useMetaux.tsx`, `useFx.ts`
2. **Hooks Crypto** - `useCryptoPositions.tsx`
3. **API Crypto** - `crypto.ts`
4. **API Métaux** - `metaux.ts`

**Objectif :** Couvrir tous les hooks de données.

---

### Phase 3 : Polissage (optionnel)

1. ✅ **Graphiques** - `DividendsChart.tsx` (FAIT)
2. **Autres graphiques** - `LineChartBox.tsx`, `PieChartBox.tsx`
3. **Modals** - Formulaires d'ajout
4. **Composants UI** - KPI Cards, etc.

**Objectif :** Améliorer la couverture globale.

---

## Métriques de succès

### Couverture cible par type de fichier

| Type de fichier | Couverture cible | Raison |
|----------------|------------------|--------|
| **Calculs** (`calculations.ts`) | 90-100% | Zéro tolérance pour les erreurs |
| **Hooks de données** | 70-80% | Logique métier critique |
| **API Handlers** | 80-90% | Point d'entrée des données |
| **Composants graphiques** | 50-60% | Logique d'affichage |
| **Composants UI simples** | 30-40% | Peu de logique |

### Indicateurs de qualité

- ✅ **Tous les calculs financiers testés** (ROI, rendement, totaux)
- ✅ **Tous les cas limites couverts** (division par zéro, valeurs négatives)
- ✅ **Toutes les API mockées** (pas d'appels réels dans les tests)
- ✅ **Tests rapides** (< 1 seconde pour la suite complète)

---

## Comment tester un nouveau composant ?

### 1. Identifier le type

- **Calcul ?** → Test unitaire simple
- **Hook ?** → `renderHook` de Testing Library
- **Composant ?** → `render` et vérifier l'affichage
- **API ?** → Mocker les dépendances

### 2. Créer le fichier de test

```bash
# À côté du fichier source
src/hooks/useMyHook.ts
src/hooks/useMyHook.test.ts  ← Créer ce fichier
```

### 3. Suivre les exemples

- **Calculs** : Voir `calculations.test.ts`
- **Composants** : Voir `DividendsChart.test.tsx`
- **API** : Voir `stocks-search.test.ts`

### 4. Lancer et itérer

```bash
npm test -- useMyHook.test.ts
```

---

## Ressources

- [Guide de tests complet](./TESTING_GUIDE.md)
- [Exemples de tests](./src/utils/calculations.test.ts)
- [Documentation Vitest](https://vitest.dev/)

---

**Rappel :** Ne cherche pas 100% de couverture partout. Concentre-toi sur les **calculs financiers** et la **logique métier critique**. Le reste peut être testé progressivement. 🎯
