import { StyleSheet, Text, View } from 'react-native';

interface Props {
  distanceKm: number;
}


export default function Distance({ distanceKm }: Props) {
    

    return (
        <View style={styles.container}>
        <Text style={styles.value}>{distanceKm.toFixed(2)}</Text>
        <Text style={styles.distance}>Distance (km)</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flexDirection:'column', alignItems: 'center'},
    distance: {fontSize: 15, color: 'white', opacity: 0.70 },
    value: {
        fontSize: 32,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'], 
        letterSpacing: 2,
        color: 'white',
    },

});