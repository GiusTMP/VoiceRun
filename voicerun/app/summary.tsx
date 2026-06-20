// app/summary.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, globalStyles } from './styles/global';
import { formatTimer } from './utils/formatTimer';

export default function SummaryScreen() {
  const router = useRouter();
  const { distanceKm, durationSecs, calories, pace } = useLocalSearchParams();
  const {h, m, s} = formatTimer(parseInt(durationSecs as string))
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo-app.png')} style={styles.logo} />
      <Text style={globalStyles.title}>Summary</Text>
      <View style={{ height: 1, backgroundColor: 'white', marginVertical: 10, width: '70%', marginTop: 30 }} />
      <View style={styles.containerInfo}>
        <View style={styles.display}>
          <TimeUnit value={h}/>
          <Text style={styles.separator}>:</Text>
          <TimeUnit value={m}/>
          <Text style={styles.separator}>:</Text>
          <TimeUnit value={s}/>
        </View>
        <Text style={styles.infoTitle}>Duration</Text>
        <Text style={styles.info}>{distanceKm} km</Text>
        <Text style={styles.infoTitle}>Distance</Text>
        <Text style={styles.info}>{pace} min/km</Text>
        <Text style={styles.infoTitle}>Pace</Text>
        <Text style={styles.info}>{calories} Kcal</Text>
        <Text style={styles.infoTitle}>Calories</Text>
      </View>
      <View style={{ height: 1, backgroundColor: 'white', marginVertical: 10, width: '70%', marginBottom: 50 }} />

      <TouchableOpacity style={styles.button} onPress={() => router.replace('/history')}>
        <Text style={{color:'white', fontWeight: 'bold'}}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function TimeUnit({ value }: { value: string }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.info}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: 100, 
  },
  logo: {
    marginBottom: 20
  },
  unit: { alignItems: 'center' },
  display: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  separator: { fontSize: 30, fontWeight: 'bold', marginBottom: 2, color: 'white' },
  containerInfo:{
    marginTop: 20,
    flexDirection: 'column',
    alignItems: 'center'
  },
  info:{
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  infoTitle:{
     color: 'white', 
     opacity: 0.70,
     fontSize: 15,
     marginBottom: 30,
  },
  button:{
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#4fc3f7',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 30,
  },
  },
)