import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const INITIAL_ZOOM = { latitudeDelta: 0.002, longitudeDelta: 0.002 };

export function useUserLocation() {
  const [region, setRegion] = useState<Region | null>(null); /*useState remembers the value at every render*/

  useEffect(() => { /* useEffect is called only the first time */
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      await Location.watchPositionAsync({ /* every time location changes region gets updated */
        accuracy: Location.Accuracy.High
      }, (location) => {setRegion({ ...location.coords, ...INITIAL_ZOOM });});
    })();
  }, []);

  return region;
}