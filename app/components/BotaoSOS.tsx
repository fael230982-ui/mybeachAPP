import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Serviço de bateria
import { getBatteryPercentage } from '../../services/deviceUtils';

export default function BotaoSOS() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🚨 COLE AQUI O UUID DO CIDADÃO QUE VOCÊ VAI CRIAR 🚨
const UUID_CIDADAO = "d22daf77-a60a-4e8d-a86e-44a73ecccc3f";

  const dispararSOSReal = async (tipo: string) => {
    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s para dar tempo do GPS do celular aquecer

    try {
      console.log(`\n🚨 Iniciando disparo de emergência: ${tipo}...`);

      // 🔋 1. LENDO BATERIA DO SEU CELULAR FÍSICO
      let batteryLevel = await getBatteryPercentage();
      console.log(`🔋 Bateria real lida do celular: ${batteryLevel}%`);

      // 📍 2. LENDO GPS DO SEU CELULAR FÍSICO
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Erro", "Precisamos do GPS para acionar o resgate.");
        setIsLoading(false);
        return;
      }
      
      console.log("📍 Buscando satélites GPS...");
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const finalLat = location.coords.latitude;
      const finalLng = location.coords.longitude;
      
      console.log(`📍 Coordenadas reais: Lat ${finalLat} | Lng ${finalLng}`);

      // 📦 3. MONTANDO O PAYLOAD EXATO (SEM DADOS FALSOS)
      const payload = {
        alert_type: tipo,
        latitude: finalLat,
        longitude: finalLng,
        battery_level: batteryLevel ? Math.round(batteryLevel) : 100, // Garantia extra caso o Expo Go engasgue
        created_by_id: UUID_CIDADAO 
      };

      console.log("📦 DADOS ENVIADOS:", JSON.stringify(payload, null, 2));

      // 🚀 4. DISPARO
      const response = await fetch("https://api.mybeach.com.br/alerts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Accept": "application/json" 
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.status === 429) {
        Alert.alert("⏳ Calma!", "Um alerta já foi enviado do seu aparelho. Aguarde 3 min.");
      } else if (response.ok) {
        Alert.alert("🚨 RESGATE ACIONADO!", "A central recebeu seu alerta, bateria e localização na Rafa Beach!");
      } else {
        const erroTexto = await response.text();
        console.log("❌ ERRO DA API:", erroTexto);
        Alert.alert("Erro", `O servidor recusou. Status: ${response.status}`);
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      Alert.alert("Erro de Conexão", error.message);
    } finally {
      setIsLoading(false);
      setModalVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.pillButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="warning" size={24} color="#fff" />
        <Text style={styles.pillText}>SOS</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Qual é a emergência?</Text>
            
            {isLoading ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={{ color: '#fff', marginTop: 10 }}>Coletando GPS e Bateria...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ef4444' }]} onPress={() => dispararSOSReal('DROWNING')}>
                  <Text style={styles.actionText}>Afogamento</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#a855f7' }]} onPress={() => dispararSOSReal('MEDICAL')}>
                  <Text style={styles.actionText}>Emergência Médica</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  pillText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  }
});