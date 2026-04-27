import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { defaultBeachData, useBeachStore } from '@/stores/beachStore';

function buildSeaStatus(flag: string, waves: string, wind: string) {
  if (flag === 'vermelha') {
    return {
      title: 'Atencao maxima',
      detail: `Bandeira ${flag}. Priorize observacao e acione ajuda ao primeiro sinal de risco.`,
      accent: '#b91c1c',
      surface: '#fee2e2',
    };
  }

  if (flag === 'amarela') {
    return {
      title: 'Atencao reforcada',
      detail: `Ondas ${waves} e vento ${wind}. Oriente banhistas a respeitar a sinalizacao local.`,
      accent: '#a16207',
      surface: '#fef3c7',
    };
  }

  return {
    title: 'Condicao monitorada',
    detail: `Ondas ${waves}, vento ${wind} e monitoramento local ativo para a praia selecionada.`,
    accent: '#0369a1',
    surface: '#e0f2fe',
  };
}

function buildCoverageLabel(waves: string, updatedAt: string) {
  const hasWaveData = waves !== '--';
  return hasWaveData
    ? `Ultima janela recebida do backend: ${updatedAt}.`
    : 'Sem leitura detalhada de mare. O app exibe apenas os sinais operacionais ja sincronizados.';
}

export default function MareScreen() {
  const selectedBeach = useBeachStore((state) => state.selectedBeach) ?? defaultBeachData;
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const seaStatus = useMemo(
    () => buildSeaStatus(selectedBeach.flag, selectedBeach.waves, selectedBeach.wind),
    [selectedBeach.flag, selectedBeach.waves, selectedBeach.wind]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Janela do mar</Text>
        <Text style={styles.subtitle}>
          {selectedBeach.name} - {currentDate}
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: seaStatus.surface }]}>
        <View style={[styles.heroIconWrap, { backgroundColor: seaStatus.accent }]}>
          <Ionicons name="water" size={34} color="#fff" />
        </View>
        <Text style={[styles.heroTitle, { color: seaStatus.accent }]}>{seaStatus.title}</Text>
        <Text style={styles.heroText}>{seaStatus.detail}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Ondas" value={selectedBeach.waves} helper="Leitura sincronizada da praia" />
        <MetricCard label="Vento" value={selectedBeach.wind} helper="Usado como apoio operacional" />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Temperatura" value={selectedBeach.temp} helper="Contexto local atual" />
        <MetricCard label="UV" value={selectedBeach.uv} helper="Exposicao ambiental" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cobertura atual</Text>
        <Text style={styles.cardText}>{buildCoverageLabel(selectedBeach.waves, selectedBeach.updatedAt)}</Text>
        <Text style={styles.cardText}>
          O app ainda nao calcula baixa-mar e preamar porque esse contrato nao foi publicado no backend atual.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Leitura operacional</Text>
        <Text style={styles.bullet}>Bandeira atual: {selectedBeach.flag.toUpperCase()}</Text>
        <Text style={styles.bullet}>Atualizado em: {selectedBeach.updatedAt}</Text>
        <Text style={styles.bullet}>Praia vinculada ao fluxo de alertas: {selectedBeach.id}</Text>
        <Text style={styles.bullet}>
          Uso recomendado: combine esta aba com a tela inicial para abrir alerta e acompanhar status real.
        </Text>
      </View>
    </ScrollView>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelper}>{helper}</Text>
    </View>
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
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 15,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  heroText: {
    marginTop: 8,
    color: '#334155',
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 8,
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '900',
  },
  metricHelper: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardText: {
    color: '#475569',
    lineHeight: 22,
    marginBottom: 10,
  },
  bullet: {
    color: '#334155',
    lineHeight: 22,
    marginBottom: 8,
  },
});
