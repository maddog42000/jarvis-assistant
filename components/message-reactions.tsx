import React from 'react';
import { View, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

interface MessageReactionsProps {
  messageId: string;
  onReact?: (messageId: string, emoji: string) => void;
}

const REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '💡'];

export function MessageReactions({ messageId, onReact }: MessageReactionsProps) {
  const handleReact = async (emoji: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }

    if (onReact) {
      onReact(messageId, emoji);
    }
  };

  return (
    <View className="flex-row gap-1 mt-2">
      {REACTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => handleReact(emoji)}
          style={({ pressed }) => [
            { opacity: pressed ? 0.7 : 1 },
          ]}
          className="bg-surface border border-border rounded-full px-2 py-1"
        >
          <Text className="text-sm">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}
