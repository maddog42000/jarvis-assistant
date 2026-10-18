import { Redirect } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useOnboarding } from "@/lib/onboarding-context";

const ESTIMATED_LOAD_MS = 3200;
const OBJECTS = [
  { label: "J", left: "16%", top: "28%", color: "#18d5ff", drift: -90, rotate: "-34deg" },
  { label: "A", left: "46%", top: "20%", color: "#a979ff", drift: 80, rotate: "38deg" },
  { label: "R", left: "73%", top: "34%", color: "#42e6a4", drift: 120, rotate: "-52deg" },
  { label: "V", left: "31%", top: "55%", color: "#ffbd66", drift: -120, rotate: "52deg" },
  { label: "I", left: "66%", top: "61%", color: "#ff6f91", drift: 70, rotate: "-28deg" },
  { label: "S", left: "84%", top: "72%", color: "#18d5ff", drift: -80, rotate: "40deg" },
];

export default function EntryRoute() {
  const { isReady, hasCompletedOnboarding } = useOnboarding();
  const [launch, setLaunch] = useState(false);

  if (launch) {
    return hasCompletedOnboarding ? <Redirect href="/(tabs)" /> : <Redirect href={"/onboarding" as Href} />;
  }

  return <LoadingEntryRoute isReady={isReady} onLaunch={() => setLaunch(true)} />;
}

function FallingObject({
  object,
  index,
}: {
  object: (typeof OBJECTS)[number];
  index: number;
}) {
  const fall = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [fallen, setFallen] = useState(false);

  const fallApart = () => {
    if (fallen) return;
    setFallen(true);
    Animated.parallel([
      Animated.timing(fall, {
        toValue: 1,
        duration: 650 + index * 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.12,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.35, duration: 560, useNativeDriver: true }),
      ]),
    ]).start();
  };

  return (
    <Pressable
      accessibilityLabel={`Break apart ${object.label}`}
      onPress={fallApart}
      style={[styles.objectHit, { left: object.left as `${number}%`, top: object.top as `${number}%` }]}
    >
      <Animated.View
        style={{
          opacity,
          transform: [
            { translateX: fall.interpolate({ inputRange: [0, 1], outputRange: [0, object.drift] }) },
            { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, 170] }) },
            { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", object.rotate] }) },
            { scale },
          ],
        }}
      >
        <View style={[styles.object, { borderColor: object.color, shadowColor: object.color }]}>
          <Text style={[styles.objectLabel, { color: object.color }]}>{object.label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function LoadingEntryRoute({
  isReady,
  onLaunch,
}: {
  isReady: boolean;
  onLaunch: () => void;
}) {
  const [progress, setProgress] = useState(4);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const nextElapsed = Date.now() - startedAt;
      setElapsed(nextElapsed);
      if (isReady) {
        setProgress(100);
        return;
      }
      setProgress(Math.min(92, Math.max(4, Math.round((nextElapsed / ESTIMATED_LOAD_MS) * 92))));
    }, 80);
    return () => clearInterval(timer);
  }, [isReady]);

  const ready = isReady;
  const progressWidth = `${Math.max(4, progress)}%` as `${number}%`;

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.scanLine} />
      <View style={styles.header}>
        <Text style={styles.kicker}>JARVIS // SYSTEM BOOT</Text>
        <Text style={styles.title}>LAUNCH BAY</Text>
        <Text style={styles.subtitle}>
          {ready ? "Core systems are online." : "Tap the floating nodes while Jarvis wakes up."}
        </Text>
      </View>

      <View style={styles.playfield}>
        <View style={styles.ringOuter} />
        <View style={styles.ringInner} />
        {OBJECTS.map((object, index) => (
          <FallingObject key={`${object.label}-${index}`} object={object} index={index} />
        ))}
        <View style={styles.core}>
          <Text style={styles.coreText}>{ready ? "READY" : `${progress}%`}</Text>
          <Text style={styles.coreCaption}>{ready ? "TO LAUNCH" : "BOOTING"}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{ready ? "STARTUP COMPLETE" : "INITIALIZING CORE SYSTEMS"}</Text>
          <Text style={styles.timeText}>
            {ready ? `${(elapsed / 1000).toFixed(1)}s` : `EST. ${(ESTIMATED_LOAD_MS / 1000).toFixed(1)}s`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ready ? "Launch Jarvis" : "Jarvis is loading"}
          disabled={!ready}
          onPress={onLaunch}
          style={({ pressed }) => [styles.launchButton, !ready && styles.launchButtonDisabled, pressed && styles.launchButtonPressed]}
        >
          <Text style={styles.launchButtonText}>{ready ? "LAUNCH JARVIS" : "PLEASE WAIT"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#070b12", paddingHorizontal: 24, paddingTop: 70, paddingBottom: 30 },
  scanLine: { position: "absolute", left: 0, right: 0, top: "43%", height: 1, backgroundColor: "rgba(24,213,255,0.12)" },
  header: { alignItems: "center" },
  kicker: { color: "#18d5ff", fontSize: 11, fontWeight: "700", letterSpacing: 2.4 },
  title: { color: "#edfaff", fontSize: 32, fontWeight: "800", letterSpacing: 5, marginTop: 10 },
  subtitle: { color: "#7f99a8", fontSize: 14, marginTop: 10, textAlign: "center" },
  playfield: { flex: 1, minHeight: 360, position: "relative", marginVertical: 18, overflow: "hidden" },
  ringOuter: { position: "absolute", width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: "rgba(24,213,255,0.18)", alignSelf: "center", top: "22%" },
  ringInner: { position: "absolute", width: 168, height: 168, borderRadius: 84, borderWidth: 1, borderColor: "rgba(167,121,255,0.24)", alignSelf: "center", top: "31%" },
  core: { position: "absolute", alignSelf: "center", top: "42%", width: 100, height: 100, borderRadius: 50, backgroundColor: "#0e1d2a", borderWidth: 2, borderColor: "#18d5ff", alignItems: "center", justifyContent: "center", shadowColor: "#18d5ff", shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  coreText: { color: "#effcff", fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  coreCaption: { color: "#18d5ff", fontSize: 9, fontWeight: "700", letterSpacing: 1.3, marginTop: 4 },
  objectHit: { position: "absolute", width: 58, height: 58, marginLeft: -29, marginTop: -29, alignItems: "center", justifyContent: "center" },
  object: { width: 46, height: 46, borderRadius: 14, borderWidth: 1.5, backgroundColor: "rgba(11,25,37,0.92)", alignItems: "center", justifyContent: "center", shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  objectLabel: { fontSize: 20, fontWeight: "800" },
  footer: { gap: 14 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusText: { color: "#a9c4d0", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  timeText: { color: "#18d5ff", fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#152431", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#18d5ff" },
  launchButton: { height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#18d5ff", shadowColor: "#18d5ff", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  launchButtonDisabled: { backgroundColor: "#1a3442", shadowOpacity: 0 },
  launchButtonPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  launchButtonText: { color: "#061018", fontSize: 14, fontWeight: "800", letterSpacing: 1.8 },
});
