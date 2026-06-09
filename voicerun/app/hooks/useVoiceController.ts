import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Vibration } from 'react-native';
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
  isPermissionGranted: boolean | null;
}

const INTENTS = {
  START: /start|begin|let's go|go for a run/i,
  PAUSE: /pause|hold on|take a break|suspend/i,
  RESUME: /resume|continue|go on|keep going/i,
  STOP: /stop|finish|end run|call it a day|terminate/i,
  DISTANCE: /distance|how far|kilometers|km|meters/i,
  TIME: /time|duration|how long|timer|clock/i,
  CALORIES: /calories|burned|fat|kcal|energy/i,
  PACE: /pace|rhythm|speed|how fast/i,
};

const CONFIRM_YES = /yes|yeah|sure|confirm|do it|ok/i;
const CONFIRM_NO = /no|cancel|dont|don't|keep running/i;

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
  isPermissionGranted,
}: VoiceControllerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0); 
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined); 
  
  const [isUserDisabled, setIsUserDisabled] = useState(false); 
  const isUserDisabledRef = useRef(false); // 👈 NUOVO REF: Risolve il bug dell'animazione verde che non partiva subito
  const isPermissionGrantedRef = useRef(isPermissionGranted);
  const shouldListenRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  
  const isStartingRef = useRef(false); 
  const isSpeakingRef = useRef(false); 
  const isListeningRef = useRef(false); 
  const isConfirmingStopRef = useRef(false);

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
  useEffect(() => { isPermissionGrantedRef.current = isPermissionGranted; }, [isPermissionGranted]);

  const getParsedIntent = (text: string): keyof typeof INTENTS | null => {
    for (const [intent, regex] of Object.entries(INTENTS)) {
      if (regex.test(text)) return intent as keyof typeof INTENTS;
    }
    return null;
  };

  const speakSafe = (text: string) => {
    if (isSpeakingRef.current) return;
    isSpeakingRef.current = true;
    setVolume(0); 
    
    ExpoSpeechRecognitionModule.stop();

    setTimeout(() => {
      Speech.speak(text, {
        language: 'en-US',
        onDone: () => resumeListeningAfterSpeech(),
        onStopped: () => resumeListeningAfterSpeech(),
        onError: () => resumeListeningAfterSpeech()
      });
    }, 50);
  };

  const resumeListeningAfterSpeech = () => {
    isSpeakingRef.current = false;
    setTimeout(() => startListening(), 150); 
  };

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    isListeningRef.current = true;
    isStartingRef.current = false;
  });
  
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    isListeningRef.current = false;
    setVolume(0); 
    if (shouldListenRef.current && !isSpeakingRef.current && !isStartingRef.current) {
      setTimeout(() => startListening(), 150); 
    }
  });
  
  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    isListeningRef.current = false;
    isStartingRef.current = false;
    setVolume(0); 

    const ignoredErrors = ['other', 'no-speech', 'aborted'];
    const delay = ignoredErrors.includes(event.error) ? 300 : 1500;
    
    if (shouldListenRef.current && !isSpeakingRef.current) {
      setTimeout(() => startListening(), delay); 
    }
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    if (isSpeakingRef.current) {
      setVolume(0);
      return;
    }
    const rawValue = event.value || 0;
    setVolume(rawValue * 2);
  });
  
  useSpeechRecognitionEvent('result', (event) => {
    if (!shouldListenRef.current || isSpeakingRef.current) return;

    let text = event.results[event.results.length - 1]?.transcript?.toLowerCase().trim() || '';
    setTranscript(text);

    if (!text || text === lastProcessedTextRef.current) return;

    if (isConfirmingStopRef.current) {
      if (CONFIRM_YES.test(text)) {
        lastProcessedTextRef.current = text;
        isConfirmingStopRef.current = false;
        Vibration.vibrate(1000);
        speakSafe('Activity terminated');
        confirmStop(); 
      } else if (CONFIRM_NO.test(text)) {
        lastProcessedTextRef.current = text;
        isConfirmingStopRef.current = false;
        speakSafe('Tracking continued');
      }
      return; 
    }

    if (text.startsWith('voice run')) {
      text = text.replace('voice run', 'voicerun');
    }

    if (!text.startsWith('voicerun')) {
      return; 
    }

    const commandText = text.replace('voicerun', '').trim();
    const intent = getParsedIntent(commandText);
    if (!intent) return; 

    lastProcessedTextRef.current = text;

    switch (intent) {
      case 'START':
        if (isPermissionGrantedRef.current !== true) {
          Vibration.vibrate([0, 200, 100, 200]);
          speakSafe('Location permission is required to start the run.');
          break;
        }

        if (!isRunningRef.current) {
          setIsRunning(true);
          Vibration.vibrate(1000);
          speakSafe('Run started');
        } else {
          speakSafe('The run is already active');
        }
        break;

      case 'PAUSE':
        if (isRunningRef.current && !isPausedRef.current) {
          setIsPaused(true);
          Vibration.vibrate(100);
          speakSafe('Run paused');
        } else {
          speakSafe('The tracking cannot be paused right now');
        }
        break;

      case 'RESUME':
        if (isRunningRef.current && isPausedRef.current) {
          setIsPaused(false);
          Vibration.vibrate(100);
          speakSafe('Run resumed');
        } else {
          speakSafe('The tracking is already active');
        }
        break;

      case 'STOP':
        if (isRunningRef.current) {
          isConfirmingStopRef.current = true; 
          speakSafe('Are you sure you want to finish? Say yes to confirm, or no to cancel.');
        } else {
          speakSafe('No active activity to stop');
        }
        break;

      case 'TIME':
        const { h, m, s } = formatTimer(totalSecondsRef.current);
        const speechTime = parseInt(h) > 0 
          ? `${parseInt(h)} hours, ${parseInt(m)} minutes and ${parseInt(s)} seconds`
          : `${parseInt(m)} minutes and ${parseInt(s)} seconds`;
        speakSafe(`Time elapsed: ${speechTime}`);
        break;

      case 'DISTANCE':
        speakSafe(`You have run ${distanceKmRef.current.toFixed(2)} kilometers`);
        break;

      case 'CALORIES':
        speakSafe(`You have burn ${caloriesRef.current.toFixed(0)} calories`);
        break;

      case 'PACE':
        const paceParts = finalPaceRef.current.split(':');
        const paceSpeech = paceParts.length === 2 
          ? `${parseInt(paceParts[0])} minutes and ${parseInt(paceParts[1])} seconds per kilometer`
          : 'Pace not available';
        speakSafe(`Your current pace is ${paceSpeech}`);
        break;
    }
  });

  const startListening = async (isManual = false) => {
    if (isManual) {
      shouldListenRef.current = true;
      setIsUserDisabled(false); 
      isUserDisabledRef.current = false; // 👈 Sblocca immediatamente il riferimento sincrono
    }

    // 👈 MODIFICATO: Controlla il ref invece dello stato per evitare il lag di React
    if (!shouldListenRef.current || isUserDisabledRef.current || isSpeakingRef.current) return;

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setHasPermission(granted); 

      if (!granted) {
        isStartingRef.current = false;
        
        if (isManual) {
          Alert.alert(
            'Microphone Permission',
            'Voice commands require microphone access. Please enable it in your system settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() }, 
            ]
          );
        }
        return;
      }

      if (isStartingRef.current || isListeningRef.current) {
        isStartingRef.current = false;
        return;
      }

      isStartingRef.current = true; 

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        continuous: true,
        interimResults: true,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 10000,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 4000,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
        },
      });
    } catch (e) {
      console.log("Error starting speech recognition", e);
      setHasPermission(false); 
      isStartingRef.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      shouldListenRef.current = true;
      isStartingRef.current = false;
      isConfirmingStopRef.current = false;
      lastProcessedTextRef.current = '';

      startListening(false); 

      return () => {
        shouldListenRef.current = false;
        ExpoSpeechRecognitionModule.stop();
      };
    }, [])
  );

  return {
    isListening,
    isAwake: isConfirmingStopRef.current, 
    volume, 
    transcript,
    hasPermission: hasPermission === false ? false : !isUserDisabled, 
    speakSafe, 
    startListening: () => startListening(true), 
    stopListening: () => {
      shouldListenRef.current = false;
      setIsUserDisabled(true); 
      isUserDisabledRef.current = true; // 👈 Blocca immediatamente il riferimento sincrono
      ExpoSpeechRecognitionModule.stop();
    }
  };
}