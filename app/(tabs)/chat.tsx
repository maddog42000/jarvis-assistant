import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { ChatMessage } from '@/components/chat-message';
import { JarvisAvatar } from '@/components/jarvis-avatar';
import { ScreenContainer } from '@/components/screen-container';
import { CommandCarousel, SpeechPlayer } from '@/components/voice-and-command-widgets';
import { useChat } from '@/lib/chat-context';
import { useTts } from '@/lib/tts-context';

export default function ChatScreen() {
  const { messages, isLoading, jarvisState, sendMessage, hasApiKey } = useChat();
  const { speak, settings: ttsSettings } = useTts();
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: true });
    const latest = messages[messages.length - 1];
    if (latest?.role === 'assistant' && latest.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = latest.id;
      if (ttsSettings.autoSpeak) speak(latest.content);
    }
  }, [messages, speak, ttsSettings.autoSpeak]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics are optional.
    }
    await sendMessage(text);
  };

  const handleVoiceInput = () => {
    inputRef.current?.focus();
    Alert.alert('Keyboard dictation', 'Your Android keyboard microphone is the safe voice-input option in this APK. Tap its microphone, speak, then tap Send.');
  };

  const openGoogleAi = async () => {
    try {
      await Linking.openURL('https://gemini.google.com/app');
    } catch {
      Alert.alert('Unable to open Google AI', 'Open Chrome and visit gemini.google.com/app.');
    }
  };

  const handleQuickAction = async (command: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics are optional.
    }
    await sendMessage(command);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <ScreenContainer className="flex-1 p-0" edges={['top', 'left', 'right']}>
        <View className="bg-surface border-b border-primary/20 px-4 py-4 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center">
            <MaterialIcons name="smart-toy" size={22} color="#18d5ff" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Jarvis</Text>
            <Text className="text-xs text-muted mt-0.5">Private assistant · offline first</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-success" />
            <Text className="text-xs text-success">Ready</Text>
          </View>
        </View>

        <View className="flex-1">
          {messages.length === 0 ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
              <View className="flex-1 justify-center items-center">
                <JarvisAvatar state={jarvisState} size={104} />
                <Text className="text-center text-foreground text-2xl font-bold mt-6">How can I help?</Text>
                <Text className="text-center text-muted text-sm mt-3 leading-relaxed max-w-sm">
                  Ask a question, try an offline command, or browse the quick actions below.
                </Text>
                <View className="w-full mt-7 bg-surface border border-border rounded-2xl p-4">
                  <CommandCarousel onSelect={handleQuickAction} />
                </View>
              </View>
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChatMessage message={item} />}
              contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            />
          )}
          {isLoading && (
            <View className="items-center justify-center py-3">
              <JarvisAvatar state={jarvisState} size={56} />
            </View>
          )}
        </View>

        <View className="bg-surface border-t border-border px-4 pt-3" style={{ paddingBottom: keyboardVisible ? 8 : 16 }}>
          <SpeechPlayer />
          {messages.length > 0 && <CommandCarousel onSelect={handleQuickAction} />}
          <View className="flex-row gap-2 items-end mt-3">
            <Pressable
              onPress={handleVoiceInput}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="w-12 h-12 rounded-full bg-primary/15 border border-primary items-center justify-center"
              accessibilityLabel="Voice input help"
            >
              <MaterialIcons name="mic-none" size={22} color="#18d5ff" />
            </Pressable>
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Jarvis anything..."
              placeholderTextColor="#77808c"
              className="flex-1 min-h-[48px] max-h-28 bg-background border border-border rounded-2xl px-4 py-3 text-foreground"
              multiline
              maxLength={500}
              editable={!isLoading}
              scrollEnabled
              onFocus={() => requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }))}
              returnKeyType="send"
              onSubmitEditing={() => void handleSend()}
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!inputText.trim() || isLoading}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : !inputText.trim() || isLoading ? 0.45 : 1 }]}
              className="w-12 h-12 rounded-full bg-primary items-center justify-center"
              accessibilityLabel="Send message"
            >
              <MaterialIcons name="arrow-upward" size={22} color="#061018" />
            </Pressable>
          </View>
          <Text className="text-[11px] text-muted text-center mt-2">Offline commands work without an API key</Text>
          {!hasApiKey ? (
            <Pressable onPress={() => void openGoogleAi()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} className="flex-row items-center justify-center gap-1 mt-2">
              <MaterialIcons name="open-in-new" size={14} color="#18d5ff" />
              <Text className="text-[11px] text-primary font-semibold">Open Google AI in Chrome</Text>
            </Pressable>
          ) : null}
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
