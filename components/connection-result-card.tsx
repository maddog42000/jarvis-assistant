import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

type ConnectionResultCardProps = {
  status: ConnectionStatus;
  message: string;
  onRetry?: () => void;
};

export function ConnectionResultCard({ status, message, onRetry }: ConnectionResultCardProps) {
  if (status === 'idle' || !message) return null;

  const isTesting = status === 'testing';
  const isSuccess = status === 'success';
  const color = isSuccess ? '#49d17d' : status === 'error' ? '#ff6878' : '#18d5ff';
  const title = isTesting ? 'Checking connection' : isSuccess ? 'Connection ready' : 'Connection needs attention';
  const icon = isTesting ? undefined : isSuccess ? 'check-circle' : 'error-outline';

  return (
    <View className={`mt-3 rounded-xl border p-3 ${isSuccess ? 'bg-success/10 border-success/30' : status === 'error' ? 'bg-error/10 border-error/30' : 'bg-primary/10 border-primary/30'}`}>
      <View className="flex-row items-start gap-3">
        {isTesting ? <ActivityIndicator size="small" color={color} /> : <MaterialIcons name={icon!} size={20} color={color} />}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
          <Text className="text-xs leading-relaxed mt-1" style={{ color }}>{message}</Text>
        </View>
      </View>
      {status === 'error' && onRetry ? (
        <Pressable onPress={onRetry} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} className="self-start flex-row items-center gap-1 mt-3 rounded-lg border border-error/40 px-3 py-2">
          <MaterialIcons name="refresh" size={15} color={color} />
          <Text className="text-xs font-bold" style={{ color }}>Retry connection</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
