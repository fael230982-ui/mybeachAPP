import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { KIDS_PRIVACY_SUMMARY, MINOR_GUARDIAN_CONSENT_VERSION } from '@/constants/legal';
import { useKidsSafetyStore } from '@/stores/kidsSafetyStore';

function Section({ title, items }: { title: string; items: string[] }) {
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

export default function KidsGuardianConsentScreen() {
  const acceptGuardianConsent = useKidsSafetyStore((state) => state.acceptGuardianConsent);
  const [guardianName, setGuardianName] = useState('');
  const [guardianDocument, setGuardianDocument] = useState('');
  const [relationship, setRelationship] = useState('');

  function handleAccept() {
    if (!guardianName.trim() || !relationship.trim()) {
      Alert.alert('Dados incompletos', 'Informe nome do responsavel e vinculo antes de continuar.');
      return;
    }

    acceptGuardianConsent({
      acceptedByName: guardianName.trim(),
      acceptedByDocument: guardianDocument.trim() || null,
      relationship: relationship.trim(),
    });

    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>AREA INFANTIL PROTEGIDA</Text>
      <Text style={styles.title}>Consentimento do Responsavel</Text>
      <Text style={styles.subtitle}>
        Esta etapa prepara a futura area kids com travas de privacidade. Nenhum perfil infantil fica publico por padrao.
      </Text>
      <Text style={styles.version}>Versao do consentimento: {MINOR_GUARDIAN_CONSENT_VERSION}</Text>

      <Section title="Regras base" items={KIDS_PRIVACY_SUMMARY.terms} />
      <Section title="Privacidade infantil" items={KIDS_PRIVACY_SUMMARY.privacy} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Responsavel</Text>
        <TextInput
          value={guardianName}
          onChangeText={setGuardianName}
          style={styles.input}
          placeholder="Nome do responsavel"
        />
        <TextInput
          value={guardianDocument}
          onChangeText={setGuardianDocument}
          style={styles.input}
          placeholder="Documento do responsavel"
        />
        <TextInput
          value={relationship}
          onChangeText={setRelationship}
          style={styles.input}
          placeholder="Vinculo com a crianca"
        />
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          Ao confirmar, o responsavel declara estar ciente de que o modulo infantil deve operar com minimizacao de dados,
          sem fotos liberadas por padrao e sem exposicao publica ate definicao juridica e operacional completa.
        </Text>
      </View>

      <Pressable style={styles.button} onPress={handleAccept}>
        <Text style={styles.buttonLabel}>Registrar consentimento do responsavel</Text>
      </Pressable>
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
  },
  subtitle: {
    color: '#475569',
    lineHeight: 22,
    marginTop: 12,
  },
  version: {
    marginTop: 10,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 20,
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
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#0f172a',
  },
  noticeBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  noticeText: {
    color: '#9a3412',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
});
