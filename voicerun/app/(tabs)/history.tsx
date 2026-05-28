import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RunItem from '../components/RunItem';
import { clearAllRuns, getRun, Run } from '../storage/activities';
import { colors, globalStyles } from '../styles/global';


export default function AllRunsScreen() {
  const [runs, setRuns] = useState<Run[]>([]);
  const { refresh } = useLocalSearchParams();
  const router = useRouter();



  const loadRuns = async () => {
    const data = await getRun();
    setRuns(data);
  };
  const clearAllAndLoad = async () => {
    await clearAllRuns();
    loadRuns();
  };
  const handleClearAll = async () => {
    Alert.alert(
        'Clear All',
        'Are you sure you want to delete all the activities?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => {
              clearAllAndLoad();
            }
          }
        ]
    
    )
  };
  
  useEffect(
    useCallback(() => {
      loadRuns();
    }, [refresh]));

  useFocusEffect(
    useCallback(() => {
      loadRuns();
    }, []));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} >
      <Image source={require('../../assets/images/logo-app.png')} style={globalStyles.logo} />
      <View style={globalStyles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      <TouchableOpacity style={styles.clearContainer} onPress={() => handleClearAll()}>
          <Text style={styles.clearButton}>
            Clear all
          </Text>
      </TouchableOpacity>
      <View style={{ marginTop: 30 }}>
        {runs.length === 0 ? (
          <Text style={globalStyles.empty}>No runs logged yet.</Text>
        ) : (
          runs.map((run) => (
            <RunItem
              key={run.id}
              distance={run.distance}
              duration={run.duration}
              calories={run.calories}
              pace={run.pace}
              date={run.createdAt}
              onPress={() => router.push({
              pathname: '/summary',
              params: {
                distanceKm: run.distance,
                durationSecs: run.duration,
                calories: run.calories,
                pace: run.pace,
              },
            })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    paddingTop: 30,
  },
  clearContainer: {
    flexDirection:'column', 
    alignItems: 'center',
    alignSelf: 'flex-end', 
    marginRight:20,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  clearButton: {
    color: 'red',
    fontSize: 16,
  },
})
