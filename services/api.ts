import { getStoredAccessToken, getStoredTokenType } from '@/stores/authStore';

import { apiAccessToken, getApiBaseUrl } from './config';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  requireAuth?: boolean;
  authToken?: string | null;
  authTokenType?: string | null;
};

export class AppError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code = 'APP_ERROR', status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export function resolveApiErrorCode(status: number) {
  return status === 401
    ? 'AUTH_UNAUTHORIZED'
    : status === 403
      ? 'AUTH_FORBIDDEN'
      : 'API_REQUEST_FAILED';
}

export function resolveAuthToken(authToken?: string | null) {
  return authToken ?? getStoredAccessToken() ?? apiAccessToken ?? null;
}

export function resolveAuthTokenType(authTokenType?: string | null) {
  return authTokenType ?? getStoredTokenType() ?? 'Bearer';
}

function buildHeaders(
  headers?: Record<string, string>,
  requireAuth?: boolean,
  authToken?: string | null,
  authTokenType?: string | null
) {
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (requireAuth) {
    const token = resolveAuthToken(authToken);

    if (!token) {
      throw new AppError(
        'Configure EXPO_PUBLIC_API_ACCESS_TOKEN para usar os endpoints protegidos.',
        'API_TOKEN_MISSING'
      );
    }

    finalHeaders.Authorization = `${resolveAuthTokenType(authTokenType)} ${token}`;
  }

  return finalHeaders;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, options.requireAuth, options.authToken, options.authTokenType),
  });

  if (!response.ok) {
    const text = await response.text();
    const code = resolveApiErrorCode(response.status);

    throw new AppError(text || `Falha na API (${response.status}).`, code, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function isAuthError(error: unknown) {
  return (
    error instanceof AppError &&
    (error.code === 'AUTH_UNAUTHORIZED' || error.code === 'AUTH_FORBIDDEN')
  );
}
