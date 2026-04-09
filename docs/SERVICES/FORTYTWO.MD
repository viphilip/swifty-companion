# Couche 42 API: guide d'onboarding et de maintenance

Ce document explique comment fonctionne l'integration 42 API actuelle, comment l'etendre proprement, et comment la debugger rapidement.

References:
- Guide 42: [Getting started](https://api.intra.42.fr/apidoc/guides/getting_started)
- Index API: [API doc](https://api.intra.42.fr/apidoc)

## 1) Objectif de cette couche

Cette couche de services a ete creee pour garantir 4 contraintes du sujet:

1. Ne pas recreer un token a chaque requete.
2. Gerer proprement l'expiration du token (bonus).
3. Garder les ecrans UI simples et types.
4. Normaliser les erreurs pour afficher les bons messages.

## 2) Cartographie des fichiers

- `services/oauth.ts`
  - Point d'entree public. Re-export de tout ce dont les ecrans ont besoin.
- `services/fortytwo/auth.ts`
  - Recuperation OAuth + cache token en memoire + logique d'expiration.
- `services/fortytwo/client.ts`
  - Wrapper fetch authentifie generique (`apiFetch<T>`).
- `services/fortytwo/users.ts`
  - Endpoint metier utilisateur (`getUserByLogin`).
- `services/fortytwo/types.ts`
  - Types TypeScript des payloads 42.
- `services/fortytwo/errors.ts`
  - Erreur applicative partagee (`FortyTwoApiError`).

## 3) Flux d'execution (de bout en bout)

### Flux de recherche (`getUserByLogin`)

1. L'ecran appelle `getUserByLogin(login)` depuis `services/oauth.ts`.
2. `users.ts` normalise l'input (`trim().toLowerCase()`), puis construit `/v2/users/{login}`.
3. `client.ts` appelle `getValidAccessToken()` avant la requete HTTP.
4. `auth.ts`:
   - renvoie le token en cache s'il est encore valide,
   - sinon demande un nouveau token via `POST /oauth/token` avec `grant_type=client_credentials`.
5. `client.ts` envoie la requete avec `Authorization: Bearer <token>`.
6. Si la reponse est `401`, le cache token est invalide et la requete est retentee une seule fois.
7. Si la reponse est `404` sur l'endpoint user, `users.ts` convertit en `USER_NOT_FOUND`.

## 4) Details sur le cycle de vie token

Le cache token est en memoire (variables module-level dans `auth.ts`):

- `tokenCache`: `{ accessToken, expiresAtMs }`
- `refreshPromise`: verrou pour eviter des refresh concurrents

L'expiration est calculee avec marge de securite:

- formule: `created_at + expires_in - 60s`
- constante: `TOKEN_SAFETY_WINDOW_MS = 60_000`

Pourquoi cette marge:
- eviter les cas limites ou le token expire pendant une requete en vol.

## 5) Variables d'environnement

Variables obligatoires:

- `EXPO_PUBLIC_API_UID`
- `EXPO_PUBLIC_API_SECRET`

Lecture actuelle:
- `auth.ts` lit `process.env.EXPO_PUBLIC_API_UID` et `process.env.EXPO_PUBLIC_API_SECRET`.

Point important:
- Les variables `EXPO_PUBLIC_*` sont bundlees cote client par Expo, donc non secretes en production.
- Pour ce projet ecole c'est souvent accepte si les fichiers `.env*` ne sont jamais pushes. En production reelle, preferer un backend proxy.

## 6) Contrat d'erreurs

Toutes les erreurs metier doivent etre des `FortyTwoApiError` avec `code`:

- `CONFIG_ERROR`
  - Variables env manquantes.
  - Action UI: message de configuration.
- `NETWORK_ERROR`
  - Reseau indisponible, DNS, timeout fetch.
  - Action UI: "Erreur reseau, reessayez".
- `AUTH_ERROR`
  - Echec sur l'endpoint OAuth token.
  - Action UI: message indisponibilite auth/API.
- `USER_NOT_FOUND`
  - Login inexistant (`404` sur `/v2/users/{login}`).
  - Action UI: "Login introuvable".
- `API_ERROR`
  - Erreur API generique, status non-OK, payload invalide.
  - Action UI: message generique.

## 7) Consommation depuis l'UI

Toujours importer depuis `services/oauth.ts` (facade publique), pas via des imports profonds.

Exemple:

```ts
import { FortyTwoApiError, getUserByLogin } from '@/services/oauth';

async function search(login: string) {
  try {
    const user = await getUserByLogin(login);
    return user;
  } catch (error) {
    if (error instanceof FortyTwoApiError) {
      switch (error.code) {
        case 'USER_NOT_FOUND':
          // afficher "Login introuvable"
          break;
        case 'NETWORK_ERROR':
          // afficher "Verifiez votre connexion internet"
          break;
        default:
          // afficher erreur API generique
      }
    }
    throw error;
  }
}
```

## 8) Ajouter un nouvel endpoint proprement

Exemple: ajouter "liste des cursus".

1. Ajouter/etendre les types dans `services/fortytwo/types.ts`.
2. Creer un module endpoint, par exemple `services/fortytwo/cursus.ts`.
3. Implementer la fonction via `apiFetch<T>()`.
4. Mapper les statuses speciaux vers des erreurs metier si necessaire.
5. Re-exporter depuis `services/oauth.ts`.
6. Mettre a jour ce document si le comportement evolue.

Template:

```ts
import { apiFetch } from './client';
import type { FortyTwoCursus } from './types';

export async function getCursus(): Promise<FortyTwoCursus[]> {
  return apiFetch<FortyTwoCursus[]>('/v2/cursus');
}
```

## 9) Regles de maintenance (conventions equipe)

1. Pas de `fetch('https://api.intra.42.fr/...')` direct dans les ecrans.
2. Toute requete authentifiee passe par `apiFetch<T>()`.
3. Garder la logique par ressource dans des modules dedies (`users.ts`, `cursus.ts`, etc).
4. Mapper les statuses attendus vers des erreurs metier explicites.
5. Mettre les types a jour avant la logique fonctionnelle.
6. Garder `services/oauth.ts` comme facade d'import unique pour l'UI.

## 10) Checklist de test manuel

- Test configuration
  - Retirer une variable env localement et verifier `CONFIG_ERROR`.
- Happy path
  - Appeler `getUserByLogin` avec un login valide et verifier le payload profil.
- Not found
  - Utiliser un faux login et verifier `USER_NOT_FOUND`.
- Erreur reseau
  - Couper le reseau sur simulateur/appareil et verifier `NETWORK_ERROR`.
- Refresh token
  - Attendre l'expiration (ou reduire temporairement la validite en dev), verifier la re-demande automatique du token sans crash.
- Retry unauthorized
  - Simuler un token invalide si possible et verifier un seul retry apres `401`.

## 11) Limites connues et ameliorations futures

Limites actuelles:

- Cache token uniquement en memoire (perdu au redemarrage app).
- Credentials cote client (`EXPO_PUBLIC_*`), donc pas vraiment secrets.
- Pas encore de strategie de retry/backoff sur rate-limit ou `5xx`.

Ameliorations possibles:

1. Ajouter timeout requete + abort controller.
2. Ajouter retry conditionnel pour erreurs transitoires `5xx`.
3. Ajouter logger centralise pour erreurs API.
4. Persister certaines metadonnees token pour un meilleur UX.
5. Deplacer l'echange OAuth sur un backend proxy en prod.
