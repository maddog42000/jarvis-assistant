import { describe, expect, it } from 'vitest';

import { CURRENT_GEMINI_MODEL, DEFAULT_AGENTS, getAgent, getProvider, normalizeEndpoint, normalizeGeminiModel } from '../lib/assistant-config';

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
});
