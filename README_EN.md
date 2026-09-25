# Swifty Companion

A mobile app for browsing 42 student profiles, built with Expo and React Native. Search for a login, then view the profile, skills and projects through the 42 API.

*[Version française](README.md)*

## Requirements

- **Node.js 20** or later
- **npm**
- The **[Expo Go](https://expo.dev/go)** app on an iOS or Android phone
- A 42 account (to create the OAuth application)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd swifty-companion
npm install
```

### 2. Create an OAuth application on the 42 intranet

Go to [profile.intra.42.fr/oauth/applications/new](https://profile.intra.42.fr/oauth/applications/new) and create an application.

The form requires a redirect URI. This project uses the `client_credentials` flow, which never uses it, so any valid URL will do — for example `http://localhost:8081`.

Once the application is created, copy its **UID** and **SECRET**.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then fill in your credentials in `.env.local`:

```bash
EXPO_PUBLIC_API_UID=your_uid
EXPO_PUBLIC_API_SECRET=your_secret
```

> [!IMPORTANT]
> `.env.local` is git-ignored and must **never** be committed. Without these two variables, the app throws a `CONFIG_ERROR` on the first API call.

> [!NOTE]
> Variables prefixed with `EXPO_PUBLIC_` are inlined into the client bundle by Expo, so they are not secret once the app ships. That is acceptable for this school project as long as the `.env*` files stay out of the repository. A real production setup would route these calls through a backend proxy.

## Running the app

```bash
npx expo start -c
```

Then scan the QR code with Expo Go. The `-c` flag clears the Metro cache, which is needed after any change to `.env.local`.

### On the school computers (Fedora)

The LAN is blocked on school machines, so the default mode leaves the phone unable to reach the Metro server. Use a tunnel instead:

```bash
npx expo start --tunnel
```

Bun equivalent: `bunx expo start --tunnel`. If Expo asks for `@expo/ngrok`, install it and restart:

```bash
npx expo install @expo/ngrok
```

Both the computer and the phone need internet access.

## Project structure

```
app/              Screens and routing (expo-router, file-based routing)
components/       Reusable UI components
services/
  fortytwo/       42 API access layer (auth, client, users, types, errors)
constants/        Theme and shared constants
hooks/            Custom React hooks
styles/           Shared styles
docs/             Technical documentation
```

## Documentation

- **42 API layer** — onboarding and maintenance: [`docs/SERVICES/FORTYTWO_EN.MD`](docs/SERVICES/FORTYTWO_EN.MD) *(French version: [`FORTYTWO_FR.MD`](docs/SERVICES/FORTYTWO_FR.MD))*
- **UX/UI design**: [`docs/UXUI/DESIGN.MD`](docs/UXUI/DESIGN.MD) *(written in French)*

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `CONFIG_ERROR` | `.env.local` missing or variables empty | Redo step 3, then restart with `npx expo start -c` |
| `AUTH_ERROR` | Invalid UID or SECRET | Check the credentials on the 42 intranet |
| `NETWORK_ERROR` | No access to `api.intra.42.fr` | Check the phone's internet connection |
| QR code loads nothing | LAN blocked (school computers) | Use `npx expo start --tunnel` |
| Change to `.env.local` has no effect | Metro cache | Restart with `npx expo start -c` |

## Linting

```bash
npm run lint
```
