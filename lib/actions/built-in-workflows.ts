import { validateWorkflow, type ActionWorkflow } from './action-engine';

export const BUILT_IN_WORKFLOWS: ActionWorkflow[] = [
  {
    id: 'morning-brief',
    name: 'Morning search',
    steps: [
      { id: 'open-weather-search', action: 'searchWeb', args: { query: 'weather today', provider: 'google' } },
      { id: 'open-news-search', action: 'searchWeb', args: { query: 'latest news today', provider: 'google' }, delayMs: 500 },
    ],
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
