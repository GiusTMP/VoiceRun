import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatTimer } from '../utils/formatTimer';

interface StopwatchProps {
  onStop?: (totalSeconds: number) => void;
  isRunning: boolean;
  resetKey: number;
  onTick?: (secs: number) => void; 
}

export default function Stopwatch({ isRunning, resetKey, onTick }: StopwatchProps) {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds(prev => prev + 1); // 👈 solo aggiorna lo stato
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // 👇 useEffect separato che chiama onTick quando totalSeconds cambia
  useEffect(() => {
    onTick?.(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    setTotalSeconds(0);
  }, [resetKey]);

  const { h, m, s } = formatTimer(totalSeconds);

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <TimeUnit value={h}/>
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={m}/>
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={s}/>
      </View>
      <Text style={styles.duration}>Duration</Text>
    </View>
  );
}

function TimeUnit({ value }: { value: string }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.time}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection:'column', alignItems: 'center', paddingBottom: 25},
  display: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unit: { alignItems: 'center' },
  time: {
    fontSize: 64,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    color: 'white',
  },
  label: { fontSize: 20, fontWeight: '600', opacity: 0.5, letterSpacing: 1 },
  separator: { fontSize: 64, fontWeight: 'bold', marginBottom: 2, color: 'white' },
  duration: { fontSize: 15, color: 'white', opacity: 0.70 }
});