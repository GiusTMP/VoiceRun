import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import ActivityMap from "../components/ActivityMap";
import Calories from "../components/Calories";
import Distance from "../components/Distance";
import Pace from "../components/Pace";
import Timer from "../components/Timer";
import VoiceInfoModal from "../components/VoiceInfoModal";
import VoiceMicButton from "../components/VoiceMicButton";
import { useTracking } from "../hooks/useTracking";
import { useVoiceController } from "../hooks/useVoiceController";
import { addRun } from '../storage/activities';
import { colors, globalStyles } from "../styles/global";
import { formatTimer } from '../utils/formatTimer';

export default function ActivityScreen() {
  const router = useRouter();
  
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const { position, route, distanceKm, isPermissionGranted } = useTracking(isRunning && !isPaused); 
  
  const [resetKey, setResetKey] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0); 
  const totalSecondsRef = useRef(0);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const calories = (0.9 * 80 * distanceKm);
  const paceSecs = distanceKm > 0 ? Math.floor(totalSecondsRef.current / distanceKm) : 0;
  const { m, s } = formatTimer(paceSecs);
  const finalPace = m + ":" + s;
  
  const announcedKmRef = useRef(0);

  useEffect(() => {
    const km = Math.floor(distanceKm);
    if (km > announcedKmRef.current) {
      announcedKmRef.current = km;
      Speech.speak(`${km} kilometers. Pace: ${finalPace}`, { language: 'en-US' });
    }
  }, [distanceKm]);

  const handleAddRun = async () => {
    await addRun({
      duration: totalSecondsRef.current.toString(),
      calories: calories.toString(),
      pace: finalPace,
      distance: distanceKm.toString()
    });
  };

  const confirmStopActivity = () => {
    setIsRunning(false); 
    setIsPaused(false); 
    setResetKey(k => k + 1);
    handleAddRun();
    router.push({
      pathname: '/summary',
      params: {
        distanceKm: distanceKm.toFixed(2),
        durationSecs: totalSecondsRef.current,
        calories: calories.toFixed(0),
        pace: finalPace,
        refresh: Date.now()
      },
    });
  };

  const handleStop = () => {
    Alert.alert(
      'End activity',
      'Are you sure you want to finish the activity?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => confirmStopActivity() } 
      ]
    );
  };

  // 👈 ESTRAIAMO ANCHE stopListening 
  const { 
    isAwake, 
    isListening, 
    volume, 
    startListening, 
    stopListening, 
    hasPermission: isMicPermissionGranted 
  } = useVoiceController({
    isRunning,
    isPaused,
    setIsRunning,
    setIsPaused,
    confirmStop: confirmStopActivity, 
    distanceKm,
    calories,
    finalPace,
    totalSeconds: currentSeconds,
    isPermissionGranted,
  });

  return (
    <View style={globalStyles.container}>
      <StatusBar style="light" />
      <TouchableOpacity style={styles.infoIconCircle} onPress={() => setIsInfoModalVisible(true)}>
        <Ionicons name="information-circle-outline" size={28} color="white" />
      </TouchableOpacity>
      <Image source={require('../../assets/images/logo-app.png')} style={globalStyles.logo} />
      
      <Timer 
        isRunning={isRunning && !isPaused} 
        resetKey={resetKey} 
        onTick={(secs) => {
          totalSecondsRef.current = secs;
          setCurrentSeconds(secs); 
        }} 
      />
      
      <View style={styles.runDetails}>
        <Distance distanceKm={distanceKm} />
        <Calories calories={calories}/>
        <Pace pace={finalPace}/>
      </View>
      
      <View style={styles.mapContainer}>
        {isPermissionGranted === false ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="location-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={styles.permissionText}>
              The app needs location permissions to display the map and track your ride.
            </Text>
            <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityMap position={position} route={route} distanceKm={distanceKm} />
        )}
        
        <VoiceMicButton 
          isAwake={isAwake} 
          isListening={isListening} 
          volume={volume} 
          hasPermission={isMicPermissionGranted} 
          onPress={() => {
            if (isListening) {
              // 👈 AGGIUNTO: Chiede la conferma prima di disattivare
              Alert.alert(
                'Disable voice commands',
                'Are you sure you want to mute your microphone?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Deactivate', 
                    style: 'destructive', 
                    onPress: () => stopListening() // Disattiva solo se l'utente preme "Disattiva"
                  }
                ]
              );
            } else {
              // Se è già spento, si riattiva immediatamente al primo click
              startListening();
            }
          }}
        />
        {!isRunning ? (
          isPermissionGranted === true && (
            <TouchableOpacity style={styles.startButton} onPress={() => { setIsRunning(true); Speech.speak('Run started', { language: 'en-US' }); Vibration.vibrate(1000); }}>
              <Text style={styles.startButtonText}>Start Run</Text>
            </TouchableOpacity>
          )
        ) : ( 
          !isPaused ? (
            <View style={styles.runButtons}>
              <TouchableOpacity style={styles.circleButtonRestart} onPress={() => {setIsPaused(!isPaused); Vibration.vibrate(100)}}>
                <Ionicons name='pause-outline' size={30} color='white' />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circleButton, styles.stopButton]} onPress={() => handleStop()}>
                <Ionicons name='stop' size={30} color='white'/>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.runButtons}>
              <TouchableOpacity style={styles.circleButton} onPress={() => {setIsPaused(!isPaused); Vibration.vibrate(100)}}>
                <Ionicons name='play' size={30} color='white' />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circleButton, styles.stopButton]} onPress={() => handleStop()}>
                <Ionicons name='stop' size={30} color='white'/>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
      <VoiceInfoModal 
        isVisible={isInfoModalVisible} 
        onClose={() => setIsInfoModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  runDetails: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingBottom: 12 },
  mapContainer: { width: '100%', flex: 1, position: 'relative' },
  map: { width: '100%', flex: 1 },
  infoIconCircle: {
    position: 'absolute',
    top: 52, 
    left: 20,
    zIndex: 99,
    padding: 6,
  },
  startButton: {  
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25
  },
  startButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  runButtons: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 32,
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonRestart: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a2ec6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: { backgroundColor: '#1a1a2e' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  settingsButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  settingsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});