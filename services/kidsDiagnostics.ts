import type { AuthUser } from '@/stores/authStore';
import type {
  ChildContentDraft,
  ChildLinkedProfile,
  GuardianConsentRecord,
  GuardianNotificationItem,
  KidsFeatureAvailability,
  KidsIntegrationMode,
} from '@/types/api';

type IntegrationMapItem = {
  id: string;
  label: string;
  state: 'remoto' | 'local' | 'bloqueado';
  detail: string;
};

type BuildKidsIntegrationMapParams = {
  hasSession: boolean;
  features: KidsFeatureAvailability;
};

type BuildKidsSnapshotParams = {
  integrationMode: KidsIntegrationMode;
  integrationLabel: string;
  user: AuthUser | null;
  guardianConsent: GuardianConsentRecord | null;
  childProfiles: ChildLinkedProfile[];
  childContentDrafts: ChildContentDraft[];
  guardianNotifications: GuardianNotificationItem[];
  integrationMap: IntegrationMapItem[];
};

export function buildKidsIntegrationMap({
  hasSession,
  features,
}: BuildKidsIntegrationMapParams): IntegrationMapItem[] {
  return [
    {
      id: 'session',
      label: 'Sessao do responsavel',
      state: hasSession ? 'remoto' : 'local',
      detail: hasSession ? 'Login remoto ativo pelo ecossistema.' : 'Sem sessao autenticada. Uso apenas local.',
    },
    {
      id: 'children',
      label: 'Perfis infantis',
      state: features.childrenCrud ? 'remoto' : 'local',
      detail: features.childrenCrud
        ? 'CRUD remoto em /children disponivel.'
        : 'Perfis infantis ainda em fallback local.',
    },
    {
      id: 'content',
      label: 'Conteudo kids',
      state: features.childContent ? 'remoto' : 'local',
      detail: features.childContent
        ? 'Conteudo infantil com endpoint remoto publicado.'
        : 'Conteudo infantil ainda depende de fallback local seguro.',
    },
    {
      id: 'consent',
      label: 'Consentimento parental',
      state: features.guardianConsents ? 'remoto' : 'local',
      detail: features.guardianConsents
        ? 'Consentimento parental remoto publicado.'
        : 'Consentimento parental ainda local, aguardando endpoint oficial.',
    },
    {
      id: 'notifications',
      label: 'Notificacoes parentais',
      state: features.guardianNotifications ? 'remoto' : 'local',
      detail: features.guardianNotifications
        ? 'Notificacoes parentais remotas publicadas.'
        : 'Notificacoes parentais ainda ficam em fallback local.',
    },
    {
      id: 'child-photo',
      label: 'Foto infantil',
      state: features.childPhotoUpload ? 'bloqueado' : 'local',
      detail: features.childPhotoUpload
        ? 'Endpoint e politica remota existem, mas upload segue bloqueado por politica conservadora.'
        : 'Upload remoto ainda nao publicado.',
    },
  ];
}

export function buildKidsSnapshotJson({
  integrationMode,
  integrationLabel,
  user,
  guardianConsent,
  childProfiles,
  childContentDrafts,
  guardianNotifications,
  integrationMap,
}: BuildKidsSnapshotParams) {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      integrationMode,
      integrationLabel,
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            legacyRole: user.legacyRole ?? null,
            emailVerified: Boolean(user.emailVerified),
          }
        : null,
      consent: guardianConsent
        ? {
            version: guardianConsent.version,
            acceptedAt: guardianConsent.acceptedAt,
            acceptedByName: guardianConsent.acceptedByName,
            relationship: guardianConsent.relationship,
          }
        : null,
      children: childProfiles.map((profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        source: profile.source,
        birthDate: profile.birthDate ?? null,
        ageBracket: profile.ageBracket,
        parentId: profile.parentId ?? null,
      })),
      childContent: childContentDrafts.map((draft) => ({
        id: draft.id,
        childProfileId: draft.childProfileId,
        title: draft.title,
        status: draft.status,
        category: draft.category,
        publicRequested: draft.publicRequested,
      })),
      guardianNotifications: guardianNotifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        readAt: notification.readAt ?? null,
      })),
      integrationMap,
    },
    null,
    2
  );
}

export function buildKidsBackendPendingSnapshot(features: KidsFeatureAvailability) {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      pendingBackendAreas: {
        guardianConsents: !features.guardianConsents,
        childContent: !features.childContent,
        guardianNotifications: !features.guardianNotifications,
        childPhotoOperationalPolicy: features.childPhotoUpload,
      },
    },
    null,
    2
  );
}
