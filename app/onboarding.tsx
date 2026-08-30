import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useChat } from '@/lib/chat-context';
import { useOnboarding } from '@/lib/onboarding-context';
import { getProvider, PROVIDERS, type ProviderId } from '@/lib/assistant-config';

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const { currentStep, setCurrentStep, completeOnboarding } = useOnboarding();
  const { updateApiConfig } = useChat();
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const finish = async () => {
    if (apiKey.trim()) {
      await updateApiConfig({ providerId, apiKey: apiKey.trim(), apiKeys: { [providerId]: apiKey.trim() } });
      setSaved(true);
    }
    await completeOnboarding();
    router.replace('/(tabs)/chat');
  };

  const next = () => {
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep(currentStep + 1);
    else void finish();
  };

  const skip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/chat');
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View className="flex-row gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View key={index} className={`h-1 flex-1 rounded-full ${index <= currentStep ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </View>

        {currentStep === 0 && (
          <View className="flex-1 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-6">
              <MaterialIcons name="smart-toy" size={48} color="#18d5ff" />
            </View>
            <Text className="text-3xl font-bold text-foreground text-center">Meet Jarvis</Text>
            <Text className="text-base text-muted text-center leading-relaxed mt-4 max-w-sm">
              A private assistant for quick offline commands, local chat history, and optional AI connections.
            </Text>
            <View className="w-full bg-surface border border-border rounded-2xl p-4 mt-8 gap-3">
              <FeatureRow icon="bolt" text="Offline commands work without an API key" />
              <FeatureRow icon="lock" text="Your settings stay on this device" />
              <FeatureRow icon="tune" text="You can change everything later" />
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View className="flex-1 justify-center">
            <Text className="text-3xl font-bold text-foreground">Choose your mode</Text>
            <Text className="text-base text-muted leading-relaxed mt-3 mb-6">
              Start privately with local tools, or connect an AI provider when you are ready.
            </Text>
            <View className="gap-3">
              <ModeCard icon="offline-bolt" title="Offline first" description="Time, date, battery, network, jokes, quotes, help, and more." active />
              <ModeCard icon="cloud-queue" title="Optional AI connection" description="Add your own provider key later for general questions and creative work." />
            </View>
            <Text className="text-sm font-semibold text-foreground mt-7 mb-2">Choose a provider now or later</Text>
            <View className="gap-2">
              {PROVIDERS.slice(0, 3).map((provider) => (
                <Pressable key={provider.id} onPress={() => setProviderId(provider.id)} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]} className={`rounded-xl border p-3 flex-row items-center gap-3 ${providerId === provider.id ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}>
                  <MaterialIcons name={providerId === provider.id ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={providerId === provider.id ? '#18d5ff' : '#77808c'} />
                  <View className="flex-1"><Text className="text-sm font-semibold text-foreground">{provider.name}</Text><Text className="text-xs text-muted mt-1">{provider.description}</Text></View>
                </Pressable>
              ))}
            </View>
            <View className="bg-warning/10 border border-warning/30 rounded-xl p-4 mt-6 flex-row gap-3">
              <MaterialIcons name="info-outline" size={20} color="#f5b942" />
              <Text className="flex-1 text-sm text-muted leading-relaxed">
                Jarvis does not embed an API key. You remain in control of which provider you use.
              </Text>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View className="flex-1 justify-center">
            <Text className="text-3xl font-bold text-foreground">Add an API key</Text>
            <Text className="text-base text-muted leading-relaxed mt-3">
              This step is optional. You selected {getProvider(providerId).name}. Open its official key page, create a key, copy it, and paste it below.
            </Text>
            <Pressable
              onPress={() => void Linking.openURL(getProvider(providerId).keyUrl)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="bg-primary/10 border border-primary/30 rounded-xl p-4 mt-6 flex-row items-center gap-3"
            >
              <MaterialIcons name="open-in-new" size={22} color="#18d5ff" />
              <View className="flex-1">
              <Text className="font-semibold text-foreground">Open {getProvider(providerId).name} key page</Text>
              <Text className="text-xs text-muted mt-1">{getProvider(providerId).keyUrl.replace(/^https?:\/\//, '')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#8a92a0" />
            </Pressable>
            <Text className="text-sm font-semibold text-foreground mt-8 mb-2">Paste key (optional)</Text>
            <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={getProvider(providerId).keyHint}
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
            <Text className="text-xs text-muted mt-2">Stored locally for {getProvider(providerId).name}. You can skip this and use offline mode.</Text>
          </View>
        )}

        {currentStep === 3 && (
          <View className="flex-1 justify-center">
            <Text className="text-3xl font-bold text-foreground">You are ready</Text>
            <Text className="text-base text-muted leading-relaxed mt-3 mb-8">
              Ask Jarvis for help, tap a preset command, or open Settings anytime to change your connection.
            </Text>
            <View className="gap-3">
              <Checklist text="Offline commands are available immediately" />
              <Checklist text="API setup can be revisited in Settings" />
              <Checklist text="Onboarding can be restarted from Settings" />
            </View>
            {saved && <Text className="text-sm text-success mt-6">API key saved locally.</Text>}
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-6 gap-3">
        <Pressable onPress={next} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2">
          <Text className="text-background font-bold">{currentStep === TOTAL_STEPS - 1 ? 'Enter Jarvis' : 'Continue'}</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#061018" />
        </Pressable>
        <Pressable onPress={() => void skip()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} className="py-3 items-center">
          <Text className="text-sm font-semibold text-muted">Skip for now</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function FeatureRow({ icon, text }: { icon: keyof typeof MaterialIcons.glyphMap; text: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <MaterialIcons name={icon} size={20} color="#18d5ff" />
      <Text className="flex-1 text-sm text-foreground">{text}</Text>
    </View>
  );
}

function ModeCard({ icon, title, description, active = false }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; active?: boolean }) {
  return (
    <View className={`rounded-xl border p-4 flex-row gap-3 ${active ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}>
      <MaterialIcons name={icon} size={24} color={active ? '#18d5ff' : '#8a92a0'} />
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted leading-relaxed mt-1">{description}</Text>
      </View>
      {active && <MaterialIcons name="check-circle" size={20} color="#18d5ff" />}
    </View>
  );
}

function Checklist({ text }: { text: string }) {
  return (
    <View className="flex-row items-center gap-3 bg-surface border border-border rounded-xl p-4">
      <MaterialIcons name="check-circle" size={20} color="#49d17d" />
      <Text className="flex-1 text-sm text-foreground">{text}</Text>
    </View>
  );
}
