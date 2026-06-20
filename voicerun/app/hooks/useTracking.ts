// hooks/useTracking.ts
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Haversine distance
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

  const isPermGrantedRef = useRef<boolean | null>(null); 
  
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  
  const isRouteBroken = useRef<boolean>(false);

  const updatePermissionState = (granted: boolean) => {
    isPermGrantedRef.current = granted;
    setIsPermissionGranted(granted);
  };

  useEffect(() => {
    let isMounted = true;

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
        // ignore it in the background
      }
    }

    async function checkStatus(shouldRequest = false) {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (isMounted && isPermGrantedRef.current !== false) {
            updatePermissionState(false);
            stopWatching(); 
            isRouteBroken.current = true; 
          }
          return;
        }

        // permits
        const currentPerm = await Location.getForegroundPermissionsAsync();
        
        if (currentPerm.status === 'granted') {
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
            isRouteBroken.current = true;
          }
        }
      } catch (err) {
        if (isMounted && isPermGrantedRef.current !== false) {
          updatePermissionState(false);
          isRouteBroken.current = true;
        }
      }
    }

    checkStatus(true);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkStatus(false);
      }
    });

    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkStatus(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  // tracking based on current status
  useEffect(() => {
    if (isRunning && isPermissionGranted) {
      startWatching();
    } else {
      stopWatching();
      
      if (!isRunning) {
        isRouteBroken.current = true;
      }
      
      if (isRunning && !isPermissionGranted) {
        isRouteBroken.current = true;
      }
    }
    return () => stopWatching();
  }, [isRunning, isPermissionGranted]);

  const startWatching = async () => {
    if (watchRef.current) return; 

    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, //Chosen meters for updates
        },
        (loc) => {
          const newCoord: Coordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          setPosition(newCoord);

          setRoute((prev) => {
            if (prev.length > 0) {
              // Distance with GPS lost
              if (isRouteBroken.current) {
                isRouteBroken.current = false; 
                return [...prev, newCoord]; 
              }

              const added = haversine(prev[prev.length - 1], newCoord);
              if (added > 0.005) { 
                setDistanceKm((d) => d + added);
                return [...prev, newCoord];
              }
              return prev;
            } 
            
            // first step of run
            return [...prev, newCoord];
          });
        }
      );
    } catch (err) {
      console.log("Errore nell'avvio di watchPositionAsync:", err);
      updatePermissionState(false);
      isRouteBroken.current = true;
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