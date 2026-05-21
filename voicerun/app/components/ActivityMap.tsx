// components/ActivityMap.tsx
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Coordinate } from '../hooks/useTracking';

interface Props {
  position: Coordinate | null;
  route: Coordinate[];
  distanceKm: number;
}

export default function ActivityMap({ position, route, distanceKm }: Props) {
  if (!position) {
    return (
      <View style={styles.placeholder}>
        <Text>Acquisizione GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        //provider={PROVIDER_GOOGLE}
        region={{
          ...position,
          latitudeDelta: 0.005,   // 👈 zoom ravvicinato
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        followsUserLocation  // 👈 la mappa segue l'utente
      >
        {/* Traccia il percorso */}
        {route.length > 1 && (
          <Polyline
            coordinates={route}
            strokeColor="#22c55e"
            strokeWidth={4}
          />
        )}

        {/* Punto di partenza */}
        {route.length > 0 && (
          <Marker coordinate={route[0]} title="Partenza" pinColor="blue" />
        )}
      </MapView>

      {/* Badge km sovrapposto alla mappa */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{distanceKm.toFixed(2)} km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});