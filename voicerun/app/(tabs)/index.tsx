import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from 'react-native-maps';
import Calories from "../components/Calories";
import Distance from "../components/Distance";
import Pace from "../components/Pace";
import Timer from "../components/Timer";
import { useUserLocation } from "../hooks/location";
import { globalStyles } from "../styles/global";

export default function ActivityScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  /* const { position, route, distanceKm, reset } = useTracking(isRunning); */
  const mapRef = useRef<MapView>(null); /* needed reference to call method on the map */
  const region = useUserLocation();
  const [isPaused, setIsPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

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
            router.push({
              pathname: '/summary',
              params: {
                distanceKm: '5.23',
                durationSecs: '00:23:12',
                calories: '312',
                pace: '20:10',
                refresh: Date.now()
              },
            });
          }
        }
      ]
  
    )
    
  };

  useEffect(() => {      
    if (region) {
      mapRef.current?.animateToRegion(region, 500);
    }
  }, [region]);

  if (!region) return <ActivityIndicator size="large" />; /* spinning wheel for loading */

  return (
    <View style={globalStyles.container}>
      <StatusBar style="light" />
      <Image source={require('../../assets/images/logo-app.png')} style={globalStyles.logo} />
      <Timer isRunning={isRunning && !isPaused} resetKey={resetKey}/>
      <View style={styles.runDetails}>
        <Distance />
        <Calories />
        <Pace />
      </View>
      {/* <ActivityMap position={position} route={route} distanceKm={distanceKm} /> */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef} /* to update */
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
        />
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