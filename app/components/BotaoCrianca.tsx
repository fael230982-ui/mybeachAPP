import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BotaoCrianca() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingLocalizacao, setLoadingLocalizacao] = useState(false);
  const [disparando, setDisparando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // 🚨 FUNÇÃO DE DISPARO (BLINDADA CONTRA O SNORLAX DA API E LOOP INFINITO)
  const dispararAlertaCrianca = async () => {
    setLoadingLocalizacao(true);
    
    // 1. Simula que pegou a localização (1.5 segundos)
    setTimeout(async () => {
      setLoadingLocalizacao(false);
      setDisparando(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        console.log(`\n🚨 Iniciando disparo de Criança Perdida...`);
        const payload = {
          alert_type: "LOST_CHILD",
          latitude: -23.9681, 
          longitude: -46.3736
        };

        const response = await fetch("https://api.mybeach.com.br/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Tratamento do Erro 429 (Rate Limit de 3 Minutos)
        if (response.status === 429) {
          setDisparando(false);
          setModalVisible(false);
          Alert.alert("⏳ Calma!", "Um alerta de criança perdida já foi emitido deste aparelho. Por segurança, aguarde 3 minutos.");
          return;
        }

        if (response.ok) {
          // SUCESSO REAL! Mostra a tela verde e fecha tudo depois de 3.5s
          setDisparando(false);
          setSucesso(true);
          setTimeout(() => {
            setSucesso(false);
            setModalVisible(false);
          }, 3500);
        } else {
          setDisparando(false);
          const text = await response.text();
          console.log("❌ Erro do Servidor (Criança):", text);
          Alert.alert("Falha", `Erro do servidor: ${response.status}`);
        }

      } catch (error: any) {
        clearTimeout(timeoutId);
        setDisparando(false);
        if (error.name === 'AbortError') {
          Alert.alert("Tempo Esgotado", "O servidor demorou a responder.");
        } else {
          Alert.alert("Erro", "Sem conexão com a internet.");
        }
      }
    }, 1500);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.pillButton} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="body" size={24} color="#000" />
        <Text style={styles.pillText}>Criança Perdida</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {!sucesso ? (
              <>
                <Text style={styles.modalTitle}>Reportar Criança Perdida</Text>
                
                {loadingLocalizacao ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Buscando sua localização exata...</Text>
                  </View>
                ) : disparando ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Avisando Guarda-Vidas na região...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.descriptionText}>
                      Ao confirmar, um alerta será enviado imediatamente para a central e os Guarda-Vidas mais próximos serão notificados.
                    </Text>

                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#f59e0b' }]} 
                      onPress={dispararAlertaCrianca}
                    >
                      <Text style={[styles.actionText, { color: '#000' }]}>Disparar Alerta Agora</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <View style={styles.sucessoContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                <Text style={styles.sucessoTitle}>ALERTA ENVIADO!</Text>
                <Text style={styles.sucessoText}>Os Guarda-Vidas já receberam sua posição e estão a caminho.</Text>
              </View>
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
    bottom: 150,
    right: 20,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  pillText: {
    color: '#000',
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
    minHeight: 300,
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    color: '#f59e0b',
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'black',
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
  },
  sucessoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sucessoTitle: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 15,
    marginBottom: 10,
  },
  sucessoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});