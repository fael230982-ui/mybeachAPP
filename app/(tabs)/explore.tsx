import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar</Text>
        <Text style={styles.subtitle}>Conheça os segredos da orla</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locais Instagramáveis</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 25 }}>
          <View style={styles.tourCard}>
            <Image source={require('../../assets/images/pompeba.jpg')} style={styles.cardImg} />
            <Text style={styles.cardLabel}>Ilha da Pompeba</Text>
          </View>
          <View style={styles.tourCard}>
            <Image source={require('../../assets/images/la-plage.jpg')} style={styles.cardImg} />
            <Text style={styles.cardLabel}>Shopping La Plage</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.sectionPadding}>
        <Text style={styles.sectionTitle}>Regras da Praia</Text>
        <View style={styles.whiteCard}>
          <Text style={styles.rule}>🚫 Proibido Som Automotivo</Text>
          <View style={styles.divider} />
          <Text style={styles.rule}>🐾 Proibido Cães na Areia</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 30, paddingTop: 60 },
  title: { fontSize: 34, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b' },
  section: { marginBottom: 35 },
  sectionPadding: { paddingHorizontal: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 15 },
  tourCard: { width: 240, backgroundColor: '#fff', borderRadius: 25, marginRight: 15, overflow: 'hidden', elevation: 5 },
  cardImg: { width: '100%', height: 140 },
  cardLabel: { padding: 15, fontWeight: 'bold', color: '#1e293b' },
  whiteCard: { backgroundColor: '#fff', borderRadius: 25, padding: 25, elevation: 3 },
  rule: { fontSize: 16, fontWeight: 'bold', color: '#475569' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 }
});