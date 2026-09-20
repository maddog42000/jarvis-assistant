import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { JarvisAvatar } from '@/components/jarvis-avatar';
import { ScreenContainer } from '@/components/screen-container';
import { useChat } from '@/lib/chat-context';
import { useMemory } from '@/lib/memory-context';
import { useTts } from '@/lib/tts-context';

const QUICK_ACTIONS = [
  { icon: 'today' as const, label: 'Plan my day', prompt: 'Help me plan a calm, productive day.' },
  { icon: 'self-improvement' as const, label: 'Check in', prompt: 'Check in with me and ask how I am feeling today.' },
  { icon: 'lightbulb-outline' as const, label: 'Give me a boost', prompt: 'Give me one practical, encouraging idea for right now.' },
  { icon: 'format-list-bulleted' as const, label: 'My focus', prompt: 'Help me turn my current focus into the next three small steps.' },
];

export default function HomeScreen() {
  const { hasApiKey, messages, sendMessage } = useChat();
  const { memory, greetingName, saveMemory } = useMemory();
  const { settings: ttsSettings } = useTts();
  const [nameDraft, setNameDraft] = useState(memory.name);
  const [focusDraft, setFocusDraft] = useState(memory.focus);

  const timeLabel = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const saveProfile = async () => {
    await saveMemory({ name: nameDraft.trim(), focus: focusDraft.trim(), lastCheckIn: Date.now() });
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* optional */ }
  };

  const runAction = async (prompt: string) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* optional */ }
    router.push('/(tabs)/chat');
    await sendMessage(prompt);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 132 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-xs uppercase tracking-widest text-primary font-bold">Assistant Home</Text>
            <Text className="text-3xl font-bold text-foreground mt-1">{timeLabel}, {greetingName}</Text>
            <Text className="text-sm text-muted mt-1">Your private companion, ready when you are.</Text>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-primary/15 items-center justify-center border border-primary/30">
            <MaterialIcons name="auto-awesome" size={24} color="#18d5ff" />
          </View>
        </View>

        <View className="bg-surface border border-primary/25 rounded-3xl p-5 mb-5 overflow-hidden">
          <View className="flex-row items-center gap-4">
            <JarvisAvatar state="idle" size={82} />
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">Jarvis is online</Text>
              <Text className="text-sm text-muted mt-1 leading-relaxed">I can remember your preferences on this device and keep suggestions practical.</Text>
            </View>
          </View>
          <View className="flex-row gap-2 mt-5">
            <StatusPill icon="offline-bolt" label={hasApiKey ? 'AI connected' : 'Offline ready'} tone={hasApiKey ? '#49d17d' : '#f5b942'} />
            <StatusPill icon="volume-up" label={ttsSettings.autoSpeak ? 'Voice on' : 'Voice off'} tone="#18d5ff" />
            <StatusPill icon="chat-bubble-outline" label={`${messages.length} messages`} tone="#b58cff" />
          </View>
        </View>

        <Text className="text-lg font-bold text-foreground mb-3">What do you need?</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {QUICK_ACTIONS.map((action) => (
            <Pressable key={action.label} onPress={() => void runAction(action.prompt)} style={({ pressed }) => [{ width: '47%', opacity: pressed ? 0.75 : 1 }]} className="bg-surface border border-border rounded-2xl p-4">
              <MaterialIcons name={action.icon} size={24} color="#18d5ff" />
              <Text className="text-sm font-semibold text-foreground mt-3">{action.label}</Text>
              <Text className="text-xs text-muted mt-1">Tap to start</Text>
            </Pressable>
          ))}
        </View>

        <View className="bg-surface border border-border rounded-2xl p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialIcons name="favorite-border" size={20} color="#ff7eaa" />
            <Text className="text-lg font-bold text-foreground">Companion memory</Text>
          </View>
          <Text className="text-xs text-muted leading-relaxed mb-4">Optional details help Jarvis feel more personal. Everything stays local unless you send it in a provider chat.</Text>
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2">What should I call you?</Text>
          <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="Your name or nickname" placeholderTextColor="#77808c" className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3" maxLength={40} />
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Current focus</Text>
          <TextInput value={focusDraft} onChangeText={setFocusDraft} placeholder="e.g. finish my course, sleep better" placeholderTextColor="#77808c" className="bg-background border border-border rounded-xl px-4 py-3 text-foreground" maxLength={120} />
          <Pressable onPress={() => void saveProfile()} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className="bg-primary rounded-xl py-3 items-center mt-4">
            <Text className="font-bold text-background">Save my preferences</Text>
          </Pressable>
          {memory.focus ? <Text className="text-xs text-success mt-3 text-center">Focus saved locally: {memory.focus}</Text> : null}
        </View>

        <Pressable onPress={() => router.push('/(tabs)/chat')} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]} className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex-row items-center gap-3">
          <MaterialIcons name="chat" size={22} color="#18d5ff" />
          <View className="flex-1"><Text className="font-bold text-foreground">Open full chat</Text><Text className="text-xs text-muted mt-1">Use offline commands, swipe actions, or your connected AI.</Text></View>
          <MaterialIcons name="arrow-forward" size={20} color="#18d5ff" />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatusPill({ icon, label, tone }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; tone: string }) {
  return <View className="flex-1 bg-background rounded-xl px-2 py-2 items-center" style={{ borderWidth: 1, borderColor: `${tone}44` }}><MaterialIcons name={icon} size={16} color={tone} /><Text className="text-[10px] text-muted mt-1 text-center">{label}</Text></View>;
}
