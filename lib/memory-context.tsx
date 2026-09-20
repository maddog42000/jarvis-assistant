import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CompanionMemory = {
  name: string;
  focus: string;
  notes: string[];
  lastCheckIn: number | null;
};

interface MemoryContextValue {
  memory: CompanionMemory;
  isReady: boolean;
  greetingName: string;
  saveMemory: (updates: Partial<CompanionMemory>) => Promise<void>;
  rememberNote: (note: string) => Promise<void>;
  clearMemory: () => Promise<void>;
}

const STORAGE_KEY = 'jarvis_companion_memory';
const DEFAULT_MEMORY: CompanionMemory = { name: '', focus: '', notes: [], lastCheckIn: null };

const MemoryContext = createContext<MemoryContextValue | undefined>(undefined);

function normalizeMemory(value: unknown): CompanionMemory {
  if (!value || typeof value !== 'object') return DEFAULT_MEMORY;
  const raw = value as Partial<CompanionMemory>;
  return {
    name: typeof raw.name === 'string' ? raw.name.slice(0, 40) : '',
    focus: typeof raw.focus === 'string' ? raw.focus.slice(0, 120) : '',
    notes: Array.isArray(raw.notes) ? raw.notes.filter((note): note is string => typeof note === 'string').slice(-12) : [],
    lastCheckIn: typeof raw.lastCheckIn === 'number' ? raw.lastCheckIn : null,
  };
}

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [memory, setMemory] = useState<CompanionMemory>(DEFAULT_MEMORY);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) setMemory(normalizeMemory(JSON.parse(value)));
      })
      .catch((error) => console.warn('Unable to load companion memory:', error))
      .finally(() => setIsReady(true));
  }, []);

  const persist = useCallback(async (next: CompanionMemory) => {
    setMemory(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('Unable to save companion memory:', error);
    }
  }, []);

  const saveMemory = useCallback(async (updates: Partial<CompanionMemory>) => {
    await persist(normalizeMemory({ ...memory, ...updates }));
  }, [memory, persist]);

  const rememberNote = useCallback(async (note: string) => {
    const cleanNote = note.trim().slice(0, 160);
    if (!cleanNote) return;
    await persist(normalizeMemory({ ...memory, notes: [...memory.notes, cleanNote] }));
  }, [memory, persist]);

  const clearMemory = useCallback(async () => {
    await persist(DEFAULT_MEMORY);
  }, [persist]);

  const value = useMemo(() => ({
    memory,
    isReady,
    greetingName: memory.name || 'there',
    saveMemory,
    rememberNote,
    clearMemory,
  }), [clearMemory, isReady, memory, rememberNote, saveMemory]);

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>;
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) throw new Error('useMemory must be used within MemoryProvider');
  return context;
}
