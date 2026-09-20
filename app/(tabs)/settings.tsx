import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { PRESET_COMMANDS } from '@/components/voice-and-command-widgets';
import { getProvider, PROVIDERS, type ProviderId } from '@/lib/assistant-config';
import { useChat } from '@/lib/chat-context';
import { useOnboarding } from '@/lib/onboarding-context';
import { useTts } from '@/lib/tts-context';
import { useMemory } from '@/lib/memory-context';

export default function SettingsScreen() {
  const { apiConfig, hasApiKey, updateApiConfig, testConnection, clearMessages } = useChat();
  const { resetOnboarding } = useOnboarding();
  const { voices, settings: ttsSettings, isLoadingVoices, updateSettings: updateTtsSettings } = useTts();
  const { clearMemory } = useMemory();
  const [providerId, setProviderId] = useState<ProviderId>(apiConfig.providerId);
  const [apiKey, setApiKey] = useState(apiConfig.apiKey);
  const [endpoint, setEndpoint] = useState(apiConfig.endpoint);
  const [model, setModel] = useState(apiConfig.model);
  const [agentId, setAgentId] = useState(apiConfig.agentId);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {
    setProviderId(apiConfig.providerId);
    setApiKey(apiConfig.apiKey);
    setEndpoint(apiConfig.endpoint);
    setModel(apiConfig.model);
    setAgentId(apiConfig.agentId);
  }, [apiConfig.apiKey, apiConfig.agentId, apiConfig.endpoint, apiConfig.model, apiConfig.providerId]);

  const provider = getProvider(providerId);
  const recommendedVoices = useMemo(() => voices.filter((voice) => voice.language.toLowerCase().startsWith('en')).slice(0, 8), [voices]);
  const selectedAgent = apiConfig.agents.find((agent) => agent.id === agentId) ?? apiConfig.agents[0];

  const selectProvider = (nextProviderId: ProviderId) => {
    const nextProvider = getProvider(nextProviderId);
    setProviderId(nextProviderId);
    setApiKey(apiConfig.apiKeys[nextProviderId] ?? '');
    setEndpoint(nextProviderId === 'custom' ? apiConfig.endpoint : nextProvider.endpoint);
    setModel(nextProviderId === 'custom' ? apiConfig.model : nextProvider.model);
    setConnectionState('idle');
    setConnectionMessage('');
  };

  const saveConnection = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics are optional.
    }
    const cleanKey = apiKey.trim();
    await updateApiConfig({
      providerId,
      apiKey: cleanKey,
      apiKeys: { ...apiConfig.apiKeys, [providerId]: cleanKey },
      endpoint: endpoint.trim() || provider.endpoint,
      model: model.trim() || provider.model,
      agentId,
    });
    setSaved(true);
    setConnectionState('idle');
    setConnectionMessage('');
    setTimeout(() => setSaved(false), 1800);
  };

  const handleTestConnection = async () => {
    setConnectionState('testing');
    setConnectionMessage('Sending a small test request…');
    const result = await testConnection({
      providerId,
      apiKey: apiKey.trim(),
      apiKeys: { ...apiConfig.apiKeys, [providerId]: apiKey.trim() },
      endpoint: endpoint.trim() || provider.endpoint,
      model: model.trim() || provider.model,
      agentId,
    });
    setConnectionState(result.ok ? 'success' : 'error');
    setConnectionMessage(result.message);
  };

  const confirmReset = () => {
    Alert.alert('Restart onboarding?', 'The setup walkthrough will open immediately. Your saved provider settings will stay on this device.', [
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

  const confirmClearMemory = () => {
    Alert.alert('Clear companion memory?', 'This removes your saved name, focus, and remembered notes from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear memory', style: 'destructive', onPress: () => void clearMemory() },
    ]);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-foreground">Settings</Text>
        <Text className="text-sm text-muted mt-1 mb-6">Choose how Jarvis connects, which agent it uses, and how it speaks.</Text>

        <View className={`rounded-2xl border p-4 mb-5 flex-row items-center gap-3 ${hasApiKey ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
          <MaterialIcons name={hasApiKey ? 'check-circle' : 'offline-bolt'} size={25} color={hasApiKey ? '#49d17d' : '#f5b942'} />
          <View className="flex-1">
            <Text className="font-semibold text-foreground">{hasApiKey ? `${provider.name} connection ready` : 'Offline mode active'}</Text>
            <Text className="text-xs text-muted mt-1">{hasApiKey ? `${selectedAgent?.name ?? 'Jarvis'} will handle general questions.` : 'Preset commands work without a provider key.'}</Text>
          </View>
        </View>

        <SectionTitle icon="key" title="AI provider" subtitle="Keys stay local to this device" />
        <View className="bg-surface border border-border rounded-2xl p-4">
          <Text className="text-sm font-semibold text-foreground mb-3">1. Choose a provider</Text>
          <View className="gap-2">
            {PROVIDERS.map((item) => (
              <Pressable key={item.id} onPress={() => selectProvider(item.id)} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]} className={`rounded-xl border p-3 flex-row items-center gap-3 ${providerId === item.id ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                <MaterialIcons name={providerId === item.id ? 'radio-button-checked' : 'radio-button-unchecked'} size={21} color={providerId === item.id ? '#18d5ff' : '#77808c'} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted mt-1">{item.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View className="bg-background border border-border rounded-xl p-3 mt-4">
            <Text className="text-sm font-semibold text-foreground">2. Get your key</Text>
            <Text className="text-xs text-muted leading-relaxed mt-1">Open the official provider page, create a key, copy it, return here, and paste it below. Jarvis never ships with a key.</Text>
            <Pressable onPress={() => void Linking.openURL(provider.keyUrl)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} className="flex-row items-center gap-2 mt-3">
              <MaterialIcons name="open-in-new" size={15} color="#18d5ff" />
              <Text className="text-xs font-semibold text-primary">Open {provider.name} key page</Text>
            </Pressable>
          </View>

          <Text className="text-sm font-semibold text-foreground mt-4 mb-2">3. Paste the key</Text>
          <View className="flex-row items-center bg-background border border-border rounded-xl px-4">
            <TextInput value={apiKey} onChangeText={setApiKey} placeholder={provider.keyHint} placeholderTextColor="#77808c" secureTextEntry={!showKey} autoCapitalize="none" autoCorrect={false} className="flex-1 py-4 text-foreground" />
            <Pressable onPress={() => setShowKey((value) => !value)} hitSlop={12}>
              <MaterialIcons name={showKey ? 'visibility' : 'visibility-off'} size={20} color="#8a92a0" />
            </Pressable>
          </View>
          <Text className="text-xs text-muted mt-2">Saved separately for {provider.name}. You can switch providers without losing another provider’s key.</Text>

          <Text className="text-sm font-semibold text-foreground mt-4 mb-2">4. Confirm endpoint and model</Text>
          <TextInput value={endpoint} onChangeText={setEndpoint} placeholder={provider.endpoint} placeholderTextColor="#77808c" autoCapitalize="none" autoCorrect={false} className="bg-background border border-border rounded-xl px-4 py-4 text-foreground mb-2" />
          <TextInput value={model} onChangeText={setModel} placeholder={provider.model} placeholderTextColor="#77808c" autoCapitalize="none" autoCorrect={false} className="bg-background border border-border rounded-xl px-4 py-4 text-foreground" />
          <Text className="text-xs text-muted mt-2">Use the exact model name enabled for your account. Custom providers must expose an OpenAI-compatible /chat/completions endpoint.</Text>

          <View className="flex-row gap-2 mt-4">
            <Pressable onPress={() => void handleTestConnection()} disabled={connectionState === 'testing'} style={({ pressed }) => [{ opacity: pressed ? 0.75 : connectionState === 'testing' ? 0.5 : 1 }]} className="flex-1 border border-primary rounded-xl py-3 flex-row items-center justify-center gap-2">
              <MaterialIcons name={connectionState === 'testing' ? 'sync' : 'wifi-tethering'} size={18} color="#18d5ff" />
              <Text className="font-bold text-primary">{connectionState === 'testing' ? 'Testing…' : 'Test connection'}</Text>
            </Pressable>
            <Pressable onPress={() => void saveConnection()} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className="flex-1 bg-primary rounded-xl py-3 flex-row items-center justify-center gap-2">
              <MaterialIcons name={saved ? 'check' : 'save'} size={18} color="#061018" />
              <Text className="font-bold text-background">{saved ? 'Saved' : 'Save setup'}</Text>
            </Pressable>
          </View>
          {connectionMessage ? <Text className={`text-xs leading-relaxed mt-3 ${connectionState === 'success' ? 'text-success' : connectionState === 'error' ? 'text-error' : 'text-muted'}`}>{connectionMessage}</Text> : null}
        </View>

        <SectionTitle icon="smart-toy" title="Agent profile" subtitle="The selected profile controls tone and instructions" />
        <View className="bg-surface border border-border rounded-2xl p-4 gap-2">
          {apiConfig.agents.map((agent) => (
            <Pressable key={agent.id} onPress={() => { setAgentId(agent.id); void updateApiConfig({ agentId: agent.id }); }} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]} className={`rounded-xl border p-3 flex-row items-center gap-3 ${agentId === agent.id ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
              <MaterialIcons name={agentId === agent.id ? 'radio-button-checked' : 'radio-button-unchecked'} size={21} color={agentId === agent.id ? '#18d5ff' : '#77808c'} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{agent.name}</Text>
                <Text className="text-xs text-muted mt-1">{agent.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionTitle icon="volume-up" title="Voice playback" subtitle="Use an installed English voice and keep responses spoken automatically" />
        <View className="bg-surface border border-border rounded-2xl p-4">
          <View className="flex-row items-center justify-between border-b border-border pb-3">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-semibold text-foreground">Speak responses automatically</Text>
              <Text className="text-xs text-muted mt-1">Turn this off if you prefer silent chat.</Text>
            </View>
            <Switch value={ttsSettings.autoSpeak} onValueChange={(value) => void updateTtsSettings({ autoSpeak: value })} trackColor={{ false: '#394253', true: '#18d5ff' }} thumbColor="#ffffff" />
          </View>
          <Text className="text-sm font-semibold text-foreground mt-4">Choose a voice</Text>
          <Text className="text-xs text-muted leading-relaxed mt-1">Jarvis prefers an English female-sounding voice when Android exposes one. Accent and availability come from the phone’s installed TTS engine and language packs.</Text>
          {isLoadingVoices ? <Text className="text-xs text-muted mt-3">Loading voices from Android…</Text> : recommendedVoices.length === 0 ? <Text className="text-xs text-warning mt-3">No English voice list was returned. Android will use its default voice.</Text> : (
            <View className="gap-2 mt-3">
              {recommendedVoices.map((voice) => (
                <Pressable key={voice.identifier} onPress={() => void updateTtsSettings({ voiceIdentifier: voice.identifier, language: voice.language })} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]} className={`rounded-xl border p-3 flex-row items-center gap-3 ${ttsSettings.voiceIdentifier === voice.identifier ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                  <MaterialIcons name={ttsSettings.voiceIdentifier === voice.identifier ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={ttsSettings.voiceIdentifier === voice.identifier ? '#18d5ff' : '#77808c'} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{voice.name || voice.identifier}</Text>
                    <Text className="text-xs text-muted mt-1">{voice.language}{voice.quality ? ` · ${voice.quality}` : ''}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
          <View className="flex-row gap-2 mt-4">
            {[
              { label: 'Warm', pitch: 1.02, rate: 0.88 },
              { label: 'Natural', pitch: 1.06, rate: 0.92 },
              { label: 'Bright', pitch: 1.12, rate: 0.98 },
            ].map((preset) => (
              <Pressable key={preset.label} onPress={() => void updateTtsSettings({ pitch: preset.pitch, rate: preset.rate })} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className="flex-1 bg-background border border-border rounded-lg py-2 items-center">
                <Text className="text-xs font-semibold text-foreground">{preset.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-sm font-semibold text-foreground mt-4">Language / accent pack</Text>
          <Text className="text-xs text-muted mt-1">These options only work when the matching voice pack is installed on Android.</Text>
          <View className="flex-row gap-2 mt-3">
            {[
              { label: 'US English', language: 'en-US' },
              { label: 'UK English', language: 'en-GB' },
              { label: 'Australian', language: 'en-AU' },
            ].map((option) => (
              <Pressable key={option.language} onPress={() => void updateTtsSettings({ language: option.language })} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className={`flex-1 rounded-lg py-2 items-center border ${ttsSettings.language === option.language ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                <Text className="text-[11px] font-semibold text-foreground">{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-xs text-muted mt-3">On Android, Play restarts a response after Stop because Expo’s speech API does not expose true pause, resume, or seek.</Text>
        </View>

        <SectionTitle icon="bolt" title="Offline command deck" subtitle={`${PRESET_COMMANDS.length} commands available without an API key`} />
        <View className="bg-surface border border-border rounded-2xl overflow-hidden">
          {PRESET_COMMANDS.map((command, index) => (
            <View key={command.label} className={`flex-row items-center gap-3 px-4 py-3 ${index < PRESET_COMMANDS.length - 1 ? 'border-b border-border' : ''}`}>
              <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: `${command.color}22` }}><MaterialIcons name={command.icon} size={17} color={command.color} /></View>
              <View className="flex-1"><Text className="text-sm font-semibold text-foreground">{command.label}</Text><Text className="text-xs text-muted mt-0.5">Say or type “{command.command}”</Text></View>
            </View>
          ))}
        </View>

        <SectionTitle icon="tune" title="App preferences" subtitle="Walkthrough and local data" />
        <View className="gap-3">
          <ActionRow icon="school" title="Restart onboarding" description="Review provider setup, voice guidance, and offline mode" onPress={confirmReset} />
          <ActionRow icon="favorite-border" title="Clear companion memory" description="Remove your saved name, focus, and local notes" onPress={confirmClearMemory} />
          <ActionRow icon="delete-outline" danger title="Clear chat history" description="Remove saved conversations from this device" onPress={confirmClear} />
        </View>

        <Text className="text-xs text-muted text-center mt-8">Jarvis v1.0.5 · {Platform.OS === 'android' ? 'Android' : 'iOS'} · Offline first</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string }) {
  return <View className="flex-row items-center gap-3 mt-5 mb-3"><MaterialIcons name={icon} size={20} color="#18d5ff" /><View className="flex-1"><Text className="text-lg font-bold text-foreground">{title}</Text><Text className="text-xs text-muted mt-0.5">{subtitle}</Text></View></View>;
}

function ActionRow({ icon, title, description, danger = false, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; danger?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className={`bg-surface border rounded-2xl p-4 flex-row items-center gap-3 ${danger ? 'border-error/40' : 'border-border'}`}><MaterialIcons name={icon} size={22} color={danger ? '#ff6b78' : '#18d5ff'} /><View className="flex-1"><Text className={`text-sm font-semibold ${danger ? 'text-error' : 'text-foreground'}`}>{title}</Text><Text className="text-xs text-muted mt-1">{description}</Text></View><MaterialIcons name="chevron-right" size={20} color="#8a92a0" /></Pressable>;
}
