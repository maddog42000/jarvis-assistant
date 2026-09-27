import { describe, expect, it } from 'vitest';
import { getFallbackDiagnostic, runFallbackChain } from '../lib/fallback-routing';

describe('fallback routing', () => {
  it('continues to secure backup after provider failure', async () => {
    const result = await runFallbackChain([
      { id: 'Gemini', run: async () => { throw new Error('403'); } },
      { id: 'Jarvis secure backup', run: async () => 'backup answer' },
    ], 50);

    expect(result.used).toBe('Jarvis secure backup');
    expect(result.value).toBe('backup answer');
    expect(getFallbackDiagnostic(result)).toContain('Gemini');
  });

  it('advances after a provider timeout', async () => {
    const result = await runFallbackChain([
      { id: 'Slow provider', run: () => new Promise<string>(() => undefined) },
      { id: 'Backup', run: async () => 'timeout answer' },
    ], 10);

    expect(result.used).toBe('Backup');
    expect(result.failures[0]?.message).toContain('timed out');
  });
});
