import * as Location from 'expo-location';
import { Target } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { getQueueSummary } from '@/services/offlineQueue';
import { listRecentAlerts, RecentAlertItem } from '@/services/recentAlerts';
import { defaultBeachData, useBeachStore } from '@/stores/beachStore';

const defaultRegion = {
  latitude: -23.9932,
  longitude: -46.2564,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type QueueSummary = Awaited<ReturnType<typeof getQueueSummary>>;

export default function MapasScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [queueSummary, setQueueSummary] = useState<QueueSummary | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlertItem[]>([]);
  const selectedBeach = useBeachStore((state) => state.selectedBeach) ?? defaultBeachData;

  const region = useMemo(() => {
    if (!location) {
      return defaultRegion;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [location]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const [queueState, alertHistory] = await Promise.all([getQueueSummary(), listRecentAlerts()]);
        if (isMounted) {
          setQueueSummary(queueState);
          setRecentAlerts(alertHistory.slice(0, 2));
        }
      } catch {
        if (isMounted) {
          setQueueSummary(null);
          setRecentAlerts([]);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permita a localizacao para usar o mapa.');
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted) {
          setLocation(currentLocation);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            'Localizacao indisponivel',
            error instanceof Error ? error.message : 'Nao foi possivel carregar sua localizacao.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingLocation(false);
        }
      }
    }

    void loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {isLoadingLocation ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Buscando sua localizacao...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {location ? (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Sua posicao"
              description="Localizacao atual do dispositivo"
            />
          ) : null}
        </MapView>
      )}

      <View style={styles.topCard}>
        <Text style={styles.topTitle}>Mapa operacional</Text>
        <Text style={styles.topText}>Praia ativa: {selectedBeach.name}</Text>
        <Text style={styles.topText}>Bandeira: {selectedBeach.flag.toUpperCase()}</Text>
        <Text style={styles.topText}>Atualizacao da praia: {selectedBeach.updatedAt}</Text>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>Fila local</Text>
          <Text style={styles.panelText}>
            {queueSummary
              ? `${queueSummary.total} item(ns), alertas ${queueSummary.alerts}, pings ${queueSummary.pings}.`
              : 'Fila nao carregada.'}
          </Text>
          <Text style={styles.panelSubtext}>
            {queueSummary?.nextRetryLabel ?? 'Sem retry pendente no momento.'}
          </Text>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>Historico imediato</Text>
          {recentAlerts.length > 0 ? (
            recentAlerts.map((item) => (
              <Text key={item.id} style={styles.panelText}>
                {item.statusLabel} - {item.type} - {item.createdAtLabel}
              </Text>
            ))
          ) : (
            <Text style={styles.panelText}>Sem alertas recentes gravados localmente.</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.btnTarget}
        onPress={() => {
          if (!location || !mapRef.current) {
            Alert.alert('Localizacao indisponivel', 'Aguarde o carregamento da sua posicao.');
            return;
          }

          mapRef.current.animateToRegion(region);
        }}
      >
        <Target size={24} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  topCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 80,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    padding: 18,
  },
  topTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  topText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPanel: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    gap: 12,
  },
  panelCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 16,
  },
  panelTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  panelText: {
    color: '#334155',
    lineHeight: 20,
    marginBottom: 4,
  },
  panelSubtext: {
    color: '#64748b',
    lineHeight: 20,
  },
  btnTarget: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 15,
    elevation: 5,
  },
});
