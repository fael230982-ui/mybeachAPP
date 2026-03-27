import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getBatteryPercentage } from '../../services/deviceUtils';

const { width, height } = Dimensions.get('window');

// Fallback de UFs brasileiras (27 estados - carrega sempre para evitar vazio)
const UFS_FALLBACK = [
  { id: 'AC', name: 'Acre', uf: 'AC' },
  { id: 'AL', name: 'Alagoas', uf: 'AL' },
  { id: 'AP', name: 'Amapá', uf: 'AP' },
  { id: 'AM', name: 'Amazonas', uf: 'AM' },
  { id: 'BA', name: 'Bahia', uf: 'BA' },
  { id: 'CE', name: 'Ceará', uf: 'CE' },
  { id: 'DF', name: 'Distrito Federal', uf: 'DF' },
  { id: 'ES', name: 'Espírito Santo', uf: 'ES' },
  { id: 'GO', name: 'Goiás', uf: 'GO' },
  { id: 'MA', name: 'Maranhão', uf: 'MA' },
  { id: 'MT', name: 'Mato Grosso', uf: 'MT' },
  { id: 'MS', name: 'Mato Grosso do Sul', uf: 'MS' },
  { id: 'MG', name: 'Minas Gerais', uf: 'MG' },
  { id: 'PA', name: 'Pará', uf: 'PA' },
  { id: 'PB', name: 'Paraíba', uf: 'PB' },
  { id: 'PR', name: 'Paraná', uf: 'PR' },
  { id: 'PE', name: 'Pernambuco', uf: 'PE' },
  { id: 'PI', name: 'Piauí', uf: 'PI' },
  { id: 'RJ', name: 'Rio de Janeiro', uf: 'RJ' },
  { id: 'RN', name: 'Rio Grande do Norte', uf: 'RN' },
  { id: 'RS', name: 'Rio Grande do Sul', uf: 'RS' },
  { id: 'RO', name: 'Rondônia', uf: 'RO' },
  { id: 'RR', name: 'Roraima', uf: 'RR' },
  { id: 'SC', name: 'Santa Catarina', uf: 'SC' },
  { id: 'SP', name: 'São Paulo', uf: 'SP' },
  { id: 'SE', name: 'Sergipe', uf: 'SE' },
  { id: 'TO', name: 'Tocantins', uf: 'TO' },
];

type EstadoItem = { id: string; name: string; uf: string };
type CidadeItem = { id: string | number; name: string; [key: string]: any };
type PraiaItem = { 
  id: string | number; 
  name: string; 
  city_id: string | number; 
  latitude?: number | string; 
  longitude?: number | string; 
  [key: string]: any;
};

type BeachRealtimeData = {
  temp: string; 
  waves: string; 
  wind: string; 
  uv: string; 
  flag: string; 
  updatedAt: string;
  curiosidades: string[]; 
  ruas: string[]; 
  pontosTuristicos: string[]; 
  locaisInstagramaveis: string[];
};

const API_BASE_URL = 'https://api.mybeach.com.br';
const TOKEN_MASTER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMjJkYWY3Ny1hNjBhLTRlOGQtYTg2ZS00NGE3M2VjY2NjM2YiLCJyb2xlIjoiTUFTVEVSIiwiZXhwIjoxNzc0NjE5OTE3fQ.MOH_Lwscjo1bATmnnLw7Ibv8y52xWAJE9LEccJ-mGPg'; // Substitua pelo token do backend
const UUID_MASTER = '030cf4e3-b042-4188-b78a-c645bb530028';

const SOS_GUIDANCE = {
  SOS_AGUA: { title: 'SOS NA ÁGUA', subtitle: 'AFOGAMENTO / ARRASTAMENTO', guidance: ['MANTENHA CONTATO VISUAL.', 'NÃO ENTRE NA ÁGUA.', 'APONTE PARA OS GUARDA-VIDAS.'] },
  SOS_AREIA_INFARTO: { title: 'SOS INFARTO', subtitle: 'DOR NO PEITO / FALTA DE AR', guidance: ['MANTENHA A PESSOA SENTADA.', 'AFROUXE AS ROUPAS.', 'NÃO DÊ COMIDA OU BEBIDA.'] },
  SOS_AREIA_DESMAIO: { title: 'SOS DESMAIO', subtitle: 'PERDA DE CONSCIÊNCIA', guidance: ['MANTENHA A PESSOA DEITADA.', 'ELEVE AS PERNAS.', 'DÊ ESPAÇO PARA RESPIRAR.'] },
  SOS_AREIA_CONVULSAO: { title: 'SOS CONVULSÃO', subtitle: 'MOVIMENTOS INVOLUNTÁRIOS', guidance: ['NÃO SEGURE A PESSOA.', 'PROTEJA A CABEÇA.', 'NÃO COLOQUE NADA NA BOCA.'] },
  SOS_AREIA_NAO_IDENTIFICADO: { title: 'SOS MAL-ESTAR', subtitle: 'SITUAÇÃO INDEFINIDA', guidance: ['MANTENHA A CALMA.', 'OBSERVE A RESPIRAÇÃO.', 'AGUARDE A EQUIPE.'] },
  CRIANCA_PERDIDA: { title: 'CRIANÇA PERDIDA', subtitle: 'DESAPARECIMENTO', guidance: ['FIQUE NO ÚLTIMO LOCAL VISTO.', 'DESCREVA A ROUPA DA CRIANÇA.', 'BUSCA INICIADA NO MAPA.'] },
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const [isSending, setIsSending] = useState(false);
  const [isLoadingBeachData, setIsLoadingBeachData] = useState(false);
  const [beachName, setBeachName] = useState('Localizando...');
  const [beachId, setBeachId] = useState('');
  const [beachData, setBeachData] = useState<BeachRealtimeData>({
    temp: '--', waves: '--', wind: '--', uv: '--', flag: 'verde', updatedAt: 'Sincronizando...',
    curiosidades: [], ruas: [], pontosTuristicos: [], locaisInstagramaveis: [],
  });

  const [estados, setEstados] = useState<EstadoItem[]>(UFS_FALLBACK); // Carrega fallback imediatamente
  const [cidades, setCidades] = useState<CidadeItem[]>([]);
  const [praias, setPraias] = useState<PraiaItem[]>([]);

  const [selectedEstado, setSelectedEstado] = useState('BA'); // Default BA
  const [selectedCidadeId, setSelectedCidadeId] = useState('');
  const [selectedPraiaId, setSelectedPraiaId] = useState('');

  const [showBeachModal, setShowBeachModal] = useState(false);
  const [showSosMainModal, setShowSosMainModal] = useState(false);
  const [showSosAreiaModal, setShowSosAreiaModal] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [pendingAlertType, setPendingAlertType] = useState<keyof typeof SOS_GUIDANCE | null>(null);

  // 🛡️ Scanner Inteligente de UF (funciona com qualquer campo da API)
  const extrairUF = (cidade: any): string => {
    if (!cidade) return '';
    const camposPossiveis = ['uf', 'state', 'sigla', 'acronym', 'state_acronym', 'estado'];
    for (const campo of camposPossiveis) {
      const valor = String(cidade[campo] || '').toUpperCase().trim();
      if (valor.length === 2 && !['BR', 'US', 'EUA'].includes(valor)) return valor;
    }
    // Varredura completa do objeto
    for (const key in cidade) {
      if (typeof cidade[key] === 'string') {
        const valor = cidade[key].toUpperCase().trim();
        if (valor.length === 2 && !['BR', 'US', 'EUA'].includes(valor)) return valor;
      }
    }
    return 'BA'; // Fallback para BA
  };

  // Filtros em cascata (com validação de array)
  const cidadesFiltradas = useMemo(() => {
    if (!selectedEstado || !Array.isArray(cidades)) return [];
    return cidades.filter((c) => extrairUF(c) === selectedEstado.toUpperCase());
  }, [cidades, selectedEstado]);

  const praiasFiltradas = useMemo(() => {
    if (!selectedCidadeId || !Array.isArray(praias)) return [];
    return praias.filter((p) => String(p.city_id) === String(selectedCidadeId));
  }, [praias, selectedCidadeId]);

  // 🗺️ Cálculo de Distância Haversine (para localização automática)
  const calcularDistanciaHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
  };

  useEffect(() => {
    inicializarSistema();
  }, []);

  // ✅ Função registrarPush corrigida (no escopo correto)
  const registrarPush = async () => {
    try {
      if (!Device.isDevice) {
        console.log('[PUSH] Dispositivo não é físico, pulando registro.');
        return;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('[PUSH] Permissão negada.');
        return;
      }
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: 'seu-project-id-aqui', // Adicione no app.json se necessário
      });
      console.log('[PUSH] Token gerado:', tokenResponse.data);

      // Tenta registrar na API (com tratamento de 401)
      await fetch(`${API_BASE_URL}/users/${UUID_MASTER}/fcm-token`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN_MASTER}` },
        body: JSON.stringify({ push_token: tokenResponse.data }),
      });
      console.log('[PUSH] Token registrado com sucesso.');
    } catch (error) {
      console.log('[PUSH] Erro no registro (Expo Go limitado ou token inválido):', error);
      // Não quebra o app - continua
    }
  };

  // 🔄 Inicialização do Sistema (com retry para 401)
  const inicializarSistema = async () => {
    try {
      console.log('🔍 [INIT] Iniciando sistema...');
      const { cidadesBase, praiasBase } = await carregarBasesDeDados();
      if (praiasBase.length > 0) {
        await configurarGeolocalizacaoAutomatica(cidadesBase, praiasBase);
      }
      await registrarPush(); // Agora no escopo correto
      console.log('✅ [INIT] Sistema inicializado.');
    } catch (error) {
      console.log('❌ [INIT] Erro na inicialização:', error);
      // Fallback automático - usa dados locais
      setEstados(UFS_FALLBACK);
      setSelectedEstado('BA');
      setBeachName('Modo Offline - BA');
    }
  };

  // 📡 Carregar Dados da API (com retry e fallback para 401)
  const carregarBasesDeDados = async (retryCount = 0): Promise<{ cidadesBase: CidadeItem[], praiasBase: PraiaItem[] }> => {
    try {
      console.log('🔍 [API] Fetching cidades e praias (tentativa', retryCount + 1, ')...');
      const [cRes, bRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cities`, {
          headers: { Authorization: `Bearer ${TOKEN_MASTER}` },
        }),
        fetch(`${API_BASE_URL}/beaches`, {
          headers: { Authorization: `Bearer ${TOKEN_MASTER}` },
        }),
      ]);

      if (cRes.status === 401 || bRes.status === 401) {
        if (retryCount < 1) {
          console.log('⚠️ [API] Token inválido (401) - Tentando revalidação...');
          // Aqui você pode chamar uma função para renovar token se tiver
          return carregarBasesDeDados(retryCount + 1);
        }
        console.log('❌ [API] Token expirado (401). Usando modo offline.');
        Alert.alert('Conexão', 'Token inválido. Usando dados locais. Solicite novo token ao backend.');
        return { cidadesBase: [], praiasBase: [] };
      }

      if (!cRes.ok || !bRes.ok) {
        console.log('❌ [API] Resposta não OK:', cRes.status, bRes.status);
        return { cidadesBase: [], praiasBase: [] };
      }

      const cData = await cRes.json();
      const bData = await bRes.json();

      console.log('🔍 [API] Estrutura de cidades (primeira):', JSON.stringify(cData[0] || {}, null, 2));

      const cArray = Array.isArray(cData) ? cData : (cData.data || cData.cities || []);
      const bArray = Array.isArray(bData) ? bData : (bData.data || bData.beaches || []);

      setCidades(cArray);
      setPraias(bArray);

      // 🛡️ Geração de Estados com Scanner Inteligente
      const ufsUnicas = Array.from(new Set(cArray.map((c: CidadeItem) => extrairUF(c))))
        .filter((uf: string) => uf && uf.length === 2 && !['BR', 'US'].includes(uf))
        .sort();

      const listaEstados = ufsUnicas.length > 0
        ? ufsUnicas.map((uf) => ({ id: uf, name: uf, uf }))
        : UFS_FALLBACK;

      setEstados(listaEstados);
      console.log('✅ [API] UFs extraídas:', listaEstados.slice(0, 5).map((e) => e.uf), '...');

      return { cidadesBase: cArray, praiasBase: bArray };
    } catch (error) {
      console.log('❌ [API] Erro na fetch (timeout ou rede):', error);
      Alert.alert('Conexão', 'Erro de rede. Usando modo offline.');
      setEstados(UFS_FALLBACK); // Garante que UF sempre apareça
      return { cidadesBase: [], praiasBase: [] };
    }
  };

  // 📍 Localização Automática do Celular (com Haversine e Fallback)
  const configurarGeolocalizacaoAutomatica = async (cBase: CidadeItem[], pBase: PraiaItem[]) => {
    try {
      console.log('📍 [GPS] Solicitando permissão...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('⚠️ [GPS] Permissão negada - fallback.');
        ativarFallbackLocalizacao(cBase, pBase);
        return;
      }

      console.log('📍 [GPS] Buscando posição (timeout 8s)...');
      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 8000,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000)),
      ]) as Location.LocationObject;

      if (!position.coords) {
        throw new Error('Coordenadas inválidas');
      }

      const { latitude, longitude } = position.coords;
      console.log('📍 [GPS] Posição encontrada:', latitude, longitude);

      // Calcula praia mais próxima com Haversine
      let maisProxima: PraiaItem | null = null;
      let menorDistancia = Infinity;

      pBase.forEach((p) => {
        const pLat = Number(p.latitude);
        const pLon = Number(p.longitude);
        if (!isNaN(pLat) && !isNaN(pLon)) {
          const distancia = calcularDistanciaHaversine(latitude, longitude, pLat, pLon);
          if (distancia < menorDistancia) {
            menorDistancia = distancia;
            maisProxima = p;
          }
        }
      });

      if (maisProxima) {
        const cidade = cBase.find((c) => String(c.id) === String(maisProxima.city_id));
        const uf = extrairUF(cidade || {});
        setSelectedEstado(uf || 'BA');
        setSelectedCidadeId(String(maisProxima.city_id));
        setBeachName(maisProxima.name);
        setBeachId(String(maisProxima.id));
        console.log('✅ [GPS] Praia mais próxima:', maisProxima.name, '(UF:', uf, ', Distância:', menorDistancia.toFixed(2), 'km)');
      } else {
        ativarFallbackLocalizacao(cBase, pBase);
      }
    } catch (error) {
      console.log('⚠️ [GPS] Erro/timeout - fallback:', error.message);
      ativarFallbackLocalizacao(cBase, pBase);
    }
  };

  // Fallback para localização (usa primeira praia ou BA padrão)
  const ativarFallbackLocalizacao = (cBase: CidadeItem[], pBase: PraiaItem[]) => {
    if (pBase.length > 0) {
      const pDefault = pBase[0];
      const cDefault = cBase.find((c) => String(c.id) === String(pDefault.city_id));
      const ufDefault = extrairUF(cDefault || {});
      setSelectedEstado(ufDefault || 'BA');
      setSelectedCidadeId(String(pDefault.city_id));
      setBeachName(pDefault.name || 'Praia Padrão - BA');
      setBeachId(String(pDefault.id));
      console.log('🔄 [FALLBACK] Usando praia padrão:', pDefault.name, 'UF:', ufDefault);
    } else {
      setSelectedEstado('BA');
      setBeachName('Modo Offline - Bahia');
      console.log('🔄 [FALLBACK] Sem praias na API - usando BA genérico');
    }
  };

  // 🌊 Selecionar Praia Manual
  const selecionarPraiaManual = async (id: string, obj?: PraiaItem) => {
    const p = obj || praias.find((x) => String(x.id) === String(id));
    if (!p) return;

    setBeachName(p.name);
    setBeachId(String(id));
    setSelectedPraiaId(String(id));
    setIsLoadingBeachData(true);

    try {
      const res = await fetch(`${API_BASE_URL}/beaches/${id}/status`, {
        headers: { Authorization: `Bearer ${TOKEN_MASTER}` },
      });
      if (!res.ok) {
        setBeachData((prev) => ({ ...prev, updatedAt: 'Offline' }));
        return;
      }
      const data = await res.json();
      setBeachData({
        temp: data.temp || '--',
        waves: data.waves || '--',
        wind: data.wind || '--',
        uv: data.uv || '--',
        flag: String(data.flag || 'verde').toLowerCase(),
        updatedAt: data.updated_at ? new Date(data.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora',
        curiosidades: data.curiosidades || [],
        ruas: data.ruas_referencia || [],
        pontosTuristicos: data.pontos_turisticos || [],
        locaisInstagramaveis: data.locais_instagramaveis || [],
      });
    } catch (e) {
      setBeachData((prev) => ({ ...prev, updatedAt: 'Offline' }));
    } finally {
      setIsLoadingBeachData(false);
      setShowBeachModal(false);
    }
  };

  // 🚨 Acionar Emergência (com GPS e bateria)
  const acionarEmergencia = async (tipo: keyof typeof SOS_GUIDANCE) => {
    setIsSending(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const battery = await getBatteryPercentage();

      const payload = {
        alert_type: tipo,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        battery_level: battery ? Math.round(battery) : 100,
        created_by_id: UUID_MASTER,
        beach_id: beachId || null,
      };

      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN_MASTER}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setPendingAlertType(tipo);
        setShowSosMainModal(false);
        setShowSosAreiaModal(false);
        setShowGuidanceModal(true);
      } else {
        Alert.alert('Erro', 'Falha ao contatar a Central. Tente novamente.');
      }
    } catch (e) {
      Alert.alert('Falha', 'Verifique conexão e GPS.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>CENTRAL MYBEACH • {selectedEstado} • {cidades.find((c) => String(c.id) === selectedCidadeId)?.name || 'LOCAL'}</Text>
          <TouchableOpacity style={styles.beachSelector} onPress={() => setShowBeachModal(true)}>
            <Ionicons name="location" size={28} color="#ef4444" />
            <Text style={styles.beachName}>{beachName}</Text>
            {isLoadingBeachData ? <ActivityIndicator size="small" color="#94a3b8" /> : <Ionicons name="chevron-down" size={24} color="#94a3b8" />}
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={require('../../assets/images/pompeba.jpg')} style={styles.heroImg} resizeMode="cover" />
          <View style={styles.heroOverlay}>
            <View style={styles.flagBadge}>
              <View style={[styles.dot, { backgroundColor: beachData.flag === 'verde' ? '#22c55e' : beachData.flag === 'amarela' ? '#eab308' : '#ef4444' }]} />
              <Text style={styles.flagText}>BANDEIRA {beachData.flag.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Monitoramento em Tempo Real</Text>
            <Text style={styles.updateText}>Sincronizado: {beachData.updatedAt}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="thermometer" size={38} color="#ef4444" />
              <Text style={styles.statValue}>{beachData.temp}</Text>
              <Text style={styles.statLabel}>TEMP.</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="waves" size={38} color="#3b82f6" />
              <Text style={styles.statValue}>{beachData.waves}</Text>
              <Text style={styles.statLabel}>ONDAS</Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>Curiosidades e Orientações</Text>
            {beachData.curiosidades.length > 0 ? beachData.curiosidades.map((c, i) => <Text key={i} style={styles.infoItem}>• {c}</Text>) : <Text style={styles.infoItem}>Carregando dados locais...</Text>}
          </View>
        </View>
      </ScrollView>

      {/* FABs */}
      <TouchableOpacity style={styles.fabCrianca} onPress={() => acionarEmergencia('CRIANCA_PERDIDA')} activeOpacity={0.9}>
        <Ionicons name="people" size={30} color="#fff" />
        <Text style={styles.fabText}>Criança Perdida</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fabSOS} onPress={() => setShowSosMainModal(true)} activeOpacity={0.9}>
        {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sosText}>SOS</Text>}
      </TouchableOpacity>

      {/* Modal de Localização (UF sempre populado) */}
      <Modal visible={showBeachModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Jurisdição</Text>
            <View style={styles.filterGroup}>
              <Text style={styles.label}>1. Estado (UF)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {estados.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.chip, selectedEstado === e.uf && styles.chipActive]}
                    onPress={() => {
                      setSelectedEstado(e.uf);
                      setSelectedCidadeId('');
                      setSelectedPraiaId('');
                    }}
                  >
                    <Text style={[styles.chipText, selectedEstado === e.uf && styles.chipTextActive]}>
                      {e.uf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.label}>2. Cidade</Text>
              <ScrollView style={styles.list} nestedScrollEnabled>
                {cidadesFiltradas.length > 0 ? cidadesFiltradas.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.item, selectedCidadeId === String(c.id) && styles.itemActive]}
                    onPress={() => {
                      setSelectedCidadeId(String(c.id));
                      setSelectedPraiaId('');
                    }}
                  >
                    <Text style={styles.itemText}>{c.name}</Text>
                  </TouchableOpacity>
                )) : <Text style={styles.emptyText}>Selecione um estado para ver cidades</Text>}
              </ScrollView>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.label}>3. Praia</Text>
              <ScrollView style={styles.list} nestedScrollEnabled>
                {praiasFiltradas.length > 0 ? praiasFiltradas.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.item, selectedPraiaId === String(p.id) && styles.itemActive]}
                    onPress={() => selecionarPraiaManual(String(p.id), p)}
                  >
                    <Text style={styles.itemText}>{p.name}</Text>
                  </TouchableOpacity>
                )) : <Text style={styles.emptyText}>Selecione uma cidade para ver praias</Text>}
              </ScrollView>
            </View>
            <TouchableOpacity onPress={() => setShowBeachModal(false)} style={styles.closeBtn}>
              <Text style={styles.close}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Orientação SOS (High Contrast para Sol/Estresse) */}
      <Modal visible={showGuidanceModal} transparent={false} animationType="fade">
        <StatusBar barStyle="light-content" backgroundColor="#ef4444" />
        <View style={styles.guidanceFullScreen}>
          <View style={styles.guidanceHeader}>
            <Ionicons name="warning" size={60} color="#fff" />
            <Text style={styles.guidanceHeaderMain}>SOCORRO ENVIADO!</Text>
          </View>
          <ScrollView contentContainerStyle={styles.guidanceScroll}>
            {pendingAlertType && (
              <>
                <Text style={styles.guidanceTypeTitle}>{SOS_GUIDANCE[pendingAlertType].title}</Text>
                <Text style={styles.guidanceTypeSub}>{SOS_GUIDANCE[pendingAlertType].subtitle}</Text>
                <View style={styles.guidanceDoutrinaBox}>
                  {SOS_GUIDANCE[pendingAlertType].guidance.map((g, i) => (
                    <View key={i} style={styles.guidanceRow}>
                      <Text style={styles.guidanceBullet}>•</Text>
                      <Text style={styles.guidanceTextMain}>{g}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.statusBox}>
                  <ActivityIndicator size="large" color="#ef4444" />
                  <Text style={styles.statusBoxText}>Equipe a caminho da sua localização</Text>
                  <Text style={styles.statusBoxSub}>Praia: {beachName}</Text>
                </View>
              </>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.btnEntendido} onPress={() => setShowGuidanceModal(false)}>
            <Text style={styles.btnEntendidoText}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modals SOS (Água/Areia) */}
      <Modal visible={showSosMainModal} transparent animationType="fade">
        <View style={styles.modalBgCenter}>
          <View style={styles.sosContent}>
            <Text style={styles.modalTitle}>QUAL A EMERGÊNCIA?</Text>
            <TouchableOpacity style={[styles.sosBtn, { backgroundColor: '#2563eb' }]} onPress={() => acionarEmergencia('SOS_AGUA')}>
              <MaterialCommunityIcons name="waves" size={32} color="#fff" />
              <Text style={styles.sosBtnText}>NA ÁGUA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sosBtn, { backgroundColor: '#ef4444' }]} onPress={() => { setShowSosMainModal(false); setShowSosAreiaModal(true); }}>
              <MaterialCommunityIcons name="medical-bag" size={32} color="#fff" />
              <Text style={styles.sosBtnText}>NA AREIA</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSosMainModal(false)} style={styles.closeBtn}>
              <Text style={styles.close}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSosAreiaModal} transparent animationType="fade">
        <View style={styles.modalBgCenter}>
          <View style={styles.sosContent}>
            <Text style={styles.modalTitle}>TIPO DE OCORRÊNCIA</Text>
            <TouchableOpacity style={[styles.sosBtn, { backgroundColor: '#b91c1c' }]} onPress={() => acionarEmergencia('SOS_AREIA_INFARTO')}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="#fff" />
              <Text style={styles.sosBtnText}>INFARTO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sosBtn, { backgroundColor: '#dc2626' }]} onPress={() => acionarEmergencia('SOS_AREIA_DESMAIO')}>
              <MaterialCommunityIcons name="bed" size={28} color="#fff" />
              <Text style={styles.sosBtnText}>DESMAIO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sosBtn, { backgroundColor: '#991b1b' }]} onPress={() => acionarEmergencia('SOS_AREIA_CONVULSAO')}>
              <MaterialCommunityIcons name="flash-alert" size={28} color="#fff" />
              <Text style={styles.sosBtnText}>CONVULSÃO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sosBtn, { backgroundColor: '#7f1d1d' }]} onPress={() => acionarEmergencia('SOS_AREIA_NAO_IDENTIFICADO')}>
              <MaterialCommunityIcons name="help-circle" size={28} color="#fff" />
              <Text style={styles.sosBtnText}>OUTRO</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowSosAreiaModal(false); setShowSosMainModal(true); }} style={styles.closeBtn}>
              <Text style={styles.close}>VOLTAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { paddingBottom: 220 },
  header: { padding: 25, paddingTop: 60, backgroundColor: '#fff' },
  headerLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  beachSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 18, borderRadius: 24, marginTop: 12, borderWidth: 2, borderColor: '#e2e8f0', gap: 12 },
  beachName: { flex: 1, fontSize: 26, fontWeight: '950', color: '#0f172a' },
  hero: { width, height: 260, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 25 },
  flagBadge: { backgroundColor: 'rgba(255,255,255,0.95)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  flagText: { fontWeight: '950', fontSize: 13 },
  content: { padding: 25 },
  titleRow: { marginBottom: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '950', color: '#0f172a' },
  updateText: { fontSize: 12, color: '#94a3b8', fontWeight: '900' },
  statsGrid: { flexDirection: 'row', gap: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 22, borderRadius: 34, elevation: 4, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '950', marginTop: 10, color: '#0f172a' },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '950' },
  infoBlock: { marginTop: 25, backgroundColor: '#fff', borderRadius: 34, padding: 25, elevation: 3 },
  infoBlockTitle: { fontSize: 20, fontWeight: '950', color: '#0f172a', marginBottom: 20 },
  infoItem: { fontSize: 14, color: '#334155', marginBottom: 10, fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: 20 },
  fabCrianca: { position: 'absolute', bottom: 45, left: 20, backgroundColor: '#f97316', flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 22, borderRadius: 45, gap: 12, elevation: 20 },
  fabText: { color: '#fff', fontWeight: '950', fontSize: 16 },
  fabSOS: { position: 'absolute', bottom: 35, right: 20, width: 110, height: 110, borderRadius: 55, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', elevation: 20, borderWidth: 10, borderColor: '#fff' },
  sosText: { color: '#fff', fontWeight: '950', fontSize: 36 },
  guidanceFullScreen: { flex: 1, backgroundColor: '#fff' },
  guidanceHeader: { backgroundColor: '#ef4444', height: 200, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  guidanceHeaderMain: { color: '#fff', fontSize: 30, fontWeight: '950', marginTop: 10 },
  guidanceScroll: { padding: 30 },
  guidanceTypeTitle: { fontSize: 38, fontWeight: '950', color: '#0f172a' },
  guidanceTypeSub: { fontSize: 22, fontWeight: '800', color: '#64748b', marginBottom: 30 },
  guidanceDoutrinaBox: { backgroundColor: '#f8fafc', padding: 25, borderRadius: 28, borderWidth: 3, borderColor: '#e2e8f0', marginBottom: 35 },
  guidanceRow: { flexDirection: 'row', marginBottom: 25, gap: 15 },
  guidanceBullet: { fontSize: 36, color: '#ef4444', fontWeight: '950', marginTop: -10 },
  guidanceTextMain: { fontSize: 24, fontWeight: '800', color: '#1e293b', flex: 1 },
  statusBox: { alignItems: 'center', gap: 20, marginBottom: 60 },
  statusBoxText: { textAlign: 'center', color: '#ef4444', fontWeight: '950', fontSize: 16, letterSpacing: 1 },
  statusBoxSub: { textAlign: 'center', color: '#64748b', fontSize: 14 },
  btnEntendido: { backgroundColor: '#0f172a', height: 130, justifyContent: 'center', alignItems: 'center' },
  btnEntendidoText: { color: '#fff', fontSize: 36, fontWeight: '950' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: height * 0.9 },
  sosContent: { backgroundColor: '#fff', borderRadius: 40, padding: 30 },
  modalTitle: { fontSize: 26, fontWeight: '950', color: '#0f172a', marginBottom: 25, textAlign: 'center' },
  filterGroup: { marginBottom: 25 },
  label: { fontSize: 13, fontWeight: '950', color: '#64748b', marginBottom: 15, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 28, backgroundColor: '#f1f5f9' },
  chipActive: { backgroundColor: '#ef4444' },
  chipText: { fontSize: 14, fontWeight: '900', color: '#475569' },
  chipTextActive: { color: '#fff' },
  list: { maxHeight: 160, backgroundColor: '#f8fafc', borderRadius: 24, padding: 15 },
  item: { paddingVertical: 18, borderBottomWidth: 1.5, borderBottomColor: '#e2e8f0' },
  itemText: { fontSize: 18, fontWeight: '850', color: '#1e293b' },
  itemActive: { backgroundColor: '#fee2e2' },
  sosBtn: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 24, borderRadius: 28, marginBottom: 15 },
  sosBtnText: { color: '#fff', fontWeight: '950', fontSize: 20 },
  closeBtn: { paddingVertical: 15, alignItems: 'center' },
  close: { textAlign: 'center', color: '#ef4444', fontWeight: '950', fontSize: 18 },
});