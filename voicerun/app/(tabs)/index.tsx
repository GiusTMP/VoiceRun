import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import ActivityMap from "../components/ActivityMap";
import Calories from "../components/Calories";
import Distance from "../components/Distance";
import Pace from "../components/Pace";
import Timer from "../components/Timer";
import VoiceMicButton from "../components/VoiceMicButton"; // 👈 Nuovo Import
import { useTracking } from "../hooks/useTracking";
import { useVoiceController } from "../hooks/useVoiceController"; // 👈 Nuovo Import
import { addRun } from '../storage/activities';
import { globalStyles } from "../styles/global";
import { formatTimer } from '../utils/formatTimer';

export default function ActivityScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { position, route, distanceKm} = useTracking(isRunning && !isPaused); 
  const [resetKey, setResetKey] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0); // Passato all'hook vocale
  const totalSecondsRef = useRef(0);
  const calories = (0.9*80*distanceKm);
  const paceSecs = distanceKm > 0 ? Math.floor(totalSecondsRef.current / distanceKm) : 0;
  const {m,s} = formatTimer(paceSecs)
  const finalPace = m+ ":" + s;
  const announcedKmRef = useRef(0);

  useEffect(() => {
    const km = Math.floor(distanceKm);
    if (km > announcedKmRef.current) {
      announcedKmRef.current = km;
      // Added English localization and better formatting
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
  }
  const confirmStopActivity = () => {
    setIsRunning(false); 
    setIsPaused(false); 
    setResetKey(k => k + 1);
    handleAddRun();
    router.push({
      pathname: '/summary',
      params: {
        distanceKm: distanceKm.toFixed(2),
        durationSecs:  totalSecondsRef.current,
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
        { text: 'Yes', onPress: () => confirmStopActivity() } // Usa la funzione pura
      ]
    )
  };

  // 👈 INTEGRAZIONE HOOK VOCALE
  const { isAwake, isListening, startListening } = useVoiceController({
    isRunning,
    isPaused,
    setIsRunning,
    setIsPaused,
    confirmStop: confirmStopActivity, // <-- Modificato: non passiamo più l'Alert!
    distanceKm,
    calories,
    finalPace,
    totalSeconds: currentSeconds,
  });

  return (
    <View style={globalStyles.container}>
      <StatusBar style="light" />
      <Image source={require('../../assets/images/logo-app.png')} style={globalStyles.logo} />
      <Timer 
        isRunning={isRunning && !isPaused} 
        resetKey={resetKey} 
        onTick={(secs) => {
          totalSecondsRef.current = secs;
          setCurrentSeconds(secs); // Sincronizza lo stato locale per i comandi vocali
        }} 
      />
      <View style={styles.runDetails}>
        <Distance distanceKm={distanceKm} />
        <Calories calories={calories}/>
        <Pace pace={finalPace}/>
      </View>
      
      <View style={styles.mapContainer}>
        <ActivityMap position={position} route={route} distanceKm={distanceKm} />
        
        {/* 👈 COMPONENTE MICROFONO IN BASSO A DESTRA */}
        <VoiceMicButton 
          isAwake={isAwake} 
          isListening={isListening} 
          onPress={() => {
            // Se per caso si spegne l'ascolto di background, l'utente può cliccarlo manualmente
            startListening();
          }}
        />

        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={() => {setIsRunning(true); Speech.speak('Run started', {language: 'en-US'}); Vibration.vibrate(1000);} }>
            <Text style={styles.startButtonText}>Start Run</Text>
          </TouchableOpacity>
        ) : ( 
          !isPaused ? (
          <View style={styles.runButtons}>
            <TouchableOpacity style={styles.circleButtonRestart} onPress={() => setIsPaused(!isPaused)}>
              <Ionicons name='pause-outline' size={30} color='white' />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleButton, styles.stopButton]} onPress={() => handleStop()}>
              <Ionicons name='stop' size={30} color='white'/>
            </TouchableOpacity>
          </View>
          ) : (
          <View style={styles.runButtons}>
            <TouchableOpacity style={styles.circleButton} onPress={() => setIsPaused(!isPaused)}>
              <Ionicons name='play' size={30} color='white' />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleButton, styles.stopButton]} onPress={() => handleStop()}>
              <Ionicons name='stop' size={30} color='white'/>
            </TouchableOpacity>
          </View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    runDetails: { flexDirection:'row', alignItems: 'center',gap:20, paddingBottom: 12},
    mapContainer: {  width: '100%', flex: 1, position: 'relative'},
    map: { width: '100%', flex:1 },
    startButton: {  
      position: 'absolute',
      bottom: 16,
      alignSelf: 'center',
      backgroundColor: '#1a1a2e',
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 25},
    startButtonText: {  color: 'white', fontWeight: 'bold', fontSize: 16},
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
    stopButton: {backgroundColor: '#1a1a2e',},
    },
);