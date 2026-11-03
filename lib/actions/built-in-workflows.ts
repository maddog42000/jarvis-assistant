import { validateWorkflow, type ActionWorkflow } from './action-engine';

export const BUILT_IN_WORKFLOWS: ActionWorkflow[] = [
  {
    id: 'launch-google',
    name: 'Open Google',
    steps: [{ id: 'open-google', action: 'openApp', args: { app: 'google' } }],
  },
  {
    id: 'launch-chrome',
    name: 'Open Chrome',
    steps: [{ id: 'open-chrome', action: 'openApp', args: { app: 'chrome' } }],
  },
  {
    id: 'launch-bixby',
    name: 'Open Bixby',
    steps: [{ id: 'open-bixby', action: 'openApp', args: { app: 'bixby' } }],
  },
  {
    id: 'start-focus-timer',
    name: 'Start a 25-minute focus timer',
    steps: [{ id: 'focus-timer', action: 'openClock', args: { kind: 'timer', seconds: 1500 } }],
  },
  {
    id: 'morning-dashboard',
    name: 'Morning brief: weather and news',
    steps: [
      { id: 'weather', action: 'searchWeb', args: { query: 'weather today', provider: 'google' } },
      { id: 'news', action: 'searchWeb', args: { query: 'top news today', provider: 'google' }, delayMs: 500 },
    ],
  },

  {
    id: 'enable-screen-actions',
    name: 'Open Accessibility Settings',
    steps: [{ id: 'open-accessibility-settings', action: 'openAccessibilitySettings', args: {} }],
  },
  {
    id: 'open-gemini',
    name: 'Open Gemini',
    steps: [{ id: 'launch-gemini', action: 'openApp', args: { app: 'gemini' } }],
  },
];

export function exportWorkflowJson(workflow: ActionWorkflow): string {
  const validated = validateWorkflow(workflow);
  if (!validated.ok) throw new Error(validated.error);
  return JSON.stringify(validated.workflow, null, 2);
}

export function importWorkflowJson(json: string): ActionWorkflow {
  if (json.length > 16000) throw new Error('Workflow JSON is too large. Keep it under 16 KB.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Workflow file is not valid JSON.');
  }
  const validated = validateWorkflow(parsed);
  if (!validated.ok) throw new Error(validated.error);
  return validated.workflow;
}
