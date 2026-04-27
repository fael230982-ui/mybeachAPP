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

export function getFriendlyApiErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    if (error.code === 'API_TOKEN_MISSING') {
      return 'Sessao ou token de API ausente. Entre novamente ou configure o ambiente antes de continuar.';
    }

    if (error.code === 'AUTH_UNAUTHORIZED') {
      return 'Sessao expirada ou nao autorizada. Entre novamente para continuar.';
    }

    if (error.code === 'AUTH_FORBIDDEN') {
      return 'Seu usuario nao tem permissao para esta operacao.';
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return 'Nao foi possivel conectar com a API. Verifique internet, endpoint ativo e ambiente configurado.';
  }

  return 'Nao foi possivel concluir a operacao neste momento.';
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
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: buildHeaders(options.headers, options.requireAuth, options.authToken, options.authTokenType),
    });
  } catch (error) {
    throw new AppError(getFriendlyApiErrorMessage(error), 'API_NETWORK_ERROR');
  }

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
