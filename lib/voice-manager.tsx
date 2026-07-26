import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import type { ExpoSpeechRecognitionResultEvent } from 'expo-speech-recognition';
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
const WAKE_WORD = 'hey jarvis';

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
        if (Platform.OS !== 'web') {
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

  // Handle speech recognition results
  useSpeechRecognitionEvent('result', (event: ExpoSpeechRecognitionResultEvent) => {
    if (event.results.length === 0) return;
    
    const result = event.results[event.results.length - 1];
    const recognizedText = result.transcript.toLowerCase().trim();
    
    currentTranscriptRef.current = recognizedText;
    setTranscript(recognizedText);

    // If this is a final result, set up auto-submit timer
    if (event.isFinal) {
      // Clear existing timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Set new timer for auto-submit
      silenceTimerRef.current = setTimeout(async () => {
        await stopListening();
      }, SILENCE_TIMEOUT);
    }
  }) as any;

  // Handle speech recognition errors
  useSpeechRecognitionEvent('error', (event: any) => {
    console.error('Speech recognition error:', event.error);
    setVoiceState('idle');
    setIsListening(false);
  });

  // Handle speech end
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setVoiceState('idle');
    if (currentTranscriptRef.current && onTranscriptReady) {
      onTranscriptReady(currentTranscriptRef.current);
    }
  });

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current as any);
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
  }, [isSpeechAvailable, clearSilenceTimer]) as any;

  // Stop listening
  const stopListening = useCallback(async () => {
    try {
      ExpoSpeechRecognitionModule.stop();
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
  }, []) as any;

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    try {
      Speech.stop();
      setIsSpeaking(false);
      setVoiceState('idle');
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }, []);

  // Pause speaking
  const pauseSpeaking = useCallback(() => {
    try {
      Speech.pause();
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }, []);

  // Resume speaking
  const resumeSpeaking = useCallback(() => {
    try {
      Speech.resume();
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
