// components/ActivityMap.tsx
import React from 'react'; // 1. Importiamo React per usare memo
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Coordinate } from '../hooks/useTracking';

interface Props {
  position: Coordinate | null;
  route: Coordinate[];
}

// 2. Trasformiamo la funzione in una costante per poterla avvolgere in React.memo[cite: 4]
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
        // Il rendering della region ora è protetto dal memoizzatore
        region={{
          ...position,
          latitudeDelta: 0.005,   
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        followsUserLocation  
      >
        {/* Linea sulla mappa */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

// 3. Esportiamo il componente memorizzato con un confronto accurato delle proprietà[cite: 4]
export default React.memo(ActivityMap, (prevProps, nextProps) => {
  // La mappa deve aggiornarsi SOLO se:
  // - La posizione latitudine/longitudine cambia effettivamente
  // - Viene aggiunto un nuovo punto alla rotta (lunghezza array differente)
  return (
    prevProps.position?.latitude === nextProps.position?.latitude &&
    prevProps.position?.longitude === nextProps.position?.longitude &&
    prevProps.route.length === nextProps.route.length
  );
});