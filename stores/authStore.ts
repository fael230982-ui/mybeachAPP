import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';

import { isJwtExpired } from '@/services/jwt';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  legacyRole?: string | null;
  emailVerified?: boolean;
  cityId?: string | null;
  audience?: 'ADULT' | 'MINOR';
  guardianId?: string | null;
  guardianVerified?: boolean;
};

type AuthState = {
  hydrated: boolean;
  accessToken: string | null;
  tokenType: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
  setSession: (payload: {
    accessToken: string;
    tokenType?: string | null;
    expiresAt?: string | null;
    user: AuthUser | null;
  }) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
};

const secureStorage: StateStorage = {
  getItem: async (name) => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      accessToken: null,
      tokenType: null,
      expiresAt: null,
      user: null,
      setSession: ({ accessToken, tokenType, expiresAt, user }) =>
        set({
          accessToken,
          tokenType: tokenType ?? 'Bearer',
          expiresAt: expiresAt ?? null,
          user,
        }),
      clearSession: () => set({ accessToken: null, tokenType: null, expiresAt: null, user: null }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'mybeach-auth',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && isJwtExpired(state.accessToken)) {
          state.clearSession();
        }
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        tokenType: state.tokenType,
        expiresAt: state.expiresAt,
        user: state.user,
      }),
    }
  )
);

export function getStoredAccessToken() {
  return useAuthStore.getState().accessToken;
}

export function getStoredTokenType() {
  return useAuthStore.getState().tokenType;
}

export function getStoredUser() {
  return useAuthStore.getState().user;
}
