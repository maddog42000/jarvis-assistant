import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useOnboarding } from '@/lib/onboarding-context';

export default function EntryRoute() {
  const { isReady, hasCompletedOnboarding } = useOnboarding();

  if (!isReady) return <LoadingEntryRoute />;

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/chat" />;
  }

    return <Redirect href={'/onboarding' as Href} />;
}

export function LoadingEntryRoute() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#18d5ff" />
    </View>
  );
}
