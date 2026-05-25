// app/summary.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { addRun } from './storage/activities';
import { globalStyles } from './styles/global';

export default function SummaryScreen() {
  const router = useRouter();
  const { distanceKm, durationSecs, calories } = useLocalSearchParams();
  
  const handleAddRun = async () => {
     await addRun({
    duration: '29 km',
    calories: '200',
    pace: '0.00',
    });
  }
 
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Riepilogo corsa</Text>

      <Text>Distanza: {distanceKm} km</Text>
      <Text>Tempo: {durationSecs} sec</Text>
      <Text>Calorie: {calories} kcal</Text>

      {/* Torna alla home */}
      <TouchableOpacity onPress={() => {handleAddRun(); router.replace('/history')}}>
        <Text>Torna alla home</Text>
      </TouchableOpacity>
    </View>
  );
}