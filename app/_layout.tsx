import { Redirect, Stack, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { hasApiAccessToken } from '@/services/config';
import { isJwtExpired } from '@/services/jwt';
import { useAuthStore } from '@/stores/authStore';
import { usePrivacyStore } from '@/stores/privacyStore';

function FullScreenLoader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#ef4444" />
    </View>
  );
}

export default function RootLayout() {
  const segments = useSegments();
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const privacyHydrated = usePrivacyStore((state) => state.hydrated);
  const acceptedVersion = usePrivacyStore((state) => state.acceptedVersion);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    if (isJwtExpired(accessToken)) {
      clearSession();
    }
  }, [accessToken, clearSession, hydrated]);

  if (!hydrated || !privacyHydrated) {
    return <FullScreenLoader />;
  }

  const hasAcceptedPrivacy = Boolean(acceptedVersion);
  const hasSession = Boolean(accessToken || hasApiAccessToken());
  const inAuthScreen = segments[0] === 'auth';
  const inPrivacyScreen = segments[0] === 'privacy-consent';

  if (!hasAcceptedPrivacy && !inPrivacyScreen) {
    return <Redirect href="/privacy-consent" />;
  }

  if (hasAcceptedPrivacy && inPrivacyScreen) {
    return <Redirect href={hasSession ? '/(tabs)' : '/auth'} />;
  }

  if (!hasSession && !inAuthScreen) {
    return <Redirect href="/auth" />;
  }

  if (hasSession && inAuthScreen) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="privacy-consent" />
      <Stack.Screen name="kids-guardian-consent" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Detalhes',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
