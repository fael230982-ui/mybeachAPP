import { AppError, apiRequest, resolveAuthToken } from './api';

import type {
  ChildProfileCreateRequest,
  ChildProfileResponse,
  ChildProfileUpdateRequest,
  GuardianConsentCreateRequest,
  GuardianConsentResponse,
  GuardianContentReviewRequest,
  GuardianNotificationResponse,
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
  guardianConsents: false,
  childContent: false,
  guardianNotifications: false,
};

function buildUnsupportedError(feature: string) {
  return new AppError(
    `A OpenAPI atual ainda nao publicou endpoint oficial para ${feature}.`,
    'KIDS_ENDPOINT_NOT_AVAILABLE'
  );
}

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
    mode: 'REMOTE_CHILDREN_ONLY',
    label: 'Modo kids com perfis remotos',
    reason:
      'A OpenAPI atual ja suporta perfis infantis e foto em /children, mas ainda nao publicou consentimento, conteudo infantil e notificacoes parentais.',
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

export async function getCurrentKidsGuardianConsent(_authToken?: string | null): Promise<GuardianConsentResponse> {
  throw buildUnsupportedError('consentimento parental remoto');
}

export async function createKidsGuardianConsent(
  _payload: GuardianConsentCreateRequest,
  _authToken?: string | null
): Promise<GuardianConsentResponse> {
  throw buildUnsupportedError('registro remoto de consentimento parental');
}

export async function revokeKidsGuardianConsent(_authToken?: string | null): Promise<void> {
  throw buildUnsupportedError('revogacao remota de consentimento parental');
}

export async function listKidsContent(_authToken?: string | null): Promise<never> {
  throw buildUnsupportedError('conteudo infantil remoto');
}

export async function createKidsContent(_payload: unknown, _authToken?: string | null): Promise<never> {
  throw buildUnsupportedError('criacao remota de conteudo infantil');
}

export async function requestKidsContentPublication(_contentId: string, _authToken?: string | null): Promise<never> {
  throw buildUnsupportedError('pedido remoto de publicacao infantil');
}

export async function reviewKidsContent(
  _contentId: string,
  _payload: GuardianContentReviewRequest,
  _authToken?: string | null
): Promise<never> {
  throw buildUnsupportedError('revisao remota de conteudo infantil');
}

export async function listKidsGuardianNotifications(_authToken?: string | null): Promise<GuardianNotificationResponse[]> {
  throw buildUnsupportedError('notificacoes parentais remotas');
}

export async function markKidsGuardianNotificationRead(
  _notificationId: string,
  _authToken?: string | null
): Promise<void> {
  throw buildUnsupportedError('leitura remota de notificacoes parentais');
}
