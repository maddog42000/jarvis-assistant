import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';

interface JarvisAvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: number;
}

export function JarvisAvatar({ state, size = 80 }: JarvisAvatarProps) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const orbitRotation = useSharedValue(0);
  const mouthScale = useSharedValue(0);

  useEffect(() => {
    if (state === 'idle') {
      // Subtle pulse
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = 0.3;
    } else if (state === 'listening') {
      // Listening animation - faster pulse
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = 0.7;
    } else if (state === 'thinking') {
      // Orbiting glow dots
      orbitRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1
      );
      glowOpacity.value = 0.8;
      pulseScale.value = 1;
    } else if (state === 'speaking') {
      // Mouth animation
      mouthScale.value = withRepeat(
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = 1;
      pulseScale.value = 1;
    }
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const mouthStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: mouthScale.value }],
  }));

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow background */}
      <Animated.View
        style={[
          glowStyle,
          {
            position: 'absolute',
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: '#00d4ff',
          },
        ]}
      />

      {/* Main avatar container */}
      <Animated.View
        style={[
          pulseStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#0a7ea4',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          },
        ]}
      >
        {/* Eyes */}
        <View className="absolute top-6 flex-row gap-3">
          <View
            className="rounded-full bg-white"
            style={{ width: 6, height: 6 }}
          />
          <View
            className="rounded-full bg-white"
            style={{ width: 6, height: 6 }}
          />
        </View>

        {/* Mouth (animated when speaking) */}
        {state === 'speaking' && (
          <Animated.View
            style={[
              mouthStyle,
              {
                position: 'absolute',
                bottom: 12,
                width: 16,
                height: 2,
                backgroundColor: '#00d4ff',
                borderRadius: 1,
              },
            ]}
          />
        )}

        {/* Orbiting dots (when thinking) */}
        {state === 'thinking' && (
          <Animated.View style={[orbitStyle, { position: 'absolute' }]}>
            <View
              style={{
                width: size * 0.8,
                height: size * 0.8,
                borderRadius: (size * 0.8) / 2,
                borderWidth: 1,
                borderColor: 'rgba(0, 212, 255, 0.5)',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  left: '50%',
                  marginLeft: -4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#00d4ff',
                }}
              />
            </View>
          </Animated.View>
        )}
      </Animated.View>

      {/* Status text below avatar */}
      <Text className="mt-3 text-xs text-muted uppercase tracking-wider">
        {state === 'idle' && 'Ready'}
        {state === 'listening' && 'Listening...'}
        {state === 'thinking' && 'Thinking...'}
        {state === 'speaking' && 'Speaking...'}
      </Text>
    </View>
  );
}
