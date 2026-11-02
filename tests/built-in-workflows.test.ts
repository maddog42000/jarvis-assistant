import { describe, expect, it } from 'vitest';
import { BUILT_IN_WORKFLOWS, exportWorkflowJson, importWorkflowJson } from '../lib/actions/built-in-workflows';

describe('built-in action workflows', () => {
  it('exports and imports a valid workflow', () => {
    const json = exportWorkflowJson(BUILT_IN_WORKFLOWS[0]);
    expect(importWorkflowJson(json)).toEqual(BUILT_IN_WORKFLOWS[0]);
  });

  it('keeps the new daily routines valid and within the workflow safety limits', () => {
    const expected = ['morning-dashboard', 'focus-session', 'evening-wind-down'];
    for (const id of expected) {
      const workflow = BUILT_IN_WORKFLOWS.find((item) => item.id === id);
      expect(workflow).toBeDefined();
      expect(() => exportWorkflowJson(workflow!)).not.toThrow();
      expect(workflow!.steps.length).toBeLessThanOrEqual(8);
    }
  });

  it('rejects invalid JSON and unsafe action ids', () => {
    expect(() => importWorkflowJson('{')).toThrow('not valid JSON');
    expect(() => importWorkflowJson(JSON.stringify({
      id: 'bad', name: 'Bad', steps: [{ id: 'run', action: 'shell', args: { command: 'whoami' } }],
    }))).toThrow('not allowed');
  });
});
