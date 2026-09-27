export type FallbackStep = {
  id: string;
  run: () => Promise<string>;
};

export type FallbackResult = {
  value: string;
  used: string;
  failures: Array<{ id: string; message: string }>;
};

export function timeoutError(id: string, timeoutMs: number) {
  return new Error(`${id} timed out after ${timeoutMs}ms`);
}

function runWithTimeout(step: FallbackStep, timeoutMs: number) {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(timeoutError(step.id, timeoutMs)), timeoutMs);
    step.run().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function runFallbackChain(
  steps: FallbackStep[],
  timeoutMs = 15000,
): Promise<FallbackResult> {
  const failures: FallbackResult['failures'] = [];

  for (const step of steps) {
    try {
      const value = await runWithTimeout(step, timeoutMs);
      if (value.trim()) return { value: value.trim(), used: step.id, failures };
      failures.push({ id: step.id, message: 'empty response' });
    } catch (error) {
      failures.push({ id: step.id, message: error instanceof Error ? error.message : 'unknown error' });
    }
  }

  throw new Error(failures.map((failure) => `${failure.id}: ${failure.message}`).join(' | ') || 'No assistant routes configured.');
}

export function getFallbackDiagnostic(result: FallbackResult) {
  if (!result.failures.length) return `Connected through ${result.used}.`;
  return `Connected through ${result.used} after ${result.failures.map((failure) => failure.id).join(', ')} was unavailable.`;
}
