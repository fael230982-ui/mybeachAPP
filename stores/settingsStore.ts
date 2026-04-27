import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SettingsState = {
  apiBaseUrl: string | null;
  setApiBaseUrl: (value: string | null) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiBaseUrl: null,
      setApiBaseUrl: (value) => set({ apiBaseUrl: value }),
    }),
    {
      name: 'mybeach-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        apiBaseUrl: state.apiBaseUrl,
      }),
    }
  )
);

export function getStoredApiBaseUrl() {
  return useSettingsStore.getState().apiBaseUrl;
}
