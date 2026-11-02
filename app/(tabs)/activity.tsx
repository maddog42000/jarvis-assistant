import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { clearWorkflowActivity, readWorkflowActivity, type WorkflowActivityRecord } from '@/lib/actions/action-history';

export default function ActivityScreen() {
  const [items, setItems] = useState<WorkflowActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setItems(await readWorkflowActivity());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const confirmClear = () => {
    Alert.alert('Clear activity history?', 'This removes the saved record of Jarvis workflow runs from this device. It does not change your workflows or reminders.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear history', style: 'destructive', onPress: () => { void clearWorkflowActivity().then(refresh); } },
    ]);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-xs uppercase tracking-widest text-primary font-bold">Jarvis timeline</Text>
            <Text className="text-3xl font-bold text-foreground mt-1">Activity</Text>
          </View>
          <Pressable onPress={confirmClear} disabled={!items.length} className="rounded-xl border border-border p-3">
            <MaterialIcons name="delete-outline" size={21} color={items.length ? '#f08a8a' : '#77808c'} />
          </Pressable>
        </View>
        <Text className="text-sm text-muted leading-relaxed mb-5">A local history of automation runs, including completed steps and failures. Records stay on this device and the newest 60 are kept.</Text>

        {loading ? (
          <Text className="text-sm text-muted">Loading activity…</Text>
        ) : items.length === 0 ? (
          <View className="bg-surface border border-border rounded-2xl p-5 items-center">
            <MaterialIcons name="history" size={34} color="#18d5ff" />
            <Text className="text-base font-semibold text-foreground mt-3">Nothing here yet</Text>
            <Text className="text-xs text-muted text-center leading-relaxed mt-2">Run a workflow from the Actions tab and Jarvis will record its result here.</Text>
          </View>
        ) : items.map((item) => (
          <View key={item.id} className="bg-surface border border-border rounded-2xl p-4 mb-3">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name={item.success ? 'check-circle' : 'error-outline'} size={20} color={item.success ? '#49d17d' : '#f08a8a'} />
              <Text className="flex-1 text-base font-semibold text-foreground">{item.workflowName}</Text>
              <Text className="text-[10px] uppercase font-bold" style={{ color: item.success ? '#49d17d' : '#f08a8a' }}>{item.success ? 'Success' : 'Stopped'}</Text>
            </View>
            <Text className="text-xs text-muted mt-2">{new Date(item.createdAt).toLocaleString()}</Text>
            <Text className="text-xs text-muted mt-2">{item.completedSteps} of {item.totalSteps} steps completed</Text>
            <Text className="text-sm text-foreground leading-relaxed mt-2">{item.message}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
