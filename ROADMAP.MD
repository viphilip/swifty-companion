# 🗺️ Roadmap : Swifty Companion (React Native / Expo)

## 📍 Milestone 1 : Initialisation et Configuration (Setup)

_L'objectif est d'avoir une base de projet saine, typée, et sécurisée._

- **Créer l'application sur l'Intranet 42** :
  - Aller sur l'intra 42 -> Settings -> API -> Register a new app.
  - Récupérer le `UID` (Client ID) et le `SECRET` (Client Secret).
- **Initialiser le projet Expo avec TypeScript** :
  - `npx create-expo-app swifty-companion -t expo-template-blank-typescript`
- **Configurer les variables d'environnement** :
  - Créer un fichier `.env` à la racine.
  - Y ajouter `EXPO_PUBLIC_API_UID` et `EXPO_PUBLIC_API_SECRET`.
  - ⚠️ **CRITIQUE** : Vérifier que `.env` est bien dans le `.gitignore` (échec direct du projet sinon).
- **Installer les dépendances principales** :
  - (Optionnel) Icônes/UI : `@expo/vector-icons` (inclus dans Expo).

## 📍 Milestone 2 : Authentification OAuth2 & Service API (Cœur logique)

_L'objectif est de communiquer avec l'API 42 sans recréer un token à chaque requête et de gérer le bonus._

- **Créer un service API (`src/services/api.ts`)** :
  - Mettre en place une classe ou un module pour gérer les appels à `https://api.intra.42.fr`.
- **Gérer le Token OAuth2 (Client Credentials Flow)** :
  - Créer une fonction pour demander un token `POST /oauth/token` avec `grant_type=client_credentials`.
  - Stocker le token en mémoire (ou via `expo-secure-store`) pour le réutiliser.
- **Implémenter la logique de validité du Token (Bonus )** :
  - Stocker la date d'expiration (`created_at` + `expires_in`).
  - Avant chaque requête à l'API, vérifier si le token est expiré. S'il l'est, appeler la fonction de rafraîchissement/recréation du token de manière transparente.
- **Créer la fonction de recherche d'utilisateur** :
  - `GET /v2/users/{login}` en passant le token dans le header `Authorization: Bearer <token>`.

## 📍 Milestone 3 : Navigation et Squelette des Vues

_L'objectif est de respecter la contrainte des "au moins 2 vues" et du retour en arrière._

- **Créer la Vue 1 : `SearchScreen`** :
  - Utiliser ton fichier app/index.tsx (la page d'accueil) pour y mettre ta barre de recherche
- **Créer la Vue 2 : `ProfileScreen`** :
  - Créer un nouveau fichier app/profile.tsx. Expo va automatiquement comprendre que c'est une nouvelle page accessible.
- **Lier les deux vues** :
  - S'assurer que le bouton "Retour" natif (ou header) fonctionne pour revenir de `ProfileScreen` à `SearchScreen`.

## 📍 Milestone 4 : Vue 1 - Recherche et Gestion des Erreurs

_L'objectif est de gérer la saisie et tous les cas d'erreurs demandés par le sujet._

- **UI de la barre de recherche** :
  - Un `TextInput` stylisé (Flexbox) et un bouton de validation.
- **Gestion du chargement (Loading state)** :
  - Afficher un `ActivityIndicator` pendant l'appel API.
- **Gestion des erreurs (Obligatoire)** :
  - **Login not found (404)** : Afficher une alerte ou un texte "Utilisateur introuvable".
  - **Network error** : Couper le wifi du simulateur/téléphone et vérifier qu'un message "Erreur réseau" s'affiche.
  - **Autres erreurs (401, 500)** : Message d'erreur générique.
- **Transition** :
  - Si l'API renvoie un succès (200 OK), naviguer vers `ProfileScreen` en passant les données JSON récupérées.

## 📍 Milestone 5 : Vue 2 - Affichage du Profil (Data Parsing)

_L'objectif est d'afficher toutes les informations requises de manière claire._

> Plan detaille de dev: `docs/UXUI/VIEW2-DEV-PLAN.MD`

- **En-tête du profil (Header)** :
  - Afficher la **photo de profil** (`image.versions.large` ou `image.link`).
  - Afficher les **4 détails minimum** (ex: `login`, `email`, `phone`, `wallet`, `correction_point`, `location` si présent).
- **Section Compétences (Skills)** :
  - Récupérer le tableau `cursus_users[x].skills` (attention à bien filtrer le cursus principal, souvent `cursus_id: 21` pour 42).
  - Afficher les skills dans un **radar chart** (tous les skills disponibles dans le cursus principal).
  - Afficher le nom de la compétence, le niveau (ex: `Level 12.42`) et un **pourcentage** (`%`) dans la liste detaillee.
- **Section Projets (Projects)** :
  - Récupérer le tableau `projects_users`.
  - Regrouper les projets par `cursus_id` / `cursus_ids` avec un titre de section par cursus.
  - Afficher le nom du projet, le statut (`finished`, `failed`, `in_progress`) et la note (`final_mark`).
  - _Astuce UI : Mettre la note en vert si validé, en rouge si échoué._

## 📍 Milestone 6 : Layout Flexible et Design (UI/UX)

_L'objectif est de respecter la contrainte de "flexible or modern layout technique"._

- **Utilisation de Flexbox** :
  - S'assurer que l'application utilise `flex: 1`, `justifyContent`, `alignItems` pour s'adapter aux petits et grands écrans.
- **ScrollViews et FlatLists** :
  - Utiliser `ScrollView` pour la page profil globale.
  - Utiliser `FlatList` (ou `map` dans une ScrollView) pour la liste des projets afin d'optimiser les performances.
- **Polissage visuel** :
  - Ajouter des couleurs (pourquoi pas le thème sombre/clair de 42).
  - Gérer les zones de sécurité (`SafeAreaView` pour les encoches d'iPhone).

## 📍 Milestone 7 : Tests finaux et Préparation à la soutenance

_Vérification stricte de la grille de correction._

- Vérifier que le `.env` n'est **PAS** sur le repo Git (`git status` / `git ls-files`).
- Tester avec un login valide (ex: `norminet`, ou le tien).
- Tester avec un login invalide (ex: `login_qui_n_existe_pas_123`).
- Tester sans connexion internet.
- Tester la rotation de l'écran ou différents simulateurs (iPhone SE vs iPhone 15 Pro Max) pour valider le layout flexible.
- Vérifier les logs : s'assurer qu'un nouveau token n'est pas généré à chaque recherche.
- (Bonus) Attendre 2 heures (ou forcer l'expiration du token dans le code) et vérifier que l'appli recrée bien le token toute seule et affiche le profil sans crash.

---

Veux-tu que l'on commence par le **Milestone 1** (Setup et configuration de l'API) ? Je peux te guider sur la structure des dossiers et le code pour le service API.
