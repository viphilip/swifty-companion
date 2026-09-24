# 42 API layer: onboarding and maintenance guide

This document explains how the current 42 API integration works, how to extend it cleanly, and how to debug it quickly.

References:

- 42 guide: [Getting started](https://api.intra.42.fr/apidoc/guides/getting_started)
- API index: [API doc](https://api.intra.42.fr/apidoc)

## 1) Purpose of this layer

This service layer was built to satisfy 4 subject constraints:

1. Do not create a new token on every request.
2. Handle token expiration properly (bonus).
3. Keep UI screens simple and typed.
4. Normalize errors so the right messages can be shown.

## 2) File map

- `services/oauth.ts`
  - Public entry point. Re-exports everything the screens need.
- `services/fortytwo/auth.ts`
  - OAuth fetch + in-memory token cache + expiration logic.
- `services/fortytwo/client.ts`
  - Generic authenticated fetch wrapper (`apiFetch<T>`).
- `services/fortytwo/users.ts`
  - User business endpoint (`getUserByLogin`).
- `services/fortytwo/types.ts`
  - TypeScript types for 42 payloads.
- `services/fortytwo/errors.ts`
  - Shared application error (`FortyTwoApiError`).

## 3) Execution flow (end to end)

### Search flow (`getUserByLogin`)

1. The screen calls `getUserByLogin(login)` from `services/oauth.ts`.
2. `users.ts` normalizes the input (`trim().toLowerCase()`), then builds `/v2/users/{login}`.
3. `client.ts` calls `getValidAccessToken()` before the HTTP request.
4. `auth.ts`:
   - returns the cached token if it is still valid,
   - otherwise requests a new token via `POST /oauth/token` with `grant_type=client_credentials`.
5. `client.ts` sends the request with `Authorization: Bearer <token>`.
6. If the response is `401`, the token cache is invalidated and the request is retried once.
7. If the response is `404` on the user endpoint, `users.ts` converts it to `USER_NOT_FOUND`.

## 4) Token lifecycle details

The token cache lives in memory (module-level variables in `auth.ts`):

- `tokenCache`: `{ accessToken, expiresAtMs }`
- `refreshPromise`: lock that prevents concurrent refreshes

Expiration is computed with a safety margin:

- formula: `created_at + expires_in - 60s`
- constant: `TOKEN_SAFETY_WINDOW_MS = 60_000`

Why this margin:
- avoid edge cases where the token expires while a request is still in flight.

## 5) Environment variables

Required variables:

- `EXPO_PUBLIC_API_UID`
- `EXPO_PUBLIC_API_SECRET`

Current read path:
- `auth.ts` reads `process.env.EXPO_PUBLIC_API_UID` and `process.env.EXPO_PUBLIC_API_SECRET`.

Important point:
- `EXPO_PUBLIC_*` variables are bundled on the client by Expo, so they are not secret in production.
- For this school project that is often acceptable as long as `.env*` files are never pushed. In a real production setup, prefer a backend proxy.

## 6) Error contract

Every business error must be a `FortyTwoApiError` with a `code`:

- `CONFIG_ERROR`
  - Missing environment variables.
  - UI action: configuration message.
- `NETWORK_ERROR`
  - Network unavailable, DNS, fetch timeout.
  - UI action: "Network error, try again".
- `AUTH_ERROR`
  - Failure on the OAuth token endpoint.
  - UI action: auth/API unavailable message.
- `USER_NOT_FOUND`
  - Unknown login (`404` on `/v2/users/{login}`).
  - UI action: "Login not found".
- `API_ERROR`
  - Generic API error, non-OK status, invalid payload.
  - UI action: generic message.

## 7) Consuming the layer from the UI

Always import from `services/oauth.ts` (the public facade), not through deep imports.

Example:

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
          // show "Login not found"
          break;
        case 'NETWORK_ERROR':
          // show "Check your internet connection"
          break;
        default:
          // show a generic API error
      }
    }
    throw error;
  }
}
```

## 8) Adding a new endpoint cleanly

Example: add a "cursus list".

1. Add or extend types in `services/fortytwo/types.ts`.
2. Create an endpoint module, for example `services/fortytwo/cursus.ts`.
3. Implement the function through `apiFetch<T>()`.
4. Map special statuses to business errors when needed.
5. Re-export it from `services/oauth.ts`.
6. Update this document if the behavior changes.

Template:

```ts
import { apiFetch } from './client';
import type { FortyTwoCursus } from './types';

export async function getCursus(): Promise<FortyTwoCursus[]> {
  return apiFetch<FortyTwoCursus[]>('/v2/cursus');
}
```

## 9) Maintenance rules (team conventions)

1. No direct `fetch('https://api.intra.42.fr/...')` in screens.
2. Every authenticated request goes through `apiFetch<T>()`.
3. Keep resource logic in dedicated modules (`users.ts`, `cursus.ts`, and so on).
4. Map expected statuses to explicit business errors.
5. Update types before functional logic.
6. Keep `services/oauth.ts` as the single import facade for the UI.

## 10) Manual test checklist

- Configuration test
  - Remove an env variable locally and check for `CONFIG_ERROR`.
- Happy path
  - Call `getUserByLogin` with a valid login and check the profile payload.
- Not found
  - Use a fake login and check for `USER_NOT_FOUND`.
- Network error
  - Turn off the network on the simulator or device and check for `NETWORK_ERROR`.
- Token refresh
  - Wait for expiration (or temporarily shorten validity in dev) and check that the token is requested again automatically without a crash.
- Unauthorized retry
  - Simulate an invalid token if possible and check that there is a single retry after `401`.

## 11) Known limits and future improvements

Current limits:

- Token cache is in memory only (lost when the app restarts).
- Client-side credentials (`EXPO_PUBLIC_*`), so they are not truly secret.
- No retry/backoff strategy yet for rate limits or `5xx`.

Possible improvements:

1. Add a request timeout and an abort controller.
2. Add conditional retry for transient `5xx` errors.
3. Add a centralized logger for API errors.
4. Persist some token metadata for a better UX.
5. Move the OAuth exchange to a backend proxy in production.
