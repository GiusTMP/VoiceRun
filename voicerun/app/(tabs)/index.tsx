import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
/*import MapView from 'react-native-maps';*/
import Calories from "../components/Calories";
import Distance from "../components/Distance";
import Pace from "../components/Pace";
import Timer from "../components/Timer";
/*import { useUserLocation } from "../hooks/location";*/
import ActivityMap from "../components/ActivityMap";
import { useTracking } from "../hooks/useTracking";
import { addRun } from '../storage/activities';
import { globalStyles } from "../styles/global";
import { formatTimer } from '../utils/formatTimer';

export default function ActivityScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { position, route, distanceKm} = useTracking(isRunning && !isPaused); 
  /*const mapRef = useRef<MapView>(null);*/ /* needed reference to call method on the map */
  /*const region = useUserLocation();*/
  const [resetKey, setResetKey] = useState(0);
  const totalSecondsRef = useRef(0);
  const calories = (0.9*80*distanceKm);
  const paceSecs = distanceKm > 0 ? Math.floor(totalSecondsRef.current / distanceKm) : 0;
  const {m,s} = formatTimer(paceSecs)
  const finalPace = m+ ":" + s;
  /*const distanceKm = '5.23';*/

  const handleAddRun = async () => {
    await addRun({
      duration: totalSecondsRef.current.toString(),
      calories: calories.toString(),
      pace: finalPace,
      distance: distanceKm.toString()
      });
  }
  const handleStop = () => {
    Alert.alert(
      'End activity',
      'Are you sure you want to finish the activity?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
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
          }
        }
      ]
  
    )
    
  };

  return (
    <View style={globalStyles.container}>
      <StatusBar style="light" />
      <Image source={require('../../assets/images/logo-app.png')} style={globalStyles.logo} />
      <Timer isRunning={isRunning && !isPaused} resetKey={resetKey} onTick={(secs) => {totalSecondsRef.current = secs;}} />
      <View style={styles.runDetails}>
        <Distance distanceKm={distanceKm} />
        <Calories calories={calories}/>
        <Pace pace={finalPace}/>
      </View>
      {/* <ActivityMap position={position} route={route} distanceKm={distanceKm} /> */}
      <View style={styles.mapContainer}>
        <ActivityMap position={position} route={route} distanceKm={distanceKm} />
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={() => setIsRunning(true)}>
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

/*        <MapView
          ref={mapRef} /* to update */
          /*style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
        />*/







