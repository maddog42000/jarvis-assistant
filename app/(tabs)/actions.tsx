import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { BUILT_IN_WORKFLOWS, exportWorkflowJson, importWorkflowJson } from '@/lib/actions/built-in-workflows';
import { runWorkflow, type ActionWorkflow } from '@/lib/actions/action-engine';
import { createExpoActionHandlers } from '@/lib/actions/expo-action-adapter';

const STORAGE_KEY = 'jarvis_action_workflows_v1';

export default function ActionsScreen() {
  const [workflows, setWorkflows] = useState<ActionWorkflow[]>(BUILT_IN_WORKFLOWS);
  const [selectedId, setSelectedId] = useState(BUILT_IN_WORKFLOWS[0]?.id ?? '');
  const [jsonDraft, setJsonDraft] = useState('');
  const [status, setStatus] = useState('Choose a workflow, or paste a JSON workflow below.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as unknown;
        if (!Array.isArray(saved)) return;
        const valid = saved.map((item) => {
          try { return importWorkflowJson(JSON.stringify(item)); } catch { return null; }
        }).filter((item): item is ActionWorkflow => item !== null);
        if (valid.length) {
          setWorkflows([...BUILT_IN_WORKFLOWS, ...valid.filter((item) => !BUILT_IN_WORKFLOWS.some((builtin) => builtin.id === item.id))]);
        }
      } catch {
        setStatus('Saved workflows could not be loaded. Built-in workflows are still available.');
      }
    })();
  }, []);

  const selected = useMemo(() => workflows.find((workflow) => workflow.id === selectedId) ?? workflows[0], [selectedId, workflows]);

  useEffect(() => {
    if (selected) setJsonDraft(exportWorkflowJson(selected));
  }, [selected]);

  const saveWorkflows = async (next: ActionWorkflow[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next.filter((item) => !BUILT_IN_WORKFLOWS.some((builtin) => builtin.id === item.id))));
    setWorkflows(next);
  };

  const saveDraft = async () => {
    try {
      const workflow = importWorkflowJson(jsonDraft);
      const next = [...workflows.filter((item) => item.id !== workflow.id), workflow];
      await saveWorkflows(next);
      setSelectedId(workflow.id);
      setStatus(`Saved "${workflow.name}" on this device. It will be validated again before running.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save workflow.');
    }
  };

  const importFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const workflow = importWorkflowJson(text);
      const next = [...workflows.filter((item) => item.id !== workflow.id), workflow];
      await saveWorkflows(next);
      setSelectedId(workflow.id);
      setJsonDraft(exportWorkflowJson(workflow));
      setStatus(`Imported "${workflow.name}" from clipboard.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Clipboard did not contain a valid workflow.');
    }
  };

  const exportToClipboard = async () => {
    try {
      const workflow = importWorkflowJson(jsonDraft);
      await Clipboard.setStringAsync(exportWorkflowJson(workflow));
      setStatus('Validated workflow JSON copied to clipboard.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not export workflow.');
    }
  };

  const requestRun = (workflow: ActionWorkflow) => {
    Alert.alert(
      `Run "${workflow.name}"?`,
      `Jarvis will run ${workflow.steps.length} approved action(s). This may open websites/apps or schedule a notification. Continue only if you recognize these actions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Run workflow', onPress: () => void execute(workflow) },
      ],
    );
  };

  const execute = async (workflow: ActionWorkflow) => {
    setBusy(true);
    setStatus(`Starting "${workflow.name}"…`);
    try {
      const result = await runWorkflow(workflow, createExpoActionHandlers(), {
        onStep: (step, index) => setStatus(`Step ${index + 1}/${workflow.steps.length}: ${step.action}`),
      });
      setStatus(result.ok
        ? `Success: ${result.message}`
        : `Stopped after ${result.completed} completed step(s): ${result.message}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Workflow failed.');
    } finally {
      setBusy(false);
    }
  };

  const removeSelected = () => {
    if (!selected || BUILT_IN_WORKFLOWS.some((item) => item.id === selected.id)) {
      setStatus('Built-in workflows cannot be deleted. Edit the JSON and save it with a new workflow id to create your own.');
      return;
    }
    Alert.alert('Delete saved workflow?', `Remove "${selected.name}" from this device?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          const next = workflows.filter((item) => item.id !== selected.id);
          void saveWorkflows(next);
          setSelectedId(BUILT_IN_WORKFLOWS[0]?.id ?? '');
          setStatus('Workflow deleted from this device.');
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-xs uppercase tracking-widest text-primary font-bold">Jarvis automation</Text>
        <Text className="text-3xl font-bold text-foreground mt-1">Action Workflows</Text>
        <Text className="text-sm text-muted leading-relaxed mt-2 mb-5">
          Run approved phone actions or build reusable JSON workflows. Jarvis never executes arbitrary JavaScript or shell commands.
        </Text>

        <View className="bg-surface border border-primary/25 rounded-2xl p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcons name="verified-user" size={20} color="#18d5ff" />
            <Text className="text-base font-bold text-foreground">Built-in and saved workflows</Text>
          </View>
          {workflows.map((workflow) => {
            const active = selected?.id === workflow.id;
            const builtin = BUILT_IN_WORKFLOWS.some((item) => item.id === workflow.id);
            return (
              <Pressable key={workflow.id} onPress={() => setSelectedId(workflow.id)} className={`rounded-xl border p-3 mb-2 flex-row items-center gap-3 ${active ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                <MaterialIcons name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={active ? '#18d5ff' : '#77808c'} />
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{workflow.name}</Text>
                  <Text className="text-xs text-muted mt-1">{workflow.steps.length} step(s) · {builtin ? 'built-in' : 'saved on device'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#77808c" />
              </Pressable>
            );
          })}
          <Pressable disabled={busy || !selected} onPress={() => selected && requestRun(selected)} className={`rounded-xl py-3 flex-row items-center justify-center gap-2 mt-2 ${busy ? 'bg-border' : 'bg-primary'}`}>
            <MaterialIcons name={busy ? 'hourglass-top' : 'play-arrow'} size={20} color="#061018" />
            <Text className="font-bold text-background">{busy ? 'Running workflow…' : 'Review and run selected'}</Text>
          </Pressable>
        </View>

        <View className="bg-surface border border-border rounded-2xl p-4">
          <Text className="text-lg font-bold text-foreground">Workflow JSON editor</Text>
          <Text className="text-xs text-muted leading-relaxed mt-1 mb-3">
            Edit the selected workflow, or paste JSON copied from another device. Saving validates every action, argument, URL scheme, delay, and step count.
          </Text>
          <TextInput
            value={jsonDraft}
            onChangeText={setJsonDraft}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
            editable={!busy}
            className="min-h-64 bg-background border border-border rounded-xl p-3 text-foreground"
            style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 18 }}
            accessibilityLabel="Workflow JSON editor"
          />
          <View className="flex-row flex-wrap gap-2 mt-3">
            <SmallButton icon="save" label="Validate & save" onPress={() => void saveDraft()} disabled={busy} />
            <SmallButton icon="content-paste" label="Import clipboard" onPress={() => void importFromClipboard()} disabled={busy} />
            <SmallButton icon="content-copy" label="Copy JSON" onPress={() => void exportToClipboard()} disabled={busy} />
            <SmallButton icon="delete-outline" label="Delete saved" onPress={removeSelected} disabled={busy} />
          </View>
        </View>

        <View className="bg-background border border-primary/25 rounded-xl p-3 mt-4">
          <Text className="text-sm font-semibold text-foreground">Run status</Text>
          <Text accessibilityLiveRegion="polite" className="text-xs text-muted leading-relaxed mt-1">{status}</Text>
        </View>
        <Text className="text-xs text-muted leading-relaxed mt-4">
          Limits: maximum 8 steps per workflow, 5 seconds per optional delay, HTTP/HTTPS links only, and stop-on-failure. App launch and alarm behavior vary by Android version and installed apps. Screen tapping/typing automation is a separate optional native accessibility-service stage and is not silently enabled here.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function SmallButton({ icon, label, onPress, disabled }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className={`rounded-lg border border-border px-3 py-2 flex-row items-center gap-2 ${disabled ? 'opacity-40' : 'bg-background'}`}>
      <MaterialIcons name={icon} size={16} color="#18d5ff" />
      <Text className="text-xs font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
