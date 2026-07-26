import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useChat } from '@/lib/chat-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

interface Shortcut {
  id: string;
  label: string;
  icon: string;
  command: string;
  color: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    id: 'status',
    label: 'Status',
    icon: 'info',
    command: 'Jarvis, status report',
    color: '#0a7ea4',
  },
  {
    id: 'time',
    label: 'Time',
    icon: 'schedule',
    command: 'Jarvis, what time is it?',
    color: '#00d4ff',
  },
  {
    id: 'battery',
    label: 'Battery',
    icon: 'battery-full',
    command: 'Jarvis, battery check',
    color: '#00ff88',
  },
  {
    id: 'network',
    label: 'Network',
    icon: 'signal-cellular-alt',
    command: 'Jarvis, network status',
    color: '#ffaa00',
  },
  {
    id: 'stealth',
    label: 'Stealth',
    icon: 'visibility-off',
    command: 'Jarvis, stealth mode',
    color: '#ff4466',
  },
  {
    id: 'clear',
    label: 'Clear',
    icon: 'delete-outline',
    command: 'Jarvis, clear history',
    color: '#8a92a0',
  },
];

interface GestureShortcutsProps {
  onShortcutPress?: (command: string) => void;
}

export function GestureShortcuts({ onShortcutPress }: GestureShortcutsProps) {
  const { sendMessage } = useChat();

  const handleShortcut = async (shortcut: Shortcut) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }

    if (onShortcutPress) {
      onShortcutPress(shortcut.command);
    } else {
      await sendMessage(shortcut.command);
    }
  };

  return (
    <View className="bg-surface rounded-lg p-4">
      <Text className="text-sm font-semibold text-foreground mb-3">Quick Shortcuts</Text>
      <View className="flex-row flex-wrap gap-2">
        {SHORTCUTS.map((shortcut) => (
          <Pressable
            key={shortcut.id}
            onPress={() => handleShortcut(shortcut)}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.7 : 1,
                backgroundColor: `${shortcut.color}20`,
                borderWidth: 1,
                borderColor: shortcut.color,
              },
            ]}
            className="items-center justify-center p-3 rounded-lg flex-1 min-w-[30%]"
          >
            <MaterialIcons name={shortcut.icon as any} size={20} color={shortcut.color} />
            <Text className="text-xs text-foreground mt-1 text-center">{shortcut.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
