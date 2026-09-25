import { describe, expect, it } from 'vitest';

import { CURRENT_GEMINI_MODEL, DEFAULT_AGENTS, getAgent, getProvider, normalizeEndpoint, normalizeGeminiModel } from '../lib/assistant-config';
import { buildServerAssistantInput, getServerFallbackNotice } from '../lib/server-assistant';

describe('assistant configuration', () => {
  it('returns provider defaults for each supported provider', () => {
    expect(getProvider('openai').endpoint).toBe('https://api.openai.com/v1');
    expect(getProvider('gemini').endpoint).toContain('generativelanguage.googleapis.com');
    expect(getProvider('anthropic').endpoint).toBe('https://api.anthropic.com/v1');
  });

  it('normalizes endpoint slashes without changing the protocol', () => {
    expect(normalizeEndpoint('https://api.example.com/v1///')).toBe('https://api.example.com/v1');
  });

  it('migrates retired Gemini Flash model ids to the current default', () => {
    expect(normalizeGeminiModel('gemini-2.0-flash')).toBe(CURRENT_GEMINI_MODEL);
    expect(normalizeGeminiModel('')).toBe(CURRENT_GEMINI_MODEL);
  });

  it('falls back to the default local agent when the saved id is missing', () => {
    expect(getAgent({ agentId: 'missing', agents: DEFAULT_AGENTS }).id).toBe('jarvis');
  });

  it('keeps secure proxy payloads bounded while preserving companion context', () => {
    const payload = buildServerAssistantInput(
      'You are Jarvis.',
      Array.from({ length: 15 }, (_, index) => ({ role: 'user' as const, content: ` turn ${index} ` })),
      { name: 'Sam', focus: 'launch', notes: ['likes concise answers'] },
    );
    expect(payload.messages).toHaveLength(12);
    expect(payload.messages[0].content).toBe('turn 3');
    expect(payload.systemPrompt).toContain('name=Sam');
    expect(payload.systemPrompt.length).toBeLessThanOrEqual(4000);
  });

  it('explains that provider failover stays inside Jarvis', () => {
    expect(getServerFallbackNotice('Google Gemini')).toContain('You stayed in this chat');
  });
});
