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
