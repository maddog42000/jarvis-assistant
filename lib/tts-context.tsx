import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

export type TtsVoice = {
  identifier: string;
  language: string;
  name: string;
  quality?: string;
};

export type TtsSettings = {
  voiceIdentifier: string;
  language: string;
  pitch: number;
  rate: number;
  autoSpeak: boolean;
};

interface TtsContextValue {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  progress: number;
  canPause: boolean;
  voices: TtsVoice[];
  settings: TtsSettings;
  isLoadingVoices: boolean;
  speak: (text: string) => void;
  restart: () => void;
  pauseOrResume: () => Promise<void>;
  stop: () => Promise<void>;
  updateSettings: (settings: Partial<TtsSettings>) => Promise<void>;
}

const TtsContext = createContext<TtsContextValue | undefined>(undefined);
const TTS_SETTINGS_KEY = 'jarvis_tts_settings';
const DEFAULT_SETTINGS: TtsSettings = {
  voiceIdentifier: '',
  language: 'en-US',
  pitch: 1.06,
  rate: 0.92,
  autoSpeak: true,
};

const FEMALE_VOICE_HINTS = /female|woman|samantha|ava|victoria|karen|zira|jenny|aria|libby|moira|allison|susan|emma|google us english/i;

function cleanForSpeech(text: string) {
  return text
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);
}

function scoreVoice(voice: TtsVoice) {
  const language = voice.language.toLowerCase();
  const name = `${voice.name} ${voice.identifier}`;
  let score = 0;
  if (language.startsWith('en')) score += 20;
  if (language === 'en-us' || language === 'en_us') score += 8;
  if (FEMALE_VOICE_HINTS.test(name)) score += 12;
  if (String(voice.quality).toLowerCase().includes('enhanced')) score += 3;
  return score;
}

function sortVoices(voices: TtsVoice[]) {
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a) || a.name.localeCompare(b.name));
}

export function TtsProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [settings, setSettings] = useState<TtsSettings>(DEFAULT_SETTINGS);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const activeTextRef = useRef('');
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadVoiceSettings = async () => {
      try {
        const [availableVoices, storedSettings] = await Promise.all([
          Speech.getAvailableVoicesAsync(),
          AsyncStorage.getItem(TTS_SETTINGS_KEY),
        ]);
        if (cancelled) return;
        const sorted = sortVoices(availableVoices as TtsVoice[]);
        setVoices(sorted);
        const parsed = storedSettings ? JSON.parse(storedSettings) as Partial<TtsSettings> : {};
        const storedVoice = parsed.voiceIdentifier && sorted.some((voice) => voice.identifier === parsed.voiceIdentifier)
          ? parsed.voiceIdentifier
          : sorted[0]?.identifier ?? '';
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          voiceIdentifier: storedVoice,
          language: parsed.language || sorted.find((voice) => voice.identifier === storedVoice)?.language || 'en-US',
        });
      } catch (error) {
        if (!cancelled) console.warn('Unable to load Android TTS voices:', error);
      } finally {
        if (!cancelled) setIsLoadingVoices(false);
      }
    };
    void loadVoiceSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(async (nextSettings: Partial<TtsSettings>) => {
    const updated = { ...settings, ...nextSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Unable to save TTS settings:', error);
    }
  }, [settings]);

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
      language: settings.language || 'en-US',
      voice: settings.voiceIdentifier || undefined,
      pitch: settings.pitch,
      rate: settings.rate,
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
  }, [clearProgressTimer, settings]);

  const restart = useCallback(() => {
    if (activeTextRef.current) speak(activeTextRef.current);
  }, [speak]);

  const pauseOrResume = useCallback(async () => {
    if (Platform.OS === 'android') {
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
        voices,
        settings,
        isLoadingVoices,
        speak,
        restart,
        pauseOrResume,
        stop,
        updateSettings,
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
