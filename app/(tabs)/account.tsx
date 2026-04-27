import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isAuthError } from '@/services/api';
import { fetchCurrentUserProfile, fetchUserProfile } from '@/services/auth';
import { getApiBaseUrl, getApiEnvironmentOptions, getCurrentApiEnvironmentLabel } from '@/services/config';
import { LGPD_CONSENT_VERSION, MINOR_GUARDIAN_CONSENT_VERSION } from '@/constants/legal';
import { getLiveHealth, getReadyHealth } from '@/services/health';
import {
  createKidsChildProfile,
  deleteKidsChildProfile,
  getKidsCapabilitySummary,
  listKidsChildren,
  updateKidsChildProfile,
} from '@/services/kids';
import {
  buildKidsBackendPendingSnapshot,
  buildKidsIntegrationMap,
  buildKidsSnapshotJson,
} from '@/services/kidsDiagnostics';
import {
  clearQueue,
  getQueueItemRetryLabel,
  getQueueSummary,
  listQueueItems,
} from '@/services/offlineQueue';
import { listRecentAlerts } from '@/services/recentAlerts';
import { flushOfflineQueue } from '@/services/sync';
import { formatRemainingSessionTime, formatTokenExpiration } from '@/services/sessionUtils';
import { useAuthStore } from '@/stores/authStore';
import { useKidsSafetyStore } from '@/stores/kidsSafetyStore';
import { usePrivacyStore } from '@/stores/privacyStore';
import { useSettingsStore } from '@/stores/settingsStore';

function resolveAgeBracketFromBirthDate(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return '6-9' as const;
  }

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age <= 5) {
    return '0-5' as const;
  }

  if (age <= 9) {
    return '6-9' as const;
  }

  if (age <= 13) {
    return '10-13' as const;
  }

  return '14-17' as const;
}

function isValidBirthDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenType = useAuthStore((state) => state.tokenType);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const clearSession = useAuthStore((state) => state.clearSession);
  const savedApiBaseUrl = useSettingsStore((state) => state.apiBaseUrl);
  const setApiBaseUrl = useSettingsStore((state) => state.setApiBaseUrl);
  const acceptedVersion = usePrivacyStore((state) => state.acceptedVersion);
  const acceptedAt = usePrivacyStore((state) => state.acceptedAt);
  const guardianConsent = useKidsSafetyStore((state) => state.guardianConsent);
  const childProfiles = useKidsSafetyStore((state) => state.childProfiles);
  const childContentDrafts = useKidsSafetyStore((state) => state.childContentDrafts);
  const guardianNotifications = useKidsSafetyStore((state) => state.guardianNotifications);
  const addChildProfileDraft = useKidsSafetyStore((state) => state.addChildProfileDraft);
  const syncRemoteChildProfiles = useKidsSafetyStore((state) => state.syncRemoteChildProfiles);
  const addChildContentDraft = useKidsSafetyStore((state) => state.addChildContentDraft);
  const reviewChildContentDraft = useKidsSafetyStore((state) => state.reviewChildContentDraft);
  const markGuardianNotificationRead = useKidsSafetyStore((state) => state.markGuardianNotificationRead);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [queueText, setQueueText] = useState('Sem pendencias locais.');
  const [queueDetails, setQueueDetails] = useState<string[]>([]);
  const [recentHistory, setRecentHistory] = useState<string[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState('');
  const [kidsSnapshotJson, setKidsSnapshotJson] = useState('');
  const [kidsBackendPendingJson, setKidsBackendPendingJson] = useState('');
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(savedApiBaseUrl ?? getApiBaseUrl());
  const [remoteChildrenLoading, setRemoteChildrenLoading] = useState(false);
  const [childProfileNameInput, setChildProfileNameInput] = useState('Perfil infantil 1');
  const [childProfileBirthDateInput, setChildProfileBirthDateInput] = useState('2018-01-01');
  const [healthLines, setHealthLines] = useState<string[]>([
    'Health live: nao verificado',
    'Health ready: nao verificado',
  ]);

  const expirationLabel = useMemo(() => formatTokenExpiration(accessToken), [accessToken]);
  const remainingSessionLabel = useMemo(() => formatRemainingSessionTime(expiresAt), [expiresAt]);
  const kidsCapability = useMemo(() => getKidsCapabilitySummary(accessToken), [accessToken]);
  const integrationMap = useMemo(
    () =>
      buildKidsIntegrationMap({
        hasSession: Boolean(accessToken),
        features: kidsCapability.features,
      }),
    [accessToken, kidsCapability.features]
  );

  useEffect(() => {
    setApiBaseUrlInput(savedApiBaseUrl ?? getApiBaseUrl());
  }, [savedApiBaseUrl]);

  const buildDiagnosticReport = useCallback(
    (queueSummaryText: string, queueLines: string[], historyLines: string[], healthSummaryLines: string[]) => {
      return [
        'MYBEACH-CIDADAO DIAGNOSTICO LOCAL',
        `Data: ${new Date().toLocaleString('pt-BR')}`,
        `Base URL: ${getApiBaseUrl()}`,
        `Usuario: ${user?.name ?? 'Nao autenticado no app'}`,
        `Email: ${user?.email ?? 'Nao disponivel'}`,
        `Perfil: ${user?.role ?? 'Nao disponivel'}`,
        `Email verificado: ${user?.emailVerified ? 'sim' : 'nao'}`,
        `Legacy role: ${user?.legacyRole ?? 'Nao informado'}`,
        `Token type: ${tokenType ?? 'Bearer'}`,
        `Expiracao: ${expirationLabel}`,
        `Tempo restante: ${remainingSessionLabel}`,
        `Modo kids: ${kidsCapability.label}`,
        queueSummaryText,
        '',
        'Saude da API:',
        ...healthSummaryLines,
        '',
        'Fila offline:',
        ...(queueLines.length > 0 ? queueLines : ['Sem itens pendentes.']),
        '',
        'Historico recente:',
        ...(historyLines.length > 0 ? historyLines : ['Sem alertas locais registrados.']),
      ].join('\n');
    },
    [expirationLabel, kidsCapability.label, remainingSessionLabel, tokenType, user?.email, user?.emailVerified, user?.legacyRole, user?.name, user?.role]
  );

  const loadLocalSnapshot = useCallback(async () => {
    const queue = await getQueueSummary();
    const queueItems = await listQueueItems();
    const recent = await listRecentAlerts();

    const nextQueueText =
      queue.total > 0
        ? `Fila local: ${queue.total} item(ns) - alertas ${queue.alerts} - pings ${queue.pings}${queue.nextRetryLabel ? ` - ${queue.nextRetryLabel}` : ''}`
        : 'Sem pendencias locais.';

    const nextQueueDetails = queueItems.map(
      (item) =>
        `${item.type} - tentativas ${item.attempts} - ${getQueueItemRetryLabel(item)} - proximo retry ${new Date(
          item.nextRetryAt
        ).toLocaleString('pt-BR')}${item.lastError ? ` - erro: ${item.lastError}` : ''}`
    );

    const nextRecentHistory = recent.map((item) => {
      const timelineSuffix =
        item.timeline && item.timeline.length > 1 ? ` - timeline ${item.timeline.length} eventos` : '';
      return `${item.statusLabel} - ${item.createdAtLabel} - ${item.type}${item.queued ? ' - fila local' : ''}${timelineSuffix}`;
    });

    setQueueText(nextQueueText);
    setQueueDetails(nextQueueDetails);
    setRecentHistory(nextRecentHistory);
    setDiagnosticReport(buildDiagnosticReport(nextQueueText, nextQueueDetails, nextRecentHistory, healthLines));
    return {
      queueSummaryText: nextQueueText,
      queueLines: nextQueueDetails,
      historyLines: nextRecentHistory,
    };
  }, [buildDiagnosticReport, healthLines]);

  const refreshHealthStatus = useCallback(async () => {
    const nextLines: string[] = [];

    try {
      const live = await getLiveHealth();
      const liveStatus = live.status ?? (live.ok ? 'ok' : 'sem status');
      nextLines.push(`Health live: ${liveStatus}`);
    } catch {
      nextLines.push('Health live: indisponivel');
    }

    try {
      const ready = await getReadyHealth();
      const readyStatus = ready.status ?? (ready.ok ? 'ok' : 'sem status');
      nextLines.push(`Health ready: ${readyStatus}`);
    } catch {
      nextLines.push('Health ready: indisponivel');
    }

    setHealthLines(nextLines);
    return nextLines;
  }, []);

  const environmentOptions = useMemo(() => getApiEnvironmentOptions(), []);

  useEffect(() => {
    void loadLocalSnapshot();
  }, [loadLocalSnapshot]);

  useEffect(() => {
    setKidsSnapshotJson(
      buildKidsSnapshotJson({
        integrationMode: kidsCapability.mode,
        integrationLabel: kidsCapability.label,
        user,
        guardianConsent,
        childProfiles,
        childContentDrafts,
        guardianNotifications,
        integrationMap,
      })
    );
    setKidsBackendPendingJson(buildKidsBackendPendingSnapshot(kidsCapability.features));
  }, [
    childContentDrafts,
    childProfiles,
    guardianConsent,
    guardianNotifications,
    integrationMap,
    kidsCapability.features,
    kidsCapability.label,
    kidsCapability.mode,
    user,
  ]);

  useEffect(() => {
    void refreshHealthStatus();
  }, [refreshHealthStatus]);

  const handleRefreshRemoteChildren = useCallback(async () => {
    if (!accessToken || !kidsCapability.features.childrenCrud) {
      return;
    }

    setRemoteChildrenLoading(true);

    try {
      const remoteProfiles = await listKidsChildren(accessToken);
      syncRemoteChildProfiles(remoteProfiles);
      setMessage(`Perfis infantis remotos sincronizados: ${remoteProfiles.length}.`);
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        setMessage('Sessao invalida ou sem permissao. O login local foi encerrado.');
      } else {
        setMessage('Nao foi possivel sincronizar os perfis infantis remotos agora.');
      }
    } finally {
      setRemoteChildrenLoading(false);
    }
  }, [accessToken, kidsCapability.features.childrenCrud, syncRemoteChildProfiles, clearSession]);

  useEffect(() => {
    if (!accessToken || !kidsCapability.features.childrenCrud) {
      return;
    }

    void handleRefreshRemoteChildren();
  }, [accessToken, kidsCapability.features.childrenCrud, handleRefreshRemoteChildren]);

  async function handleDiagnostics() {
    setLoading(true);
    setMessage(null);

    try {
      await loadLocalSnapshot();
      await flushOfflineQueue();
      const nextHealthLines = await refreshHealthStatus();
      const snapshot = await loadLocalSnapshot();
      setDiagnosticReport(
        buildDiagnosticReport(snapshot.queueSummaryText, snapshot.queueLines, snapshot.historyLines, nextHealthLines)
      );

      if (user && accessToken) {
        let profile = null;

        try {
          profile = await fetchCurrentUserProfile(accessToken);
        } catch {
          profile = await fetchUserProfile(user.id, accessToken);
        }

        setMessage(`API autenticada com sucesso para ${profile.name} (${profile.role}).`);
      } else {
        setMessage('Diagnostico local concluido com sessao baseada em ambiente.');
      }
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        setMessage('Sessao invalida ou sem permissao. O login local foi encerrado.');
      } else {
        setMessage('Nao foi possivel concluir o diagnostico da API neste momento.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFlushNow() {
    setLoading(true);
    setMessage(null);

    try {
      await flushOfflineQueue();
      await loadLocalSnapshot();
      setMessage('Fila offline sincronizada com sucesso ou mantida apenas com itens ainda nao elegiveis.');
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        setMessage('Sessao invalida ou sem permissao. O login local foi encerrado.');
      } else {
        setMessage('Nao foi possivel sincronizar a fila offline agora.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleClearQueue() {
    await clearQueue();
    await loadLocalSnapshot();
    setMessage('Fila offline local removida deste aparelho.');
  }

  async function handleShareDiagnosticReport() {
    const report = diagnosticReport || 'Gere um diagnostico para montar o resumo local.';
    await Share.share({
      title: 'MYBEACH-CIDADAO DIAGNOSTICO',
      message: report,
    });
  }

  async function handleShareKidsSnapshot() {
    const report =
      kidsSnapshotJson ||
      buildKidsSnapshotJson({
        integrationMode: kidsCapability.mode,
        integrationLabel: kidsCapability.label,
        user,
        guardianConsent,
        childProfiles,
        childContentDrafts,
        guardianNotifications,
        integrationMap,
      });
    await Share.share({
      title: 'MYBEACH-CIDADAO KIDS SNAPSHOT',
      message: report,
    });
  }

  async function handleCreateProtectedChildDraft() {
    if (!guardianConsent) {
      Alert.alert(
        'Consentimento necessario',
        'Registre antes o consentimento do responsavel para preparar perfis infantis protegidos.'
      );
      return;
    }

    const normalizedName = childProfileNameInput.trim();
    const normalizedBirthDate = childProfileBirthDateInput.trim();

    if (!normalizedName) {
      Alert.alert('Nome obrigatorio', 'Informe um nome para o perfil infantil.');
      return;
    }

    if (!isValidBirthDate(normalizedBirthDate)) {
      Alert.alert('Data invalida', 'Use o formato AAAA-MM-DD para a data de nascimento.');
      return;
    }

    if (accessToken && kidsCapability.features.childrenCrud) {
      setRemoteChildrenLoading(true);

      try {
        await createKidsChildProfile(
          {
            name: normalizedName,
            birth_date: normalizedBirthDate,
          },
          accessToken
        );
        await handleRefreshRemoteChildren();
        setMessage('Perfil infantil criado na API oficial e sincronizado com o app do responsavel.');
        return;
      } catch (error) {
        if (isAuthError(error)) {
          clearSession();
          setMessage('Sessao invalida ou sem permissao. O login local foi encerrado.');
          return;
        }

        setMessage('Falha ao criar perfil infantil remoto. O app manteve o fallback local seguro.');
      } finally {
        setRemoteChildrenLoading(false);
      }
    }

    addChildProfileDraft({
      displayName: normalizedName,
      ageBracket: resolveAgeBracketFromBirthDate(normalizedBirthDate),
      notes: `Rascunho protegido criado localmente. Nascimento informado: ${normalizedBirthDate}. Foto continua bloqueada.`,
    });
    setMessage('Rascunho infantil protegido criado localmente sem foto e sem visibilidade publica.');
  }

  async function handleUpdateFirstRemoteChild() {
    const firstRemoteProfile = childProfiles.find((item) => item.source === 'REMOTE');

    if (!firstRemoteProfile || !accessToken || !kidsCapability.features.childrenCrud) {
      Alert.alert('Perfil remoto ausente', 'Sincronize antes os perfis infantis remotos.');
      return;
    }

    const normalizedName = childProfileNameInput.trim();
    const normalizedBirthDate = childProfileBirthDateInput.trim();

    if (!normalizedName || !isValidBirthDate(normalizedBirthDate)) {
      Alert.alert('Dados invalidos', 'Informe nome e data de nascimento validos no formato AAAA-MM-DD.');
      return;
    }

    setRemoteChildrenLoading(true);

    try {
      await updateKidsChildProfile(
        firstRemoteProfile.id,
        {
          name: normalizedName,
          birth_date: normalizedBirthDate,
        },
        accessToken
      );
      await handleRefreshRemoteChildren();
      setMessage(`Perfil remoto ${firstRemoteProfile.displayName} atualizado com sucesso.`);
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        setMessage('Sessao invalida ou sem permissao. O login local foi encerrado.');
      } else {
        setMessage('Nao foi possivel atualizar o perfil infantil remoto.');
      }
    } finally {
      setRemoteChildrenLoading(false);
    }
  }

  async function handleDeleteFirstRemoteChild() {
    const firstRemoteProfile = childProfiles.find((item) => item.source === 'REMOTE');

    if (!firstRemoteProfile || !accessToken || !kidsCapability.features.childrenCrud) {
      Alert.alert('Perfil remoto ausente', 'Sincronize antes os perfis infantis remotos.');
      return;
    }

    setRemoteChildrenLoading(true);

    try {
      await deleteKidsChildProfile(firstRemoteProfile.id, accessToken);
      await handleRefreshRemoteChildren();
      setMessage(`Perfil remoto ${firstRemoteProfile.displayName} removido com sucesso.`);
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        setMessage('Sessao invalida ou sem permissao. O login local foi encerrado.');
      } else {
        setMessage('Nao foi possivel remover o perfil infantil remoto.');
      }
    } finally {
      setRemoteChildrenLoading(false);
    }
  }

  function handleCreateChildContentDraft() {
    const firstProfile = childProfiles[0];
    if (!firstProfile) {
      Alert.alert('Perfil infantil ausente', 'Crie primeiro um perfil infantil protegido.');
      return;
    }

    addChildContentDraft({
      childProfileId: firstProfile.id,
      title: `Descoberta de ${firstProfile.displayName}`,
      category: 'DISCOVERY',
      photoRequested: false,
      publicRequested: false,
    });
    setMessage('Conteudo infantil criado como rascunho privado.');
  }

  function handleRequestChildPublication() {
    const firstProfile = childProfiles[0];
    if (!firstProfile) {
      Alert.alert('Perfil infantil ausente', 'Crie primeiro um perfil infantil protegido.');
      return;
    }

    addChildContentDraft({
      childProfileId: firstProfile.id,
      title: `Publicacao de ${firstProfile.displayName}`,
      category: 'DISCOVERY',
      photoRequested: false,
      publicRequested: true,
    });
    setMessage('Solicitacao de publicacao enviada para decisao do responsavel.');
  }

  function handleSaveApiBaseUrl() {
    const normalized = apiBaseUrlInput.trim().replace(/\/+$/, '');

    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      Alert.alert('Base URL invalida', 'Informe uma URL iniciando com http:// ou https://');
      return;
    }

    setApiBaseUrl(normalized);
    setMessage('Base URL salva localmente. O app passa a usar esse endpoint imediatamente.');
  }

  function handleResetApiBaseUrl() {
    setApiBaseUrl(null);
    setApiBaseUrlInput(getApiBaseUrl());
    setMessage('Base URL local removida. O app voltou para a configuracao padrao do ambiente.');
  }

  function handleUseEnvironment(url: string | null, label: string, available: boolean) {
    if (!available || !url) {
      Alert.alert('Ambiente indisponivel', `O preset ${label} ainda nao foi configurado no app.`);
      return;
    }

    setApiBaseUrl(url);
    setApiBaseUrlInput(url);
    setMessage(`Ambiente ${label} aplicado localmente.`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Conta e diagnostico</Text>
      <Text style={styles.subtitle}>Sessao, expiracao do token, fila local e resumo pronto para reporte.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sessao</Text>
        <Text style={styles.item}>Usuario: {user?.name ?? 'Nao autenticado no app'}</Text>
        <Text style={styles.item}>Email: {user?.email ?? 'Nao disponivel'}</Text>
        <Text style={styles.item}>Perfil: {user?.role ?? 'Nao disponivel'}</Text>
        <Text style={styles.item}>Email verificado: {user?.emailVerified ? 'sim' : 'nao'}</Text>
        <Text style={styles.item}>Legacy role: {user?.legacyRole ?? 'Nao informado'}</Text>
        <Text style={styles.item}>Token type: {tokenType ?? 'Bearer'}</Text>
        <Text style={styles.item}>Expira em: {expirationLabel}</Text>
        <Text style={styles.item}>Tempo restante: {remainingSessionLabel}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacidade e LGPD</Text>
        <Text style={styles.item}>Versao aceita: {acceptedVersion ?? 'Nao registrada'}</Text>
        <Text style={styles.item}>
          Data do aceite: {acceptedAt ? new Date(acceptedAt).toLocaleString('pt-BR') : 'Nao registrada'}
        </Text>
        <Text style={styles.item}>Versao atual exigida: {LGPD_CONSENT_VERSION}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/privacy-consent')}>
          <Text style={styles.secondaryButtonLabel}>Revisar termos e privacidade</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Area Kids e Responsavel</Text>
        <Text style={styles.item}>
          Consentimento do responsavel: {guardianConsent?.version ?? 'Nao registrado'}
        </Text>
        <Text style={styles.item}>
          Versao exigida: {MINOR_GUARDIAN_CONSENT_VERSION}
        </Text>
        <Text style={styles.item}>
          Data: {guardianConsent?.acceptedAt ? new Date(guardianConsent.acceptedAt).toLocaleString('pt-BR') : 'Nao registrada'}
        </Text>
        <Text style={styles.item}>
          Responsavel: {guardianConsent?.acceptedByName ?? 'Nao informado'}
        </Text>
        <Text style={styles.item}>
          Perfis infantis protegidos: {childProfiles.length}
        </Text>
        <Text style={styles.item}>
          Perfis remotos sincronizados: {childProfiles.filter((item) => item.source === 'REMOTE').length}
        </Text>
        <Text style={styles.item}>
          Conteudos aguardando aprovacao: {childContentDrafts.filter((item) => item.status === 'AWAITING_GUARDIAN_APPROVAL').length}
        </Text>
        <Text style={styles.item}>
          Notificacoes do responsavel: {guardianNotifications.filter((item) => !item.readAt).length} pendente(s)
        </Text>
        <Text style={styles.item}>Integracao kids: {kidsCapability.label}</Text>
        <Text style={styles.helper}>
          {kidsCapability.reason}
        </Text>
        <Text style={styles.helper}>
          Perfis remotos OpenAPI: {kidsCapability.features.childrenCrud ? 'disponiveis' : 'nao publicados'}
        </Text>
        <Text style={styles.helper}>
          Push do responsavel pode reaproveitar o registro atual de token do ecossistema, mas ainda falta recurso remoto de notificacoes parentais com leitura e auditoria.
        </Text>
        <TextInput
          value={childProfileNameInput}
          onChangeText={setChildProfileNameInput}
          style={styles.input}
          placeholder="Nome do perfil infantil"
        />
        <TextInput
          value={childProfileBirthDateInput}
          onChangeText={setChildProfileBirthDateInput}
          style={styles.input}
          autoCapitalize="none"
          placeholder="AAAA-MM-DD"
        />
        <Text style={styles.helper}>
          Fotos seguem bloqueadas por padrao e nenhum perfil infantil fica publico nesta fase.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/kids-guardian-consent')}>
            <Text style={styles.secondaryButtonLabel}>Consentimento responsavel</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void handleCreateProtectedChildDraft()}>
            <Text style={styles.secondaryButtonLabel}>
              {kidsCapability.features.childrenCrud ? 'Criar perfil remoto' : 'Criar rascunho infantil'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.refreshButton}
            onPress={() => void handleRefreshRemoteChildren()}
            disabled={!kidsCapability.features.childrenCrud || remoteChildrenLoading}
          >
            <Text style={styles.refreshButtonLabel}>
              {remoteChildrenLoading ? 'Sincronizando...' : 'Atualizar perfis da API'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => void handleUpdateFirstRemoteChild()}
            disabled={!kidsCapability.features.childrenCrud || remoteChildrenLoading}
          >
            <Text style={styles.secondaryButtonLabel}>Atualizar 1o perfil remoto</Text>
          </Pressable>
          <Pressable
            style={styles.clearButton}
            onPress={() => void handleDeleteFirstRemoteChild()}
            disabled={!kidsCapability.features.childrenCrud || remoteChildrenLoading}
          >
            <Text style={styles.clearButtonLabel}>Excluir 1o perfil remoto</Text>
          </Pressable>
        </View>
        <Text style={styles.helper}>
          O endpoint de foto infantil ja existe na API, mas continua bloqueado por politica conservadora ate definicao formal do backend.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.refreshButton} onPress={handleCreateChildContentDraft}>
            <Text style={styles.refreshButtonLabel}>Salvar rascunho privado</Text>
          </Pressable>
          <Pressable style={styles.refreshButton} onPress={handleRequestChildPublication}>
            <Text style={styles.refreshButtonLabel}>Pedir publicacao</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mapa de integracao kids</Text>
        {integrationMap.map((item) => (
          <View key={item.id} style={styles.kidsRow}>
            <Text style={styles.item}>
              {item.label}: {item.state}
            </Text>
            <Text style={styles.helper}>{item.detail}</Text>
          </View>
        ))}
        <Pressable style={styles.secondaryButton} onPress={() => void handleShareKidsSnapshot()}>
          <Text style={styles.secondaryButtonLabel}>Compartilhar snapshot kids</Text>
        </Pressable>
        <Text selectable style={styles.reportBox}>
          {kidsBackendPendingJson || buildKidsBackendPendingSnapshot(kidsCapability.features)}
        </Text>
      </View>

      {childProfiles.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfis infantis protegidos</Text>
          {childProfiles.map((profile) => (
            <Text key={profile.id} style={styles.item}>
              {profile.displayName} - {profile.birthDate ? `nascimento ${profile.birthDate}` : `faixa ${profile.ageBracket}`} -{' '}
              {profile.source === 'REMOTE' ? 'perfil remoto' : 'perfil local'} - foto bloqueada - publico desativado
            </Text>
          ))}
        </View>
      ) : null}

      {childContentDrafts.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fluxo de conteudo infantil</Text>
          {childContentDrafts.map((draft) => (
            <View key={draft.id} style={styles.kidsRow}>
              <Text style={styles.item}>
                {draft.title} - {draft.category} - {draft.status}
              </Text>
              {draft.status === 'AWAITING_GUARDIAN_APPROVAL' ? (
                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => reviewChildContentDraft({ contentId: draft.id, approve: true })}
                  >
                    <Text style={styles.secondaryButtonLabel}>Autorizar sim</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => reviewChildContentDraft({ contentId: draft.id, approve: false })}
                  >
                    <Text style={styles.secondaryButtonLabel}>Autorizar nao</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {guardianNotifications.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monitoramento do responsavel</Text>
          {guardianNotifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={styles.notificationCard}
              onPress={() => markGuardianNotificationRead(notification.id)}
            >
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.item}>{notification.message}</Text>
              <Text style={styles.notificationMeta}>
                {notification.readAt ? 'Lida' : 'Pendente'} - {new Date(notification.createdAt).toLocaleString('pt-BR')}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>API</Text>
        <Text style={styles.item}>Base URL ativa: {getApiBaseUrl()}</Text>
        <Text style={styles.item}>Ambiente ativo: {getCurrentApiEnvironmentLabel()}</Text>
        {healthLines.map((line) => (
          <Text key={line} style={styles.item}>
            {line}
          </Text>
        ))}
        <TextInput
          value={apiBaseUrlInput}
          onChangeText={setApiBaseUrlInput}
          style={styles.input}
          autoCapitalize="none"
          placeholder="https://api.seudominio.com"
        />
        <View style={styles.environmentRow}>
          {environmentOptions.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.environmentButton,
                getApiBaseUrl() === option.url && option.url ? styles.environmentButtonActive : null,
                !option.available ? styles.environmentButtonDisabled : null,
              ]}
              onPress={() => handleUseEnvironment(option.url, option.label, option.available)}
            >
              <Text
                style={[
                  styles.environmentLabel,
                  getApiBaseUrl() === option.url && option.url ? styles.environmentLabelActive : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.item}>{queueText}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={handleSaveApiBaseUrl}>
            <Text style={styles.secondaryButtonLabel}>Salvar URL</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleResetApiBaseUrl}>
            <Text style={styles.secondaryButtonLabel}>Resetar</Text>
          </Pressable>
        </View>
        <View style={styles.buttonRow}>
          <Pressable style={styles.refreshButton} onPress={() => void loadLocalSnapshot()}>
            <Text style={styles.refreshButtonLabel}>Atualizar snapshot local</Text>
          </Pressable>
          <Pressable style={styles.refreshButton} onPress={() => void handleFlushNow()}>
            <Text style={styles.refreshButtonLabel}>Sincronizar fila agora</Text>
          </Pressable>
        </View>
        <Pressable style={styles.clearButton} onPress={() => void handleClearQueue()}>
          <Text style={styles.clearButtonLabel}>Limpar fila offline local</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleDiagnostics} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonLabel}>Rodar diagnostico</Text>
          )}
        </Pressable>
      </View>

      {recentHistory.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historico recente</Text>
          {recentHistory.map((item) => (
            <Text key={item} style={styles.item}>
              {item}
            </Text>
          ))}
        </View>
      ) : null}

      {queueDetails.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes da fila offline</Text>
          {queueDetails.map((item) => (
            <Text key={item} style={styles.item}>
              {item}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo para reporte</Text>
        <Text style={styles.helper}>
          Use este bloco ao reportar teste, falha de sessao, fila offline ou endpoint em uso.
        </Text>
        <Text selectable style={styles.reportBox}>
          {diagnosticReport || 'Gere um diagnostico para montar o resumo local.'}
        </Text>
        <Pressable style={styles.shareButton} onPress={() => void handleShareDiagnosticReport()}>
          <Text style={styles.shareButtonLabel}>Compartilhar resumo</Text>
        </Pressable>
      </View>

      {user ? (
        <Pressable style={styles.logoutButton} onPress={clearSession}>
          <Text style={styles.logoutLabel}>Encerrar sessao</Text>
        </Pressable>
      ) : null}
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
    paddingBottom: 120,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: '#64748b',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  item: {
    color: '#334155',
    lineHeight: 22,
    marginBottom: 8,
  },
  helper: {
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  kidsRow: {
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  message: {
    marginTop: 12,
    color: '#0f172a',
    lineHeight: 20,
  },
  environmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  environmentButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  environmentButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  environmentButtonDisabled: {
    opacity: 0.45,
  },
  environmentLabel: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  environmentLabelActive: {
    color: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    color: '#0f172a',
    fontWeight: '700',
  },
  refreshButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshButtonLabel: {
    color: '#0f172a',
    fontWeight: '700',
  },
  clearButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#fff1f2',
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonLabel: {
    color: '#be123c',
    fontWeight: '800',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '800',
  },
  reportBox: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  shareButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonLabel: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  notificationCard: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  notificationTitle: {
    color: '#0f172a',
    fontWeight: '800',
    marginBottom: 6,
  },
  notificationMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutLabel: {
    color: '#b91c1c',
    fontWeight: '800',
  },
});
