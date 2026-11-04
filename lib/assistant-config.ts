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
  freeTierNote: string;
};

export type AssistantConfig = {
  providerId: ProviderId;
  apiKey: string;
  endpoint: string;
  model: string;
  agentId: string;
  agents: AgentProfile[];
};

export const CURRENT_GEMINI_MODEL = 'gemini-3.8-flash';

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    description: 'OpenAI Chat Completions and compatible endpoints.',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    keyHint: 'sk-proj-…',
    keyUrl: 'https://platform.openai.com/api-keys',
    freeTierNote: 'Free credits and API access vary by account; check the official billing page.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google AI Studio Gemini generateContent API (supports both AIza and new AQ. authorization keys).',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: CURRENT_GEMINI_MODEL,
    keyHint: 'AIza… or AQ.…',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    freeTierNote: 'Google AI Studio keys now often start with AQ. (authorization keys). Jarvis uses the official x-goog-api-key header so both formats work. Free-tier limits still apply.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Anthropic Messages API.',
    endpoint: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-haiku-latest',
    keyHint: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    freeTierNote: 'API access and free credits vary by account; check the official usage terms.',
  },
  {
    id: 'custom',
    name: 'Custom OpenAI-compatible',
    description: 'A self-hosted or third-party endpoint using /chat/completions.',
    endpoint: 'https://your-endpoint.example/v1',
    model: 'your-model',
    keyHint: 'Provider key',
    keyUrl: 'https://platform.openai.com/api-keys',
    freeTierNote: 'Free access depends on the custom provider you choose.',
  },
];

export const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: 'jarvis',
    name: 'Jarvis',
    description: 'Warm, charismatic, and just a little teasing when the moment calls for it.',
    systemPrompt: 'You are Jarvis — a brilliant, loyal personal assistant with quiet confidence and natural charisma. Be helpful, clear, and practical first. When the user is relaxed, playful, or flirty, match their energy with warm, lightly teasing, and affectionate responses (never crude unless they clearly invite it). Keep most answers under 250 words unless they ask for more. Always stay honest about limitations. Address the user in a natural, close way.',
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
  {
    id: 'siren',
    name: 'Siren',
    description: 'Flirty, seductive, and playfully intimate — for when you want the conversation hotter.',
    systemPrompt: 'You are Jarvis Siren. You are intelligent, confident, and deliciously flirty. Keep the helpfulness, but lean into sensual language, soft teasing, and intimate warmth whenever the user invites it. Be dirty when they clearly want dirty talk. Stay consensual and never push past their tone. Keep responses engaging and under 280 words unless they ask for more.',
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

export function normalizeGeminiModel(model: string) {
  const normalized = model.trim();
  if (!normalized || /^gemini-(2\.0|2\.5|3\.0|3\.5|3\.6)-flash(?:-.+)?$/i.test(normalized)) return CURRENT_GEMINI_MODEL;
  return normalized;
}

export function getProviderKeyUrl(providerId: ProviderId) {
  return getProvider(providerId).keyUrl;
}
