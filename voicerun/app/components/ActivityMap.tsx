// components/ActivityMap.tsx
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Coordinate } from '../hooks/useTracking';

interface Props {
  position: Coordinate | null;
  route: Coordinate[];
}

export default function ActivityMap({ position, route }: Props) {
  // Loading
  if (!position) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color="#4fc3f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          ...position,
          latitudeDelta: 0.005,   
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        followsUserLocation  
      >
        {/* line on the map */}
        {route.length > 1 && (
          <Polyline
            coordinates={route}
            strokeColor="#22c55e"
            strokeWidth={4}
          />
        )}

        {/* Starting point */}
        {route.length > 0 && (
          <Marker coordinate={route[0]} title="Partenza" pinColor="blue" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});