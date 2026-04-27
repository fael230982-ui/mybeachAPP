import { apiRequest } from './api';

import type { PrivacyConsentPayload, PrivacyConsentResponse } from '@/types/api';

export async function getRemotePrivacyConsent(authToken?: string | null) {
  return apiRequest<PrivacyConsentResponse | null>('/auth/me/privacy-consent', {
    requireAuth: true,
    authToken,
  });
}

export async function acceptRemotePrivacyConsent(payload: PrivacyConsentPayload, authToken?: string | null) {
  return apiRequest<PrivacyConsentResponse>('/auth/me/privacy-consent', {
    method: 'POST',
    requireAuth: true,
    authToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
