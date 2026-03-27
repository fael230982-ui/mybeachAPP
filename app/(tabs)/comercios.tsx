import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ComerciosScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Comércios</Text>
        <Text style={styles.subtitle}>O melhor da gastronomia local</Text>
      </View>

      <TouchableOpacity style={styles.card}>
        <Image source={require('../../assets/images/quiosque.jpeg')} style={styles.cardImg} />
        <View style={styles.info}>
          <Text style={styles.name}>Quiosque do Pescador</Text>
          <Text style={styles.desc}>Sabor autêntico e tradição da Rafiells Soluções.</Text>
          <View style={styles.row}>
             <Ionicons name="star" size={16} color="#eab308" />
             <Text style={styles.rating}>4.9 (250 avaliações)</Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 30, paddingTop: 60 },
  title: { fontSize: 34, fontWeight: '900' },
  subtitle: { fontSize: 16, color: '#64748b' },
  card: { marginHorizontal: 25, backgroundColor: '#fff', borderRadius: 30, overflow: 'hidden', elevation: 6, marginBottom: 25 },
  cardImg: { width: '100%', height: 180 },
  info: { padding: 20 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  desc: { color: '#64748b', fontSize: 14, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rating: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' }
});