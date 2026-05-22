import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from 'react-native-maps';
import Calories from "../components/Calories";
import Distance from "../components/Distance";
import Pace from "../components/Pace";
import Timer from "../components/Timer";
import { useUserLocation } from "../hooks/location";
import { globalStyles } from "../styles/global";



export default function ActivityScreen() {
  const [isRunning, setIsRunning] = useState(false);
  /* const { position, route, distanceKm, reset } = useTracking(isRunning); */
  const mapRef = useRef<MapView>(null); /* needed reference to call method on the map */
  const region = useUserLocation();
  const [isPaused, setIsPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {      
    if (region) {
      mapRef.current?.animateToRegion(region, 500);
    }
  }, [region]);

  if (!region) return <ActivityIndicator size="large" />; /* spinning wheel for loading */

  return (
    <View style={globalStyles.container}>
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
          <View style={styles.runButtons}>
            <TouchableOpacity style={styles.circleButton} onPress={() => setIsPaused(!isPaused)}>
              <Text style={styles.circleButtonText}>⏸</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleButton, styles.stopButton]} onPress={() => {setIsRunning(false); setIsPaused(false); setResetKey(k => k + 1);}}>
              <Text style={styles.circleButtonText}>⏹</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    runDetails: { flexDirection:'row', alignItems: 'center',gap:20},
    mapContainer: {  width: '100%', height: 423, position: 'relative'},
    map: { width: '100%', height: 423 },
    startButton: {  
      position: 'absolute',
      bottom: 16,
      alignSelf: 'center',
      backgroundColor: '#FF6B35',
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
      backgroundColor: '#FF6B35',
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopButton: {backgroundColor: '#CC0000',},
    circleButtonText: {fontSize: 24,},
    },
);