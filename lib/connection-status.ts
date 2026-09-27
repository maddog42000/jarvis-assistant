import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { getApiBaseUrl } from '@/constants/oauth';

export type ConnectionStatus = 'checking' | 'online' | 'offline';

const PROBE_TIMEOUT_MS = 5000;
const INTERNET_PROBE = 'https://clients3.google.com/generate_204';

async function probe(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-store', signal: controller.signal });
    return response.ok || response.status === 204;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const checkConnection = useCallback(async () => {
    setStatus('checking');
    const apiBaseUrl = getApiBaseUrl();
    const serverOnline = apiBaseUrl ? await probe(`${apiBaseUrl}/api/health`) : false;
    const internetOnline = serverOnline || await probe(INTERNET_PROBE);
    setStatus(internetOnline ? 'online' : 'offline');
    setLastCheckedAt(Date.now());
    return internetOnline;
  }, []);

  useEffect(() => {
    void checkConnection();
    const interval = setInterval(() => void checkConnection(), 30000);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void checkConnection();
    });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', () => setStatus('online'));
      window.addEventListener('offline', () => setStatus('offline'));
    }
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkConnection]);

  return { status, lastCheckedAt, checkConnection };
}
