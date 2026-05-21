import { useState } from 'react';
import { Image, StyleSheet, View } from "react-native";
import ActivityMap from '../components/ActivityMap';
import Calories from "../components/Calories";
import Distance from "../components/Distance";
import Pace from "../components/Pace";
import Timer from "../components/Timer";
import { useTracking } from '../hooks/useTracking';
import { globalStyles } from "../styles/global";


export default function ActivityScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const { position, route, distanceKm, reset } = useTracking(isRunning);
  return (
    <View style={globalStyles.container}>
      <Image source={require('../../assets/images/logo-app.png')} style={globalStyles.logo} />
      <Timer />
      <View style={styles.runDetails}>
        <Distance />
        <Calories />
        <Pace />
      </View>
      <ActivityMap position={position} route={route} distanceKm={distanceKm} />
    </View>
  );
}

const styles = StyleSheet.create({
    runDetails: { flexDirection:'row', alignItems: 'center',gap:40},
    },
);