import { StyleSheet, Text, View } from 'react-native';

export default function Distance() {
    

    return (
        <View style={styles.container}>
        <Text style={styles.value}>0.00</Text>
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
        fontVariant: ['tabular-nums'], // 👈 evita che i numeri "ballino"
        letterSpacing: 2,
        color: 'white',
    },

});