export type CachedHistoryMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isOfflineCommand?: boolean;
};

export const MAX_CACHED_MESSAGES = 100;

export function normalizeCachedHistory(raw: unknown): CachedHistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .filter((item) => (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `cached-${index}-${item.timestamp ?? Date.now()}`,
      role: item.role as 'user' | 'assistant',
      content: item.content as string,
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
      isOfflineCommand: item.isOfflineCommand === true,
    }))
    .slice(-MAX_CACHED_MESSAGES);
}

export function limitCachedHistory<T>(messages: T[]) {
  return messages.slice(-MAX_CACHED_MESSAGES);
}

export function serializeCachedHistory(messages: CachedHistoryMessage[]) {
  return JSON.stringify(limitCachedHistory(messages));
}
