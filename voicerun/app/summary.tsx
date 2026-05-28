// app/summary.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, globalStyles } from './styles/global';

export default function SummaryScreen() {
  const router = useRouter();
  const { distanceKm, durationSecs, calories, pace } = useLocalSearchParams();
 
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo-app.png')} style={styles.logo} />
      <Text style={globalStyles.title}>Summary</Text>
      <View style={{ height: 1, backgroundColor: 'white', marginVertical: 10, width: '70%', marginTop: 30 }} />
      <View style={styles.containerInfo}>
        <Text style={styles.info}>{durationSecs}</Text>
        <Text style={styles.infoTitle}>Duration</Text>
        <Text style={styles.info}>{distanceKm} km</Text>
        <Text style={styles.infoTitle}>Distance</Text>
        <Text style={styles.info}>{pace} /km</Text>
        <Text style={styles.infoTitle}>Pace</Text>
        <Text style={styles.info}>{calories} Kcal</Text>
        <Text style={styles.infoTitle}>Calories</Text>
      </View>
      {/* Torna alla home */}
      <View style={{ height: 1, backgroundColor: 'white', marginVertical: 10, width: '70%', marginBottom: 50 }} />

      <TouchableOpacity style={styles.button} onPress={() => {router.replace('/history')}}>
        <Text style={{color:'white', fontWeight: 'bold'}}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: 100, //150
  },
  logo: {
    marginBottom: 20
  },

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
    backgroundColor: '#565690',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 30,
  },
  },
)