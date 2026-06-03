import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

interface VoiceMicButtonProps {
  isAwake?: boolean; // Mantenuta come opzionale per non rompere index.tsx, ma ignorata visivamente
  isListening: boolean;
  volume: number; 
  onPress?: () => void;
}

export default function VoiceMicButton({ isListening, volume, onPress }: VoiceMicButtonProps) {
  const animatedVolume = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 1. Animazione a ciclo continuo ad onda (verde di default)
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.8,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // 2. Sincronizzazione dinamica reattiva per i decibel audio della voce
  useEffect(() => {
    Animated.timing(animatedVolume, {
      toValue: isListening ? volume : 0,
      duration: 70, 
      useNativeDriver: true,
    }).start();
  }, [volume, isListening]);

  const voiceScale = animatedVolume.interpolate({
    inputRange: [0, 1, 4, 10],
    outputRange: [1, 1.2, 1.6, 2.4],
    extrapolate: 'clamp',
  });

  const voiceOpacity = animatedVolume.interpolate({
    inputRange: [0, 1, 8],
    outputRange: [0.1, 0.4, 0.7],
    extrapolate: 'clamp',
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.4, 1.8],
    outputRange: [0.4, 0.2, 0],
  });

  return (
    <View style={styles.container}>
      
      {/* ONDA 1: Pulsazione continua di base (Sempre Verde) */}
      {isListening && (
        <Animated.View
          style={[
            styles.waveRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseOpacity,
              backgroundColor: '#22c55e', // Verde fisso
            },
          ]}
        />
      )}

      {/* ONDA 2: Reattività volumetrica d'ampiezza voce (Sempre Verde brillante) */}
      {isListening && (
        <Animated.View
          style={[
            styles.waveRing,
            {
              transform: [{ scale: voiceScale }],
              opacity: voiceOpacity,
              backgroundColor: '#4ade80', // Verde brillante
              borderWidth: 1.5,
              borderColor: '#22c55e',
            },
          ]}
        />
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Ionicons 
          // Se rileva un minimo di voce l'icona si riempie, altrimenti resta vuota
          name={volume > 0.5 ? 'mic' : 'mic-outline'} 
          size={26} 
          color='white' 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  waveRing: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    zIndex: -1,
  },
  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1a1a2e', // Colore scuro standard
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});