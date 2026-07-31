import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useChat } from '@/lib/chat-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const { apiConfig, updateApiConfig, clearMessages, hasApiKey } = useChat();

  const [endpoint, setEndpoint] = useState(apiConfig.endpoint);
  const [apiKey, setApiKey] = useState(apiConfig.apiKey);
  const [model, setModel] = useState(apiConfig.model);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('api');

  const handleSave = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }

    await updateApiConfig({
      endpoint,
      apiKey,
      model,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to delete all conversations? This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: async () => {
            await clearMessages();
            Alert.alert('Success', 'Chat history cleared.');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        {/* Header */}
        <Text className="text-3xl font-bold text-foreground mb-2">Settings</Text>
        <Text className="text-sm text-muted mb-8">Configure Jarvis and manage preferences</Text>

        {/* API Status Banner */}
        <View className={`rounded-lg p-4 mb-6 flex-row items-center gap-3 ${hasApiKey ? 'bg-success/10 border border-success' : 'bg-warning/10 border border-warning'}`}>
          <MaterialIcons 
            name={hasApiKey ? "check-circle" : "info"} 
            size={24} 
            color={hasApiKey ? "#22C55E" : "#F59E0B"} 
          />
          <View className="flex-1">
            <Text className={`font-semibold ${hasApiKey ? 'text-success' : 'text-warning'}`}>
              {hasApiKey ? 'API Connected' : 'No API Key'}
            </Text>
            <Text className="text-xs text-muted mt-1">
              {hasApiKey ? 'Full AI features enabled' : 'Using offline commands only'}
            </Text>
          </View>
        </View>

        {/* API Configuration Section */}
        <ExpandableSection
          title="🔑 API Configuration"
          subtitle="Set up your AI provider"
          isExpanded={expandedSection === 'api'}
          onPress={() => setExpandedSection(expandedSection === 'api' ? null : 'api')}
        >
          <View className="gap-4">
            {/* Quick Setup Guide */}
            <View className="bg-background border border-border rounded-lg p-3">
              <Text className="text-xs font-semibold text-primary mb-2">📚 Quick Setup Guide</Text>
              <Text className="text-xs text-muted leading-relaxed mb-2">
                1. Get an API key from OpenAI (openai.com/api)\n
                2. Paste it below\n
                3. Use default endpoint or enter custom\n
                4. Click Save
              </Text>
              <Pressable
                onPress={() => openLink('https://platform.openai.com/api-keys')}
                className="flex-row items-center gap-2"
              >
                <MaterialIcons name="open-in-new" size={14} color="#0a7ea4" />
                <Text className="text-xs text-primary font-semibold">Get API Key</Text>
              </Pressable>
            </View>

            {/* API Key */}
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-semibold text-foreground">API Key *</Text>
                <Pressable
                  onPress={() => setShowApiKey(!showApiKey)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <MaterialIcons
                    name={showApiKey ? 'visibility' : 'visibility-off'}
                    size={18}
                    color="#8a92a0"
                  />
                </Pressable>
              </View>
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-... (required for AI features)"
                placeholderTextColor="#8a92a0"
                secureTextEntry={!showApiKey}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
              <Text className="text-xs text-muted mt-1">
                ✓ Stored locally • Never shared • Encrypted
              </Text>
            </View>

            {/* Endpoint */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">API Endpoint</Text>
              <TextInput
                value={endpoint}
                onChangeText={setEndpoint}
                placeholder="https://api.openai.com/v1"
                placeholderTextColor="#8a92a0"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
              <Text className="text-xs text-muted mt-1">
                OpenAI or compatible API endpoint
              </Text>
            </View>

            {/* Model */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Model</Text>
              <TextInput
                value={model}
                onChangeText={setModel}
                placeholder="gpt-3.5-turbo"
                placeholderTextColor="#8a92a0"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
              <Text className="text-xs text-muted mt-1">
                gpt-3.5-turbo, gpt-4, or other compatible model
              </Text>
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-primary rounded-lg px-4 py-3 flex-row items-center justify-center gap-2"
            >
              <MaterialIcons name="save" size={18} color="white" />
              <Text className="text-white font-semibold">
                {saved ? '✓ Saved!' : 'Save Configuration'}
              </Text>
            </Pressable>
          </View>
        </ExpandableSection>

        {/* Offline Commands Section */}
        <ExpandableSection
          title="⚡ Offline Commands"
          subtitle="20+ commands that work without API"
          isExpanded={expandedSection === 'commands'}
          onPress={() => setExpandedSection(expandedSection === 'commands' ? null : 'commands')}
        >
          <View className="bg-surface border border-border rounded-lg overflow-hidden">
            <CommandGrid />
          </View>
        </ExpandableSection>

        {/* Fallback Options Section */}
        <ExpandableSection
          title="🌐 No API Key? Try These"
          subtitle="Alternative AI options"
          isExpanded={expandedSection === 'fallback'}
          onPress={() => setExpandedSection(expandedSection === 'fallback' ? null : 'fallback')}
        >
          <View className="gap-3">
            <FallbackOption
              icon="assistant"
              title="Google Assistant"
              description="Use your device's built-in Google Assistant"
              action={() => Alert.alert('Google Assistant', 'Activate Google Assistant on your device')}
            />
            <FallbackOption
              icon="mic"
              title="Siri / Voice Assistant"
              description="Use your device's native voice assistant"
              action={() => Alert.alert('Voice Assistant', 'Activate Siri or your device assistant')}
            />
            <FallbackOption
              icon="language"
              title="Google AI in Browser"
              description="Open Chrome and use Google's AI mode"
              action={() => openLink('https://google.com')}
            />
            <FallbackOption
              icon="chat"
              title="ChatGPT Web"
              description="Visit ChatGPT directly in your browser"
              action={() => openLink('https://chat.openai.com')}
            />
          </View>
        </ExpandableSection>

        {/* About Section */}
        <ExpandableSection
          title="ℹ️ About Jarvis"
          subtitle="App information"
          isExpanded={expandedSection === 'about'}
          onPress={() => setExpandedSection(expandedSection === 'about' ? null : 'about')}
        >
          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <InfoRow label="Version" value="1.0.5" />
            <InfoRow label="Platform" value={require('react-native').Platform.OS === 'android' ? 'Android' : 'iOS'} />
            <InfoRow label="Status" value="Active" />
            <Text className="text-xs text-muted leading-relaxed mt-2">
              Jarvis is a sophisticated AI assistant with voice control, offline capabilities, and beautiful animations. Developed with React Native & Expo.
            </Text>
          </View>
        </ExpandableSection>

        {/* Danger Zone */}
        <View className="mt-8 mb-8">
          <Text className="text-lg font-semibold text-error mb-3">⚠️ Danger Zone</Text>

          <Pressable
            onPress={handleClearHistory}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
            ]}
            className="bg-error/10 border border-error rounded-lg px-4 py-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="delete-outline" size={20} color="#ff4466" />
              <Text className="text-error font-semibold">Clear All Chat History</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#ff4466" />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function ExpandableSection({
  title,
  subtitle,
  isExpanded,
  onPress,
  children,
}: {
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
      >
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
          <Text className="text-xs text-muted mt-1">{subtitle}</Text>
        </View>
        <MaterialIcons
          name={isExpanded ? 'expand-less' : 'expand-more'}
          size={24}
          color="#8a92a0"
        />
      </Pressable>
      {isExpanded && (
        <View className="mt-3 bg-background border border-border border-t-0 rounded-b-lg p-4">
          {children}
        </View>
      )}
    </View>
  );
}

function CommandGrid() {
  const commands = [
    { emoji: '📊', name: 'Status Report', cmd: 'status report' },
    { emoji: '⏰', name: 'Current Time', cmd: 'what time is it' },
    { emoji: '📅', name: 'Today\'s Date', cmd: 'what date' },
    { emoji: '🔋', name: 'Battery Status', cmd: 'battery check' },
    { emoji: '📡', name: 'Network Info', cmd: 'network status' },
    { emoji: '💾', name: 'Storage Info', cmd: 'storage' },
    { emoji: '⏲️', name: 'Set Reminder', cmd: 'remind me' },
    { emoji: '🔔', name: 'Set Alarm', cmd: 'set alarm' },
    { emoji: '⏱️', name: 'Timer', cmd: 'timer' },
    { emoji: '🗑️', name: 'Clear History', cmd: 'clear history' },
    { emoji: '🕵️', name: 'Stealth Mode', cmd: 'stealth mode' },
    { emoji: '👁️', name: 'Screen Analysis', cmd: 'eyes on' },
    { emoji: '😄', name: 'Tell a Joke', cmd: 'joke' },
    { emoji: '💡', name: 'Get Quote', cmd: 'quote' },
    { emoji: '🧮', name: 'Calculate', cmd: 'calculate' },
    { emoji: '🤖', name: 'Help', cmd: 'help' },
  ];

  return (
    <View className="p-4">
      <View className="flex-row flex-wrap gap-2">
        {commands.map((cmd, idx) => (
          <View key={idx} className="flex-1 min-w-[45%] bg-background border border-border rounded-lg p-2 items-center">
            <Text className="text-2xl mb-1">{cmd.emoji}</Text>
            <Text className="text-xs font-semibold text-foreground text-center">{cmd.name}</Text>
            <Text className="text-xs text-muted text-center mt-1">{cmd.cmd}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FallbackOption({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action: () => void;
}) {
  return (
    <Pressable
      onPress={action}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="bg-surface border border-border rounded-lg p-4 flex-row items-center gap-3"
    >
      <MaterialIcons name={icon as any} size={24} color="#0a7ea4" />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#8a92a0" />
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}
