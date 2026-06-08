// hooks/useTracking.ts
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

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
  
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);
  // Usiamo una ref per tracciare il permesso in modo sincrono e impedire ricaricamenti superflui
  const isPermGrantedRef = useRef<boolean | null>(null); 
  
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // Funzione di utilità per aggiornare stato e ref simultaneamente
  const updatePermissionState = (granted: boolean) => {
    isPermGrantedRef.current = granted;
    setIsPermissionGranted(granted);
  };

  useEffect(() => {
    let isMounted = true;

    // Recupera la posizione in modo silenzioso per ripristinare la mappa
    async function updateLocationSilent() {
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (isMounted) {
          setPosition({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }
      } catch (e) {
        // Ignoriamo gli errori qui per evitare log fastidiosi
      }
    }

    // Controlla lo stato generale di permessi e hardware
    async function checkStatus(shouldRequest = false) {
      try {
        // 1. Controllo hardware (es. menu a tendina)
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (isMounted && isPermGrantedRef.current !== false) {
            updatePermissionState(false);
          }
          return;
        }

        // 2. Controllo permessi app
        const currentPerm = await Location.getForegroundPermissionsAsync();
        
        if (currentPerm.status === 'granted') {
          // Se prima eravamo bloccati (es. GPS appena riacceso), sblocca e chiedi subito la posizione
          if (isPermGrantedRef.current === false || isPermGrantedRef.current === null) {
            if (isMounted) updatePermissionState(true);
            await updateLocationSilent();
          }
        } else if (currentPerm.status === 'undetermined' && shouldRequest) {
          const requestPerm = await Location.requestForegroundPermissionsAsync();
          if (requestPerm.status === 'granted') {
            if (isMounted) updatePermissionState(true);
            await updateLocationSilent();
          } else {
            if (isMounted) updatePermissionState(false);
          }
        } else {
          if (isMounted && isPermGrantedRef.current !== false) {
            updatePermissionState(false);
          }
        }
      } catch (err) {
        if (isMounted && isPermGrantedRef.current !== false) {
          updatePermissionState(false);
        }
      }
    }

    // Avvio immediato al caricamento
    checkStatus(true);

    // Ascoltatore cambi di stato (quando l'utente esce completamente per andare in Impostazioni)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkStatus(false);
      }
    });

    // POLLING: Controllo continuo (ogni 2 secondi) per le disattivazioni al volo (menu a tendina)
    const intervalId = setInterval(() => {
      // Evitiamo controlli se l'app è in background per risparmiare risorse
      if (AppState.currentState === 'active') {
        checkStatus(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(intervalId); // Pulizia del timer
    };
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
    if (watchRef.current) return; 

    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
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
              if (added > 0.005) { 
                setDistanceKm((d) => d + added);
                return [...prev, newCoord];
              }
              return prev;
            } 
            return [...prev, newCoord];
          });
        }
      );
    } catch (err) {
      console.log("Errore durante l'avvio di watchPositionAsync:", err);
      updatePermissionState(false);
    }
  };

  const stopWatching = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  };

  return { position, route, distanceKm, isPermissionGranted };
}