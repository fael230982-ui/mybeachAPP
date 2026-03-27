import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MareScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tábua de Marés</Text>
        <Text style={styles.date}>Guarujá • {new Date().toLocaleDateString('pt-BR')}</Text>
      </View>

      <View style={styles.waveCard}>
        <Ionicons name="water" size={80} color="#fff" />
        <Text style={styles.waveStatus}>Maré em Alta</Text>
        <Text style={styles.waveHeight}>1.4m às 15:45</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Baixa-mar</Text>
          <Text style={styles.value}>0.4m</Text>
          <Text style={styles.time}>09:20</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Preamar</Text>
          <Text style={styles.value}>1.6m</Text>
          <Text style={styles.time}>21:30</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 25, paddingTop: 60 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  date: { fontSize: 16, color: '#64748b' },
  waveCard: { backgroundColor: '#3b82f6', borderRadius: 35, padding: 40, alignItems: 'center', elevation: 15 },
  waveStatus: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 15 },
  waveHeight: { color: '#dbeafe', fontSize: 18 },
  grid: { flexDirection: 'row', gap: 15, marginTop: 20 },
  infoBox: { flex: 1, backgroundColor: '#fff', borderRadius: 25, padding: 20, alignItems: 'center', elevation: 3 },
  label: { color: '#64748b', fontSize: 13, marginBottom: 5 },
  value: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  time: { color: '#94a3b8', fontSize: 12 }
});