import { AppError, apiRequest, getFriendlyApiErrorMessage } from './api';
import { getApiBaseUrl } from './config';
import { decodeJwtPayload } from './jwt';

import type { AuthUser } from '@/stores/authStore';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  cityId?: string | null;
};

function extractAccessToken(data: any) {
  return data?.access_token ?? data?.token ?? data?.accessToken ?? null;
}

function extractTokenType(data: any) {
  const tokenType = data?.token_type ?? data?.tokenType ?? 'Bearer';
  return String(tokenType);
}

function extractExpiresAt(accessToken: string) {
  const payload = decodeJwtPayload(accessToken);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;

  if (!exp) {
    return null;
  }

  return new Date(exp * 1000).toISOString();
}

function mapUser(data: any): AuthUser {
  return {
    id: String(data.id),
    name: String(data.name),
    email: String(data.email),
    role: String(data.role),
    legacyRole: data?.legacy_role ? String(data.legacy_role) : null,
    emailVerified: Boolean(data?.email_verified),
    cityId: data.city_id ? String(data.city_id) : null,
  };
}

export async function fetchCurrentUserProfile(accessToken: string) {
  const response = await apiRequest<any>('/users/me', {
    requireAuth: true,
    authToken: accessToken,
  });

  return mapUser(response);
}

export async function fetchUserProfile(userId: string, accessToken: string) {
  const response = await apiRequest<any>(`/users/${userId}`, {
    requireAuth: true,
    authToken: accessToken,
  });

  return mapUser(response);
}

export async function loginCitizen(payload: LoginPayload) {
  const formBody = new URLSearchParams({
    username: payload.email,
    password: payload.password,
  });

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: formBody.toString(),
    });
  } catch (error) {
    throw new AppError(getFriendlyApiErrorMessage(error), 'API_NETWORK_ERROR');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(text || 'Falha ao autenticar cidadao.', 'AUTH_LOGIN_FAILED', response.status);
  }

  const data = await response.json();
  const accessToken = extractAccessToken(data);
  const tokenType = extractTokenType(data);

  if (!accessToken) {
    throw new AppError('A resposta do login nao retornou access_token.', 'AUTH_TOKEN_MISSING');
  }

  const tokenPayload = decodeJwtPayload(accessToken);
  const userId = tokenPayload?.sub ? String(tokenPayload.sub) : null;
  let user: AuthUser | null = null;

  try {
    user = await fetchCurrentUserProfile(accessToken);
  } catch {
    user = userId ? await fetchUserProfile(userId, accessToken) : null;
  }

  return {
    accessToken,
    tokenType,
    expiresAt: extractExpiresAt(accessToken),
    user,
  };
}

export async function registerCitizen(payload: RegisterPayload) {
  await apiRequest('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: 'CITIZEN',
      city_id: payload.cityId ?? null,
    }),
  });

  return loginCitizen({
    email: payload.email,
    password: payload.password,
  });
}
