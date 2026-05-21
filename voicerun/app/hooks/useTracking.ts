// hooks/useTracking.ts
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Calcola distanza tra due punti in km (formula Haversine)
function haversine(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function useTracking(isRunning: boolean) {
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [route, setRoute] = useState<Coordinate[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Posizione iniziale anche prima di avviare
      const current = await Location.getCurrentPositionAsync({});
      setPosition({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    if (isRunning) {
      startWatching();
    } else {
      stopWatching();
    }
    return () => stopWatching();
  }, [isRunning]);

  const startWatching = async () => {
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5, // 👈 aggiorna ogni 5 metri
      },
      (loc) => {
        const newCoord: Coordinate = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setPosition(newCoord);

        setRoute((prev) => {
          if (prev.length > 0) {
            const added = haversine(prev[prev.length - 1], newCoord);
            setDistanceKm((d) => d + added);
          }
          return [...prev, newCoord];
        });
      }
    );
  };

  const stopWatching = () => {
    watchRef.current?.remove();
    watchRef.current = null;
  };

  const reset = () => {
    setRoute([]);
    setDistanceKm(0);
  };

  return { position, route, distanceKm, reset };
}