import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTts } from '@/lib/tts-context';

export const PRESET_COMMANDS = [
  { label: 'Time', command: 'what time is it', icon: 'schedule' as const, color: '#18d5ff' },
  { label: 'Date', command: 'what date is it', icon: 'today' as const, color: '#9c8cff' },
  { label: 'Battery', command: 'battery check', icon: 'battery-full' as const, color: '#49d17d' },
  { label: 'Network', command: 'network status', icon: 'wifi' as const, color: '#f5b942' },
  { label: 'Storage', command: 'storage info', icon: 'sd-storage' as const, color: '#ff8a65' },
  { label: 'Status', command: 'status report', icon: 'dashboard' as const, color: '#18d5ff' },
  { label: 'Weather', command: 'weather', icon: 'wb-sunny' as const, color: '#f5b942' },
  { label: 'Reminder', command: 'remind me', icon: 'alarm-add' as const, color: '#9c8cff' },
  { label: 'Timer', command: 'timer', icon: 'timer' as const, color: '#ff8a65' },
  { label: 'Joke', command: 'tell me a joke', icon: 'sentiment-very-satisfied' as const, color: '#49d17d' },
  { label: 'Quote', command: 'give me a quote', icon: 'format-quote' as const, color: '#18d5ff' },
  { label: 'Help', command: 'help', icon: 'help-outline' as const, color: '#9c8cff' },
  { label: 'Features', command: 'features', icon: 'auto-awesome' as const, color: '#f5b942' },
  { label: 'About', command: 'about jarvis', icon: 'info-outline' as const, color: '#ff8a65' },
  { label: 'Overwatch', command: 'overwatch', icon: 'visibility' as const, color: '#49d17d' },
  { label: 'Stealth', command: 'stealth mode', icon: 'visibility-off' as const, color: '#18d5ff' },
];

export function CommandCarousel({ onSelect }: { onSelect: (command: string) => void }) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted">Quick commands</Text>
        <Text className="text-xs text-muted">Swipe to explore</Text>
      </View>
      <FlatList
        data={PRESET_COMMANDS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.label}
        contentContainerStyle={{ gap: 10, paddingRight: 20 }}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item.command)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, width: 132 }]}
            className="bg-background border border-border rounded-2xl p-3"
          >
            <View className="w-9 h-9 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: `${item.color}22` }}>
              <MaterialIcons name={item.icon} size={20} color={item.color} />
            </View>
            <Text className="text-sm font-semibold text-foreground">{item.label}</Text>
            <Text className="text-xs text-muted mt-1" numberOfLines={1}>{item.command}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

export function SpeechPlayer() {
  const { isSpeaking, isPaused, currentText, progress, canPause, speak, restart, pauseOrResume, stop } = useTts();

  if (!currentText) return null;

  return (
    <View className="bg-primary/10 border border-primary/30 rounded-2xl p-3 mb-3">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
          <MaterialIcons name="volume-up" size={15} color="#18d5ff" />
        </View>
        <Text className="flex-1 text-xs font-semibold text-foreground" numberOfLines={1}>
          {isSpeaking ? 'Jarvis is speaking' : isPaused ? 'Speech paused' : 'Last response'}
        </Text>
        <Pressable onPress={() => speak(currentText)} hitSlop={10}>
          <MaterialIcons name="replay" size={18} color="#18d5ff" />
        </Pressable>
        <Pressable onPress={() => void stop()} hitSlop={10}>
          <MaterialIcons name="stop-circle" size={18} color="#ff6b78" />
        </Pressable>
      </View>
      <View className="h-1.5 rounded-full bg-primary/20 overflow-hidden">
        <View className="h-full rounded-full bg-primary" style={{ width: `${Math.max(progress * 100, 2)}%` }} />
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-[11px] text-muted flex-1">
          {canPause ? 'Pause or resume playback' : 'Android: use replay to hear it again'}
        </Text>
        <Pressable
          onPress={() => void (canPause ? pauseOrResume() : (isSpeaking ? stop() : restart()))}
          className="flex-row items-center gap-1"
          hitSlop={8}
        >
          <MaterialIcons name={canPause && !isPaused ? 'pause' : 'play-arrow'} size={18} color="#18d5ff" />
          <Text className="text-xs font-semibold text-primary">{canPause && !isPaused ? 'Pause' : 'Play'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
