import { apiFetch } from './client';
import { FortyTwoApiError } from './errors';
import type { FortyTwoUser } from './types';

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

export async function getUserByLogin(login: string): Promise<FortyTwoUser> {
  const normalizedLogin = normalizeLogin(login);

  if (!normalizedLogin) {
    throw new FortyTwoApiError('Login must not be empty.', 'API_ERROR');
  }

  try {
    return await apiFetch<FortyTwoUser>(`/v2/users/${encodeURIComponent(normalizedLogin)}`);
  } catch (error) {
    if (error instanceof FortyTwoApiError && error.code === 'API_ERROR' && error.status === 404) {
      throw new FortyTwoApiError(
        `User "${normalizedLogin}" was not found.`,
        'USER_NOT_FOUND',
        404,
        error.details
      );
    }
    throw error;
  }
}
