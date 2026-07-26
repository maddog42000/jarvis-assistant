import React from 'react';
import { View, Text } from 'react-native';
import { Message } from '@/lib/chat-context';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
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
      <View
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
      </View>

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
