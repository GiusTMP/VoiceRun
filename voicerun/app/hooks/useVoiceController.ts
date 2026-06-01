import { useFocusEffect } from 'expo-router'; // <-- NUOVO IMPORT
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react'; // <-- AGGIUNTO useCallback
import { formatTimer } from '../utils/formatTimer';

interface VoiceControllerProps {
  isRunning: boolean;
  isPaused: boolean;
  setIsRunning: (val: boolean) => void;
  setIsPaused: (val: boolean) => void;
  confirmStop: () => void;
  distanceKm: number;
  calories: number;
  finalPace: string;
  totalSeconds: number;
}

export function useVoiceController({
  isRunning,
  isPaused,
  setIsRunning,
  setIsPaused,
  confirmStop,
  distanceKm,
  calories,
  finalPace,
  totalSeconds,
}: VoiceControllerProps) {
  const [isAwakeState, setIsAwakeState] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldListenRef = useRef(false); // Di base spento finché non è a focus
  const lastProcessedTextRef = useRef('');
  
  // LUCCHETTI
  const isStartingRef = useRef(false); 
  const isSpeakingRef = useRef(false); 
  const isListeningRef = useRef(false); 
  const isConfirmingStopRef = useRef(false);

  const isAwakeRef = useRef(false);
  const isRunningRef = useRef(isRunning);
  const isPausedRef = useRef(isPaused);
  const distanceKmRef = useRef(distanceKm);
  const caloriesRef = useRef(calories);
  const finalPaceRef = useRef(finalPace);
  const totalSecondsRef = useRef(totalSeconds);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { distanceKmRef.current = distanceKm; }, [distanceKm]);
  useEffect(() => { caloriesRef.current = calories; }, [calories]);
  useEffect(() => { finalPaceRef.current = finalPace; }, [finalPace]);
  useEffect(() => { totalSecondsRef.current = totalSeconds; }, [totalSeconds]);

  const setIsAwake = (val: boolean) => {
    setIsAwakeState(val);
    isAwakeRef.current = val;
    if (!val) isConfirmingStopRef.current = false; 
  };

  const resetAwakeTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsAwake(false);
      lastProcessedTextRef.current = '';
    }, 15000);
  };

  const speakSafe = (text: string) => {
    if (isSpeakingRef.current) return;
    isSpeakingRef.current = true;
    
    // Non forzare shouldListenRef a false qui, altrimenti rompiamo il focus.
    // Lo fermiamo solo a livello di sensore nativo.
    ExpoSpeechRecognitionModule.stop();

    setTimeout(() => {
      Speech.speak(text, {
        language: 'en-US',
        onDone: () => {
          isSpeakingRef.current = false;
          setTimeout(() => startListening(), 800);
        },
        onStopped: () => {
          isSpeakingRef.current = false;
          setTimeout(() => startListening(), 800);
        },
        onError: () => {
          isSpeakingRef.current = false;
          setTimeout(() => startListening(), 800);
        }
      });
    }, 300); 
  };

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    isListeningRef.current = true;
    isStartingRef.current = false;
  });
  
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    isListeningRef.current = false;
    
    if (shouldListenRef.current && !isSpeakingRef.current && !isStartingRef.current) {
      setTimeout(() => startListening(), 1000);
    }
  });
  
  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    isListeningRef.current = false;
    isStartingRef.current = false;

    const ignoredErrors = ['other', 'no-speech', 'aborted'];
    const delay = ignoredErrors.includes(event.error) ? 1500 : 3000;
    
    if (shouldListenRef.current && !isSpeakingRef.current) {
      setTimeout(() => startListening(), delay); 
    }
  });
  
  useSpeechRecognitionEvent('result', (event) => {
    // 🛡️ SCUDO ANTI-FANTASMA: Se la schermata non è a fuoco, ignora TUTTO!
    if (!shouldListenRef.current) return;
    
    if (isSpeakingRef.current) return;

    const results = event.results;
    const latestResult = results[results.length - 1];
    const text = latestResult?.transcript?.toLowerCase().trim() || '';
    
    setTranscript(text);

    if (!text || text === lastProcessedTextRef.current) return;

    if (!isAwakeRef.current) {
      if (text.includes('hey run') || text.includes('wake up')) {
        lastProcessedTextRef.current = text;
        setIsAwake(true);
        speakSafe("I'm listening");
        resetAwakeTimeout();
      }
      return;
    }

    if (isAwakeRef.current) {
      resetAwakeTimeout();

      if (isConfirmingStopRef.current) {
        if (text.includes('yes') || text.includes('yeah') || text.includes('sure') || text.includes('confirm')) {
          lastProcessedTextRef.current = text;
          isConfirmingStopRef.current = false;
          speakSafe('Activity terminated');
          setIsAwake(false);
          confirmStop(); 
        } 
        else if (text.includes('no') || text.includes('cancel') || text.includes('resume')) {
          lastProcessedTextRef.current = text;
          isConfirmingStopRef.current = false;
          speakSafe('Tracking continued');
        }
        return; 
      }

      if (text.includes('start') || text.includes('begin')) {
        lastProcessedTextRef.current = text;
        if (!isRunningRef.current) {
          setIsRunning(true);
          speakSafe('Run started');
        }
        setIsAwake(false);
      }
      else if (text.includes('pause') || text.includes('suspend')) {
        lastProcessedTextRef.current = text;
        if (isRunningRef.current && !isPausedRef.current) {
          setIsPaused(true);
          speakSafe('Run paused');
        }
        setIsAwake(false);
      }
      else if (text.includes('resume') || text.includes('continue')) {
        lastProcessedTextRef.current = text;
        if (isRunningRef.current && isPausedRef.current) {
          setIsPaused(false);
          speakSafe('Run resumed');
        }
        setIsAwake(false);
      }
      else if (text.includes('stop') || text.includes('finish') || text.includes('end run')) {
        lastProcessedTextRef.current = text;
        if (isRunningRef.current) {
          isConfirmingStopRef.current = true; 
          speakSafe('Are you sure you want to finish? Say yes to confirm, or no to cancel.');
          resetAwakeTimeout(); 
        }
      }
      else if (text.includes('time') || text.includes('duration')) {
        lastProcessedTextRef.current = text;
        const { h, m, s } = formatTimer(totalSecondsRef.current);
        const speechTime = parseInt(h) > 0 
          ? `${parseInt(h)} hours, ${parseInt(m)} minutes and ${parseInt(s)} seconds`
          : `${parseInt(m)} minutes and ${parseInt(s)} seconds`;
        speakSafe(`Time elapsed: ${speechTime}`);
        setIsAwake(false);
      }
      else if (text.includes('distance') || text.includes('kilometers')) {
        lastProcessedTextRef.current = text;
        speakSafe(`You have run ${distanceKmRef.current.toFixed(2)} kilometers`);
        setIsAwake(false);
      }
      else if (text.includes('calories') || text.includes('burned')) {
        lastProcessedTextRef.current = text;
        speakSafe(`You have burned ${caloriesRef.current.toFixed(0)} calories`);
        setIsAwake(false);
      }
      else if (text.includes('pace') || text.includes('rhythm')) {
        lastProcessedTextRef.current = text;
        const paceParts = finalPaceRef.current.split(':');
        const paceSpeech = paceParts.length === 2 
          ? `${parseInt(paceParts[0])} minutes and ${parseInt(paceParts[1])} seconds per kilometer`
          : 'Pace not available';
        speakSafe(`Your current pace is ${paceSpeech}`);
        setIsAwake(false);
      }
    }
  });

  const startListening = async () => {
    if (!shouldListenRef.current || isStartingRef.current || isSpeakingRef.current || isListeningRef.current) return;
    
    isStartingRef.current = true; 

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (granted && shouldListenRef.current && !isSpeakingRef.current) {
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          continuous: true,
          interimResults: true,
          androidIntentOptions: {
            EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 10000,
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 5000,
            EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
          },
        });
      } else {
        isStartingRef.current = false;
      }
    } catch (e) {
      console.log("Error starting speech recognition", e);
      isStartingRef.current = false;
    }
  };

  // 🛡️ GESTIONE DEL FOCUS: Avvia/Arresta in base alla schermata visibile
  useFocusEffect(
    useCallback(() => {
      // Quando la schermata DIVENTA VISIBILE
      shouldListenRef.current = true;
      isStartingRef.current = false;
      isConfirmingStopRef.current = false; // Reset dello stato di stop
      lastProcessedTextRef.current = '';
      setIsAwakeState(false);
      isAwakeRef.current = false;

      startListening();

      // Quando la schermata VIENE NASCOSTA (es. vai su summary)
      return () => {
        shouldListenRef.current = false;
        ExpoSpeechRecognitionModule.stop();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [])
  );

  return {
    isListening,
    isAwake: isAwakeState,
    transcript,
    speakSafe, 
    startListening, 
    stopListening: () => {
      shouldListenRef.current = false;
      ExpoSpeechRecognitionModule.stop();
    }
  };
}