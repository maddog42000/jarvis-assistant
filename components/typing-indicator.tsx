import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [dot1]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dot2.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [dot2]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dot3.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [dot3]);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ translateY: -dot1.value * 4 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ translateY: -dot2.value * 4 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ translateY: -dot3.value * 4 }],
  }));

  return (
    <View className="flex-row gap-1 items-center">
      <Animated.View
        style={[
          dot1Style,
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#00d4ff',
          },
        ]}
      />
      <Animated.View
        style={[
          dot2Style,
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#00d4ff',
          },
        ]}
      />
      <Animated.View
        style={[
          dot3Style,
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#00d4ff',
          },
        ]}
      />
    </View>
  );
}
