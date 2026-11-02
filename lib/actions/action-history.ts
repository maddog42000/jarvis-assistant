import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'jarvis_action_activity_v1';
const MAX_ACTIVITY_ITEMS = 60;

export type WorkflowActivityRecord = {
  id: string;
  workflowId: string;
  workflowName: string;
  createdAt: string;
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  message: string;
};

function isRecord(value: unknown): value is WorkflowActivityRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && typeof item.workflowId === 'string'
    && typeof item.workflowName === 'string'
    && typeof item.createdAt === 'string'
    && typeof item.success === 'boolean'
    && typeof item.completedSteps === 'number'
    && typeof item.totalSteps === 'number'
    && typeof item.message === 'string';
}

export async function readWorkflowActivity(): Promise<WorkflowActivityRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).slice(0, MAX_ACTIVITY_ITEMS);
  } catch {
    return [];
  }
}

export async function appendWorkflowActivity(record: WorkflowActivityRecord): Promise<void> {
  const current = await readWorkflowActivity();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...current].slice(0, MAX_ACTIVITY_ITEMS)));
}

export async function clearWorkflowActivity(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
