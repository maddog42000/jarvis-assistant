import React from 'react';
import { Alert, Pressable, View, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Message } from '@/lib/chat-context';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const copyMessage = async () => {
    await Clipboard.setStringAsync(message.content);
    Alert.alert('Message copied', 'You can now paste it anywhere.');
  };
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      className={`flex-row gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar indicator */}
      {!isUser && (
        <View
          className="w-8 h-8 rounded-full bg-primary items-center justify-center flex-shrink-0"
        >
          <Text className="text-xs font-bold text-white">J</Text>
        </View>
      )}

      {/* Message bubble */}
      <Pressable
        onLongPress={() => void copyMessage()}
        delayLongPress={350}
        accessibilityHint="Long press to copy this message"
        className={`max-w-xs px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary rounded-br-none'
            : 'bg-surface rounded-bl-none border border-border'
        }`}
      >
        <Text
          className={`text-base leading-relaxed ${
            isUser ? 'text-white' : 'text-foreground'
          }`}
        >
          {message.content}
        </Text>

        {/* Timestamp and offline indicator */}
        <View className="flex-row items-center gap-1 mt-2">
          <Text
            className={`text-xs ${
              isUser ? 'text-blue-200' : 'text-muted'
            }`}
          >
            {timestamp}
          </Text>
          {message.isOfflineCommand && (
            <Text className="text-xs text-warning">● offline</Text>
          )}
        </View>
        <Pressable onPress={() => void copyMessage()} hitSlop={8} className="self-end mt-1 flex-row items-center gap-1">
          <MaterialIcons name="content-copy" size={12} color={isUser ? '#d8f4ff' : '#18d5ff'} />
          <Text className={`text-[10px] ${isUser ? 'text-blue-200' : 'text-primary'}`}>Copy</Text>
        </Pressable>
      </Pressable>

      {/* User avatar */}
      {isUser && (
        <View
          className="w-8 h-8 rounded-full bg-tint items-center justify-center flex-shrink-0"
        >
          <Text className="text-xs font-bold text-background">U</Text>
        </View>
      )}
    </View>
  );
}
