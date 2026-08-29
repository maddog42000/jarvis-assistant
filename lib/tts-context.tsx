import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

interface TtsContextValue {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  progress: number;
  canPause: boolean;
  speak: (text: string) => void;
  restart: () => void;
  pauseOrResume: () => Promise<void>;
  stop: () => Promise<void>;
}

const TtsContext = createContext<TtsContextValue | undefined>(undefined);

function cleanForSpeech(text: string) {
  return text
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);
}

export function TtsProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [progress, setProgress] = useState(0);
  const activeTextRef = useRef('');
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(async () => {
    clearProgressTimer();
    try {
      await Speech.stop();
    } catch (error) {
      console.warn('Unable to stop speech:', error);
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
  }, [clearProgressTimer]);

  const speak = useCallback((text: string) => {
    const spokenText = cleanForSpeech(text);
    if (!spokenText) return;

    clearProgressTimer();
    void Speech.stop().catch(() => undefined);
    activeTextRef.current = spokenText;
    setCurrentText(spokenText);
    setProgress(0);
    setIsPaused(false);
    setIsSpeaking(true);

    const wordCount = Math.max(spokenText.split(/\s+/).length, 1);
    const estimatedDuration = Math.max(wordCount * 360, 1600);
    const startedAt = Date.now();

    progressTimerRef.current = setInterval(() => {
      const nextProgress = Math.min((Date.now() - startedAt) / estimatedDuration, 0.98);
      setProgress(nextProgress);
    }, 120);

    Speech.speak(spokenText, {
      language: 'en-US',
      pitch: 1.08,
      rate: 0.9,
      volume: 1,
      onDone: () => {
        clearProgressTimer();
        setProgress(1);
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onStopped: () => {
        clearProgressTimer();
        setIsSpeaking(false);
      },
      onError: (error) => {
        clearProgressTimer();
        console.warn('Speech playback error:', error);
        setIsSpeaking(false);
        setIsPaused(false);
      },
    });
  }, [clearProgressTimer]);

  const restart = useCallback(() => {
    if (activeTextRef.current) speak(activeTextRef.current);
  }, [speak]);

  const pauseOrResume = useCallback(async () => {
    if (Platform.OS === 'android') {
      // Android's Expo TTS API does not expose pause/resume. Stop now and let
      // the Play button restart the current response from the beginning.
      await stop();
      return;
    }

    try {
      if (isPaused) {
        await Speech.resume();
        setIsPaused(false);
        setIsSpeaking(true);
      } else {
        await Speech.pause();
        setIsPaused(true);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.warn('Unable to pause or resume speech:', error);
    }
  }, [isPaused, stop]);

  useEffect(() => () => clearProgressTimer(), [clearProgressTimer]);

  return (
    <TtsContext.Provider
      value={{
        isSpeaking,
        isPaused,
        currentText,
        progress,
        canPause: Platform.OS !== 'android',
        speak,
        restart,
        pauseOrResume,
        stop,
      }}
    >
      {children}
    </TtsContext.Provider>
  );
}

export function useTts() {
  const context = useContext(TtsContext);
  if (!context) throw new Error('useTts must be used within TtsProvider');
  return context;
}
