import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface VoiceMicButtonProps {
  isAwake: boolean;
  isListening: boolean;
  onPress?: () => void;
}

export default function VoiceMicButton({ isAwake, isListening, onPress }: VoiceMicButtonProps) {
  return (
    <View style={[styles.container, isAwake && styles.glowContainer]}>
      <TouchableOpacity 
        style={[styles.button, isAwake ? styles.buttonActive : styles.buttonInactive]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isAwake ? 'mic' : 'mic-outline'} 
          size={28} 
          color='white' 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 28,
    zIndex: 10,
  },
  glowContainer: {
    // Effetto illuminazione / ombra neon per far risaltare il microfono attivo
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 15,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInactive: {
    backgroundColor: '#1a1a2e',
  },
  buttonActive: {
    backgroundColor: '#22c55e', // Diventa verde acceso quando è pronto a ricevere comandi
  },
});