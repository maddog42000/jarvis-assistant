import { getFallbackDiagnostic, runFallbackChain } from '../lib/fallback-routing';

async function main() {
  const result = await runFallbackChain([
    { id: 'Gemini', run: async () => { throw new Error('simulated 403'); } },
    { id: 'OpenAI', run: async () => { throw new Error('simulated timeout'); } },
    { id: 'Jarvis secure backup', run: async () => 'simulated backup response' },
  ], 50);

  if (result.used !== 'Jarvis secure backup' || result.value !== 'simulated backup response') {
    throw new Error('Expected secure backup to answer after provider failures.');
  }
  if (!getFallbackDiagnostic(result).includes('Gemini, OpenAI')) {
    throw new Error('Expected diagnostics to list failed providers.');
  }

  const timeoutResult = await runFallbackChain([
    { id: 'Slow provider', run: () => new Promise<string>(() => undefined) },
    { id: 'Backup', run: async () => 'timeout fallback response' },
  ], 10);
  if (timeoutResult.used !== 'Backup') throw new Error('Expected timeout to advance to backup.');

  console.log('Fallback routing simulation passed: provider failure and timeout both reach backup.');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
