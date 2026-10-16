/**
 * Jarvis action engine.
 *
 * Workflows are data, never executable JavaScript. Only registered action IDs
 * can run, arguments are validated before dispatch, and workflows stop at the
 * first failure. Native/platform work is supplied by the caller as handlers.
 */
export const ACTION_IDS = ['openUrl', 'searchWeb', 'setReminder', 'openClock', 'openApp'] as const;
export type ActionId = (typeof ACTION_IDS)[number];

export type ActionArguments = {
  openUrl: { url: string };
  searchWeb: { query: string; provider?: 'google' | 'bing' | 'duckduckgo' };
  setReminder: { title: string; at: string };
  openClock: { kind?: 'alarm' | 'timer' };
  openApp: { app: 'google' | 'gemini' | 'chrome' | 'bixby' };
};

export type ActionStep = {
  id: string;
  action: ActionId;
  args: Record<string, unknown>;
  delayMs?: number;
};

export type ActionWorkflow = {
  id: string;
  name: string;
  steps: ActionStep[];
};

export type ActionOutcome = {
  ok: boolean;
  message: string;
  data?: unknown;
};

export type ActionHandler = (args: Record<string, unknown>) => Promise<ActionOutcome>;

export const MAX_WORKFLOW_STEPS = 8;
export const MAX_STEP_DELAY_MS = 5000;
const MAX_TEXT = 240;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyText(value: unknown, max = MAX_TEXT): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}

export function validateActionStep(input: unknown): { ok: true; step: ActionStep } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: 'Each step must be an object.' };
  if (typeof input.id !== 'string' || !/^[a-zA-Z0-9_-]{1,48}$/.test(input.id)) {
    return { ok: false, error: 'Step id must use 1-48 letters, numbers, underscores, or hyphens.' };
  }
  if (typeof input.action !== 'string' || !ACTION_IDS.includes(input.action as ActionId)) {
    return { ok: false, error: 'This action is not allowed.' };
  }
  if (!isRecord(input.args)) return { ok: false, error: 'Step args must be an object.' };
  const args = input.args;
  const delayMs = input.delayMs === undefined ? 0 : input.delayMs;
  if (typeof delayMs !== 'number' || !Number.isInteger(delayMs) || delayMs < 0 || delayMs > MAX_STEP_DELAY_MS) {
    return { ok: false, error: `Step delay must be between 0 and ${MAX_STEP_DELAY_MS} milliseconds.` };
  }

  switch (input.action as ActionId) {
    case 'openUrl': {
      if (typeof args.url !== 'string' || args.url.length > 2048) return { ok: false, error: 'URL is missing or too long.' };
      try {
        const url = new URL(args.url);
        if (!['https:', 'http:'].includes(url.protocol) || !url.hostname) return { ok: false, error: 'Only http and https links are allowed.' };
      } catch {
        return { ok: false, error: 'Enter a valid http or https URL.' };
      }
      break;
    }
    case 'searchWeb':
      if (!nonEmptyText(args.query)) return { ok: false, error: 'Search query must contain 1-240 characters.' };
      if (args.provider !== undefined && !['google', 'bing', 'duckduckgo'].includes(String(args.provider))) return { ok: false, error: 'Unsupported search provider.' };
      break;
    case 'setReminder': {
      if (!nonEmptyText(args.title, 120)) return { ok: false, error: 'Reminder title must contain 1-120 characters.' };
      if (typeof args.at !== 'string' || !Number.isFinite(Date.parse(args.at)) || Date.parse(args.at) <= Date.now()) {
        return { ok: false, error: 'Reminder time must be a valid future date and time.' };
      }
      break;
    }
    case 'openClock':
      if (args.kind !== undefined && !['alarm', 'timer'].includes(String(args.kind))) return { ok: false, error: 'Clock action must be alarm or timer.' };
      break;
    case 'openApp':
      if (!['google', 'gemini', 'chrome', 'bixby'].includes(String(args.app))) return { ok: false, error: 'This app shortcut is not supported.' };
      break;
  }

  return { ok: true, step: { id: input.id, action: input.action as ActionId, args, delayMs } };
}

export function validateWorkflow(input: unknown): { ok: true; workflow: ActionWorkflow } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: 'Workflow must be an object.' };
  if (typeof input.id !== 'string' || !/^[a-zA-Z0-9_-]{1,48}$/.test(input.id)) return { ok: false, error: 'Workflow id is invalid.' };
  if (!nonEmptyText(input.name, 80)) return { ok: false, error: 'Workflow name must contain 1-80 characters.' };
  if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > MAX_WORKFLOW_STEPS) {
    return { ok: false, error: `Workflow must have 1-${MAX_WORKFLOW_STEPS} steps.` };
  }
  const steps: ActionStep[] = [];
  for (const rawStep of input.steps) {
    const result = validateActionStep(rawStep);
    if (!result.ok) return result;
    if (steps.some((step) => step.id === result.step.id)) return { ok: false, error: 'Step ids must be unique within a workflow.' };
    steps.push(result.step);
  }
  return { ok: true, workflow: { id: input.id, name: input.name.trim(), steps } };
}

export async function runWorkflow(
  workflowInput: unknown,
  handlers: Partial<Record<ActionId, ActionHandler>>,
  options: { onStep?: (step: ActionStep, index: number) => void; wait?: (ms: number) => Promise<void> } = {},
): Promise<{ ok: boolean; completed: number; message: string; outcomes: ActionOutcome[] }> {
  const validated = validateWorkflow(workflowInput);
  if (!validated.ok) return { ok: false, completed: 0, message: validated.error, outcomes: [] };
  const outcomes: ActionOutcome[] = [];
  const wait = options.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let index = 0; index < validated.workflow.steps.length; index += 1) {
    const step = validated.workflow.steps[index];
    if (step.delayMs) await wait(step.delayMs);
    options.onStep?.(step, index);
    const handler = handlers[step.action];
    if (!handler) {
      const outcome = { ok: false, message: `Action "${step.action}" is not available on this build.` };
      outcomes.push(outcome);
      return { ok: false, completed: index, message: outcome.message, outcomes };
    }
    try {
      const outcome = await handler(step.args);
      outcomes.push(outcome);
      if (!outcome.ok) return { ok: false, completed: index, message: outcome.message, outcomes };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed unexpectedly.';
      outcomes.push({ ok: false, message });
      return { ok: false, completed: index, message, outcomes };
    }
  }

  return { ok: true, completed: outcomes.length, message: `Completed workflow "${validated.workflow.name}".`, outcomes };
}
