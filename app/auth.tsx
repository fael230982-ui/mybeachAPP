import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { loginCitizen, registerCitizen } from '@/services/auth';
import { getFriendlyApiErrorMessage } from '@/services/api';
import { getApiBaseUrl, getEnvironmentStatus } from '@/services/config';
import { useAuthStore } from '@/stores/authStore';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const setSession = useAuthStore((state) => state.setSession);

  const title = useMemo(
    () => (mode === 'login' ? 'Entrar no MyBeach' : 'Criar conta do cidadão'),
    [mode]
  );

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const normalizedPassword = password;
  const environmentStatus = useMemo(() => getEnvironmentStatus(), []);

  async function handleSubmit() {
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setErrorMessage('Informe um e-mail valido para continuar.');
      return;
    }

    if (!normalizedPassword || normalizedPassword.length < 6) {
      setErrorMessage('A senha deve ter ao menos 6 caracteres.');
      return;
    }

    if (mode === 'register' && !normalizedName) {
      setErrorMessage('Informe seu nome para criar a conta.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'register') {
        const session = await registerCitizen({
          name: normalizedName,
          email: normalizedEmail,
          password: normalizedPassword,
        });

        setSession(session);
        return;
      }

      const session = await loginCitizen({ email: normalizedEmail, password: normalizedPassword });
      setSession(session);
    } catch (error) {
      setErrorMessage(getFriendlyApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.topGlow} />
        <View style={styles.secondaryGlow} />

        <View style={styles.hero}>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>MYBEACH</Text>
          </View>
          <View style={styles.logoShell}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.mainLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.kicker}>MYBEACH CIDADAO</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Acesso oficial ao ecossistema MyBeach com sessão local persistida e fluxo pronto para operação.
          </Text>
          <Text style={styles.legalHint}>
            O uso do app depende do aceite prévio do Termo de Uso e do Aviso de Privacidade.
          </Text>
          <View style={[styles.environmentBox, environmentStatus.warnings.length > 0 && styles.environmentBoxWarning]}>
            <Text style={styles.environmentText}>API: {getApiBaseUrl()}</Text>
            {environmentStatus.warnings.slice(0, 1).map((warning) => (
              <Text key={warning} style={styles.environmentWarning}>
                {warning}
              </Text>
            ))}
          </View>
          <View style={styles.brandStrip}>
            <Text style={styles.brandStripItem}>Segurança de praia</Text>
            <Text style={styles.brandStripDivider}>|</Text>
            <Text style={styles.brandStripItem}>Alerta rapido</Text>
            <Text style={styles.brandStripDivider}>|</Text>
            <Text style={styles.brandStripItem}>Status operacional</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Pressable
              style={[styles.switchButton, mode === 'login' && styles.switchButtonActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.switchLabel, mode === 'login' && styles.switchLabelActive]}>Entrar</Text>
            </Pressable>

            <Pressable
              style={[styles.switchButton, mode === 'register' && styles.switchButtonActive]}
              onPress={() => switchMode('register')}
            >
              <Text style={[styles.switchLabel, mode === 'register' && styles.switchLabelActive]}>
                Cadastrar
              </Text>
            </Pressable>
          </View>

          {mode === 'register' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Seu nome" />
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="voce@exemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Sua senha"
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitLabel}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.creditBlock}>
          <Text style={styles.creditLabel}>Desenvolvido por</Text>
          <Image
            source={require('../assets/images/Logo-Rafiels.png')}
            style={styles.creditLogo}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#eaf3fb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: 40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#bfdbfe',
    opacity: 0.8,
  },
  secondaryGlow: {
    position: 'absolute',
    top: 180,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fecaca',
    opacity: 0.7,
  },
  hero: {
    marginBottom: 24,
    alignItems: 'center',
  },
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0f172a',
    marginBottom: 16,
  },
  brandPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  logoShell: {
    width: 172,
    height: 172,
    borderRadius: 42,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  mainLogo: {
    width: 124,
    height: 124,
  },
  kicker: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  legalHint: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  environmentBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 360,
  },
  environmentBoxWarning: {
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
  },
  environmentText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  environmentWarning: {
    marginTop: 6,
    color: '#9a3412',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  brandStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  brandStripItem: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  brandStripDivider: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 22,
    elevation: 4,
  },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 6,
    marginBottom: 18,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#0f172a',
  },
  switchLabel: {
    color: '#475569',
    fontWeight: '700',
  },
  switchLabelActive: {
    color: '#fff',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    marginBottom: 14,
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#ef4444',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  creditBlock: {
    marginTop: 28,
    alignItems: 'center',
  },
  creditLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  creditLogo: {
    width: 190,
    height: 58,
  },
});
