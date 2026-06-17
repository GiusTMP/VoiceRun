import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

interface VoiceMicButtonProps {
  isAwake?: boolean; 
  isListening: boolean;
  volume: number; 
  onPress?: () => void;
  hasPermission?: boolean; 
}

export default function VoiceMicButton({ 
  isListening, 
  volume, 
  onPress, 
  hasPermission = true 
}: VoiceMicButtonProps) {
  const animatedVolume = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation
  useEffect(() => {
    if (isListening && hasPermission) {
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
  }, [isListening, hasPermission]);

  
  useEffect(() => {
    Animated.timing(animatedVolume, {
      toValue: (isListening && hasPermission) ? volume : 0,
      duration: 70, 
      useNativeDriver: true,
    }).start();
  }, [volume, isListening, hasPermission]);

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

  
  const getIconName = () => {
    if (!hasPermission) {
      return 'mic-off'; 
    }
    return volume > 0.5 ? 'mic' : 'mic-outline';
  };

  return (
    <View style={styles.container}>
      {isListening && hasPermission && (
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
      {isListening && hasPermission && (
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
        style={[
          styles.button, 
          !hasPermission && styles.buttonDisabled 
        ]} 
        onPress={onPress} // 👈 Sempre attivo, gestirà il controllo internamente
        activeOpacity={0.85} // 👈 Sempre attivo per dare un feedback visivo al tocco
      >
        <Ionicons 
          name={getIconName()} 
          size={26} 
          color={hasPermission ? 'white' : '#ef4444'} 
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
  buttonDisabled: {
    borderColor: '#ef4444', // Aggiunge un bordo rosso per accentuare il blocco del microfono
    borderWidth: 1.5,
    backgroundColor: '#111122',
  }
});