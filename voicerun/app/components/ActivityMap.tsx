
import React from 'react'; 
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Coordinate } from '../hooks/useTracking';

interface Props {
  position: Coordinate | null;
  route: Coordinate[];
}

const ActivityMap = ({ position, route }: Props) => {
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
        {/* Map line */}
        {route.length > 1 && (
          <Polyline
            coordinates={route}
            strokeColor="#22c55e"
            strokeWidth={4}
          />
        )}

        {/* Start point */}
        {route.length > 0 && (
          <Marker coordinate={route[0]} title="Partenza" pinColor="blue" />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});


export default React.memo(ActivityMap, (prevProps, nextProps) => {
  return (
    prevProps.position?.latitude === nextProps.position?.latitude &&
    prevProps.position?.longitude === nextProps.position?.longitude &&
    prevProps.route.length === nextProps.route.length
  );
});
