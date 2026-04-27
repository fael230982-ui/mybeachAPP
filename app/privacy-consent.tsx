import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEGAL_CONTACT, LEGAL_SUMMARY, LGPD_CONSENT_VERSION } from '@/constants/legal';
import { hasApiAccessToken } from '@/services/config';
import { useAuthStore } from '@/stores/authStore';
import { usePrivacyStore } from '@/stores/privacyStore';

function LegalSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.cardItem}>
          - {item}
        </Text>
      ))}
    </View>
  );
}

export default function PrivacyConsentScreen() {
  const acceptCurrentVersion = usePrivacyStore((state) => state.acceptCurrentVersion);
  const accessToken = useAuthStore((state) => state.accessToken);

  function handleAccept() {
    acceptCurrentVersion();
    router.replace(accessToken || hasApiAccessToken() ? '/(tabs)' : '/auth');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={require('../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.kicker}>LGPD E PRIMEIRO ACESSO</Text>
        <Text style={styles.title}>Termo de Uso e Aviso de Privacidade</Text>
        <Text style={styles.subtitle}>
          Antes de usar o app, registre o aceite desta versao dos termos e do aviso de privacidade.
        </Text>
        <Text style={styles.version}>Versao do aceite: {LGPD_CONSENT_VERSION}</Text>
      </View>

      <LegalSection title="Termo de Uso" items={LEGAL_SUMMARY.terms} />
      <LegalSection title="Aviso de Privacidade" items={LEGAL_SUMMARY.privacy} />
      <LegalSection title="Direitos do Titular" items={LEGAL_SUMMARY.rights} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Canal de Privacidade</Text>
        <Text style={styles.cardItem}>Controlador informado: {LEGAL_CONTACT.controllerName}</Text>
        <Text style={styles.cardItem}>Contato: {LEGAL_CONTACT.supportEmail}</Text>
        <Text style={styles.cardItem}>Canal: {LEGAL_CONTACT.supportChannel}</Text>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Importante</Text>
        <Text style={styles.noticeText}>
          O app trata dados de identificacao, autenticacao, localizacao e eventos operacionais para resposta de emergencia,
          seguranca e melhoria do atendimento. O uso continua sujeito a revisoes futuras dos termos.
        </Text>
      </View>

      <Pressable style={styles.acceptButton} onPress={handleAccept}>
        <Text style={styles.acceptButtonLabel}>Li e concordo</Text>
      </Pressable>

      <Text style={styles.footerText}>
        Se voce nao concordar, nao prossiga com o uso do aplicativo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  kicker: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  version: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardItem: {
    color: '#334155',
    lineHeight: 22,
    marginBottom: 8,
  },
  noticeBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  noticeTitle: {
    color: '#1d4ed8',
    fontWeight: '800',
    marginBottom: 8,
  },
  noticeText: {
    color: '#1e3a8a',
    lineHeight: 22,
  },
  acceptButton: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  footerText: {
    marginTop: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
