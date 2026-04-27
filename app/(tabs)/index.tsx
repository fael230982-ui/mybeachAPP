import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  createAlert,
  getAlertStatusSnapshot,
  getAlertStatusLabel,
  getAlertTypeLabel,
  toAlertViewModel,
} from '@/services/alerts';
import { getAlertStatusTone } from '@/constants/contracts';
import { listBeaches, getBeachDetails, listCities } from '@/services/beaches';
import { AppError, getFriendlyApiErrorMessage, isAuthError } from '@/services/api';
import {
  getApiBaseUrl,
  getBootstrapCitizenUserId,
  getCurrentApiEnvironmentId,
  getCurrentApiEnvironmentLabel,
  hasApiAccessToken,
} from '@/services/config';
import { getBatteryPercentage, getDevicePushTokenAsync } from '@/services/deviceUtils';
import { updateUserFcmToken } from '@/services/users';
import { enqueueAlert, enqueueLocationPing, getQueueSummary } from '@/services/offlineQueue';
import { pingLocation } from '@/services/locations';
import { listRecentAlerts, recordQueuedAlert, recordViewModelAlert, RecentAlertItem } from '@/services/recentAlerts';
import { flushOfflineQueue } from '@/services/sync';
import { AlertCreateRequest, Beach, City, AlertType, AlertViewModel } from '@/types/api';
import { BeachData, defaultBeachData, useBeachStore } from '@/stores/beachStore';
import { useAuthStore } from '@/stores/authStore';

const { width, height } = Dimensions.get('window');

const guidanceByType: Record<AlertType, string[]> = {
  DROWNING: ['Mantenha contato visual.', 'Não entre na água.', 'Aponte a vítima para os guarda-vidas.'],
  MEDICAL: ['Afaste curiosos.', 'Informe sinais visiveis para a equipe.', 'Mantenha o local livre para atendimento.'],
  LOST_CHILD: ['Procure um guarda-vidas próximo.', 'Não saia da área informada.', 'Descreva roupas, idade e sinais da criança.'],
};

function mapRiskLevelToFlag(riskLevel?: string | null) {
  const value = String(riskLevel ?? '').toLowerCase();

  if (value.includes('red') || value.includes('vermelh')) {
    return 'vermelha';
  }

  if (value.includes('yellow') || value.includes('amarel')) {
    return 'amarela';
  }

  return 'verde';
}

function formatMetric(value: number | null | undefined, suffix: string) {
  return value == null ? '--' : `${value}${suffix}`;
}

function buildBeachData(beach: Beach, cityId: string | null, details?: Awaited<ReturnType<typeof getBeachDetails>>): BeachData {
  return {
    id: beach.id,
    cityId,
    name: beach.name,
    temp: formatMetric(details?.temperature, 'C'),
    waves: formatMetric(details?.wave_height, 'm'),
    wind: details?.wind_speed == null ? '--' : `${details.wind_speed} km/h`,
    uv: details?.uv_index == null ? '--' : String(details.uv_index),
    flag: mapRiskLevelToFlag(details?.risk_level),
    updatedAt: details?.weather_updated_at
      ? new Date(details.weather_updated_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Agora',
    curiosidades: [
      `Monitoramento operacional da praia ${beach.name}.`,
      cityId ? `Cidade vinculada ao cadastro: ${cityId}.` : 'Cidade ainda não vinculada localmente.',
    ],
    ruas: ['Integracao detalhada de vias ainda pendente no backend.'],
    pontosTuristicos: [`Dados turísticos de ${beach.name} ainda não foram sincronizados.`],
    locaisInstagramaveis: [`Pontos visuais de ${beach.name} ainda não foram sincronizados.`],
    regrasDaPraia: ['Siga a sinalizacao oficial.', 'Procure os guarda-vidas em caso de risco.'],
    comerciosSugeridos: ['Nenhum comércio validado foi sincronizado para esta praia.'],
  };
}

export default function HomeScreen() {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingBeach, setIsLoadingBeach] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [cities, setCities] = useState<City[]>([]);
  const [beaches, setBeaches] = useState<Beach[]>([]);
  const [selectedEstado, setSelectedEstado] = useState('SP');
  const [selectedCidadeId, setSelectedCidadeId] = useState('');
  const [selectedPraiaId, setSelectedPraiaId] = useState('');

  const [showBeachModal, setShowBeachModal] = useState(false);
  const [showSosMainModal, setShowSosMainModal] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertViewModel | null>(null);
  const [queueSummary, setQueueSummary] = useState({
    total: 0,
    alerts: 0,
    pings: 0,
    nextRetryAt: null as string | null,
    nextRetryLabel: null as string | null,
  });
  const [recentAlerts, setRecentAlerts] = useState<RecentAlertItem[]>([]);

  const { selectedBeach, setSelectedBeach } = useBeachStore();
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const currentBeach = selectedBeach ?? defaultBeachData;

  const isConfigured = Boolean(accessToken || hasApiAccessToken());
  const creatorUserId = authUser?.id ?? getBootstrapCitizenUserId();
  const isHomologationEnvironment = getCurrentApiEnvironmentId() === 'homologation';

  const citiesByUf = useMemo(
    () => cities.filter((city) => city.uf === selectedEstado),
    [cities, selectedEstado]
  );

  const beachesByCity = useMemo(
    () => beaches.filter((beach) => beach.city_id === selectedCidadeId),
    [beaches, selectedCidadeId]
  );

  const selectBeach = useCallback(async (beach: Beach, cityId: string | null) => {
    setIsLoadingBeach(true);
    setSelectedPraiaId(beach.id);

    try {
      const details = await getBeachDetails(beach.id);
      const nextBeachData = buildBeachData(beach, cityId, details);
      setSelectedBeach(nextBeachData);
      setErrorMessage(null);
    } catch (error) {
      setSelectedBeach(buildBeachData(beach, cityId));
      setErrorMessage(
        error instanceof AppError
          ? `${getFriendlyApiErrorMessage(error)} A praia foi carregada sem detalhes operacionais.`
          : 'Praia carregada sem detalhes operacionais.'
      );
    } finally {
      setIsLoadingBeach(false);
      setShowBeachModal(false);
    }
  }, [setSelectedBeach]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!isConfigured) {
        if (isMounted) {
          setErrorMessage(
            'Configure EXPO_PUBLIC_API_ACCESS_TOKEN para carregar cidades, praias e alertas do backend.'
          );
          setSelectedBeach(defaultBeachData);
          setIsLoadingData(false);
        }

        return;
      }

      try {
        await flushOfflineQueue();
        const [citiesResponse, beachesResponse] = await Promise.all([listCities(), listBeaches()]);
        const queueState = await getQueueSummary();
        const recentAlertState = await listRecentAlerts();

        if (creatorUserId) {
          const devicePushToken = await getDevicePushTokenAsync();
          if (devicePushToken) {
            await updateUserFcmToken(creatorUserId, devicePushToken);
          }
        }

        if (!isMounted) {
          return;
        }

        setCities(citiesResponse);
        setBeaches(beachesResponse);
        setQueueSummary(queueState);
        setRecentAlerts(recentAlertState);

        const initialUf = citiesResponse[0]?.uf ?? 'SP';
        setSelectedEstado(initialUf);

        const initialCity = citiesResponse.find((city) => city.uf === initialUf) ?? citiesResponse[0];
        if (initialCity) {
          setSelectedCidadeId(initialCity.id);
          const initialBeach =
            beachesResponse.find((beach) =>
              beach.name.toLowerCase().includes('pitangueiras')
            ) ?? beachesResponse.find((beach) => beach.city_id === initialCity.id) ?? beachesResponse[0];

          if (initialBeach) {
            await selectBeach(initialBeach, initialCity.id);
          }
        }

        setErrorMessage(null);
      } catch (error) {
        if (isMounted) {
          if (isAuthError(error)) {
            clearSession();
          }
          setSelectedBeach(defaultBeachData);
          setErrorMessage(getFriendlyApiErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [clearSession, creatorUserId, isConfigured, selectBeach, setSelectedBeach]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      await flushOfflineQueue();
      setQueueSummary(await getQueueSummary());

      if (!creatorUserId) {
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const batteryLevel = await getBatteryPercentage();

        await pingLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          battery_level: batteryLevel,
        });
      } catch {
        try {
          const fallbackPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const fallbackBattery = await getBatteryPercentage();

          await enqueueLocationPing({
            latitude: fallbackPosition.coords.latitude,
            longitude: fallbackPosition.coords.longitude,
            accuracy: fallbackPosition.coords.accuracy,
            speed: fallbackPosition.coords.speed,
            heading: fallbackPosition.coords.heading,
            battery_level: fallbackBattery,
          });
          setQueueSummary(await getQueueSummary());
        } catch {
          // O app continua funcional mesmo sem ping imediato.
        }
      }
    });

    return () => subscription.remove();
  }, [creatorUserId]);

  useEffect(() => {
    if (!activeAlert?.id) {
      return;
    }

    if (['RESOLVED', 'CANCELLED'].includes(activeAlert.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const snapshot = await getAlertStatusSnapshot(activeAlert.id);
        if (snapshot.alert) {
          const nextAlert = toAlertViewModel(snapshot.alert);
          setActiveAlert(nextAlert);
          await recordViewModelAlert(nextAlert);
          setRecentAlerts(await listRecentAlerts());
        }
      } catch {
        // Mantem o ultimo estado local enquanto a consulta falha.
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [activeAlert?.id, activeAlert?.status]);

  async function handleAlertTrigger(type: AlertType) {
    if (!isConfigured) {
      Alert.alert('Configuracao pendente', 'Defina o token da API antes de enviar alertas.');
      return;
    }

    setIsSending(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new AppError('Permita o uso da localização para abrir um alerta.', 'LOCATION_DENIED');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const batteryLevel = await getBatteryPercentage();

      const response = await createAlert({
        alert_type: type,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        battery_level: batteryLevel,
        beach_id: currentBeach.id !== defaultBeachData.id ? currentBeach.id : null,
        created_by_id: creatorUserId,
      });

      const nextAlert = toAlertViewModel(response);
      setActiveAlert(nextAlert);
      await recordViewModelAlert(nextAlert);
      setRecentAlerts(await listRecentAlerts());
      setShowSosMainModal(false);
      setShowGuidanceModal(true);
      setErrorMessage(null);
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
      }

      const payload: AlertCreateRequest = {
        alert_type: type,
        latitude: 0,
        longitude: 0,
        battery_level: null,
        beach_id: currentBeach.id !== defaultBeachData.id ? currentBeach.id : null,
        created_by_id: creatorUserId,
      };

      try {
        const fallbackPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const fallbackBattery = await getBatteryPercentage();

        payload.latitude = fallbackPosition.coords.latitude;
        payload.longitude = fallbackPosition.coords.longitude;
        payload.battery_level = fallbackBattery;
      } catch {
        // Mantem o payload minimo obtido acima.
      }

      const enqueueResult = await enqueueAlert(payload);
      await recordQueuedAlert({
        clientReferenceId: enqueueResult.clientReferenceId,
        type,
        beachId: payload.beach_id ?? null,
        cityId: currentBeach.cityId ?? null,
      });
      setQueueSummary(enqueueResult.queueSummary);
      setRecentAlerts(await listRecentAlerts());

      const message =
        error instanceof AppError
          ? `${getFriendlyApiErrorMessage(error)} O alerta foi colocado na fila offline.`
          : 'Falha de rede. O alerta foi colocado na fila offline.';
      Alert.alert('Alerta em fila', message);
    } finally {
      setIsSending(false);
    }
  }

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Carregando dados operacionais...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandLogoShell}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTitle}>MyBeach</Text>
              <Text style={styles.brandSubtitle}>Operação do cidadão</Text>
            </View>
          </View>
          <View style={styles.brandTagsRow}>
            <Text style={styles.brandTag}>Alerta imediato</Text>
            <Text style={styles.brandTag}>Praia ativa</Text>
            <Text style={styles.brandTag}>Resposta guiada</Text>
          </View>

          <Text style={styles.headerLabel}>
            {isConfigured ? 'MYBEACH CENTRAL' : 'CONFIGURACAO PENDENTE'} - {selectedEstado}
          </Text>

          {authUser ? (
            <View style={styles.sessionRow}>
              <Text style={styles.sessionText}>Sessao: {authUser.name}</Text>
              <TouchableOpacity style={styles.sessionButton} onPress={clearSession}>
                <Text style={styles.sessionButtonLabel}>Sair</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.beachSelector}
            onPress={() => setShowBeachModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={28} color="#ef4444" />
            <Text style={styles.beachName}>{currentBeach.name}</Text>
            <Ionicons name="chevron-down" size={24} color="#94a3b8" />
          </TouchableOpacity>

          {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}
          {queueSummary.total > 0 ? (
            <Text style={styles.queueBanner}>
              Fila offline ativa: {queueSummary.total} pendencia(s) salvas neste aparelho - alertas {queueSummary.alerts} - pings {queueSummary.pings}
              {queueSummary.nextRetryLabel ? ` - ${queueSummary.nextRetryLabel}` : ''}
            </Text>
          ) : null}
          {isHomologationEnvironment ? (
            <Text style={styles.homologationBanner}>Homologacao ativa: use somente dados de teste.</Text>
          ) : null}
          <Text style={styles.environmentBanner}>Ambiente ativo: {getCurrentApiEnvironmentLabel()}</Text>
          <Text style={styles.endpointBanner}>Endpoint ativo: {getApiBaseUrl()}</Text>
        </View>

        <View style={styles.hero}>
          <Image
            source={require('../../assets/images/pompeba.jpg')}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.flagBadge}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      currentBeach.flag === 'verde'
                        ? '#22c55e'
                        : currentBeach.flag === 'amarela'
                          ? '#eab308'
                          : '#ef4444',
                  },
                ]}
              />
              <Text style={styles.flagText}>BANDEIRA {currentBeach.flag.toUpperCase()}</Text>
            </View>
            {isLoadingBeach ? (
              <View style={styles.heroLoading}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.heroLoadingText}>Atualizando praia...</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Monitoramento: {currentBeach.name}</Text>
            <Text style={styles.updateText}>
              Atualizado: {currentBeach.updatedAt} - Praias carregadas: {beaches.length}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="thermometer" size={36} color="#ef4444" />
              <Text style={styles.statValue}>{currentBeach.temp}</Text>
              <Text style={styles.statLabel}>TEMPERATURA</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="waves" size={36} color="#3b82f6" />
              <Text style={styles.statValue}>{currentBeach.waves}</Text>
              <Text style={styles.statLabel}>ONDAS</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="weather-windy" size={36} color="#64748b" />
              <Text style={styles.statValue}>{currentBeach.wind}</Text>
              <Text style={styles.statLabel}>VENTO</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="weather-sunny-alert" size={36} color="#eab308" />
              <Text style={styles.statValue}>{currentBeach.uv}</Text>
              <Text style={styles.statLabel}>UV</Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>Contexto operacional</Text>
            {currentBeach.curiosidades.map((item) => (
              <Text key={item} style={styles.infoItem}>
                - {item}
              </Text>
            ))}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>Regras da praia</Text>
            {currentBeach.regrasDaPraia.map((rule) => (
              <Text key={rule} style={styles.infoItem}>
                - {rule}
              </Text>
            ))}
          </View>

          {activeAlert ? (
            <View style={styles.alertCard}>
              <Text style={styles.alertCardTitle}>Ultimo alerta enviado</Text>
              <Text style={styles.alertCardText}>ID: {activeAlert.id}</Text>
              <Text style={styles.alertCardText}>Tipo: {getAlertTypeLabel(activeAlert.type)}</Text>
              <Text style={styles.alertCardText}>Status: {getAlertStatusLabel(activeAlert.status)}</Text>
              <Text style={styles.alertCardText}>Criado em: {activeAlert.createdAtLabel}</Text>
              {activeAlert.acceptedAtLabel ? (
                <Text style={styles.alertCardText}>Aceito em: {activeAlert.acceptedAtLabel}</Text>
              ) : null}
              {activeAlert.finishedAtLabel ? (
                <Text style={styles.alertCardText}>Encerrado em: {activeAlert.finishedAtLabel}</Text>
              ) : null}
              {activeAlert.beachId ? <Text style={styles.alertCardText}>Praia: {activeAlert.beachId}</Text> : null}
              {activeAlert.cityId ? <Text style={styles.alertCardText}>Cidade: {activeAlert.cityId}</Text> : null}
              {activeAlert.zoneId ? <Text style={styles.alertCardText}>Zona: {activeAlert.zoneId}</Text> : null}
              {activeAlert.batteryLevel != null ? (
                <Text style={styles.alertCardText}>Bateria: {activeAlert.batteryLevel}%</Text>
              ) : null}
              {activeAlert.childId || activeAlert.parentId ? (
                <Text style={styles.alertCardText}>
                  Vinculo kids: {activeAlert.childId ?? 'sem child'} / {activeAlert.parentId ?? 'sem parent'}
                </Text>
              ) : null}
              <Text style={styles.alertCardText}>
                Coordenadas: {activeAlert.coordinates.latitude.toFixed(5)} / {activeAlert.coordinates.longitude.toFixed(5)}
              </Text>
            </View>
          ) : null}

          {recentAlerts.length > 0 ? (
            <View style={styles.infoBlock}>
              <Text style={styles.infoBlockTitle}>Historico recente</Text>
              {recentAlerts.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyType}>{getAlertTypeLabel(item.type)}</Text>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: getAlertStatusTone(item.status).background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: getAlertStatusTone(item.status).text },
                        ]}
                      >
                        {item.statusLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyMetaRow}>
                    <Text style={styles.historyMeta}>{item.createdAtLabel}</Text>
                    {item.queued ? <Text style={styles.queueMarker}>Fila local</Text> : null}
                  </View>
                  {item.beachId || item.cityId ? (
                    <Text style={styles.historyMeta}>
                      {item.beachId ? `Praia ${item.beachId}` : 'Praia não informada'}
                      {item.cityId ? ` - Cidade ${item.cityId}` : ''}
                    </Text>
                  ) : null}
                  {item.timeline && item.timeline.length > 1 ? (
                    <View style={styles.timelineWrap}>
                      {item.timeline.map((entry, index) => (
                        <View key={`${item.id}-${entry.status}-${entry.createdAtLabel}-${index}`} style={styles.timelineRow}>
                          <View style={styles.timelineDot} />
                          <Text style={styles.timelineText}>
                            {entry.statusLabel} - {entry.createdAtLabel}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fabCrianca}
        onPress={() => handleAlertTrigger('LOST_CHILD')}
        activeOpacity={0.9}
      >
        <Ionicons name="people" size={28} color="#fff" />
        <Text style={styles.fabText}>Crianca perdida</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fabSOS}
        onPress={() => setShowSosMainModal(true)}
        activeOpacity={0.9}
      >
        {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sosText}>SOS</Text>}
      </TouchableOpacity>

      <Modal
        visible={showBeachModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBeachModal(false)}
      >
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowBeachModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar praia</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowBeachModal(false)}>
              <Text style={styles.close}>FECHAR</Text>
            </TouchableOpacity>

            <View style={styles.filterGroup}>
              <Text style={styles.label}>UF</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {Array.from(new Set(cities.map((city) => city.uf))).map((uf) => (
                  <TouchableOpacity
                    key={uf}
                    style={[styles.chip, selectedEstado === uf && styles.chipActive]}
                    onPress={() => {
                      setSelectedEstado(uf);
                      const firstCity = cities.find((city) => city.uf === uf);
                      setSelectedCidadeId(firstCity?.id ?? '');
                      setSelectedPraiaId('');
                    }}
                  >
                    <Text style={[styles.chipText, selectedEstado === uf && styles.chipTextActive]}>{uf}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.label}>Cidade</Text>
              <ScrollView style={styles.list} nestedScrollEnabled>
                {citiesByUf.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.item, selectedCidadeId === city.id && styles.itemActive]}
                    onPress={() => {
                      setSelectedCidadeId(city.id);
                      setSelectedPraiaId('');
                    }}
                  >
                    <Text style={styles.itemText}>{city.name}</Text>
                  </TouchableOpacity>
                ))}
                {citiesByUf.length === 0 ? <Text style={styles.emptyText}>Nenhuma cidade para a UF selecionada.</Text> : null}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.label}>Praia</Text>
              <ScrollView style={styles.list} nestedScrollEnabled>
                {beachesByCity.map((beach) => (
                  <TouchableOpacity
                    key={beach.id}
                    style={[styles.item, selectedPraiaId === beach.id && styles.itemActive]}
                    onPress={() => selectBeach(beach, selectedCidadeId || null)}
                  >
                    <Text style={styles.itemText}>{beach.name}</Text>
                  </TouchableOpacity>
                ))}
                {beachesByCity.length === 0 ? <Text style={styles.emptyText}>Nenhuma praia para a cidade selecionada.</Text> : null}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSosMainModal} transparent animationType="fade" onRequestClose={() => setShowSosMainModal(false)}>
        <View style={styles.modalBgCenter}>
          <View style={styles.sosContent}>
            <Text style={styles.modalTitle}>Qual e a emergencia?</Text>

            <TouchableOpacity
              style={[styles.sosBtn, { backgroundColor: '#2563eb' }]}
              onPress={() => handleAlertTrigger('DROWNING')}
            >
              <MaterialCommunityIcons name="waves" size={32} color="#fff" />
              <Text style={styles.sosBtnText}>Afogamento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sosBtn, { backgroundColor: '#ef4444' }]}
              onPress={() => handleAlertTrigger('MEDICAL')}
            >
              <MaterialCommunityIcons name="medical-bag" size={32} color="#fff" />
              <Text style={styles.sosBtnText}>Emergencia medica</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sosBtn, { backgroundColor: '#f97316' }]}
              onPress={() => handleAlertTrigger('LOST_CHILD')}
            >
              <MaterialCommunityIcons name="account-search" size={32} color="#fff" />
              <Text style={styles.sosBtnText}>Crianca perdida</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSosMainModal(false)}>
              <Text style={styles.close}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showGuidanceModal} transparent={false} animationType="fade" onRequestClose={() => setShowGuidanceModal(false)}>
        <View style={styles.guidanceFullScreen}>
          <View style={styles.guidanceHeader}>
            <Ionicons name="warning" size={60} color="#fff" />
            <Text style={styles.guidanceHeaderMain}>ALERTA REGISTRADO</Text>
          </View>

          <ScrollView contentContainerStyle={styles.guidanceScroll}>
            {activeAlert ? (
              <>
                <Text style={styles.guidanceTypeTitle}>{getAlertTypeLabel(activeAlert.type)}</Text>
                <Text style={styles.guidanceTypeSub}>{activeAlert.statusLabel}</Text>

                <View style={styles.guidanceDoutrinaBox}>
                  {guidanceByType[activeAlert.type].map((guidance) => (
                    <View key={guidance} style={styles.guidanceRow}>
                      <Text style={styles.guidanceBullet}>-</Text>
                      <Text style={styles.guidanceTextMain}>{guidance}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.statusBox}>
                  <Text style={styles.statusBoxText}>Status atual: {activeAlert.statusLabel}</Text>
                  <Text style={styles.statusBoxSub}>Alerta: {activeAlert.id}</Text>
                  <Text style={styles.statusBoxSub}>Criado em: {activeAlert.createdAtLabel}</Text>
                  <Text style={styles.statusBoxSub}>Praia: {currentBeach.name}</Text>
                  {activeAlert.acceptedAtLabel ? (
                    <Text style={styles.statusBoxSub}>Aceito em: {activeAlert.acceptedAtLabel}</Text>
                  ) : null}
                  {activeAlert.finishedAtLabel ? (
                    <Text style={styles.statusBoxSub}>Encerrado em: {activeAlert.finishedAtLabel}</Text>
                  ) : null}
                  {activeAlert.childId || activeAlert.parentId ? (
                    <Text style={styles.statusBoxSub}>
                      Vinculo kids: {activeAlert.childId ?? 'sem child'} / {activeAlert.parentId ?? 'sem parent'}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : null}
          </ScrollView>

          <TouchableOpacity style={styles.btnEntendido} onPress={() => setShowGuidanceModal(false)}>
            <Text style={styles.btnEntendidoText}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    paddingBottom: 220,
  },
  header: {
    padding: 25,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandLogoShell: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandLogo: {
    width: 46,
    height: 46,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  brandTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  brandTag: {
    backgroundColor: '#eef2ff',
    color: '#3730a3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sessionRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sessionButtonLabel: {
    color: '#be123c',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  beachSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 18,
    borderRadius: 24,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  beachName: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
  },
  errorBanner: {
    marginTop: 12,
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  queueBanner: {
    marginTop: 10,
    color: '#854d0e',
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  environmentBanner: {
    marginTop: 10,
    color: '#3730a3',
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 10,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  homologationBanner: {
    marginTop: 10,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  endpointBanner: {
    marginTop: 10,
    color: '#334155',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 10,
    fontSize: 12,
    lineHeight: 18,
  },
  hero: {
    width,
    height: 260,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 25,
  },
  heroLoading: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  heroLoadingText: {
    color: '#fff',
    fontWeight: '700',
  },
  flagBadge: {
    marginTop: 'auto',
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  flagText: {
    fontWeight: '900',
    fontSize: 13,
  },
  content: {
    padding: 25,
  },
  titleRow: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  updateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 34,
    elevation: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
    color: '#0f172a',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  infoBlock: {
    marginTop: 25,
    backgroundColor: '#fff',
    borderRadius: 34,
    padding: 25,
    elevation: 3,
  },
  infoBlockTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 20,
  },
  infoItem: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 10,
    fontWeight: '600',
    lineHeight: 20,
  },
  alertCard: {
    marginTop: 25,
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
  },
  alertCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  alertCardText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 6,
  },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  historyType: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  historyMeta: {
    color: '#64748b',
    fontSize: 13,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  queueMarker: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  timelineText: {
    color: '#64748b',
    fontSize: 12,
    flex: 1,
  },
  fabCrianca: {
    position: 'absolute',
    bottom: 45,
    left: 20,
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 45,
    gap: 12,
    elevation: 20,
  },
  fabText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  fabSOS: {
    position: 'absolute',
    bottom: 35,
    right: 20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    borderWidth: 10,
    borderColor: '#fff',
  },
  sosText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 36,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    maxHeight: height * 0.9,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 25,
    textAlign: 'center',
  },
  filterGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: '#ef4444',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    maxHeight: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 15,
  },
  item: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  itemActive: {
    backgroundColor: '#fee2e2',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    padding: 20,
  },
  closeBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  close: {
    textAlign: 'center',
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 18,
  },
  modalBgCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 25,
  },
  sosContent: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 30,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    padding: 24,
    borderRadius: 28,
    marginBottom: 15,
  },
  sosBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  guidanceFullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  guidanceHeader: {
    backgroundColor: '#ef4444',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  guidanceHeaderMain: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 10,
  },
  guidanceScroll: {
    padding: 30,
  },
  guidanceTypeTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
  },
  guidanceTypeSub: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 30,
  },
  guidanceDoutrinaBox: {
    backgroundColor: '#f8fafc',
    padding: 25,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    marginBottom: 35,
  },
  guidanceRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  guidanceBullet: {
    fontSize: 28,
    color: '#ef4444',
    fontWeight: '900',
  },
  guidanceTextMain: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  statusBox: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 60,
  },
  statusBoxText: {
    textAlign: 'center',
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 16,
  },
  statusBoxSub: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
  btnEntendido: {
    backgroundColor: '#0f172a',
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEntendidoText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
});

