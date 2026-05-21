import { StyleSheet, Text, View } from 'react-native';

export default function Calories() {
    

    return (
        <View style={styles.container}>
        <Text style={styles.value}>000</Text>
        <Text style={styles.calories}>Calories (kcal)</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flexDirection:'column', alignItems: 'center'},
    calories: {fontSize: 15, color: 'white', opacity: 0.70 },
    value: {
        fontSize: 32,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'], // 👈 evita che i numeri "ballino"
        letterSpacing: 2,
        color: 'white',
    },

});