import { getValidAccessToken, invalidateAccessToken } from './auth';
import { FortyTwoApiError } from './errors';

const API_BASE_URL = 'https://api.intra.42.fr';

interface ApiFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  retryUnauthorized?: boolean;
}

function buildUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseJsonOrNull<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return (await response.json()) as T;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { headers = {}, retryUnauthorized = true, ...requestInit } = options;
  const token = await getValidAccessToken();

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...requestInit,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    });
  } catch (error) {
    throw new FortyTwoApiError(
      'Network error while calling 42 API.',
      'NETWORK_ERROR',
      undefined,
      error
    );
  }

  if (response.status === 401 && retryUnauthorized) {
    invalidateAccessToken();
    return apiFetch<T>(path, { ...options, retryUnauthorized: false });
  }

  if (!response.ok) {
    const errorPayload = await parseJsonOrNull<Record<string, unknown>>(response);
    throw new FortyTwoApiError(
      `42 API request failed with status ${response.status}.`,
      'API_ERROR',
      response.status,
      errorPayload
    );
  }

  const payload = await parseJsonOrNull<T>(response);
  if (payload === null) {
    throw new FortyTwoApiError('42 API returned a non-JSON response.', 'API_ERROR', response.status);
  }

  return payload;
}
