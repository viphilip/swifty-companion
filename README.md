# Swifty Companion

Application mobile de consultation des profils d'étudiants 42, construite avec Expo et React Native. Recherche d'un login, affichage du profil, des compétences et des projets via l'API 42.

*[English version](README_EN.md)*

## Prérequis

- **Node.js 20** ou supérieur
- **npm**
- L'application **[Expo Go](https://expo.dev/go)** sur un téléphone iOS ou Android
- Un compte 42 (pour créer l'application OAuth)

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone <url-du-repo>
cd swifty-companion
npm install
```

### 2. Créer une application OAuth sur l'intra 42

Rendez-vous sur [profile.intra.42.fr/oauth/applications/new](https://profile.intra.42.fr/oauth/applications/new) et créez une application.

Le formulaire exige une *redirect URI*. Ce projet utilise le flux `client_credentials`, qui ne s'en sert pas : n'importe quelle URL valide convient, par exemple `http://localhost:8081`.

Une fois l'application créée, récupérez son **UID** et son **SECRET**.

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Puis renseignez vos identifiants dans `.env.local` :

```bash
EXPO_PUBLIC_API_UID=votre_uid
EXPO_PUBLIC_API_SECRET=votre_secret
```

> [!IMPORTANT]
> `.env.local` est ignoré par git et ne doit **jamais** être commité. Sans ces deux variables, l'application lève une erreur `CONFIG_ERROR` au premier appel API.

> [!NOTE]
> Les variables préfixées `EXPO_PUBLIC_` sont embarquées dans le bundle client par Expo : elles ne sont donc pas secrètes une fois l'application distribuée. C'est acceptable dans le cadre de ce projet école, tant que les fichiers `.env*` restent hors du dépôt. En production, il faudrait passer par un backend proxy.

## Lancement

```bash
npx expo start -c
```

Scannez ensuite le QR code avec Expo Go. Le drapeau `-c` vide le cache Metro, utile après une modification de `.env.local`.

### Sur les PC de l'école (Fedora)

Le LAN est bloqué sur les postes de l'école : le mode par défaut ne permet pas au téléphone de joindre le serveur Metro. Il faut passer par un tunnel :

```bash
npx expo start --tunnel
```

Équivalent Bun : `bunx expo start --tunnel`. Si Expo réclame `@expo/ngrok`, installez-le puis relancez :

```bash
npx expo install @expo/ngrok
```

Le PC et le téléphone doivent tous les deux avoir accès à Internet.

## Structure du projet

```
app/              Écrans et routage (expo-router, file-based routing)
components/       Composants d'interface réutilisables
services/
  fortytwo/       Couche d'accès à l'API 42 (auth, client, users, types, erreurs)
constants/        Thème et constantes partagées
hooks/            Hooks React personnalisés
styles/           Styles partagés
docs/             Documentation technique
```

## Documentation

- **Couche API 42** — onboarding et maintenance : [`docs/SERVICES/FORTYTWO_FR.MD`](docs/SERVICES/FORTYTWO_FR.MD) *(version anglaise : [`FORTYTWO_EN.MD`](docs/SERVICES/FORTYTWO_EN.MD))*
- **Design UX/UI** : [`docs/UXUI/DESIGN.MD`](docs/UXUI/DESIGN.MD)

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `CONFIG_ERROR` | `.env.local` absent ou variables vides | Reprendre l'étape 3, puis relancer avec `npx expo start -c` |
| `AUTH_ERROR` | UID ou SECRET invalide | Vérifier les identifiants sur l'intra 42 |
| `NETWORK_ERROR` | Pas d'accès à `api.intra.42.fr` | Vérifier la connexion Internet du téléphone |
| Le QR code ne charge rien | LAN bloqué (PC de l'école) | Utiliser `npx expo start --tunnel` |
| Modification de `.env.local` sans effet | Cache Metro | Relancer avec `npx expo start -c` |

## Qualité

```bash
npm run lint
```
