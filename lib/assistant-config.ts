export type ProviderId = 'openai' | 'gemini' | 'anthropic' | 'custom';

export type AgentProfile = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
};

export type ProviderDefinition = {
  id: ProviderId;
  name: string;
  description: string;
  endpoint: string;
  model: string;
  keyHint: string;
  keyUrl: string;
};

export type AssistantConfig = {
  providerId: ProviderId;
  apiKey: string;
  endpoint: string;
  model: string;
  agentId: string;
  agents: AgentProfile[];
};

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI Chat Completions and compatible endpoints.',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    keyHint: 'sk-proj-…',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google AI Studio Gemini generateContent API.',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash',
    keyHint: 'AIza…',
    keyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Anthropic Messages API.',
    endpoint: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-haiku-latest',
    keyHint: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'custom',
    name: 'Custom OpenAI-compatible',
    description: 'A self-hosted or third-party endpoint using /chat/completions.',
    endpoint: 'https://your-endpoint.example/v1',
    model: 'your-model',
    keyHint: 'Provider key',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
];

export const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: 'jarvis',
    name: 'Jarvis',
    description: 'Balanced, concise, and practical.',
    systemPrompt: 'You are Jarvis, a capable personal assistant. Be helpful, concise, practical, and transparent about limitations. Keep responses under 250 words unless the user asks for detail.',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Structured analysis with clear assumptions.',
    systemPrompt: 'You are Jarvis Researcher. Explain assumptions, distinguish known facts from uncertainty, and organize answers with concise headings. Do not invent sources or claim to have browsed unless browsing is actually available.',
  },
  {
    id: 'coder',
    name: 'Code partner',
    description: 'Focused help for debugging and implementation.',
    systemPrompt: 'You are Jarvis Code Partner. Give precise technical answers, small correct examples, and call out likely failure modes. Prefer maintainable, buildable solutions over cleverness.',
  },
  {
    id: 'coach',
    name: 'Coach',
    description: 'Encouraging, direct, and action-oriented.',
    systemPrompt: 'You are Jarvis Coach. Be warm, motivating, and direct. Turn vague goals into practical next steps while respecting the user’s autonomy and constraints.',
  },
];

export function getProvider(providerId: ProviderId) {
  return PROVIDERS.find((provider) => provider.id === providerId) ?? PROVIDERS[0];
}

export function getAgent(config: Pick<AssistantConfig, 'agentId' | 'agents'>) {
  return config.agents.find((agent) => agent.id === config.agentId) ?? DEFAULT_AGENTS[0];
}

export function normalizeEndpoint(endpoint: string) {
  return endpoint.trim().replace(/\/+$/, '');
}

export function getProviderKeyUrl(providerId: ProviderId) {
  return getProvider(providerId).keyUrl;
}
