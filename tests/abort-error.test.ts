import { describe, expect, it } from 'vitest';
import { isAbortError } from '../lib/abort-error';

describe('isAbortError', () => {
  it('recognizes React Native-style abort errors without DOMException', () => {
    expect(isAbortError({ name: 'AbortError', message: 'Aborted' })).toBe(true);
  });

  it('recognizes native Error objects carrying the AbortError name', () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    expect(isAbortError(error)).toBe(true);
  });

  it('does not classify unrelated errors as aborts', () => {
    expect(isAbortError(new Error('Network request failed'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError('AbortError')).toBe(false);
  });
});
