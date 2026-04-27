import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LGPD_CONSENT_VERSION } from '@/constants/legal';

type PrivacyState = {
  hydrated: boolean;
  acceptedVersion: string | null;
  acceptedAt: string | null;
  acceptCurrentVersion: () => void;
  clearAcceptance: () => void;
  setHydrated: (value: boolean) => void;
};

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      hydrated: false,
      acceptedVersion: null,
      acceptedAt: null,
      acceptCurrentVersion: () =>
        set({
          acceptedVersion: LGPD_CONSENT_VERSION,
          acceptedAt: new Date().toISOString(),
        }),
      clearAcceptance: () =>
        set({
          acceptedVersion: null,
          acceptedAt: null,
        }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'mybeach-privacy',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        acceptedVersion: state.acceptedVersion,
        acceptedAt: state.acceptedAt,
      }),
    }
  )
);

export function hasAcceptedCurrentLegalTerms() {
  return usePrivacyStore.getState().acceptedVersion === LGPD_CONSENT_VERSION;
}
