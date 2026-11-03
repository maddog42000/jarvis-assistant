import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const SERVICES = [
  { name: 'Gmail', detail: 'Read-only mail search and summaries' },
  { name: 'Google Calendar', detail: 'Read-only event lookup' },
  { name: 'Google Drive', detail: 'Read-only file search and metadata' },
  { name: 'Google Contacts', detail: 'Read-only contact lookup' },
];

export function GoogleConnectionCenter() {
  return (
    <View className="bg-surface border border-border rounded-2xl p-4">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center">
          <MaterialIcons name="account-circle" size={24} color="#18d5ff" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">Google account</Text>
          <Text className="text-xs text-warning mt-1">Setup required · Not connected</Text>
        </View>
        <MaterialIcons name="lock-outline" size={20} color="#f5b942" />
      </View>

      <Text className="text-xs text-muted leading-relaxed mt-3">
        You do not need Google account sign-in to use Gemini. Choose Google Gemini under AI provider and paste a key from Google AI Studio to enable AI chat. Google account sign-in is a separate integration and is not enabled in this build.
      </Text>

      <View className="bg-background border border-border rounded-xl p-3 mt-3">
        <Text className="text-sm font-semibold text-foreground">Google account services are not active yet</Text>
        <Text className="text-xs text-muted leading-relaxed mt-1">
          Gmail, Calendar, Drive, and Contacts require a verified Google OAuth configuration and service-specific permissions. Until that owner setup is complete, these services remain disconnected. This does not affect Gemini API-key chat or offline phone actions.
        </Text>
        <Pressable
          onPress={() => void Linking.openURL('https://console.cloud.google.com/apis/credentials')}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="flex-row items-center gap-2 mt-3"
        >
          <MaterialIcons name="open-in-new" size={16} color="#18d5ff" />
          <Text className="text-xs font-semibold text-primary">Google Cloud OAuth setup</Text>
        </Pressable>
      </View>

      <Text className="text-sm font-semibold text-foreground mt-4 mb-2">Google services</Text>
      <View className="gap-2">
        {SERVICES.map((service) => (
          <View key={service.name} className="flex-row items-center gap-3 rounded-xl border border-border bg-background p-3">
            <MaterialIcons name="cloud-off" size={19} color="#8a92a0" />
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground">{service.name}</Text>
              <Text className="text-[11px] text-muted mt-0.5">{service.detail}</Text>
            </View>
            <Text className="text-[10px] font-semibold text-muted">Not connected</Text>
          </View>
        ))}
      </View>
      <Text className="text-[11px] text-muted leading-relaxed mt-3">
        Each service will request its own permission, starting with read-only access. Sending, editing, and deleting will require separate confirmation.
      </Text>
    </View>
  );
}
