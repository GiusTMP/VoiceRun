import { StyleSheet, Text, View } from 'react-native';

interface Props {
  pace: string;
}

export default function Pace({pace}: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.value}>{pace}</Text>
            <Text style={styles.pace}>Pace (min/km)</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flexDirection:'column', alignItems: 'center'},
    pace: {fontSize: 15, color: 'white', opacity: 0.70 },
    value: {
        fontSize: 32,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'], // 👈 evita che i numeri "ballino"
        letterSpacing: 2,
        color: 'white',
    },

});