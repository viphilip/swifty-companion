import { FortyTwoApiError } from './errors';
import type { FortyTwoTokenResponse } from './types';

const API_BASE_URL = 'https://api.intra.42.fr';
const TOKEN_SAFETY_WINDOW_MS = 60_000;

interface TokenCache {
  accessToken: string;
  expiresAtMs: number;
}

let tokenCache: TokenCache | null = null;
let refreshPromise: Promise<string> | null = null;

function getClientCredentials() {
  const clientId = process.env.EXPO_PUBLIC_API_UID;
  const clientSecret = process.env.EXPO_PUBLIC_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new FortyTwoApiError(
      'Missing EXPO_PUBLIC_API_UID or EXPO_PUBLIC_API_SECRET in environment variables.',
      'CONFIG_ERROR'
    );
  }

  return { clientId, clientSecret };
}

function isTokenStillValid(cache: TokenCache) {
  return Date.now() < cache.expiresAtMs;
}

function computeExpiresAtMs(payload: FortyTwoTokenResponse) {
  const createdAtMs = payload.created_at * 1000;
  const lifetimeMs = payload.expires_in * 1000;
  return createdAtMs + lifetimeMs - TOKEN_SAFETY_WINDOW_MS;
}

function buildTokenRequestBody() {
  const { clientId, clientSecret } = getClientCredentials();
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  return params.toString();
}

async function requestNewAccessToken(): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: buildTokenRequestBody(),
    });
  } catch (error) {
    throw new FortyTwoApiError(
      'Unable to reach 42 OAuth endpoint. Please check your internet connection.',
      'NETWORK_ERROR',
      undefined,
      error
    );
  }

  const payload = (await response.json().catch(() => null)) as FortyTwoTokenResponse | null;

  if (!response.ok || !payload?.access_token) {
    throw new FortyTwoApiError(
      'Failed to get access token from 42 API.',
      'AUTH_ERROR',
      response.status,
      payload
    );
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAtMs: computeExpiresAtMs(payload),
  };

  return tokenCache.accessToken;
}

export async function getValidAccessToken(): Promise<string> {
  if (tokenCache && isTokenStillValid(tokenCache)) {
    return tokenCache.accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function invalidateAccessToken() {
  tokenCache = null;
}
