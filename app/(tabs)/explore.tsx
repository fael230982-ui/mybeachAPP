import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { defaultBeachData, useBeachStore } from '@/stores/beachStore';

export default function ExploreScreen() {
  const currentBeach = useBeachStore((state) => state.selectedBeach) ?? defaultBeachData;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar {currentBeach.name}</Text>
        <Text style={styles.subtitle}>
          Painel complementar da praia selecionada, sempre usando o mesmo contexto do fluxo operacional.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>CONTEXTO ATIVO</Text>
        <Text style={styles.summaryTitle}>{currentBeach.name}</Text>
        <Text style={styles.summaryText}>Cidade: {currentBeach.cityId ?? 'nao informada'}.</Text>
        <Text style={styles.summaryText}>Atualizacao local: {currentBeach.updatedAt}.</Text>
        <Text style={styles.summaryText}>Bandeira atual: {currentBeach.flag.toUpperCase()}.</Text>
      </View>

      <SectionCard title="Pontos de interesse" items={currentBeach.pontosTuristicos} />
      <SectionCard title="Locais visuais" items={currentBeach.locaisInstagramaveis} />
      <SectionCard title="Vias e acessos" items={currentBeach.ruas} />
      <SectionCard title="Regras da praia" items={currentBeach.regrasDaPraia} />
      <SectionCard title="Contexto operacional" items={currentBeach.curiosidades} />
    </ScrollView>
  );
}

function SectionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((item) => (
          <View key={item} style={styles.row}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
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
    paddingBottom: 110,
    gap: 18,
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
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
  },
  summaryEyebrow: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  summaryTitle: {
    marginTop: 10,
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  summaryText: {
    marginTop: 6,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  bullet: {
    color: '#0f172a',
    fontSize: 18,
    lineHeight: 22,
  },
  itemText: {
    flex: 1,
    color: '#475569',
    lineHeight: 22,
  },
});
