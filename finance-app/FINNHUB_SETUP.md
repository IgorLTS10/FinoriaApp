# Configuration Finnhub API

## Variables d'environnement requises

### Développement Local

Créez un fichier `.env.local` à la racine du projet `finance-app/` :

```env
FINNHUB_API_KEY=votre_cle_api_ici
```

### Production (Vercel)

Ajoutez la variable d'environnement dans les settings Vercel :

1. Allez sur https://vercel.com/votre-projet/settings/environment-variables
2. Ajoutez :
   - **Name**: `FINNHUB_API_KEY`
   - **Value**: votre clé API Finnhub
   - **Environment**: Production, Preview, Development

## Obtenir une clé API Finnhub

1. Créez un compte gratuit sur https://finnhub.io/register
2. Confirmez votre email
3. Allez sur le dashboard : https://finnhub.io/dashboard
4. Copiez votre clé API (API Key)

## Limites du plan gratuit

- **60 requêtes par minute**
- Largement suffisant avec le debounce de 600ms et le cache implémentés

## Fonctionnalités

- ✅ Recherche de symboles d'actions
- ✅ Logos d'entreprises inclus
- ✅ Cache côté serveur (1 heure)
- ✅ Cache côté client (session)
- ✅ Debounce de 600ms
- ✅ Minimum 2 caractères pour chercher

## Dépannage

### "API key not configured"
- Vérifiez que `FINNHUB_API_KEY` est bien dans `.env.local`
- Redémarrez le serveur de développement (`npm run dev`)

### "Too Many Requests"
- Le plan gratuit limite à 60 req/min
- Le cache et le debounce devraient éviter ce problème
- Attendez 1 minute avant de réessayer

### Pas de résultats
- Vérifiez que vous tapez au moins 2 caractères
- Essayez avec un symbole connu (AAPL, MSFT, TSLA)
- Vérifiez les logs de la console pour les erreurs
