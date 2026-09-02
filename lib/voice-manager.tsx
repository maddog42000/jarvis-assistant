import React, { createContext, useCallback, useContext, useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

type TranscriptHandler = (text: string) => void;

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
  onTranscriptReady?: TranscriptHandler;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

/**
 * Compatibility provider for older VoiceControls consumers.
 *
 * The production-safe app uses TtsProvider for speech output. Speech recognition
 * is deliberately not imported here because it requires a native module and was
 * the source of previous release-build failures.
 */
export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startListening = useCallback(async () => {
    setVoiceState('idle');
  }, []);

  const stopListening = useCallback(async () => {
    setVoiceState('idle');
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsSpeaking(true);
    setVoiceState('speaking');
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.08,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
        setVoiceState('idle');
      },
      onStopped: () => {
        setIsSpeaking(false);
        setVoiceState('idle');
      },
      onError: () => {
        setIsSpeaking(false);
        setVoiceState('idle');
      },
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    setVoiceState('idle');
  }, []);

  const pauseSpeaking = useCallback(() => {
    // expo-speech does not expose a portable pause API in SDK 54.
  }, []);

  const resumeSpeaking = useCallback(() => {
    // expo-speech does not expose a portable resume API in SDK 54.
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        voiceState,
        isListening: false,
        isSpeaking,
        transcript: '',
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        pauseSpeaking,
        resumeSpeaking,
        isSpeechAvailable: false,
        onTranscriptReady: undefined,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
}
