import * as Location from 'expo-location';
import { Baby, Target } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function MapasScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [sosModalVisible, setSosModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {location ? (
        <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={{ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }} showsUserLocation={true}>
          {/* BANDEIRA REAL NO POSTO */}
          <Marker coordinate={{ latitude: -23.9798, longitude: -46.2146 }}>
            <View style={styles.flagPost} />
          </Marker>
        </MapView>
      ) : (
        <View style={styles.loading}><ActivityIndicator size="large" color="#ef4444" /></View>
      )}

      <TouchableOpacity style={styles.btnTarget} onPress={() => mapRef.current?.animateToRegion({ latitude: location!.coords.latitude, longitude: location!.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 })}>
        <Target size={24} color="#0f172a" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnCrianca} onPress={() => Alert.alert("My Beach", "Lost Child Active")}>
        <Baby size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSOS} onPress={() => setSosModalVisible(true)}>
        <View style={styles.sosInner}><Text style={styles.sosText}>SOS</Text></View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  flagPost: { width: 12, height: 12, borderRadius: 2, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  btnTarget: { position: 'absolute', top: 60, left: 20, backgroundColor: '#fff', p: 12, borderRadius: 15, padding: 12, elevation: 5 },
  btnCrianca: { position: 'absolute', top: 60, right: 20, backgroundColor: '#f97316', padding: 15, borderRadius: 35, elevation: 8 },
  btnSOS: { position: 'absolute', bottom: 40, alignSelf: 'center', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(239, 68, 68, 0.3)', justifyContent: 'center', alignItems: 'center' },
  sosInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#ef4444', elevation: 10 },
  sosText: { color: '#ef4444', fontWeight: '900', fontSize: 24 }
});