import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../styles/global';


// AGGIUNGERE DISTANZA
type RunItemProps = {
  duration: string;
  calories: string;
  pace: string;
}

// AGGIUNGERE DISTANZA
export default function RunItem({ 
    duration,
    calories,
    pace,
    }: RunItemProps){
  return (
    <TouchableOpacity style={styles.container}>
      <Image
          source={require('../../assets/images/run-history.png')}
          style={{
          width: 30,
          height: 30,
          tintColor: colors.text,
          }}
      />
      <View style={styles.info} >
        <Text style={styles.macros}>
          {calories} cal
        </Text>
        <Text style={styles.dateType}>
          Date
        </Text>
      </View>
      <View style={styles.info} >
        <Text style={styles.macros}>
          {duration} 
        </Text>
        <Text style={styles.dateType}>
          Distance
        </Text>
      </View>
      <Ionicons name='chevron-forward-outline' size={30} color='white'/>
    </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '95%',  
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  macros: {
    fontSize: 20,
    color: colors.text,
    marginTop: 4,
  },
  info: {
    flexDirection:'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateType: {
    fontSize: 15, 
    color: 'white', 
    opacity: 0.50 
  },
});