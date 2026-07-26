import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PersonalityMode = 'professional' | 'casual' | 'witty';

interface PersonalityContextType {
  mode: PersonalityMode;
  setMode: (mode: PersonalityMode) => void;
  getSystemPrompt: () => string;
}

const PersonalityContext = createContext<PersonalityContextType | undefined>(undefined);

const PERSONALITY_KEY = 'jarvis_personality_mode';

const SYSTEM_PROMPTS: Record<PersonalityMode, string> = {
  professional:
    'You are Jarvis, a sophisticated and professional AI assistant. Be helpful, concise, accurate, and maintain a formal tone. Provide clear, well-structured responses.',
  casual:
    'You are Jarvis, a friendly and approachable AI assistant. Be helpful and conversational. Use a relaxed tone and feel free to use casual language while remaining professional.',
  witty:
    'You are Jarvis, a clever and witty AI assistant with a sense of humor. Be helpful while occasionally adding clever observations or light humor. Keep responses engaging and entertaining.',
};

export function PersonalityProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<PersonalityMode>('professional');

  const setMode = useCallback(async (newMode: PersonalityMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(PERSONALITY_KEY, newMode);
    } catch (error) {
      console.error('Failed to save personality mode:', error);
    }
  }, []);

  const getSystemPrompt = useCallback(() => {
    return SYSTEM_PROMPTS[mode];
  }, [mode]);

  return (
    <PersonalityContext.Provider value={{ mode, setMode, getSystemPrompt }}>
      {children}
    </PersonalityContext.Provider>
  );
}

export function usePersonality() {
  const context = useContext(PersonalityContext);
  if (!context) {
    throw new Error('usePersonality must be used within PersonalityProvider');
  }
  return context;
}
