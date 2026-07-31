import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { JarvisAvatar } from '@/components/jarvis-avatar';
import { ChatMessage } from '@/components/chat-message';
import { useChat } from '@/lib/chat-context';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ChatScreen() {
  const {
    messages,
    isLoading,
    jarvisState,
    sendMessage,
    addMessage,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available on web
    }

    await sendMessage(text);
  };

  const handleVoiceInput = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Haptics not available
    }
    // Voice input would be implemented with expo-speech-recognition
    addMessage('user', '[Voice input would be recorded here]');
  };

  const handleQuickAction = async (action: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }
    await sendMessage(action);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScreenContainer className="flex-1 justify-between p-0">
        {/* Header with gradient effect */}
        <View className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-4 py-4 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <MaterialIcons name="smart-toy" size={20} color="#0a7ea4" />
          </View>
          <View>
            <Text className="text-2xl font-bold text-foreground">Jarvis</Text>
            <Text className="text-xs text-muted mt-0.5">AI Assistant</Text>
          </View>
        </View>

        {/* Messages and Avatar */}
        <View className="flex-1">
          {messages.length === 0 ? (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              className="flex-1 justify-center items-center px-6"
            >
              <JarvisAvatar state={jarvisState} size={100} />
              <Text className="text-center text-foreground text-lg font-semibold mt-6">
                Welcome to Jarvis
              </Text>
              <Text className="text-center text-muted text-sm mt-3 leading-relaxed">
                I'm your AI assistant. Start a conversation, ask me anything, or use voice commands.
              </Text>

              {/* Quick action buttons */}
              <View className="mt-8 gap-3 w-full">
                <Pressable
                  onPress={() => handleQuickAction('What can you do?')}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  className="bg-primary rounded-lg px-4 py-3 flex-row items-center justify-center gap-2"
                >
                  <MaterialIcons name="info" size={18} color="white" />
                  <Text className="text-white text-center font-semibold">
                    What can you do?
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleQuickAction('Jarvis, status report')}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  className="bg-surface border border-primary/30 rounded-lg px-4 py-3 flex-row items-center justify-center gap-2"
                >
                  <MaterialIcons name="dashboard" size={18} color="#0a7ea4" />
                  <Text className="text-foreground text-center font-semibold">
                    Status Report
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleQuickAction('help')}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  className="bg-surface border border-primary/30 rounded-lg px-4 py-3 flex-row items-center justify-center gap-2"
                >
                  <MaterialIcons name="help" size={18} color="#0a7ea4" />
                  <Text className="text-foreground text-center font-semibold">
                    Show Commands
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChatMessage message={item} />}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
              scrollEnabled
              onEndReachedThreshold={0.3}
            />
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View className="items-center justify-center py-4">
              <JarvisAvatar state={jarvisState} size={60} />
            </View>
          )}
        </View>

        {/* Input area */}
        <View className="bg-surface border-t border-border px-4 py-4 gap-3">
          {/* Quick action buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-2"
            contentContainerStyle={{ gap: 8 }}
          >
            <Pressable
              onPress={() => handleQuickAction('Jarvis, what time is it?')}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-primary/10 border border-primary/30 rounded-full px-3 py-2 flex-row items-center gap-2"
            >
              <MaterialIcons name="schedule" size={14} color="#0a7ea4" />
              <Text className="text-xs text-primary font-semibold">Time</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAction('Jarvis, battery check')}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-success/10 border border-success/30 rounded-full px-3 py-2 flex-row items-center gap-2"
            >
              <MaterialIcons name="battery-full" size={14} color="#22C55E" />
              <Text className="text-xs text-success font-semibold">Battery</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAction('Jarvis, network status')}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-warning/10 border border-warning/30 rounded-full px-3 py-2 flex-row items-center gap-2"
            >
              <MaterialIcons name="signal-cellular-alt" size={14} color="#F59E0B" />
              <Text className="text-xs text-warning font-semibold">Network</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAction('Jarvis, status report')}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-primary/10 border border-primary/30 rounded-full px-3 py-2 flex-row items-center gap-2"
            >
              <MaterialIcons name="dashboard" size={14} color="#0a7ea4" />
              <Text className="text-xs text-primary font-semibold">Status</Text>
            </Pressable>
          </ScrollView>

          {/* Input field */}
          <View className="flex-row gap-3 items-end">
            <Pressable
              onPress={handleVoiceInput}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-primary/20 border border-primary rounded-full p-3 justify-center items-center"
            >
              <MaterialIcons name="mic" size={20} color="#0a7ea4" />
            </Pressable>

            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Jarvis..."
              placeholderTextColor="#8a92a0"
              className="flex-1 bg-surface border border-border rounded-full px-4 py-3 text-foreground"
              multiline
              maxLength={500}
              editable={!isLoading}
            />

            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : !inputText.trim() || isLoading ? 0.5 : 1 },
              ]}
              className="bg-primary rounded-full p-3 justify-center items-center"
            >
              <MaterialIcons name="send" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
