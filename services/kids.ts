import { apiRequest, resolveAuthToken } from './api';

import type {
  ChildProfileCreateRequest,
  ChildProfileResponse,
  ChildProfileUpdateRequest,
  GuardianConsentCreateRequest,
  GuardianConsentResponse,
  GuardianContentReviewRequest,
  GuardianNotificationResponse,
  ChildContentCreateRequest,
  ChildContentResponse,
  ChildPhotoPolicyResponse,
  KidsFeatureAvailability,
  KidsIntegrationMode,
} from '@/types/api';

type KidsCapabilitySummary = {
  mode: KidsIntegrationMode;
  label: string;
  reason: string;
  features: KidsFeatureAvailability;
};

const KIDS_FEATURES_FROM_OPENAPI: KidsFeatureAvailability = {
  childrenCrud: true,
  childPhotoUpload: true,
  guardianConsents: true,
  childContent: true,
  guardianNotifications: true,
};

export function getKidsCapabilitySummary(authToken?: string | null): KidsCapabilitySummary {
  const token = resolveAuthToken(authToken);

  if (!token) {
    return {
      mode: 'LOCAL_SAFE',
      label: 'Modo kids local protegido',
      reason: 'Sem token autenticado do responsavel. O fluxo infantil permanece apenas no modo local seguro.',
      features: KIDS_FEATURES_FROM_OPENAPI,
    };
  }

  return {
    mode: 'REMOTE_READY',
    label: 'Modo kids remoto 1.3',
    reason:
      'A API 1.3 publica perfis, consentimento parental, conteudo kids, notificacoes parentais e politica tipada de foto infantil. Upload segue bloqueado por politica operacional conservadora.',
    features: KIDS_FEATURES_FROM_OPENAPI,
  };
}

export async function listKidsChildren(authToken?: string | null) {
  return apiRequest<ChildProfileResponse[]>('/children/', {
    requireAuth: true,
    authToken,
  });
}

export async function createKidsChildProfile(payload: ChildProfileCreateRequest, authToken?: string | null) {
  return apiRequest<ChildProfileResponse>('/children/', {
    method: 'POST',
    requireAuth: true,
    authToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function getKidsChildProfile(childId: string, authToken?: string | null) {
  return apiRequest<ChildProfileResponse>(`/children/${childId}`, {
    requireAuth: true,
    authToken,
  });
}

export async function updateKidsChildProfile(
  childId: string,
  payload: ChildProfileUpdateRequest,
  authToken?: string | null
) {
  return apiRequest<ChildProfileResponse>(`/children/${childId}`, {
    method: 'PUT',
    requireAuth: true,
    authToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteKidsChildProfile(childId: string, authToken?: string | null) {
  return apiRequest<void>(`/children/${childId}`, {
    method: 'DELETE',
    requireAuth: true,
    authToken,
  });
}

export async function uploadKidsChildPhoto(childId: string, file: Blob, authToken?: string | null) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest(`/children/${childId}/photo`, {
    method: 'POST',
    requireAuth: true,
    authToken,
    body: formData,
  });
}

export async function getKidsChildPhotoPolicy(childId: string, authToken?: string | null) {
  return apiRequest<ChildPhotoPolicyResponse>(`/children/${childId}/photo-policy`, {
    requireAuth: true,
    authToken,
  });
}

export async function getCurrentKidsGuardianConsent(
  authToken?: string | null,
  childProfileId?: string | null
): Promise<GuardianConsentResponse | null> {
  const query = childProfileId ? `?child_profile_id=${encodeURIComponent(childProfileId)}` : '';
  return apiRequest<GuardianConsentResponse | null>(`/kids/guardian-consents/current${query}`, {
    requireAuth: true,
    authToken,
  });
}

export async function createKidsGuardianConsent(
  payload: GuardianConsentCreateRequest,
  authToken?: string | null
): Promise<GuardianConsentResponse> {
  return apiRequest<GuardianConsentResponse>('/kids/guardian-consents', {
    method: 'POST',
    requireAuth: true,
    authToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function revokeKidsGuardianConsent(consentId: string, authToken?: string | null) {
  return apiRequest<GuardianConsentResponse>('/kids/guardian-consents/revoke', {
    method: 'POST',
    requireAuth: true,
    authToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ consent_id: consentId }),
  });
}

export async function listKidsContent(authToken?: string | null) {
  return apiRequest<ChildContentResponse[]>('/kids/content', {
    requireAuth: true,
    authToken,
  });
}

export async function createKidsContent(payload: ChildContentCreateRequest, authToken?: string | null) {
  return apiRequest<ChildContentResponse>('/kids/content', {
    method: 'POST',
    requireAuth: true,
    authToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function requestKidsContentPublication(contentId: string, authToken?: string | null) {
  return apiRequest<ChildContentResponse>(`/kids/content/${contentId}/request-publication`, {
    method: 'POST',
    requireAuth: true,
    authToken,
  });
}

export async function reviewKidsContent(
  contentId: string,
  payload: GuardianContentReviewRequest,
  authToken?: string | null
) {
  return apiRequest<ChildContentResponse>(`/kids/content/${contentId}/review`, {
    method: 'POST',
    requireAuth: true,
    authToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function listKidsGuardianNotifications(authToken?: string | null): Promise<GuardianNotificationResponse[]> {
  return apiRequest<GuardianNotificationResponse[]>('/kids/guardian-notifications', {
    requireAuth: true,
    authToken,
  });
}

export async function markKidsGuardianNotificationRead(
  notificationId: string,
  authToken?: string | null
) {
  return apiRequest<GuardianNotificationResponse>(`/kids/guardian-notifications/${notificationId}/read`, {
    method: 'POST',
    requireAuth: true,
    authToken,
  });
}
