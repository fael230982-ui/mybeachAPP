import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MINOR_GUARDIAN_CONSENT_VERSION } from '@/constants/legal';
import type {
  ChildContentDraft,
  ChildLinkedProfile,
  ChildProfileDraft,
  ChildProfileResponse,
  ChildContentResponse,
  GuardianConsentRecord,
  GuardianConsentResponse,
  GuardianNotificationItem,
  GuardianNotificationResponse,
} from '@/types/api';

type KidsSafetyState = {
  hydrated: boolean;
  guardianConsent: GuardianConsentRecord | null;
  childProfiles: ChildLinkedProfile[];
  childContentDrafts: ChildContentDraft[];
  guardianNotifications: GuardianNotificationItem[];
  acceptGuardianConsent: (payload: {
    acceptedByName: string;
    acceptedByDocument?: string | null;
    relationship: string;
  }) => void;
  addChildProfileDraft: (payload: {
    displayName: string;
    ageBracket: ChildProfileDraft['ageBracket'];
    notes?: string | null;
  }) => void;
  syncRemoteChildProfiles: (profiles: ChildProfileResponse[]) => void;
  syncRemoteGuardianConsent: (consent: GuardianConsentResponse | null) => void;
  syncRemoteChildContent: (contents: ChildContentResponse[]) => void;
  syncRemoteGuardianNotifications: (notifications: GuardianNotificationResponse[]) => void;
  addChildContentDraft: (payload: {
    childProfileId: string;
    title: string;
    category: ChildContentDraft['category'];
    photoRequested?: boolean;
    publicRequested?: boolean;
  }) => void;
  reviewChildContentDraft: (payload: {
    contentId: string;
    approve: boolean;
    allowPublic?: boolean;
  }) => void;
  markGuardianNotificationRead: (notificationId: string) => void;
  clearChildProfiles: () => void;
  setHydrated: (value: boolean) => void;
};

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveAgeBracketFromBirthDate(birthDate: string): ChildProfileDraft['ageBracket'] {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return '6-9';
  }

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age <= 5) {
    return '0-5';
  }

  if (age <= 9) {
    return '6-9';
  }

  if (age <= 13) {
    return '10-13';
  }

  return '14-17';
}

export const useKidsSafetyStore = create<KidsSafetyState>()(
  persist(
    (set) => ({
      hydrated: false,
      guardianConsent: null,
      childProfiles: [],
      childContentDrafts: [],
      guardianNotifications: [],
      acceptGuardianConsent: ({ acceptedByName, acceptedByDocument, relationship }) =>
        set({
          guardianConsent: {
            version: MINOR_GUARDIAN_CONSENT_VERSION,
            acceptedAt: new Date().toISOString(),
            acceptedByName,
            acceptedByDocument: acceptedByDocument ?? null,
            relationship,
          },
        }),
      addChildProfileDraft: ({ displayName, ageBracket, notes }) =>
        set((state) => {
          if (!state.guardianConsent) {
            return {};
          }

          const nextDraft: ChildLinkedProfile = {
            id: createDraftId('child'),
            displayName,
            ageBracket,
            notes: notes ?? null,
            photoEnabled: false,
            publicVisibility: false,
            createdAt: new Date().toISOString(),
            guardianConsentVersion: state.guardianConsent.version,
            guardianName: state.guardianConsent.acceptedByName,
            guardianRelationship: state.guardianConsent.relationship,
            source: 'LOCAL',
            birthDate: null,
            parentId: null,
          };

          const nextNotification: GuardianNotificationItem = {
            id: createDraftId('notification'),
            type: 'KIDS_PROFILE_LINKED',
            title: 'Perfil infantil protegido criado',
            message: `O perfil ${displayName} foi vinculado ao responsavel ${state.guardianConsent.acceptedByName}.`,
            createdAt: new Date().toISOString(),
            readAt: null,
            relatedChildProfileId: nextDraft.id,
            relatedContentId: null,
          };

          return {
            childProfiles: [nextDraft, ...state.childProfiles].slice(0, 10),
            guardianNotifications: [nextNotification, ...state.guardianNotifications].slice(0, 30),
          };
        }),
      syncRemoteChildProfiles: (profiles) =>
        set((state) => {
          const remoteProfiles: ChildLinkedProfile[] = profiles.map((profile) => ({
            id: profile.id,
            displayName: profile.name,
            ageBracket: resolveAgeBracketFromBirthDate(profile.birth_date),
            notes: 'Perfil remoto sincronizado pela OpenAPI oficial.',
            photoEnabled: false,
            publicVisibility: false,
            createdAt: profile.birth_date,
            guardianConsentVersion: state.guardianConsent?.version ?? MINOR_GUARDIAN_CONSENT_VERSION,
            guardianName: state.guardianConsent?.acceptedByName ?? 'Responsavel autenticado',
            guardianRelationship: state.guardianConsent?.relationship ?? 'Responsavel',
            source: 'REMOTE',
            birthDate: profile.birth_date,
            parentId: profile.parent_id,
          }));

          const localProfiles = state.childProfiles.filter((item) => item.source !== 'REMOTE');

          return {
            childProfiles: [...remoteProfiles, ...localProfiles].slice(0, 20),
          };
        }),
      syncRemoteGuardianConsent: (consent) =>
        set(() => {
          if (!consent || consent.revoked_at) {
            return {};
          }

          return {
            guardianConsent: {
              version: consent.consent_version,
              acceptedAt: consent.accepted_at,
              acceptedByName: consent.accepted_by_name,
              acceptedByDocument: consent.accepted_by_document,
              relationship: consent.relationship,
            },
          };
        }),
      syncRemoteChildContent: (contents) =>
        set((state) => {
          const remoteDrafts: ChildContentDraft[] = contents.map((content) => ({
            id: content.id,
            childProfileId: content.child_profile_id ?? 'remote-unlinked',
            title: content.title,
            category: 'DISCOVERY',
            status: content.status,
            photoRequested: false,
            publicRequested: Boolean(content.requested_publication_at),
            createdAt: content.created_at,
            updatedAt: content.updated_at,
          }));
          const localDrafts = state.childContentDrafts.filter((item) => !contents.some((content) => content.id === item.id));

          return {
            childContentDrafts: [...remoteDrafts, ...localDrafts].slice(0, 50),
          };
        }),
      syncRemoteGuardianNotifications: (notifications) =>
        set((state) => {
          const remoteNotifications: GuardianNotificationItem[] = notifications.map((notification) => ({
            id: notification.id,
            type:
              notification.type === 'KIDS_PROFILE_LINKED'
                ? 'KIDS_PROFILE_LINKED'
                : 'KIDS_CONTENT_REVIEW',
            title: notification.title,
            message: notification.message,
            createdAt: notification.created_at,
            readAt: notification.read_at ?? null,
            relatedChildProfileId: notification.related_child_profile_id ?? null,
            relatedContentId: notification.related_content_id ?? null,
          }));
          const localNotifications = state.guardianNotifications.filter(
            (item) => !notifications.some((notification) => notification.id === item.id)
          );

          return {
            guardianNotifications: [...remoteNotifications, ...localNotifications].slice(0, 30),
          };
        }),
      addChildContentDraft: ({ childProfileId, title, category, photoRequested, publicRequested }) =>
        set((state) => {
          const profile = state.childProfiles.find((item) => item.id === childProfileId);
          if (!profile) {
            return {};
          }

          const nextDraft: ChildContentDraft = {
            id: createDraftId('content'),
            childProfileId,
            title,
            category,
            status: publicRequested ? 'AWAITING_GUARDIAN_APPROVAL' : 'DRAFT_PRIVATE',
            photoRequested: Boolean(photoRequested),
            publicRequested: Boolean(publicRequested),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const nextNotification: GuardianNotificationItem | null = publicRequested
            ? {
                id: createDraftId('notification'),
                type: 'KIDS_CONTENT_REVIEW',
                title: 'Autorizacao de publicacao infantil pendente',
                message: `A publicacao "${title}" do perfil ${profile.displayName} aguarda decisao do responsavel.`,
                createdAt: new Date().toISOString(),
                readAt: null,
                relatedChildProfileId: childProfileId,
                relatedContentId: nextDraft.id,
              }
            : null;

          return {
            childContentDrafts: [nextDraft, ...state.childContentDrafts].slice(0, 50),
            guardianNotifications: nextNotification
              ? [nextNotification, ...state.guardianNotifications].slice(0, 30)
              : state.guardianNotifications,
          };
        }),
      reviewChildContentDraft: ({ contentId, approve }) =>
        set((state) => ({
          childContentDrafts: state.childContentDrafts.map((draft) => {
            if (draft.id !== contentId) {
              return draft;
            }

            return {
              ...draft,
              status: approve ? 'GUARDIAN_APPROVED_FOR_PUBLICATION' : 'REJECTED_BY_GUARDIAN',
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      markGuardianNotificationRead: (notificationId) =>
        set((state) => ({
          guardianNotifications: state.guardianNotifications.map((item) =>
            item.id === notificationId
              ? {
                  ...item,
                  readAt: new Date().toISOString(),
                }
              : item
          ),
        })),
      clearChildProfiles: () =>
        set({
          childProfiles: [],
          childContentDrafts: [],
          guardianNotifications: [],
        }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'mybeach-kids-safety',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        guardianConsent: state.guardianConsent,
        childProfiles: state.childProfiles,
        childContentDrafts: state.childContentDrafts,
        guardianNotifications: state.guardianNotifications,
      }),
    }
  )
);

export function hasAcceptedCurrentGuardianConsent() {
  return useKidsSafetyStore.getState().guardianConsent?.version === MINOR_GUARDIAN_CONSENT_VERSION;
}
