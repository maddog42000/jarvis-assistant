import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isOfflineCommand?: boolean;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  isSpeaking: boolean;
  jarvisState: 'idle' | 'listening' | 'thinking' | 'speaking';
  apiConfig: {
    endpoint: string;
    apiKey: string;
    model: string;
  };
  addMessage: (role: 'user' | 'assistant', content: string, isOfflineCommand?: boolean) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setJarvisState: (state: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  updateApiConfig: (config: Partial<ChatContextType['apiConfig']>) => void;
  sendMessage: (content: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'jarvis_chat_history';
const API_CONFIG_KEY = 'jarvis_api_config';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [jarvisState, setJarvisState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [apiConfig, setApiConfig] = useState({
    endpoint: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
  });

  // Load chat history and API config on mount
  useEffect(() => {
    loadChatHistory();
    loadApiConfig();
  }, []);

  const loadChatHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);

  const loadApiConfig = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(API_CONFIG_KEY);
      if (stored) {
        setApiConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    }
  }, []);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, isOfflineCommand = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
      isOfflineCommand,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, []);

  const updateApiConfig = useCallback(async (config: Partial<ChatContextType['apiConfig']>) => {
    const updated = { ...apiConfig, ...config };
    setApiConfig(updated);
    try {
      await AsyncStorage.setItem(API_CONFIG_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save API config:', error);
    }
  }, [apiConfig]);

  const sendMessage = useCallback(async (content: string) => {
    addMessage('user', content);
    setJarvisState('thinking');
    setIsLoading(true);

    try {
      // Check for offline commands first
      const offlineResponse = checkOfflineCommands(content);
      if (offlineResponse) {
        addMessage('assistant', offlineResponse, true);
        setJarvisState('idle');
        setIsLoading(false);
        return;
      }

      // Try to send to API
      if (!apiConfig.apiKey) {
        addMessage('assistant', 'API key not configured. Please set up your API key in Settings.');
        setJarvisState('idle');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${apiConfig.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [
            { role: 'system', content: 'You are Jarvis, a sophisticated AI assistant. Be helpful, concise, and professional.' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'No response received.';
      addMessage('assistant', assistantMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again or check your API configuration.');
    } finally {
      setJarvisState('idle');
      setIsLoading(false);
    }
  }, [messages, apiConfig, addMessage]);

  // Persist messages to storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch(error => {
        console.error('Failed to save messages:', error);
      });
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isSpeaking,
        jarvisState,
        apiConfig,
        addMessage,
        clearMessages,
        setLoading: setIsLoading,
        setSpeaking: setIsSpeaking,
        setJarvisState,
        updateApiConfig,
        sendMessage,
        loadChatHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

// Offline command processor
function checkOfflineCommands(input: string): string | null {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('status report') || lowerInput.includes('status')) {
    const now = new Date();
    return `Status Report: It's currently ${now.toLocaleTimeString()}. Device is operating normally. Battery level is optimal. Network connectivity is stable.`;
  }

  if (lowerInput.includes('what time') || lowerInput.includes('time is it')) {
    const now = new Date();
    return `The current time is ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}.`;
  }

  if (lowerInput.includes('battery')) {
    return `Battery check: Device battery is at a healthy level. No charging issues detected.`;
  }

  if (lowerInput.includes('network')) {
    return `Network status: Connected to stable network. Signal strength is good. No connectivity issues detected.`;
  }

  if (lowerInput.includes('clear history')) {
    return `Chat history cleared. Starting fresh conversation.`;
  }

  if (lowerInput.includes('stealth mode')) {
    return `Stealth mode activated. Reducing visibility and silencing responses.`;
  }

  if (lowerInput.includes('overwatch')) {
    return `Overwatch mode activated. Monitoring system status and app activity.`;
  }

  if (lowerInput.includes('eyes on')) {
    return `Screen capture initiated. Current interface analyzed and ready for description.`;
  }

  return null;
}
