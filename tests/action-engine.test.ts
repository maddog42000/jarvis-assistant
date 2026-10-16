import { describe, expect, it, vi } from 'vitest';
import { runWorkflow, validateActionStep, validateWorkflow } from '../lib/actions/action-engine';

describe('Jarvis action engine', () => {
  it('rejects arbitrary action names and unsafe URL schemes', () => {
    expect(validateActionStep({ id: 'x', action: 'runShell', args: {} }).ok).toBe(false);
    expect(validateActionStep({ id: 'x', action: 'openUrl', args: { url: 'javascript:alert(1)' } }).ok).toBe(false);
  });

  it('rejects duplicate step ids and oversized workflows', () => {
    expect(validateWorkflow({ id: 'test', name: 'Test', steps: [
      { id: 'same', action: 'searchWeb', args: { query: 'one' } },
      { id: 'same', action: 'searchWeb', args: { query: 'two' } },
    ] }).ok).toBe(false);
    expect(validateWorkflow({ id: 'test', name: 'Test', steps: Array.from({ length: 9 }, (_, i) => ({
      id: String(i), action: 'searchWeb', args: { query: 'x' },
    })) }).ok).toBe(false);
  });

  it('runs approved steps in order and stops when a step fails', async () => {
    const calls: string[] = [];
    const result = await runWorkflow({
      id: 'demo', name: 'Demo', steps: [
        { id: 'first', action: 'searchWeb', args: { query: 'Jarvis' } },
        { id: 'second', action: 'openClock', args: { kind: 'timer' } },
        { id: 'third', action: 'openApp', args: { app: 'chrome' } },
      ],
    }, {
      searchWeb: async () => { calls.push('search'); return { ok: true, message: 'searched' }; },
      openClock: async () => { calls.push('clock'); return { ok: false, message: 'clock unavailable' }; },
      openApp: async () => { calls.push('app'); return { ok: true, message: 'opened' }; },
    });

    expect(result.ok).toBe(false);
    expect(result.completed).toBe(1);
    expect(calls).toEqual(['search', 'clock']);
  });

  it('uses bounded optional delays and reports missing platform handlers', async () => {
    const wait = vi.fn(async () => undefined);
    const result = await runWorkflow({
      id: 'demo', name: 'Demo', steps: [{ id: 'first', action: 'searchWeb', args: { query: 'test' }, delayMs: 20 }],
    }, {}, { wait });
    expect(wait).toHaveBeenCalledWith(20);
    expect(result.message).toContain('not available');
  });
});
