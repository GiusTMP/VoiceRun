import { Text, View } from 'react-native';

export default function Pace() {
    

    return (
        <View style={styles.container}>
            <Text style={styles.value}>00:00</Text>
            <Text style={styles.pace}>Pace (min/km)</Text>
        </View>
    );
}