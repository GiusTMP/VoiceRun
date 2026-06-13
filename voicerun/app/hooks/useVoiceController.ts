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

type AppIntent = 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'DISTANCE' | 'TIME' | 'CALORIES' | 'PACE' | 'UNKNOWN';

// Espressioni regolari locali per il controllo e la pulizia sul dispositivo
const WAKE_WORD_CHECK_REGEX = /(voicerun|voice\s*run|voice\s*runner|boys?\s*run|voice\s*ram)/i;
const WAKE_WORD_REPLACE_REGEX = /(voicerun|voice\s*run|voice\s*runner|boys?\s*run|voice\s*ram)/gi;
const CONFIRM_YES = /yes|yeah|sure|confirm|do it|ok/i;
const CONFIRM_NO = /no|cancel|dont|don't|keep running/i;

// --- FUNZIONE GROQ AI ULTRA-OTTIMIZZATA (MINIMO CONSUMO TOKEN) ---
async function analyzeIntentWithAI(cleanedCommand: string): Promise<AppIntent> {
  // ⚠️ INSERISCI QUI LA TUA API KEY DI GROQ (console.groq.com)
  const API_KEY = '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'; 
  const MODEL = 'llama-3.1-8b-instant'; 
  
  try {
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 15, // Blocco output per risparmiare token
        response_format: { type: "json_object" }, 
        messages: [
          {
            role: "system",
            // Prompt ridotto all'60% per risparmiare sui token di sistema a ogni chiamata
            content: `In JSON return ONLY {"intent": "VAL"}.
              Allowed VAL: START, PAUSE, RESUME, STOP, DISTANCE, TIME, CALORIES, PACE, UNKNOWN.
              Acoustic fixes:
              - "base","bass","space","face","paste" -> PACE
              - "distant","stance" -> DISTANCE
              - "tie" -> TIME
              Examples: "how far"->DISTANCE, "how long"->TIME, "burned"->CALORIES.`
          },
          {
            role: "user",
            content: cleanedCommand // Mandiamo solo il comando puro, senza wake word
          }
        ]
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("🔴 Errore nativo dall'API Groq:", data.error.message);
      return 'UNKNOWN';
    }

    const jsonText = data.choices[0].message.content;
    const parsed = JSON.parse(jsonText);
    const intentValue = parsed.intent ? String(parsed.intent).trim().toUpperCase() : 'UNKNOWN';
    
    console.log(`🤖 [Groq AI] Risposta: -> Intento elaborato: "${intentValue}"`);
    return (intentValue as AppIntent) || 'UNKNOWN';
  } catch (error) {
    console.error("Errore generico Groq AI:", error);
    return 'UNKNOWN';
  }
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
  isPermissionGranted,
}: VoiceControllerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0); 
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined); 
  
  const [isUserDisabled, setIsUserDisabled] = useState(false); 
  const isUserDisabledRef = useRef(false); 
  const isPermissionGrantedRef = useRef(isPermissionGranted);
  const shouldListenRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  
  const isStartingRef = useRef(false); 
  const isSpeakingRef = useRef(false); 
  const isListeningRef = useRef(false); 
  const isConfirmingStopRef = useRef(false);
  const isAnalyzingRef = useRef(false);

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (shouldListenRef.current && !isSpeakingRef.current && !isStartingRef.current && !isAnalyzingRef.current) {
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
    if (shouldListenRef.current && !isSpeakingRef.current && !isAnalyzingRef.current) {
      setTimeout(() => startListening(), delay); 
    }
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    if (isSpeakingRef.current || isAnalyzingRef.current) {
      setVolume(0);
      return;
    }
    const rawValue = event.value || 0;
    setVolume(rawValue * 2);
  });
  
  useSpeechRecognitionEvent('result', (event) => {
    if (!shouldListenRef.current || isSpeakingRef.current || isAnalyzingRef.current) return;

    // Risoluzione bug frasi duplicate: prendiamo solo il primo risultato (quello definitivo)
    const text = event.results[0]?.transcript?.toLowerCase().trim() || '';
    setTranscript(text);

    if (!text || text === lastProcessedTextRef.current) return;

    // Controllo locale della wake word tramite Regex senza spreco di token
    const hasWakeWord = WAKE_WORD_CHECK_REGEX.test(text);

    if (!hasWakeWord && !isConfirmingStopRef.current) {
      return; 
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!shouldListenRef.current || isSpeakingRef.current || isAnalyzingRef.current) return;

      // Gestione della conferma di stop (Senza passare dall'AI)
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

      // Rimuoviamo localmente la wake word dal testo prima dell'invio all'AI
      const commandText = text.replace(WAKE_WORD_REPLACE_REGEX, '').trim();
      
      // Se l'utente ha detto solo la wake word senza comandi, ci fermiamo qui risparmiando la chiamata API
      if (commandText.length < 2) return; 

      isAnalyzingRef.current = true;
      lastProcessedTextRef.current = text;
      ExpoSpeechRecognitionModule.stop();

      try {
        console.log(`✉️ Inviando a Groq solo il comando pulito: "${commandText}"`);
        const intent = await analyzeIntentWithAI(commandText);

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
            
          case 'UNKNOWN':
          default:
            speakSafe("I didn't quite catch that. Try again.");
            break;
        }
      } catch (error) {
        console.error("Errore nello smistamento dell'intento:", error);
        speakSafe("Sorry, I had trouble understanding. Try again.");
      } finally {
        isAnalyzingRef.current = false;
        if (shouldListenRef.current && !isSpeakingRef.current) {
          startListening(false);
        }
      }
    }, 1200); 
  });

  const startListening = async (isManual = false) => {
    if (isManual) {
      shouldListenRef.current = true;
      setIsUserDisabled(false); 
      isUserDisabledRef.current = false; 
    }

    if (!shouldListenRef.current || isUserDisabledRef.current || isSpeakingRef.current || isAnalyzingRef.current) return;

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
      isAnalyzingRef.current = false;
      lastProcessedTextRef.current = '';

      startListening(false); 

      return () => {
        shouldListenRef.current = false;
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        ExpoSpeechRecognitionModule.stop();
      };
    }, [])
  );

  return {
    isListening,
    isAwake: isConfirmingStopRef.current || isAnalyzingRef.current, 
    volume, 
    transcript,
    hasPermission: hasPermission === false ? false : !isUserDisabled, 
    speakSafe, 
    startListening: () => startListening(true), 
    stopListening: () => {
      shouldListenRef.current = false;
      setIsUserDisabled(true); 
      isUserDisabledRef.current = true; 
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      ExpoSpeechRecognitionModule.stop();
    }
  };
}