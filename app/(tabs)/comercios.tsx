import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { defaultBeachData, useBeachStore } from '@/stores/beachStore';

function isOperationalPlaceholder(item: string) {
  const normalized = item.toLowerCase();
  return normalized.includes('nenhum comercio') || normalized.includes('nao foi sincronizado');
}

export default function ComerciosScreen() {
  const currentBeach = useBeachStore((state) => state.selectedBeach) ?? defaultBeachData;
  const syncedItems = useMemo(
    () => currentBeach.comerciosSugeridos.filter((item) => !isOperationalPlaceholder(item)),
    [currentBeach.comerciosSugeridos]
  );
  const hasCoverage = syncedItems.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Comercios em {currentBeach.name}</Text>
        <Text style={styles.subtitle}>Somente itens ligados a praia selecionada no momento.</Text>
      </View>

      <View style={[styles.statusCard, hasCoverage ? styles.statusCardOnline : styles.statusCardPending]}>
        <Text style={styles.statusEyebrow}>{hasCoverage ? 'COBERTURA LOCAL' : 'COBERTURA PENDENTE'}</Text>
        <Text style={styles.statusTitle}>
          {hasCoverage ? 'Lista operacional disponivel' : 'Sem fonte validada de comercios'}
        </Text>
        <Text style={styles.statusText}>
          {hasCoverage
            ? 'A aba passa a mostrar apenas itens efetivamente vinculados ao contexto atual da praia.'
            : 'O app evita descrever estabelecimentos sem origem validada. Quando o backend publicar a fonte canonica, esta tela pode ser preenchida sem inventar catalogo.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Itens disponiveis</Text>
        {hasCoverage ? (
          syncedItems.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Text style={styles.itemBullet}>•</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))
        ) : (
          <>
            <Text style={styles.emptyTitle}>Nenhum comercio sincronizado para {currentBeach.name}</Text>
            <Text style={styles.emptyText}>
              A tela permanece intencionalmente conservadora para nao misturar recomendacao com placeholder.
            </Text>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contexto operacional</Text>
        <Text style={styles.contextText}>Praia atual: {currentBeach.name}</Text>
        <Text style={styles.contextText}>Cidade vinculada: {currentBeach.cityId ?? 'nao informada'}</Text>
        <Text style={styles.contextText}>Atualizacao de praia: {currentBeach.updatedAt}</Text>
        <Text style={styles.contextText}>
          Proximo passo ideal: consumir uma rota oficial de catalogo por praia em vez de manter bloco estatico.
        </Text>
      </View>
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
    paddingBottom: 110,
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
    lineHeight: 22,
  },
  statusCard: {
    borderRadius: 28,
    padding: 22,
  },
  statusCardOnline: {
    backgroundColor: '#dcfce7',
  },
  statusCardPending: {
    backgroundColor: '#fff7ed',
  },
  statusEyebrow: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  statusTitle: {
    marginTop: 8,
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
  },
  statusText: {
    marginTop: 8,
    color: '#334155',
    lineHeight: 22,
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
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  itemBullet: {
    color: '#0f172a',
    fontSize: 18,
    lineHeight: 22,
  },
  itemText: {
    flex: 1,
    color: '#475569',
    lineHeight: 22,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748b',
    lineHeight: 22,
  },
  contextText: {
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
  },
});
