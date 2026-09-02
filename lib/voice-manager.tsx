import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceContextType {
  voiceState: VoiceState;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  isSpeechAvailable: boolean;
  onTranscriptReady?: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

const SILENCE_TIMEOUT = 3000; // 3 seconds

// Lazy-load native modules only when needed
let Speech: any = null;
let ExpoSpeechRecognitionModule: any = null;

const initializeVoiceModules = async () => {
  if (Platform.OS === 'web') return;
  
  try {
    if (!Speech) {
      const speechModule = await import('expo-speech');
      Speech = speechModule.default || speechModule;
    }
    if (!ExpoSpeechRecognitionModule) {
      const recognitionModule = await import('expo-speech-recognition');
      ExpoSpeechRecognitionModule = recognitionModule.ExpoSpeechRecognitionModule;
    }
  } catch (error) {
    console.warn('Voice modules not available:', error);
  }
};

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(true);
  const [onTranscriptReady, setOnTranscriptReady] = useState<((text: string) => void) | undefined>();
  
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    const initSpeech = async () => {
      try {
        await initializeVoiceModules();
        
        if (Platform.OS !== 'web' && ExpoSpeechRecognitionModule) {
          const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
          setIsSpeechAvailable(available);
        }
      } catch (error) {
        console.error('Speech recognition not available:', error);
        setIsSpeechAvailable(false);
      }
    };

    initSpeech();
  }, []);

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isSpeechAvailable || Platform.OS === 'web') {
      console.warn('Speech recognition not available');
      return;
    }

    try {
      await initializeVoiceModules();
      
      if (!ExpoSpeechRecognitionModule) {
        console.warn('Speech recognition module not available');
        return;
      }
      
      setIsListening(true);
      setVoiceState('listening');
      setTranscript('');
      currentTranscriptRef.current = '';
      clearSilenceTimer();

      // Request permissions if needed
      try {
        await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      } catch (e) {
        console.warn('Permission request failed:', e);
      }

      // Set up event listeners before starting
      const resultHandler = (event: any) => {
        if (event.results && event.results.length > 0) {
          const result = event.results[event.results.length - 1];
          const recognizedText = result.transcript.toLowerCase().trim();
          
          currentTranscriptRef.current = recognizedText;
          setTranscript(recognizedText);

          // If this is a final result, set up auto-submit timer
          if (event.isFinal) {
            // Clear existing timer
            clearSilenceTimer();

            // Set new timer for auto-submit
            silenceTimerRef.current = setTimeout(async () => {
              await stopListening();
            }, SILENCE_TIMEOUT);
          }
        }
      };

      const errorHandler = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState('idle');
        setIsListening(false);
      };

      const endHandler = () => {
        setIsListening(false);
        setVoiceState('idle');
        if (currentTranscriptRef.current && onTranscriptReady) {
          onTranscriptReady(currentTranscriptRef.current);
        }
      };

      // Subscribe to events if available
      if (ExpoSpeechRecognitionModule.addEventListener) {
        ExpoSpeechRecognitionModule.addEventListener('result', resultHandler);
        ExpoSpeechRecognitionModule.addEventListener('error', errorHandler);
        ExpoSpeechRecognitionModule.addEventListener('end', endHandler);
      }

      // Start speech recognition
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 1,
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setVoiceState('idle');
      setIsListening(false);
    }
  }, [isSpeechAvailable, clearSilenceTimer, onTranscriptReady]);

  // Stop listening
  const stopListening = useCallback(async () => {
    try {
      if (ExpoSpeechRecognitionModule) {
        ExpoSpeechRecognitionModule.stop();
      }
      clearSilenceTimer();
      setIsListening(false);
      setVoiceState('idle');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, [clearSilenceTimer]);

  // Speak text with American Southern female voice
  const speak = useCallback(async (text: string) => {
    try {
      await initializeVoiceModules();
      
      if (!Speech) {
        console.warn('Speech module not available');
        return;
      }
      
      setIsSpeaking(true);
      setVoiceState('speaking');

      // Use a female voice with American accent
      const voiceOptions: any = {
        language: 'en-US',
        pitch: 1.1, // Slightly higher pitch for female voice
        rate: 0.85, // Slightly slower for clarity and sultry feel
        onDone: () => {
          setIsSpeaking(false);
          setVoiceState('idle');
        },
        onError: () => {
          setIsSpeaking(false);
          setVoiceState('idle');
        },
      };

      // Platform-specific voice selection for American Southern female voice
      if (Platform.OS === 'ios') {
        // iOS - use Moira for female voice with American accent
        voiceOptions.voice = 'com.apple.ttsbundle.Moira-compact';
      } else if (Platform.OS === 'android') {
        // Android - use Google female voice
        voiceOptions.voice = 'en-us-x-sfg#female_1-local';
      }

      await Speech.speak(text, voiceOptions);
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      setVoiceState('idle');
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    try {
      if (Speech) {
        Speech.stop();
      }
      setIsSpeaking(false);
      setVoiceState('idle');
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }, []);

  // Pause speaking
  const pauseSpeaking = useCallback(() => {
    try {
      if (Speech) {
        Speech.pause();
      }
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }, []);

  // Resume speaking
  const resumeSpeaking = useCallback(() => {
    try {
      if (Speech) {
        Speech.resume();
      }
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        voiceState,
        isListening,
        isSpeaking,
        transcript,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        pauseSpeaking,
        resumeSpeaking,
        isSpeechAvailable,
        onTranscriptReady,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return context;
}
