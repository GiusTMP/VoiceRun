import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VoiceInfoModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function VoiceInfoModal({ isVisible, onClose }: VoiceInfoModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Voice Commands Guide 🎙️</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#ff4d4d" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.infoIntro}>
              To trigger a command, ensure the microphone is active and say the keyword <Text style={styles.highlight}>"voicerun"</Text> followed by one of the English commands listed below.
            </Text>

            <Text style={styles.sectionTitle}>Session Controls:</Text>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun start / begin</Text>
              <Text style={styles.commandDesc}>Starts the running session</Text>
            </View>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun pause / hold on</Text>
              <Text style={styles.commandDesc}>Pauses the current tracking activity</Text>
            </View>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun resume / continue</Text>
              <Text style={styles.commandDesc}>Resumes the run from a paused state</Text>
            </View>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun stop / finish</Text>
              <Text style={styles.commandDesc}>End current workout (requires saying "yes" or "no" afterward to confirm)</Text>
            </View>

            <Text style={styles.sectionTitle}>Performance Stats:</Text>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun distance / km</Text>
              <Text style={styles.commandDesc}>Hear the total distance covered in kilometers</Text>
            </View>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun time / duration</Text>
              <Text style={styles.commandDesc}>Hear the elapsed time since the start</Text>
            </View>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun calories / burned</Text>
              <Text style={styles.commandDesc}>Hear the current estimation of burned calories</Text>
            </View>
            <View style={styles.commandRow}>
              <Text style={styles.commandTrigger}>voicerun pace / speed</Text>
              <Text style={styles.commandDesc}>Hear your current average pace per kilometer</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#33335c',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#33335c',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  infoIntro: {
    color: '#d1d1e0',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  highlight: {
    color: '#00ffcc',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00ffcc',
    marginTop: 14,
    marginBottom: 8,
  },
  commandRow: {
    backgroundColor: '#252542',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  commandTrigger: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commandDesc: {
    color: '#a3a3c2',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: '#00ffcc',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
});