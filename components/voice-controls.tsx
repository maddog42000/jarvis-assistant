import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useVoice } from '@/lib/voice-manager';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

export function VoiceControls() {
  const { voiceState, isListening, isSpeaking, startListening, stopListening, stopSpeaking, pauseSpeaking, resumeSpeaking } = useVoice();

  const handleMicPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Haptics not available
    }

    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const handlePause = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }
    pauseSpeaking();
  };

  const handleResume = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }
    resumeSpeaking();
  };

  const handleStop = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics not available
    }
    stopSpeaking();
  };

  return (
    <View className="flex-row gap-2 items-center">
      {/* Microphone button */}
      <Pressable
        onPress={handleMicPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.7 : 1 },
        ]}
        className={`rounded-full p-3 ${
          isListening ? 'bg-error' : 'bg-primary'
        }`}
      >
        <MaterialIcons
          name={isListening ? 'mic' : 'mic-none'}
          size={24}
          color="white"
        />
      </Pressable>

      {/* Voice state indicator */}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-foreground capitalize">
          {voiceState === 'listening' && 'Listening...'}
          {voiceState === 'speaking' && 'Speaking...'}
          {voiceState === 'processing' && 'Processing...'}
          {voiceState === 'idle' && 'Ready'}
        </Text>
      </View>

      {/* Playback controls (only show when speaking) */}
      {isSpeaking && (
        <View className="flex-row gap-2">
          <Pressable
            onPress={handlePause}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
            ]}
            className="bg-surface border border-border rounded-full p-2"
          >
            <MaterialIcons name="pause" size={18} color="#0a7ea4" />
          </Pressable>

          <Pressable
            onPress={handleResume}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
            ]}
            className="bg-surface border border-border rounded-full p-2"
          >
            <MaterialIcons name="play-arrow" size={18} color="#0a7ea4" />
          </Pressable>

          <Pressable
            onPress={handleStop}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
            ]}
            className="bg-error/10 border border-error rounded-full p-2"
          >
            <MaterialIcons name="stop" size={18} color="#ff4466" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
