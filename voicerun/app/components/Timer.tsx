// components/Stopwatch.tsx
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StopwatchProps {
  onStop?: (totalSeconds: number) => void;
}

export default function Stopwatch({ onStop }: StopwatchProps) {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    if (isRunning) onStop?.(totalSeconds);
    setIsRunning(prev => !prev);
  };

  const reset = () => {
    clearInterval(intervalRef.current!);
    setIsRunning(false);
    setTotalSeconds(0);
  };

  const format = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return { h, m, s };
  };

  const { h, m, s } = format(totalSeconds);

  return (
    <View style={styles.container}>

      {/* Display */}
      <View style={styles.display}>
        <TimeUnit value={h}/>
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={m}/>
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={s}/>
      </View>
      <Text style={styles.duration}>Duration</Text>

      {/* Bottoni */}
{/*       <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, isRunning ? styles.btnStop : styles.btnStart]}
          onPress={handleStartStop}
        >
          <Text style={styles.btnText}>{isRunning ? 'Stop' : 'Avvia'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnReset]}
          onPress={reset}
          disabled={isRunning}
        >
          <Text style={[styles.btnText, isRunning && styles.btnDisabled]}>
            Reset
          </Text>
        </TouchableOpacity>
      </View> */}

    </View>
  );
}

// Sotto-componente per ogni unità di tempo
function TimeUnit({ value, }: { value: string;}) {
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
    fontVariant: ['tabular-nums'], // 👈 evita che i numeri "ballino"
    letterSpacing: 2,
    color: 'white',
  },
  label: { fontSize: 20, fontWeight: '600', opacity: 0.5, letterSpacing: 1 },
  separator: { fontSize: 64, fontWeight: 'bold', marginBottom: 2, color: 'white'  },
  duration: {fontSize: 15, color: 'white', opacity: 0.70 }
/*   buttons: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnStart: { backgroundColor: '#22c55e' },
  btnStop: { backgroundColor: '#f59e0b' },
  btnReset: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.4 }, */
});