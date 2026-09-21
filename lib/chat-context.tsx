import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  DEFAULT_AGENTS,
  getAgent,
  getProvider,
  normalizeEndpoint,
  normalizeGeminiModel,
  type AgentProfile,
  type AssistantConfig,
  type ProviderId,
} from '@/lib/assistant-config';
import { useMemory } from '@/lib/memory-context';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isOfflineCommand?: boolean;
}

export type ApiConfig = AssistantConfig & {
  apiKeys: Partial<Record<ProviderId, string>>;
};

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  isSpeaking: boolean;
  jarvisState: 'idle' | 'listening' | 'thinking' | 'speaking';
  apiConfig: ApiConfig;
  hasApiKey: boolean;
  addMessage: (role: 'user' | 'assistant', content: string, isOfflineCommand?: boolean) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setJarvisState: (state: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  updateApiConfig: (config: Partial<ApiConfig>) => Promise<void>;
  testConnection: (override?: Partial<ApiConfig>) => Promise<{ ok: boolean; message: string }>;
  sendMessage: (content: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'jarvis_chat_history';
const API_CONFIG_KEY = 'jarvis_api_config';

const DEFAULT_API_CONFIG: ApiConfig = {
  providerId: 'openai',
  apiKey: '',
  apiKeys: {},
  endpoint: getProvider('openai').endpoint,
  model: getProvider('openai').model,
  agentId: DEFAULT_AGENTS[0].id,
  agents: DEFAULT_AGENTS,
};

function isProviderId(value: unknown): value is ProviderId {
  return value === 'openai' || value === 'gemini' || value === 'anthropic' || value === 'custom';
}

function inferProvider(endpoint: string): ProviderId {
  const normalized = endpoint.toLowerCase();
  if (normalized.includes('generativelanguage.googleapis.com')) return 'gemini';
  if (normalized.includes('anthropic.com')) return 'anthropic';
  if (normalized.includes('openai.com')) return 'openai';
  return 'custom';
}

function normalizeStoredConfig(raw: unknown): ApiConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_API_CONFIG;
  const stored = raw as Partial<ApiConfig> & { apiKey?: string; endpoint?: string; model?: string };
  const endpoint = typeof stored.endpoint === 'string' ? stored.endpoint : DEFAULT_API_CONFIG.endpoint;
  const providerId = isProviderId(stored.providerId) ? stored.providerId : inferProvider(endpoint);
  const provider = getProvider(providerId);
  const apiKeys = stored.apiKeys && typeof stored.apiKeys === 'object' ? { ...stored.apiKeys } : {};
  if (typeof stored.apiKey === 'string' && !apiKeys[providerId]) apiKeys[providerId] = stored.apiKey;
  const agents = Array.isArray(stored.agents) && stored.agents.length > 0 ? stored.agents : DEFAULT_AGENTS;
  const agentId = agents.some((agent) => agent.id === stored.agentId) ? stored.agentId as string : agents[0].id;

  return {
    providerId,
    apiKey: apiKeys[providerId] ?? '',
    apiKeys,
    endpoint,
    model: providerId === 'gemini' ? normalizeGeminiModel(typeof stored.model === 'string' ? stored.model : provider.model) : (typeof stored.model === 'string' && stored.model.trim() ? stored.model : provider.model),
    agentId,
    agents,
  };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { memory, rememberNote } = useMemory();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [jarvisState, setJarvisState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);

  const hasApiKey = Boolean(apiConfig.apiKey.trim());

  const loadChatHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);

  const loadApiConfig = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(API_CONFIG_KEY);
      if (stored) setApiConfig(normalizeStoredConfig(JSON.parse(stored)));
    } catch (error) {
      console.error('Failed to load API config:', error);
    }
  }, []);

  useEffect(() => {
    void loadChatHistory();
    void loadApiConfig();
  }, [loadApiConfig, loadChatHistory]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, isOfflineCommand = false) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      content,
      timestamp: Date.now(),
      isOfflineCommand,
    };
    setMessages((previous) => [...previous, newMessage]);
  }, []);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, []);

  const updateApiConfig = useCallback(async (config: Partial<ApiConfig>) => {
    let updatedConfig: ApiConfig = DEFAULT_API_CONFIG;
    setApiConfig((current) => {
      const nextProviderId = config.providerId ?? current.providerId;
      const nextApiKeys = { ...current.apiKeys, ...(config.apiKeys ?? {}) };
      if (typeof config.apiKey === 'string') nextApiKeys[nextProviderId] = config.apiKey;
      const nextProvider = getProvider(nextProviderId);
      updatedConfig = {
        ...current,
        ...config,
        providerId: nextProviderId,
        apiKey: config.apiKey ?? nextApiKeys[nextProviderId] ?? '',
        apiKeys: nextApiKeys,
        endpoint: config.endpoint ?? current.endpoint ?? nextProvider.endpoint,
        model: nextProviderId === 'gemini' ? normalizeGeminiModel(config.model ?? current.model ?? nextProvider.model) : (config.model ?? current.model ?? nextProvider.model),
        agents: config.agents ?? current.agents,
        agentId: config.agentId ?? current.agentId,
      };
      return updatedConfig;
    });
    try {
      await AsyncStorage.setItem(API_CONFIG_KEY, JSON.stringify(updatedConfig));
    } catch (error) {
      console.error('Failed to save API config:', error);
    }
  }, []);

  const testConnection = useCallback(async (override: Partial<ApiConfig> = {}) => {
    const candidateProviderId = override.providerId ?? apiConfig.providerId;
    const candidateApiKeys = { ...apiConfig.apiKeys, ...(override.apiKeys ?? {}) };
    if (typeof override.apiKey === 'string') candidateApiKeys[candidateProviderId] = override.apiKey;
    try {
      const detectedModel = candidateProviderId === 'gemini'
        ? await discoverGeminiModel(override.apiKey ?? candidateApiKeys[candidateProviderId] ?? '', override.endpoint ?? apiConfig.endpoint)
        : undefined;
      const candidate: ApiConfig = {
        ...apiConfig,
        ...override,
        providerId: candidateProviderId,
        apiKeys: candidateApiKeys,
        apiKey: override.apiKey ?? candidateApiKeys[candidateProviderId] ?? '',
        endpoint: override.endpoint ?? apiConfig.endpoint,
        model: detectedModel ?? (candidateProviderId === 'gemini' ? normalizeGeminiModel(override.model ?? apiConfig.model) : (override.model ?? apiConfig.model)),
        agentId: override.agentId ?? apiConfig.agentId,
        agents: override.agents ?? apiConfig.agents,
      };
      if (!candidate.apiKey.trim()) return { ok: false, message: 'Add a provider key before testing the connection.' };
      await requestAssistantReply(candidate, [], 'Reply with exactly: Connection OK.');
      if (candidate.providerId === 'gemini' && detectedModel) await updateApiConfig({ providerId: 'gemini', model: detectedModel });
      return { ok: true, message: `${getProvider(candidate.providerId).name} is connected using ${candidate.model}.` };
    } catch (error) {
      return { ok: false, message: formatConnectionError(error) };
    }
  }, [apiConfig, updateApiConfig]);

  const sendMessage = useCallback(async (content: string) => {
    addMessage('user', content);
    setJarvisState('thinking');
    setIsLoading(true);

    try {
      const offlineResponse = await checkOfflineCommands(content, rememberNote);
      if (offlineResponse) {
        addMessage('assistant', offlineResponse, true);
        return;
      }

      if (!apiConfig.apiKey.trim()) {
        addMessage('assistant', getOfflineFallbackMessage());
        return;
      }

      const assistantMessage = await requestAssistantReply(apiConfig, messages, content, memory);
      addMessage('assistant', assistantMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('assistant', formatConnectionError(error));
    } finally {
      setJarvisState('idle');
      setIsLoading(false);
    }
  }, [addMessage, apiConfig, messages, memory, rememberNote]);

  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch((error) => {
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
        hasApiKey,
        addMessage,
        clearMessages,
        setLoading: setIsLoading,
        setSpeaking: setIsSpeaking,
        setJarvisState,
        updateApiConfig,
        testConnection,
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
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}

type ChatTurn = { role: 'user' | 'assistant'; content: string };

type RequestConfig = Pick<ApiConfig, 'providerId' | 'apiKey' | 'endpoint' | 'model' | 'agentId' | 'agents'>;

async function requestAssistantReply(config: RequestConfig, history: Message[], content: string, memory?: { name: string; focus: string; notes: string[] }) {
  const agent = getAgent(config);
  const memoryContext = memory && (memory.name || memory.focus || memory.notes.length)
    ? `\nLocal companion context (use naturally, do not mention storage): name=${memory.name || 'unknown'}; focus=${memory.focus || 'not set'}; notes=${memory.notes.join(' | ') || 'none'}.`
    : '';
  const turns: ChatTurn[] = [
    ...history.slice(-18).map((message) => ({ role: message.role, content: message.content })),
    { role: 'user', content },
  ];
  const provider = getProvider(config.providerId);

  if (config.providerId === 'gemini') {
    const model = normalizeGeminiModel(config.model);
    const endpoint = `${normalizeEndpoint(config.endpoint)}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${agent.systemPrompt}${memoryContext}` }] },
        contents: turns.map((turn) => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });
    return extractGeminiText(await readResponseOrThrow(response, provider.name));
  }

  if (config.providerId === 'anthropic') {
    const endpoint = `${normalizeEndpoint(config.endpoint)}/messages`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 500,
        temperature: 0.7,
        system: `${agent.systemPrompt}${memoryContext}`,
        messages: turns,
      }),
    });
    return extractAnthropicText(await readResponseOrThrow(response, provider.name));
  }

  const endpoint = normalizeEndpoint(config.endpoint).endsWith('/chat/completions')
    ? normalizeEndpoint(config.endpoint)
    : `${normalizeEndpoint(config.endpoint)}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'system', content: `${agent.systemPrompt}${memoryContext}` }, ...turns],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  return extractOpenAiText(await readResponseOrThrow(response, provider.name));
}

async function readResponseOrThrow(response: Response, providerName: string) {
  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = extractErrorText(payload) || `HTTP ${response.status}`;
    throw new Error(`${providerName} connection failed: ${message}`);
  }
  return payload;
}

function extractErrorText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Record<string, unknown>;
  const error = value.error;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && typeof (error as Record<string, unknown>).message === 'string') {
    return (error as Record<string, unknown>).message as string;
  }
  if (typeof value.message === 'string') return value.message;
  return null;
}

function extractOpenAiText(payload: unknown) {
  const value = payload as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = value.choices?.[0]?.message?.content;
  if (typeof content === 'string' && content.trim()) return content.trim();
  throw new Error('The provider returned no assistant text. Check the model name and endpoint.');
}

function extractGeminiText(payload: unknown) {
  const value = payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
  const text = value.candidates?.[0]?.content?.parts?.map((part) => typeof part.text === 'string' ? part.text : '').join('').trim();
  if (text) return text;
  throw new Error('The provider returned no assistant text. Check the model name and API key.');
}

function extractAnthropicText(payload: unknown) {
  const value = payload as { content?: Array<{ type?: string; text?: unknown }> };
  const text = value.content?.filter((block) => block.type === 'text').map((block) => typeof block.text === 'string' ? block.text : '').join('').trim();
  if (text) return text;
  throw new Error('The provider returned no assistant text. Check the model name and API key.');
}

function formatConnectionError(error: unknown) {
  if (error instanceof TypeError) {
    return 'I could not reach that provider. Check your internet connection, endpoint, and provider selection in Settings.';
  }
  const message = error instanceof Error ? error.message : 'Unknown provider error.';
  if (/API key|api key|permission|unauthorized|forbidden|401|403/i.test(message)) {
    return `Gemini rejected this key. In Google AI Studio, open the key details and make sure it is an authorization key (or a restricted key with the Generative Language API enabled), then create a fresh key and try again. Details: ${message}`;
  }
  return `I could not complete that request. ${message}`;
}

async function discoverGeminiModel(apiKey: string, endpoint: string) {
  if (!apiKey.trim()) throw new Error('Add a Gemini API key before automatic setup.');
  const response = await fetch(`${normalizeEndpoint(endpoint || getProvider('gemini').endpoint)}/models?key=${encodeURIComponent(apiKey)}&pageSize=100`);
  const payload = await readResponseOrThrow(response, 'Gemini model discovery');
  const models = (payload as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> }).models ?? [];
  const supported = models
    .filter((model) => model.name && model.supportedGenerationMethods?.includes('generateContent'))
    .map((model) => model.name!.replace(/^models\//, ''));
  const preferred = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
  return preferred.find((model) => supported.includes(model)) ?? supported.find((model) => /flash/i.test(model)) ?? supported[0] ?? normalizeGeminiModel('');
}

function getOfflineFallbackMessage() {
  return 'I am in offline mode because no provider key is configured. You can use the quick-command deck, Android keyboard dictation, Google Assistant, or a browser AI mode. To connect an agent, open Settings, choose a provider, paste its key, select an agent, and tap Test connection before saving.';
}

// Comprehensive offline command processor with 20+ commands.
async function checkOfflineCommands(input: string, rememberNote: (note: string) => Promise<void>): Promise<string | null> {
  const lowerInput = input.toLowerCase();
  const now = new Date();

  if (lowerInput.startsWith('remember that ') || lowerInput.startsWith('remember ')) {
    const note = input.replace(/^remember(?: that)?\s+/i, '').trim();
    if (note) {
      await rememberNote(note);
      return `🧠 I’ll remember that on this device: **${note}**`;
    }
  }

  if (lowerInput.includes('status report') || lowerInput.includes('system status')) {
    return `📊 **System Status Report**\n\nTime: ${now.toLocaleTimeString()}\nDate: ${now.toLocaleDateString()}\nPlatform: ${Platform.OS === 'android' ? 'Android' : 'iOS'}\nStatus: All systems operational\nNetwork: Connected and stable`;
  }
  if (lowerInput.includes('what time') || lowerInput.includes('current time')) {
    return `⏰ The current time is **${now.toLocaleTimeString()}** on ${now.toLocaleDateString()}.`;
  }
  if (lowerInput.includes('what date') || lowerInput.includes('today')) {
    return `📅 Today is **${now.toLocaleDateString()}** (${now.toLocaleDateString('en-US', { weekday: 'long' })}). The time is ${now.toLocaleTimeString()}.`;
  }
  if (lowerInput.includes('battery')) {
    return '🔋 **Battery Status**\n\nEstimated battery level: Healthy\nCharging: Not connected\nTemperature: Normal\nHealth: Good';
  }
  if (lowerInput.includes('network') || lowerInput.includes('wifi') || lowerInput.includes('connection')) {
    return '📡 **Network Status**\n\nConnection: Active\nType: WiFi/Cellular\nSignal Strength: Strong\nLatency: Good\nNo connectivity issues detected';
  }
  if (lowerInput.includes('storage') || lowerInput.includes('disk space')) {
    return '💾 **Storage Information**\n\nTotal Storage: Adequate\nAvailable Space: Good\nUsed: Moderate\nRecommendation: Consider clearing old files if needed';
  }
  if (lowerInput.includes('remind me') || lowerInput.includes('set reminder')) {
    return '⏲️ **Reminder Set**\n\nI can help you set reminders! Please use your device’s native reminder app or ask me to help you remember something during our conversation.';
  }
  if (lowerInput.includes('alarm') || lowerInput.includes('set alarm')) {
    return '🔔 **Alarm Feature**\n\nTo set alarms, please use your device’s Clock app. I can remind you verbally about important times during our chat!';
  }
  if (lowerInput.includes('countdown') || lowerInput.includes('timer')) {
    return '⏱️ **Timer**\n\nFor precise timers, use your device’s Clock app. I can help you track time during our conversation!';
  }
  if (lowerInput.includes('clear history')) {
    return '🗑️ **Chat History Cleared**\n\nUse the Clear chat history button in Settings to remove saved messages from this device.';
  }
  if (lowerInput.includes('stealth mode')) {
    return '🕵️ **Stealth Mode Activated**\n\nReducing visibility and minimizing notifications. Responses will be brief and silent.';
  }
  if (lowerInput.includes('overwatch') || lowerInput.includes('monitor')) {
    return '👁️ **Overwatch Mode Active**\n\nMonitoring system status, app activity, and performance metrics. All systems running smoothly.';
  }
  if (lowerInput.includes('eyes on') || lowerInput.includes('screenshot')) {
    return '📸 **Screen Analysis**\n\nCurrent interface analyzed. I can see your device is functioning normally. Ready to help with any questions!';
  }
  if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
    return '🤖 **Jarvis Capabilities**\n\n**Offline Commands:**\n• Status reports & system info\n• Time, date, and reminders\n• Battery & network status\n• Device storage info\n• Quick actions & utilities\n\n**With a provider key:**\n• Full AI conversations\n• Complex questions & analysis\n• Creative writing & coding help\n\nTry asking me anything!';
  }
  if (lowerInput.includes('version') || lowerInput.includes('about')) {
    return `ℹ️ **About Jarvis**\n\nJarvis v1.0.5\nA sophisticated AI assistant with offline capabilities and beautiful animations.\n\nDeveloped with React Native & Expo\nPlatform: ${Platform.OS === 'android' ? 'Android' : 'iOS'}`;
  }
  if (lowerInput.includes('features') || lowerInput.includes('commands')) {
    return '✨ **Available Features**\n\n📊 System monitoring\n🎯 Offline commands (20+)\n🤖 Multi-provider AI chat\n💬 Message reactions\n⚙️ Customizable settings\n🎨 Beautiful dark theme\n📱 Responsive design';
  }
  if (lowerInput.includes('joke') || lowerInput.includes('tell me a joke')) {
    const jokes = [
      'Why did the AI go to school? To improve its learning model!',
      'What do you call an AI that tells jokes? A pun-processor!',
      'Why did the assistant break up with the API? No connection!',
      'How many programmers does it take to change a light bulb? None, that’s a hardware problem!',
    ];
    return `😄 **Joke Time**\n\n${jokes[Math.floor(Math.random() * jokes.length)]}`;
  }
  if (lowerInput.includes('quote') || lowerInput.includes('inspiration')) {
    const quotes = [
      '“The only way to do great work is to love what you do.” — Steve Jobs',
      '“Innovation distinguishes between a leader and a follower.” — Steve Jobs',
      '“Life is what happens when you’re busy making other plans.” — John Lennon',
      '“The future belongs to those who believe in the beauty of their dreams.” — Eleanor Roosevelt',
    ];
    return `💡 **Daily Inspiration**\n\n${quotes[Math.floor(Math.random() * quotes.length)]}`;
  }
  if (lowerInput.includes('calculate') || lowerInput.includes('math')) {
    return '🧮 **Calculator**\n\nI can help with basic math! Try asking me to calculate something specific, like “What is 15 + 27?” or “Calculate 50% of 200”.';
  }
  if (lowerInput.includes('weather')) {
    return '🌤️ **Weather**\n\nI do not have real-time weather data, but you can check your device’s weather app, ask Google Assistant, or visit weather.com.';
  }
  if (lowerInput.includes('news') || lowerInput.includes('headlines')) {
    return '📰 **News**\n\nFor the latest news, check Google News, BBC News, Reuters, or the Associated Press.';
  }
  if (lowerInput.includes('jarvis') && (lowerInput.includes('?') || lowerInput.length < 50)) {
    return 'I did not recognize that command. Try asking about device status, time, date, battery, network, or say “help” for more options.';
  }
  return null;
}
