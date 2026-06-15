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
  // Ref per tracciare il permesso in modo sincrono e reattivo
  const isPermGrantedRef = useRef<boolean | null>(null); 
  
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  
  // 🌟 FLAG SMART PAUSE: Segnala se il percorso si è interrotto a causa dello spegnimento del GPS o della pausa
  const isRouteBroken = useRef<boolean>(false);

  // Funzione per aggiornare stato e ref simultaneamente
  const updatePermissionState = (granted: boolean) => {
    isPermGrantedRef.current = granted;
    setIsPermissionGranted(granted);
  };

  useEffect(() => {
    let isMounted = true;

    // Recupera la posizione in modo silenzioso per inizializzare o muovere la mappa
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
        // Errore ignorato volutamente in background
      }
    }

    // Controlla lo stato hardware del GPS e i permessi dell'applicazione
    async function checkStatus(shouldRequest = false) {
      try {
        // 1. Controllo hardware globale (es. scorciatoie/menu a tendina del telefono)
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (isMounted && isPermGrantedRef.current !== false) {
            updatePermissionState(false);
            stopWatching(); // Ferma il tracciatore nativo se il chip si spegne
            isRouteBroken.current = true; // 👈 Attiva il blocco: il GPS è caduto!
          }
          return;
        }

        // 2. Controllo permessi dell'applicazione
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
            isRouteBroken.current = true; // Il permesso è stato revocato/manca
          }
        }
      } catch (err) {
        if (isMounted && isPermGrantedRef.current !== false) {
          updatePermissionState(false);
          isRouteBroken.current = true;
        }
      }
    }

    // Avvio del controllo al montaggio della schermata
    checkStatus(true);

    // Gestisce il focus quando l'utente torna dalle impostazioni del telefono
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkStatus(false);
      }
    });

    // POLLING: Monitora ogni 2 secondi lo stato per intercettare i click immediati dal menu a tendina
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

  // 🌟 MODIFICATO: Avvia o stoppa la sessione di rilevamento in base alla corsa (attiva/pausa) e alla presenza del segnale
  useEffect(() => {
    if (isRunning && isPermissionGranted) {
      startWatching();
    } else {
      stopWatching();
      
      // Se l'utente ha messo in pausa manualmente la corsa
      if (!isRunning) {
        isRouteBroken.current = true;
      }
      
      // Se la corsa sta andando ma perdiamo la connessione GPS
      if (isRunning && !isPermissionGranted) {
        isRouteBroken.current = true;
      }
    }
    return () => stopWatching();
  }, [isRunning, isPermissionGranted]); // <--- Inserito isRunning tra le dipendenze reattive

  const startWatching = async () => {
    if (watchRef.current) return; 

    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, // Notifica ogni 5 metri di movimento rilevato
        },
        (loc) => {
          const newCoord: Coordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          setPosition(newCoord);

          setRoute((prev) => {
            if (prev.length > 0) {
              // 🌟 LOGICA SMART PAUSE ANTI-LINEA D'ARIA
              // Se il flag indica che veniamo da una pausa o da un blackout del GPS, inseriamo il punto
              // ma saltiamo l'Haversine. In questo modo NON calcola la retta fasulla.
              if (isRouteBroken.current) {
                isRouteBroken.current = false; // Resetta il flag perché siamo tornati online stabilmente
                return [...prev, newCoord]; // Aggiunge la coordinata alla mappa senza incrementare i KM
              }

              // Calcolo standard della distanza tra l'ultimo punto registrato e quello attuale
              const added = haversine(prev[prev.length - 1], newCoord);
              if (added > 0.005) { // Filtro di rumore (minimo 5 metri di effettivo spostamento)
                setDistanceKm((d) => d + added);
                return [...prev, newCoord];
              }
              return prev;
            } 
            
            // Primo punto in assoluto della corsa
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