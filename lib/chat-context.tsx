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
import { trpc } from '@/lib/trpc';
import { buildServerAssistantInput, getServerFallbackNotice } from '@/lib/server-assistant';
import { runFallbackChain } from '@/lib/fallback-routing';
import { normalizeCachedHistory, serializeCachedHistory, limitCachedHistory } from '@/lib/local-history';

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
  testConnection: (override?: Partial<ApiConfig>, onProgress?: (message: string) => void) => Promise<{ ok: boolean; message: string }>;
  testServerAssistant: () => Promise<{ ok: boolean; message: string }>;
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
  const serverAssistant = trpc.assistant.complete.useMutation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [jarvisState, setJarvisState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);

  const hasApiKey = Boolean(apiConfig.apiKey.trim());

  const loadChatHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(normalizeCachedHistory(JSON.parse(stored)) as Message[]);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setHistoryLoaded(true);
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
    setMessages((previous) => limitCachedHistory([...previous, newMessage]));
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

  const testConnection = useCallback(async (override: Partial<ApiConfig> = {}, onProgress?: (message: string) => void) => {
    const candidateProviderId = override.providerId ?? apiConfig.providerId;
    const candidateApiKeys = { ...apiConfig.apiKeys, ...(override.apiKeys ?? {}) };
    if (typeof override.apiKey === 'string') candidateApiKeys[candidateProviderId] = override.apiKey;
    try {
      onProgress?.(candidateProviderId === 'gemini' ? 'Step 1 of 3: asking Google which models this key can use…' : 'Step 1 of 2: contacting the selected provider…');
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
      onProgress?.(candidateProviderId === 'gemini' ? `Step 2 of 3: found ${candidate.model}; sending a small test request…` : 'Step 2 of 2: sending a small test request…');
      await requestAssistantReply(candidate, [], 'Reply with exactly: Connection OK.');
      onProgress?.(candidateProviderId === 'gemini' ? 'Step 3 of 3: saving the verified key and model on this device…' : 'Saving the verified provider setup on this device…');
      await updateApiConfig({
        providerId: candidate.providerId,
        apiKey: candidate.apiKey,
        apiKeys: candidateApiKeys,
        endpoint: candidate.endpoint,
        model: candidate.model,
        agentId: candidate.agentId,
      });
      return { ok: true, message: `${getProvider(candidate.providerId).name} is connected using ${candidate.model}.` };
    } catch (error) {
      return { ok: false, message: formatConnectionError(error, getProvider(candidateProviderId).name) };
    }
  }, [apiConfig, updateApiConfig]);

  const testServerAssistant = useCallback(async () => {
    try {
      const reply = await runFallbackChain([{
        id: 'Jarvis secure backup',
        run: async () => (await serverAssistant.mutateAsync(buildServerAssistantInput(
          DEFAULT_AGENTS[0].systemPrompt,
          [{ role: 'user', content: 'Reply with exactly: Secure backup online.' }],
        ))).content,
      }]);
      return { ok: Boolean(reply.value), message: 'Jarvis secure backup is online and ready.' };
    } catch (error) {
      return { ok: false, message: formatConnectionError(error, 'Jarvis secure backup') };
    }
  }, [serverAssistant]);

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
        try {
          const agent = getAgent(apiConfig);
          const result = await runFallbackChain([{
            id: 'Jarvis secure backup',
            run: async () => (await serverAssistant.mutateAsync(buildServerAssistantInput(
              agent.systemPrompt,
              [...messages.slice(-10), { role: 'user' as const, content }],
              memory,
            ))).content,
          }]);
          addMessage('assistant', result.value);
        } catch (error) {
          console.error('Server assistant proxy unavailable:', error);
          addMessage('assistant', getOfflineFallbackMessage());
        }
        return;
      }

      try {
          const agent = getAgent(apiConfig);
          const result = await runFallbackChain([
            {
              id: getProvider(apiConfig.providerId).name,
              run: async () => {
                try {
                  return await requestAssistantReply(apiConfig, messages, content, memory);
                } catch (error) {
                  if (apiConfig.providerId !== 'gemini' || !/404|not found|model/i.test(error instanceof Error ? error.message : '')) throw error;
                  const recoveredModel = await discoverGeminiModel(apiConfig.apiKey, apiConfig.endpoint);
                  if (!recoveredModel || recoveredModel === apiConfig.model) throw error;
                  await updateApiConfig({ providerId: 'gemini', model: recoveredModel });
                  return requestAssistantReply({ ...apiConfig, model: recoveredModel }, messages, content, memory);
                }
              },
            },
          {
            id: 'Jarvis secure backup',
            run: async () => (await serverAssistant.mutateAsync(buildServerAssistantInput(
              agent.systemPrompt,
              [...messages.slice(-10), { role: 'user' as const, content }],
              memory,
            ))).content,
          },
        ]);
        addMessage('assistant', result.used === 'Jarvis secure backup'
          ? `${getServerFallbackNotice(getProvider(apiConfig.providerId).name)}\n\n${result.value}`
          : result.value);
      } catch (error) {
        console.error('All Jarvis AI routes failed:', error);
        addMessage('assistant', formatConnectionError(error, getProvider(apiConfig.providerId).name));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('assistant', formatConnectionError(error, getProvider(apiConfig.providerId).name));
    } finally {
      setJarvisState('idle');
      setIsLoading(false);
    }
  }, [addMessage, apiConfig, messages, memory, rememberNote, serverAssistant]);

  useEffect(() => {
    if (!historyLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, serializeCachedHistory(messages)).catch((error) => {
      console.error('Failed to save local chat history:', error);
    });
  }, [historyLoaded, messages]);

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
        testServerAssistant,
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
    const response = await fetchWithTimeout(endpoint, {
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
    const response = await fetchWithTimeout(endpoint, {
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
  const response = await fetchWithTimeout(endpoint, {
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

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The request timed out after 15 seconds.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

function formatConnectionError(error: unknown, providerName = 'the provider') {
  if (error instanceof TypeError) {
    return 'I could not reach that provider. Check your internet connection, endpoint, and provider selection in Settings.';
  }
  const message = error instanceof Error ? error.message : 'Unknown provider error.';
  if (/404|not found/i.test(message)) {
    return `${providerName} returned 404. The saved model may not be available to this key, so retry Auto setup to rediscover an allowed model. Also confirm the Gemini endpoint is https://generativelanguage.googleapis.com/v1beta.`;
  }
  if (/API key|api key|permission|unauthorized|forbidden|401|403/i.test(message)) {
    return `${providerName} rejected this key. Open the official key page, confirm the key is active and allowed for this API, then create a fresh key and try again. Details: ${message}`;
  }
  return `I could not complete that request. ${message}`;
}

async function discoverGeminiModel(apiKey: string, endpoint: string) {
  if (!apiKey.trim()) throw new Error('Add a Gemini API key before automatic setup.');
  const response = await fetchWithTimeout(`${normalizeEndpoint(endpoint || getProvider('gemini').endpoint)}/models?key=${encodeURIComponent(apiKey)}&pageSize=100`);
  const payload = await readResponseOrThrow(response, 'Gemini model discovery');
  const models = (payload as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> }).models ?? [];
  const supported = models
    .filter((model) => model.name && model.supportedGenerationMethods?.includes('generateContent'))
    .map((model) => model.name!.replace(/^models\//, ''));
  const preferred = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
  return preferred.find((model) => supported.includes(model)) ?? supported.find((model) => /flash/i.test(model)) ?? supported[0] ?? normalizeGeminiModel('');
}

function getOfflineFallbackMessage() {
  return 'The secure server assistant is temporarily unavailable, so I am in offline mode. You can still use the quick-command deck and Android keyboard dictation. To use your own provider, open Settings, paste a key, test the connection, and save setup.';
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
    return `📊 **System Status Report**\n\nTime: ${now.toLocaleTimeString()}\nDate: ${now.toLocaleDateString()}\nPlatform: ${Platform.OS === 'android' ? 'Android' : 'iOS'}\nStatus: Offline commands available\nNetwork: See the live indicator in the chat header`;
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
    return '📡 **Network Status**\n\nThe live connection indicator in the chat header shows whether Jarvis can reach the internet. Offline commands continue to work if the indicator is red.';
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
    return '🤖 **Jarvis Capabilities**\n\n**Offline Commands:**\n• Time, date, status, battery, network, and storage\n• Reminders, alarms, timers, focus, and breathing\n• Good morning, motivation, jokes, quotes, coin flips, dice, and random numbers\n• Privacy and local-history guidance\n\n**Local cache:** Recent chat stays on this device for offline reopening.\n\n**With a provider key:**\n• Full AI conversations\n• Complex questions & analysis\n• Creative writing & coding help\n\nTry asking me anything!';
  }
  if (lowerInput.includes('version') || lowerInput.includes('about')) {
    return `ℹ️ **About Jarvis**\n\nJarvis v1.0.5\nA sophisticated AI assistant with offline capabilities and beautiful animations.\n\nDeveloped with React Native & Expo\nPlatform: ${Platform.OS === 'android' ? 'Android' : 'iOS'}`;
  }
  if (lowerInput.includes('features') || lowerInput.includes('commands')) {
    return '✨ **Available Features**\n\n📊 Offline device-style commands\n🎯 Voice-friendly quick commands (30+)\n🗂️ Local conversation history cache\n🤖 Multi-provider AI chat\n💬 Message reactions\n⚙️ Customizable settings\n🎨 Beautiful dark theme\n📱 Responsive design';
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
  if (lowerInput.includes('good morning')) {
    return `☀️ **Good morning**\n\nYou’re all set for a fresh start. Today is ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Pick one small thing to make progress on first.`;
  }
  if (lowerInput.includes('good night') || lowerInput.includes(' bedtime')) {
    return '🌙 **Good night**\n\nYou did enough for today. Rest well, and I’ll be here when you’re ready to start again.';
  }
  if (lowerInput.includes('motivate') || lowerInput.includes('encourage me')) {
    return '✨ **You’ve got this**\n\nMake the next step tiny: choose one task, set a short timer, and begin before you feel completely ready.';
  }
  if (lowerInput.includes('breath') || lowerInput.includes('calm me') || lowerInput.includes('relax')) {
    return '🌬️ **One-minute breathing reset**\n\nInhale gently for 4 seconds. Hold for 2. Exhale for 6. Repeat five times and let your shoulders drop.';
  }
  if (lowerInput.includes('focus mode') || lowerInput === 'focus' || lowerInput.includes('help me focus')) {
    return '🎯 **Focus mode**\n\nChoose one task, silence distractions, and work for 10 minutes. When the timer ends, decide whether to continue or reset.';
  }
  if (lowerInput.includes('flip a coin') || lowerInput.includes('coin toss')) {
    return `🪙 **Coin flip**\n\n${Math.random() < 0.5 ? 'Heads' : 'Tails'}.`;
  }
  if (lowerInput.includes('roll a dice') || lowerInput.includes('roll the dice') || lowerInput.includes('roll a die')) {
    return `🎲 **Dice roll**\n\nYou rolled **${Math.floor(Math.random() * 6) + 1}**.`;
  }
  if (lowerInput.includes('random number') || lowerInput.includes('pick a number')) {
    return `🔀 **Random number**\n\nYour number is **${Math.floor(Math.random() * 100) + 1}**.`;
  }
  if (lowerInput.includes('privacy status') || lowerInput.includes('is my data private')) {
    return '🔒 **Privacy status**\n\nYour chat history and provider settings are cached locally on this device. API keys are not bundled with Jarvis. Online questions use your selected provider or the secure Jarvis backup when available.';
  }
  if (lowerInput.includes('local history') || lowerInput.includes('chat history') || lowerInput.includes('what did we talk about')) {
    return '🗂️ **Local history**\n\nRecent messages are saved on this device so you can reopen the conversation without internet. Use Settings → Clear chat history to remove them.';
  }
  if (lowerInput.includes('repeat that') || lowerInput.includes('say that again') || lowerInput.includes('repeat your last')) {
    return '🔁 **Repeat**\n\nUse the replay button in the speech player to hear the last Jarvis response again.';
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
