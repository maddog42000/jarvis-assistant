import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { validateWorkflow, type ActionId, type ActionStep, type ActionWorkflow } from '@/lib/actions/action-engine';
import { BUILT_IN_WORKFLOWS, importWorkflowJson } from '@/lib/actions/built-in-workflows';

const WORKFLOW_STORAGE_KEY = 'jarvis_action_workflows_v1';
const SCHEDULE_STORAGE_KEY = 'jarvis_scheduled_routines_v1';

type ScheduledRoutine = {
  id: string;
  workflowId: string;
  workflowName: string;
  notificationId: string;
  hour: number;
  minute: number;
  createdAt: string;
};

const ACTION_CHOICES: { id: ActionId; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'searchWeb', label: 'Search the web', icon: 'search' },
  { id: 'openUrl', label: 'Open a website', icon: 'language' },
  { id: 'openApp', label: 'Open an app', icon: 'apps' },
  { id: 'openClock', label: 'Open Clock', icon: 'schedule' },
  { id: 'setReminder', label: 'Set a reminder', icon: 'notifications-active' },
  { id: 'setAlarm', label: 'Set an alarm', icon: 'alarm' },
  { id: 'openAccessibilitySettings', label: 'Open accessibility settings', icon: 'accessibility' },
];

function makeStep(action: ActionId, index: number): ActionStep {
  const id = `step-${Date.now()}-${index}`;
  switch (action) {
    case 'searchWeb': return { id, action, args: { query: 'weather today', provider: 'google' } };
    case 'openUrl': return { id, action, args: { url: 'https://calendar.google.com/' } };
    case 'openApp': return { id, action, args: { app: 'chrome' } };
    case 'openClock': return { id, action, args: { kind: 'timer' } };
    case 'setReminder': return { id, action, args: { title: 'Check my Jarvis routine', at: new Date(Date.now() + 3600000).toISOString() } };
    case 'setAlarm': return { id, action, args: { hour: 7, minute: 0, label: 'Jarvis routine' } };
    case 'openAccessibilitySettings': return { id, action, args: {} };
    default: return { id, action: 'searchWeb', args: { query: 'weather today', provider: 'google' } };
  }
}

function actionLabel(action: ActionId): string {
  return ACTION_CHOICES.find((item) => item.id === action)?.label ?? action;
}

export default function BuilderScreen() {
  const [name, setName] = useState('My new routine');
  const [steps, setSteps] = useState<ActionStep[]>([makeStep('searchWeb', 0)]);
  const [saved, setSaved] = useState<ActionWorkflow[]>([]);
  const [routines, setRoutines] = useState<ScheduledRoutine[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('07:00');
  const [status, setStatus] = useState('Build a routine by adding actions in the order you want them to run.');

  const allWorkflows = useMemo(() => [...BUILT_IN_WORKFLOWS, ...saved], [saved]);
  const selectedWorkflow = allWorkflows.find((item) => item.id === selectedWorkflowId) ?? allWorkflows[0];

  const loadData = useCallback(async () => {
    try {
      const [rawWorkflows, rawSchedules] = await Promise.all([
        AsyncStorage.getItem(WORKFLOW_STORAGE_KEY),
        AsyncStorage.getItem(SCHEDULE_STORAGE_KEY),
      ]);
      if (rawWorkflows) {
        const parsed: unknown = JSON.parse(rawWorkflows);
        if (Array.isArray(parsed)) {
          const valid = parsed.map((item) => {
            try { return importWorkflowJson(JSON.stringify(item)); } catch { return null; }
          }).filter((item): item is ActionWorkflow => item !== null);
          setSaved(valid.filter((item) => !BUILT_IN_WORKFLOWS.some((builtin) => builtin.id === item.id)));
          if (valid.length) setSelectedWorkflowId(valid[0].id);
        }
      }
      if (rawSchedules) {
        const parsed: unknown = JSON.parse(rawSchedules);
        if (Array.isArray(parsed)) setRoutines(parsed as ScheduledRoutine[]);
      }
    } catch {
      setStatus('Some saved automation data could not be loaded. You can still build a new routine.');
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateArg = (index: number, key: string, value: string | number) => {
    setSteps((current) => current.map((step, i) => i === index ? { ...step, args: { ...step.args, [key]: value } } : step));
  };

  const addStep = (action: ActionId) => {
    if (steps.length >= 8) {
      setStatus('A routine can contain up to 8 actions.');
      return;
    }
    setSteps((current) => [...current, makeStep(action, current.length)]);
  };

  const saveRoutine = async () => {
    const id = `custom-${Date.now()}`;
    const result = validateWorkflow({ id, name, steps });
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    const next = [...saved.filter((item) => item.name !== result.workflow.name), result.workflow];
    await AsyncStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(next));
    setSaved(next);
    setSelectedWorkflowId(id);
    setStatus(`Saved "${result.workflow.name}". You can now schedule a daily reminder for it below.`);
  };

  const scheduleDaily = async () => {
    if (!selectedWorkflow) return;
    const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(scheduleTime.trim());
    if (!match) {
      setStatus('Enter a 24-hour time such as 07:30 or 18:45.');
      return;
    }
    const [hour, minute] = scheduleTime.split(':').map(Number);
    const permission = await Notifications.getPermissionsAsync();
    const granted = permission.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) {
      setStatus('Notifications are disabled. Allow Jarvis notifications in Android settings to create scheduled reminders.');
      return;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('jarvis-routines', {
        name: 'Jarvis scheduled routines',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 150, 200],
      });
    }
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Jarvis routine: ${selectedWorkflow.name}`,
        body: 'Your scheduled routine is ready. Tap to open Jarvis and review/run it.',
        data: { workflowId: selectedWorkflow.id, kind: 'scheduled-routine' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'jarvis-routines',
      },
    });
    const record: ScheduledRoutine = {
      id: `${Date.now()}`,
      workflowId: selectedWorkflow.id,
      workflowName: selectedWorkflow.name,
      notificationId,
      hour,
      minute,
      createdAt: new Date().toISOString(),
    };
    const next = [...routines, record];
    await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(next));
    setRoutines(next);
    setStatus(`Daily reminder scheduled for ${scheduleTime}. Android will show a notification; tap it to open Jarvis and run the routine.`);
  };

  const removeSchedule = (routine: ScheduledRoutine) => {
    Alert.alert('Remove scheduled reminder?', `Stop the daily reminder for "${routine.workflowName}"?`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        void Notifications.cancelScheduledNotificationAsync(routine.notificationId).catch(() => undefined).then(async () => {
          const next = routines.filter((item) => item.id !== routine.id);
          await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(next));
          setRoutines(next);
          setStatus('Scheduled reminder removed.');
        });
      } },
    ]);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-xs uppercase tracking-widest text-primary font-bold">No-code studio</Text>
        <Text className="text-3xl font-bold text-foreground mt-1">Automation Builder</Text>
        <Text className="text-sm text-muted leading-relaxed mt-2 mb-5">Create reusable routines by choosing actions and filling in a few details. No JSON or programming required.</Text>

        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-base font-bold text-foreground mb-2">1. Name your routine</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Getting ready for work" placeholderTextColor="#77808c" className="bg-background border border-border rounded-xl px-3 py-3 text-foreground" />
          <Text className="text-base font-bold text-foreground mt-5 mb-2">2. Build your action sequence</Text>
          {steps.map((step, index) => (
            <View key={step.id} className="border border-border bg-background rounded-xl p-3 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-foreground">Step {index + 1}: {actionLabel(step.action)}</Text>
                <Pressable onPress={() => setSteps((current) => current.filter((_, i) => i !== index))} disabled={steps.length === 1}>
                  <MaterialIcons name="delete-outline" size={20} color={steps.length === 1 ? '#59636e' : '#ef8585'} />
                </Pressable>
              </View>
              {step.action === 'searchWeb' && <Field label="Search terms" value={String(step.args.query ?? '')} onChangeText={(v) => updateArg(index, 'query', v)} />}
              {step.action === 'openUrl' && <Field label="Website URL (https://)" value={String(step.args.url ?? '')} onChangeText={(v) => updateArg(index, 'url', v)} />}
              {step.action === 'openApp' && <ChoiceRow label="App" value={String(step.args.app)} choices={['google', 'gemini', 'chrome', 'bixby']} onChange={(v) => updateArg(index, 'app', v)} />}
              {step.action === 'openClock' && <ChoiceRow label="Clock action" value={String(step.args.kind)} choices={['timer', 'alarm']} onChange={(v) => updateArg(index, 'kind', v)} />}
              {step.action === 'setReminder' && <>
                <Field label="Reminder text" value={String(step.args.title ?? '')} onChangeText={(v) => updateArg(index, 'title', v)} />
                <Field label="When (ISO date/time)" value={String(step.args.at ?? '')} onChangeText={(v) => updateArg(index, 'at', v)} />
              </>}
              {step.action === 'setAlarm' && <>
                <Field label="Hour (0-23)" value={String(step.args.hour ?? 7)} keyboardType="numeric" onChangeText={(v) => updateArg(index, 'hour', Number(v))} />
                <Field label="Minute (0-59)" value={String(step.args.minute ?? 0)} keyboardType="numeric" onChangeText={(v) => updateArg(index, 'minute', Number(v))} />
                <Field label="Alarm label" value={String(step.args.label ?? 'Jarvis alarm')} onChangeText={(v) => updateArg(index, 'label', v)} />
              </>}
              {step.action === 'openAccessibilitySettings' && <Text className="text-xs text-muted">Opens Android Accessibility settings. Enabling screen control remains your choice.</Text>}
            </View>
          ))}
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Add an action</Text>
          <View className="flex-row flex-wrap gap-2">
            {ACTION_CHOICES.map((choice) => (
              <Pressable key={choice.id} onPress={() => addStep(choice.id)} disabled={steps.length >= 8} className="rounded-lg border border-border bg-background px-3 py-2 flex-row items-center gap-2">
                <MaterialIcons name={choice.icon} size={16} color="#18d5ff" />
                <Text className="text-xs text-foreground">{choice.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => void saveRoutine()} className="bg-primary rounded-xl py-3 mt-5 flex-row justify-center items-center gap-2">
            <MaterialIcons name="save" size={18} color="#061018" />
            <Text className="font-bold text-background">Validate and save routine</Text>
          </Pressable>
        </View>

        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-base font-bold text-foreground">3. Add a daily trigger</Text>
          <Text className="text-xs text-muted leading-relaxed mt-1 mb-3">Choose a saved routine and a time. Jarvis schedules a repeating Android notification. Tapping it opens the app so you can review and run the routine.</Text>
          <Text className="text-xs text-muted font-semibold mb-2">Routine</Text>
          <View className="gap-2 mb-3">
            {allWorkflows.map((workflow) => (
              <Pressable key={workflow.id} onPress={() => setSelectedWorkflowId(workflow.id)} className={`rounded-xl border p-3 flex-row items-center gap-2 ${selectedWorkflow?.id === workflow.id ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                <MaterialIcons name={selectedWorkflow?.id === workflow.id ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color="#18d5ff" />
                <Text className="text-sm text-foreground flex-1">{workflow.name}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="Daily time (24-hour HH:MM)" value={scheduleTime} onChangeText={setScheduleTime} />
          <Pressable onPress={() => void scheduleDaily()} className="rounded-xl border border-primary bg-primary/10 py-3 mt-3 flex-row items-center justify-center gap-2">
            <MaterialIcons name="notifications-active" size={18} color="#18d5ff" />
            <Text className="font-bold text-foreground">Schedule daily reminder</Text>
          </Pressable>
          {routines.length > 0 && <Text className="text-xs font-bold text-muted uppercase tracking-wider mt-5 mb-2">Active schedules</Text>}
          {routines.map((routine) => (
            <View key={routine.id} className="rounded-xl border border-border bg-background p-3 mb-2 flex-row items-center gap-2">
              <MaterialIcons name="event-repeat" size={19} color="#18d5ff" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{routine.workflowName}</Text>
                <Text className="text-xs text-muted">Daily at {String(routine.hour).padStart(2, '0')}:{String(routine.minute).padStart(2, '0')}</Text>
              </View>
              <Pressable onPress={() => removeSchedule(routine)}><MaterialIcons name="delete-outline" size={20} color="#ef8585" /></Pressable>
            </View>
          ))}
        </View>
        <View className="bg-background border border-primary/25 rounded-xl p-3">
          <Text className="text-sm font-semibold text-foreground">Builder status</Text>
          <Text accessibilityLiveRegion="polite" className="text-xs text-muted leading-relaxed mt-1">{status}</Text>
        </View>
        <Text className="text-xs text-muted leading-relaxed mt-4">Safety: each workflow is validated against Jarvis's allowlist and limited to 8 steps. A daily trigger currently creates a notification, not silent background app-control. Android may delay scheduled background work under battery optimization.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function Field({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'numeric' }) {
  return (
    <View className="mb-2">
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType ?? 'default'} autoCapitalize="none" autoCorrect={false} placeholderTextColor="#77808c" className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground" />
    </View>
  );
}

function ChoiceRow({ label, value, choices, onChange }: { label: string; value: string; choices: string[]; onChange: (value: string) => void }) {
  return (
    <View className="mb-2">
      <Text className="text-xs text-muted mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {choices.map((choice) => <Pressable key={choice} onPress={() => onChange(choice)} className={`rounded-lg border px-3 py-2 ${value === choice ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}><Text className="text-xs text-foreground">{choice}</Text></Pressable>)}
      </View>
    </View>
  );
}
