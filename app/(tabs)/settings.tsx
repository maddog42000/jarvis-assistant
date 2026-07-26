import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useChat } from '@/lib/chat-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const { apiConfig, updateApiConfig, clearMessages } = useChat();

  const [endpoint, setEndpoint] = useState(apiConfig.endpoint);
  const [apiKey, setApiKey] = useState(apiConfig.apiKey);
  const [model, setModel] = useState(apiConfig.model);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        {/* Header */}
        <Text className="text-2xl font-bold text-foreground mb-6">Settings</Text>

        {/* API Configuration Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">
            API Configuration
          </Text>

          {/* Endpoint */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted mb-2">API Endpoint</Text>
            <TextInput
              value={endpoint}
              onChangeText={setEndpoint}
              placeholder="https://api.openai.com/v1"
              placeholderTextColor="#8a92a0"
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
            <Text className="text-xs text-muted mt-1">
              Enter your OpenAI-compatible API endpoint URL
            </Text>
          </View>

          {/* API Key */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-medium text-muted">API Key</Text>
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
              placeholder="sk-..."
              placeholderTextColor="#8a92a0"
              secureTextEntry={!showApiKey}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
            <Text className="text-xs text-muted mt-1">
              Your API key is stored locally and never shared
            </Text>
          </View>

          {/* Model */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted mb-2">Model</Text>
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder="gpt-3.5-turbo"
              placeholderTextColor="#8a92a0"
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
            <Text className="text-xs text-muted mt-1">
              Specify the model name (e.g., gpt-3.5-turbo, gpt-4)
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
              {saved ? 'Saved!' : 'Save Configuration'}
            </Text>
          </Pressable>
        </View>

        {/* Offline Commands Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Offline Commands
          </Text>

          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <CommandItem
              title="Status Report"
              description="Get device status, battery, network info"
              command="Jarvis, status report"
            />
            <CommandItem
              title="What Time Is It?"
              description="Current time and date"
              command="Jarvis, what time is it?"
            />
            <CommandItem
              title="Battery Check"
              description="Battery percentage and status"
              command="Jarvis, battery check"
            />
            <CommandItem
              title="Network Status"
              description="WiFi and cellular information"
              command="Jarvis, network status"
            />
            <CommandItem
              title="Stealth Mode"
              description="Reduce visibility and silence responses"
              command="Jarvis, stealth mode"
            />
            <CommandItem
              title="Clear History"
              description="Wipe all conversations"
              command="Jarvis, clear history"
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-error mb-4">Danger Zone</Text>

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

        {/* About Section */}
        <View className="bg-surface border border-border rounded-lg p-4">
          <Text className="text-sm font-semibold text-foreground mb-2">About Jarvis</Text>
          <Text className="text-xs text-muted leading-relaxed">
            Jarvis is a sophisticated AI assistant with voice control, offline capabilities, and beautiful animations. Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function CommandItem({
  title,
  description,
  command,
}: {
  title: string;
  description: string;
  command: string;
}) {
  return (
    <View className="pb-3 border-b border-border last:border-b-0">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <Text className="text-xs text-muted mt-1">{description}</Text>
      <View className="bg-background rounded mt-2 px-2 py-1">
        <Text className="text-xs text-primary font-mono">{command}</Text>
      </View>
    </View>
  );
}
