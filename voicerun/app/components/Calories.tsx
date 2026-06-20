import { StyleSheet, Text, View } from 'react-native';

interface Props {
  calories: number;
}

export default function Calories({ calories }: Props) {
    

    return (
        <View style={styles.container}>
        <Text style={styles.value}>{calories.toFixed(0)}</Text>
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
        fontVariant: ['tabular-nums'], 
        letterSpacing: 2,
        color: 'white',
    },

});