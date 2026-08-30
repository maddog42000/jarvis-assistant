import { describe, expect, it } from 'vitest';

import { DEFAULT_AGENTS, getAgent, getProvider, normalizeEndpoint } from '../lib/assistant-config';

describe('assistant configuration', () => {
  it('returns provider defaults for each supported provider', () => {
    expect(getProvider('openai').endpoint).toBe('https://api.openai.com/v1');
    expect(getProvider('gemini').endpoint).toContain('generativelanguage.googleapis.com');
    expect(getProvider('anthropic').endpoint).toBe('https://api.anthropic.com/v1');
  });

  it('normalizes endpoint slashes without changing the protocol', () => {
    expect(normalizeEndpoint('https://api.example.com/v1///')).toBe('https://api.example.com/v1');
  });

  it('falls back to the default local agent when the saved id is missing', () => {
    expect(getAgent({ agentId: 'missing', agents: DEFAULT_AGENTS }).id).toBe('jarvis');
  });
});
