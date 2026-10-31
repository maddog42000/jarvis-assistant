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
  { icon: 'today' as const, label: 'Plan my day', prompt: 'Help me plan a calm, productive day.', tint: '#20c9e8' },
  { icon: 'self-improvement' as const, label: 'Check in', prompt: 'Check in with me and ask how I am feeling today.', tint: '#b78aff' },
  { icon: 'lightbulb-outline' as const, label: 'Give me a boost', prompt: 'Give me one practical, encouraging idea for right now.', tint: '#f06bb5' },
  { icon: 'format-list-bulleted' as const, label: 'My focus', prompt: 'Help me turn my current focus into the next three small steps.', tint: '#69d6a5' },
];

export default function HomeScreen() {
  const { hasApiKey, messages, sendMessage, apiConfig } = useChat();
  const { memory, greetingName, saveMemory } = useMemory();
  const { settings: ttsSettings } = useTts();
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(memory.name);
  const [focusDraft, setFocusDraft] = useState(memory.focus);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const runAction = async (prompt: string) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* optional */ }
    router.push('/(tabs)/chat');
    await sendMessage(prompt);
  };

  const saveProfile = async () => {
    await saveMemory({ name: nameDraft.trim(), focus: focusDraft.trim(), lastCheckIn: Date.now() });
    setProfileOpen(false);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* optional */ }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-[11px] font-bold tracking-[3px] text-primary">J A R V I S</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">{greeting}, {greetingName}</Text>
            <Text className="text-xs text-muted mt-1">Your personal assistant</Text>
          </View>
          <View className="w-11 h-11 rounded-2xl items-center justify-center border border-primary/30 bg-primary/10">
            <MaterialIcons name="auto-awesome" size={23} color="#20c9e8" />
          </View>
        </View>

        <View className="rounded-3xl border border-primary/30 bg-surface p-4 mb-5" style={{ shadowColor: '#00cfff', shadowOpacity: 0.10, shadowRadius: 16, elevation: 3 }}>
          <View className="flex-row items-center">
            <JarvisAvatar state="idle" size={76} />
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-foreground">Ready when you are.</Text>
              <Text className="text-xs leading-5 text-muted mt-1">Ask a question, start a task, or pick a shortcut.</Text>
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: hasApiKey ? '#69d6a5' : '#f0bd58' }} />
                <Text className="text-[11px] text-muted">{hasApiKey ? `${apiConfig.providerId} key saved` : 'Offline commands ready'}</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/chat')} className="mt-4 rounded-2xl bg-primary py-3.5 px-4 flex-row items-center justify-center">
            <MaterialIcons name="chat" size={19} color="#06131d" />
            <Text className="font-bold text-sm ml-2" style={{ color: '#06131d' }}>Open Jarvis Chat</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#06131d" style={{ marginLeft: 8 }} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-foreground">Quick actions</Text>
          <Text className="text-[11px] text-muted">Choose a starting point</Text>
        </View>
        <View className="flex-row flex-wrap justify-between mb-5">
          {QUICK_ACTIONS.map((action) => (
            <Pressable key={action.label} onPress={() => void runAction(action.prompt)} style={({ pressed }) => [{ width: '48.5%', opacity: pressed ? 0.78 : 1, minHeight: 112 }]} className="rounded-2xl border border-border bg-surface p-3.5 mb-3">
              <View className="w-9 h-9 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: `${action.tint}18` }}>
                <MaterialIcons name={action.icon} size={21} color={action.tint} />
              </View>
              <Text className="text-sm font-semibold text-foreground">{action.label}</Text>
              <Text className="text-[11px] text-muted mt-1">Tap to start</Text>
            </Pressable>
          ))}
        </View>

        <View className="rounded-2xl border border-border bg-surface overflow-hidden mb-4">
          <View className="flex-row items-center p-4">
            <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
              <MaterialIcons name="graphic-eq" size={20} color="#20c9e8" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-foreground">Voice response</Text>
              <Text className="text-xs text-muted mt-1">{ttsSettings.autoSpeak ? 'Spoken replies enabled' : 'Text replies only'}</Text>
            </View>
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: ttsSettings.autoSpeak ? '#69d6a520' : '#8793a020' }}>
              <Text className="text-[10px] font-semibold" style={{ color: ttsSettings.autoSpeak ? '#69d6a5' : '#9aa6b2' }}>{ttsSettings.autoSpeak ? 'ON' : 'OFF'}</Text>
            </View>
          </View>
          <View className="h-px bg-border mx-4" />
          <View className="flex-row items-center p-4">
            <View className="w-9 h-9 rounded-xl bg-secondary/20 items-center justify-center">
              <MaterialIcons name="forum" size={20} color="#b78aff" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-foreground">Conversation history</Text>
              <Text className="text-xs text-muted mt-1">{messages.length} messages on this device</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/chat')} hitSlop={8}>
              <MaterialIcons name="chevron-right" size={24} color="#8393a4" />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={() => setProfileOpen((open) => !open)} className="rounded-2xl border border-border bg-surface p-4 flex-row items-center">
          <MaterialIcons name="tune" size={20} color="#20c9e8" />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-semibold text-foreground">Personalize Jarvis</Text>
            <Text className="text-xs text-muted mt-1">Name and focus preferences</Text>
          </View>
          <MaterialIcons name={profileOpen ? 'expand-less' : 'expand-more'} size={22} color="#8393a4" />
        </Pressable>
        {profileOpen ? (
          <View className="rounded-2xl border border-border bg-surface p-4 mt-2">
            <Text className="text-xs font-semibold text-muted mb-2">WHAT SHOULD JARVIS CALL YOU?</Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="Name or nickname" placeholderTextColor="#77808c" maxLength={40} className="bg-background border border-border rounded-xl px-3 py-3 text-foreground mb-3" />
            <Text className="text-xs font-semibold text-muted mb-2">CURRENT FOCUS</Text>
            <TextInput value={focusDraft} onChangeText={setFocusDraft} placeholder="What matters to you right now?" placeholderTextColor="#77808c" maxLength={120} className="bg-background border border-border rounded-xl px-3 py-3 text-foreground" />
            <Pressable onPress={() => void saveProfile()} className="bg-primary rounded-xl py-3 items-center mt-3">
              <Text className="text-sm font-bold" style={{ color: '#06131d' }}>Save preferences</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
