/**
 * React Native/Hermes does not guarantee a global DOMException constructor.
 * Detect fetch aborts structurally so timeout handling works on Android and web.
 */
export function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null &&
    'name' in error && (error as { name?: unknown }).name === 'AbortError';
}
