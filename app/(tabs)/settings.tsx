import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { PRESET_COMMANDS } from '@/components/voice-and-command-widgets';
import { useChat } from '@/lib/chat-context';
import { useOnboarding } from '@/lib/onboarding-context';

export default function SettingsScreen() {
  const { apiConfig, hasApiKey, updateApiConfig, clearMessages } = useChat();
  const { resetOnboarding } = useOnboarding();
  const [apiKey, setApiKey] = useState(apiConfig.apiKey);
  const [endpoint, setEndpoint] = useState(apiConfig.endpoint);
  const [model, setModel] = useState(apiConfig.model);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(apiConfig.apiKey);
    setEndpoint(apiConfig.endpoint);
    setModel(apiConfig.model);
  }, [apiConfig.apiKey, apiConfig.endpoint, apiConfig.model]);

  const saveConnection = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics are optional.
    }
    await updateApiConfig({ apiKey: apiKey.trim(), endpoint: endpoint.trim(), model: model.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const confirmReset = () => {
    Alert.alert('Restart onboarding?', 'The walkthrough will appear the next time you open Jarvis.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: () => { void resetOnboarding(); router.replace('/onboarding' as any); } },
    ]);
  };

  const confirmClear = () => {
    Alert.alert('Clear chat history?', 'This removes every saved conversation from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear history', style: 'destructive', onPress: () => void clearMessages() },
    ]);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-foreground">Settings</Text>
        <Text className="text-sm text-muted mt-1 mb-6">Simple controls for how Jarvis connects and speaks.</Text>

        <View className={`rounded-2xl border p-4 mb-5 flex-row items-center gap-3 ${hasApiKey ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
          <MaterialIcons name={hasApiKey ? 'check-circle' : 'offline-bolt'} size={25} color={hasApiKey ? '#49d17d' : '#f5b942'} />
          <View className="flex-1">
            <Text className="font-semibold text-foreground">{hasApiKey ? 'AI connection ready' : 'Offline mode active'}</Text>
            <Text className="text-xs text-muted mt-1">{hasApiKey ? 'Jarvis can use your selected provider.' : 'Preset commands work without a key.'}</Text>
          </View>
        </View>

        <SectionTitle icon="key" title="AI connection" subtitle="Optional — leave blank to stay offline" />
        <View className="bg-surface border border-border rounded-2xl p-4 gap-4">
          <View className="bg-background border border-border rounded-xl p-3">
            <Text className="text-sm font-semibold text-foreground">How to connect</Text>
            <Text className="text-xs text-muted leading-relaxed mt-1">Open the provider page, create a secret key, copy it, paste it below, then tap Save connection.</Text>
            <Pressable onPress={() => void Linking.openURL('https://platform.openai.com/api-keys')} className="flex-row items-center gap-2 mt-3">
              <MaterialIcons name="open-in-new" size={15} color="#18d5ff" />
              <Text className="text-xs font-semibold text-primary">Open provider key page</Text>
            </Pressable>
          </View>

          <FieldLabel label="API key" />
          <View className="flex-row items-center bg-background border border-border rounded-xl px-4">
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor="#77808c"
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 py-4 text-foreground"
            />
            <Pressable onPress={() => setShowKey((value) => !value)} hitSlop={12}>
              <MaterialIcons name={showKey ? 'visibility' : 'visibility-off'} size={20} color="#8a92a0" />
            </Pressable>
          </View>
          <Text className="text-xs text-muted -mt-2">Stored locally on this device. Never embed a key in the app.</Text>

          <FieldLabel label="Endpoint" />
          <TextInput value={endpoint} onChangeText={setEndpoint} placeholder="https://api.openai.com/v1" placeholderTextColor="#77808c" autoCapitalize="none" className="bg-background border border-border rounded-xl px-4 py-4 text-foreground" />

          <FieldLabel label="Model" />
          <TextInput value={model} onChangeText={setModel} placeholder="gpt-3.5-turbo" placeholderTextColor="#77808c" autoCapitalize="none" className="bg-background border border-border rounded-xl px-4 py-4 text-foreground" />

          <Pressable onPress={() => void saveConnection()} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2">
            <MaterialIcons name={saved ? 'check' : 'save'} size={18} color="#061018" />
            <Text className="font-bold text-background">{saved ? 'Connection saved' : 'Save connection'}</Text>
          </Pressable>
        </View>

        <SectionTitle icon="bolt" title="Offline command deck" subtitle={`${PRESET_COMMANDS.length} commands available without an API key`} />
        <View className="bg-surface border border-border rounded-2xl overflow-hidden">
          {PRESET_COMMANDS.map((command, index) => (
            <View key={command.label} className={`flex-row items-center gap-3 px-4 py-3 ${index < PRESET_COMMANDS.length - 1 ? 'border-b border-border' : ''}`}>
              <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: `${command.color}22` }}>
                <MaterialIcons name={command.icon} size={17} color={command.color} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{command.label}</Text>
                <Text className="text-xs text-muted mt-0.5">Say or type “{command.command}”</Text>
              </View>
            </View>
          ))}
        </View>

        <SectionTitle icon="volume-up" title="Voice playback" subtitle="Jarvis reads each response automatically" />
        <View className="bg-surface border border-border rounded-2xl p-4 flex-row items-start gap-3">
          <MaterialIcons name="record-voice-over" size={22} color="#18d5ff" />
          <Text className="flex-1 text-sm text-muted leading-relaxed">Playback uses the installed English voice. On Android, the Expo speech API supports replay and stop; true pause, seek, and a custom accent require a different native audio engine.</Text>
        </View>

        <SectionTitle icon="tune" title="App preferences" subtitle="Walkthrough and local data" />
        <View className="gap-3">
          <ActionRow icon="school" title="Restart onboarding" description="Review setup instructions and API key guidance" onPress={confirmReset} />
          <ActionRow icon="delete-outline" danger title="Clear chat history" description="Remove saved conversations from this device" onPress={confirmClear} />
        </View>

        <Text className="text-xs text-muted text-center mt-8">Jarvis v1.0.5 · {Platform.OS === 'android' ? 'Android' : 'iOS'} · Offline first</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string }) {
  return (
    <View className="flex-row items-center gap-3 mt-5 mb-3">
      <MaterialIcons name={icon} size={20} color="#18d5ff" />
      <View className="flex-1">
        <Text className="text-lg font-bold text-foreground">{title}</Text>
        <Text className="text-xs text-muted mt-0.5">{subtitle}</Text>
      </View>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text className="text-sm font-semibold text-foreground -mb-2">{label}</Text>;
}

function ActionRow({ icon, title, description, danger = false, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className={`bg-surface border rounded-2xl p-4 flex-row items-center gap-3 ${danger ? 'border-error/40' : 'border-border'}`}>
      <MaterialIcons name={icon} size={22} color={danger ? '#ff6b78' : '#18d5ff'} />
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${danger ? 'text-error' : 'text-foreground'}`}>{title}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#8a92a0" />
    </Pressable>
  );
}
