import { describe, expect, it } from 'vitest';

import { MAX_CACHED_MESSAGES, normalizeCachedHistory, serializeCachedHistory } from '../lib/local-history';

describe('local history cache', () => {
  it('drops malformed entries and keeps valid message fields', () => {
    const result = normalizeCachedHistory([
      { role: 'user', content: 'hello', timestamp: 1 },
      { role: 'system', content: 'ignore me' },
      null,
      { role: 'assistant', content: 'reply', timestamp: 2, isOfflineCommand: true },
    ]);
    expect(result).toHaveLength(2);
    expect(result[1].isOfflineCommand).toBe(true);
  });

  it('keeps only the newest bounded history entries', () => {
    const entries = Array.from({ length: MAX_CACHED_MESSAGES + 10 }, (_, index) => ({
      role: 'user' as const,
      content: `message ${index}`,
      timestamp: index,
    }));
    const result = normalizeCachedHistory(entries);
    expect(result).toHaveLength(MAX_CACHED_MESSAGES);
    expect(result[0].content).toBe('message 10');
  });

  it('serializes a cache payload that can be restored', () => {
    const serialized = serializeCachedHistory([{ id: '1', role: 'user', content: 'offline', timestamp: 1 }]);
    expect(normalizeCachedHistory(JSON.parse(serialized))[0].content).toBe('offline');
  });
});
