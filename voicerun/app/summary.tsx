// app/summary.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from './styles/global';

export default function SummaryScreen() {
  const router = useRouter();
  const { distanceKm, durationSecs, calories } = useLocalSearchParams();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Riepilogo corsa</Text>

      <Text>Distanza: {distanceKm} km</Text>
      <Text>Tempo: {durationSecs} sec</Text>
      <Text>Calorie: {calories} kcal</Text>

      {/* Torna alla home */}
      <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
        <Text>Torna alla home</Text>
      </TouchableOpacity>
    </View>
  );
}