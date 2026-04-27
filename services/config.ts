import Constants from 'expo-constants';

import { getStoredApiBaseUrl } from '@/stores/settingsStore';

type ExpoExtra = {
  apiBaseUrl?: string;
  apiBaseUrlHomolog?: string;
  apiAccessToken?: string;
  citizenUserId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

const fallbackApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra.apiBaseUrl ??
  'https://api.mybeach.com.br';

const hasExplicitApiBaseUrl = Boolean(process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl);

const fallbackHomologApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL_HOMOLOG ??
  extra.apiBaseUrlHomolog ??
  null;

export const apiAccessToken =
  process.env.EXPO_PUBLIC_API_ACCESS_TOKEN ??
  extra.apiAccessToken ??
  null;

export const citizenUserId =
  process.env.EXPO_PUBLIC_CITIZEN_USER_ID ??
  extra.citizenUserId ??
  null;

export function getApiBaseUrl() {
  return getStoredApiBaseUrl() ?? fallbackApiBaseUrl;
}

export function hasApiAccessToken() {
  return Boolean(apiAccessToken);
}

export function getEnvironmentStatus() {
  const activeApiBaseUrl = getApiBaseUrl();
  const hasCustomApiBaseUrl = Boolean(getStoredApiBaseUrl());
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!activeApiBaseUrl) {
    missing.push('EXPO_PUBLIC_API_BASE_URL');
  }

  if (!apiAccessToken) {
    warnings.push('EXPO_PUBLIC_API_ACCESS_TOKEN ausente: login por e-mail e senha continua disponivel, mas diagnosticos protegidos dependem de sessao autenticada.');
  }

  if (!citizenUserId) {
    warnings.push('EXPO_PUBLIC_CITIZEN_USER_ID ausente: recursos legados baseados em usuario fixo ficam indisponiveis.');
  }

  if (!hasExplicitApiBaseUrl && !hasCustomApiBaseUrl) {
    warnings.push('EXPO_PUBLIC_API_BASE_URL nao definido: usando fallback de producao.');
  }

  return {
    ready: missing.length === 0,
    activeApiBaseUrl,
    hasExplicitApiBaseUrl,
    hasCustomApiBaseUrl,
    hasApiAccessToken: Boolean(apiAccessToken),
    hasCitizenUserId: Boolean(citizenUserId),
    missing,
    warnings,
  };
}

export function getBootstrapCitizenUserId() {
  return citizenUserId;
}

export function getApiEnvironmentOptions() {
  return [
    {
      id: 'production',
      label: 'Producao',
      url: fallbackApiBaseUrl,
      available: true,
    },
    {
      id: 'homologation',
      label: 'Homologacao',
      url: fallbackHomologApiBaseUrl,
      available: Boolean(fallbackHomologApiBaseUrl),
    },
    {
      id: 'custom',
      label: 'Custom',
      url: getStoredApiBaseUrl(),
      available: true,
    },
  ] as const;
}

export function getCurrentApiEnvironmentLabel() {
  const activeUrl = getApiBaseUrl();
  const environments = getApiEnvironmentOptions();
  const matched = environments.find((item) => item.url === activeUrl && item.available);

  if (matched?.id === 'custom') {
    return 'Custom';
  }

  if (matched) {
    return matched.label;
  }

  return 'Custom';
}
