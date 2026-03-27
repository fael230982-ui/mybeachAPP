import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreenAnimada({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { 
          toValue: 1, 
          duration: 1500, 
          useNativeDriver: true 
        }),
        Animated.spring(logoScale, { 
          toValue: 1, 
          tension: 10,
          friction: 4, 
          useNativeDriver: true 
        })
      ]).start(() => {
        setTimeout(() => { 
          if(onFinish) onFinish(); 
        }, 2000);
      });
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Video
        source={require('../assets/images/onda-mar.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      
      <View style={styles.overlay} />

      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image 
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.poweredContainer, { opacity: logoOpacity }]}>
        <Text style={styles.poweredText}>Powered by</Text>
        <Text style={styles.companyText}>Rafiels Soluções</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  logoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  logo: { width: 250, height: 250 },
  poweredContainer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center', zIndex: 10 },
  poweredText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, fontWeight: '400', letterSpacing: 2, marginBottom: 4 },
  companyText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});