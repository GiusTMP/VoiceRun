import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Image, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
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
  
  // Stato per capire se il blocco è dovuto ai permessi app o solo al GPS spento
  const [arePermissionsGranted, setArePermissionsGranted] = useState<boolean | null>(null);

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

  // Controlla lo stato reale dei permessi e si aggiorna se l'utente riattiva l'app
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setArePermissionsGranted(status === 'granted');
    };
    
    checkPermissions();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, [isPermissionGranted]);

  const handleRequestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setArePermissionsGranted(status === 'granted');
      if (status === 'granted') {
        Alert.alert("Success", "Location permission granted!");
      } else {
        Alert.alert("Permission Denied", "To use the app, please allow location access.");
      }
    } catch (error) {
      console.log("Error requesting location permission:", error);
    }
  };

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
        { text: 'Yes', onPress: () => {{confirmStopActivity(); Vibration.vibrate(1000);}} } 
      ]
    );
  };

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
        {isPermissionGranted === false && arePermissionsGranted !== null ? (
          arePermissionsGranted ? (
            // CASO A: I permessi dell'app sono già OK, ma il GPS del telefono è spento
            <View style={styles.permissionContainer}>
              <Ionicons name="location-outline" size={48} color="#ffb74d" style={{ marginBottom: 16 }} />
              <Text style={styles.permissionText}>
                Please turn on your device's location (GPS) to display the map and track your ride.
              </Text>
            </View>
          ) : (
            // CASO B: Mancano effettivamente le autorizzazioni dell'app
            <View style={styles.permissionContainer}>
              <Ionicons name="location-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={styles.permissionText}>
                The app needs location permissions to display the map and track your ride.
              </Text>
              
              {/* Sotto c'è solo il pulsante per richiedere il permesso nativo */}
              <TouchableOpacity style={styles.settingsButton} onPress={handleRequestPermission}>
                <Text style={styles.settingsButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <ActivityMap position={position} route={route}/>
        )}
        
        {/* 🌟 SEZIONE MODIFICATA: Popup di conferma sia per attivazione che per disattivazione */}
        <VoiceMicButton 
          isAwake={isAwake}
          isListening={isListening} 
          volume={volume} 
          hasPermission={isMicPermissionGranted} 
          onPress={() => {
            if (isListening) {
              Alert.alert(
                'Disable voice commands',
                'Are you sure you want to mute your microphone?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Deactivate', 
                    style: 'destructive', 
                    onPress: () => stopListening() 
                  }
                ]
              );
            } else {
              Alert.alert(
                'Enable voice commands',
                'Are you sure you want to activate your microphone to listen for voice commands?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Activate', 
                    onPress: () => startListening() 
                  }
                ]
              );
            }
          }}
        />
        {!isRunning ? (
          isPermissionGranted === true && (
            <TouchableOpacity 
              style={[styles.startButton, !position && { opacity: 0.5 }]} 
              disabled={!position} 
              onPress={() => { 
                setIsRunning(true); 
                Speech.speak('Run started', { language: 'en-US' }); 
                Vibration.vibrate(1000); 
              }}
            >
              <Text style={styles.startButtonText}>
                {!position ? 'Acquiring GPS...' : 'Start Run'}
              </Text>
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
    backgroundColor: '#1f1f36',
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
    width: '80%', 
    alignItems: 'center',
  },
  settingsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});