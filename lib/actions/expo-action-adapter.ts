import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type { ActionHandler, ActionId } from './action-engine';

type NativeAutomation = {
  openAccessibilitySettings: () => Promise<boolean>;
  setAlarm: (hour: number, minute: number, label: string) => Promise<boolean>;
  isAccessibilityServiceEnabled: () => boolean;
  clickVisibleText: (label: string) => Promise<boolean>;
  typeIntoLabeledField: (label: string, text: string) => Promise<boolean>;
  pressBack: () => Promise<boolean>;
};

const nativeAutomation = Platform.OS === 'android'
  ? requireOptionalNativeModule<NativeAutomation>('JarvisAutomation')
  : null;

const SEARCH_URLS = {
  google: (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  bing: (query: string) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  duckduckgo: (query: string) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
};

const APP_URLS: Record<string, string[]> = {
  google: ['google://', 'https://www.google.com/'],
  gemini: ['gemini://', 'https://gemini.google.com/'],
  chrome: ['googlechrome://', 'https://www.google.com/chrome/'],
  bixby: ['bixby://', 'https://www.samsung.com/us/apps/bixby/'],
};

async function openFirstAvailable(urls: string[]) {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return { ok: true, message: `Opened ${url.startsWith('https:') ? 'the web page' : 'the installed app'}.` };
      }
      if (url.startsWith('https:')) {
        await Linking.openURL(url);
        return { ok: true, message: 'Opened the web page because a matching app was not detected.' };
      }
    } catch (error) {
      lastError = error;
    }
  }
  return { ok: false, message: lastError instanceof Error ? lastError.message : 'No compatible app or web page could be opened.' };
}

async function scheduleReminder(args: Record<string, unknown>) {
  if (Platform.OS === 'web') return { ok: false, message: 'Local notifications are available in the installed mobile app, not the web preview.' };
  const permission = await Notifications.getPermissionsAsync();
  let granted = permission.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return { ok: false, message: 'Notification permission was not granted. Enable notifications for Jarvis in Android settings and try again.' };

  const title = String(args.title);
  const date = new Date(String(args.at));
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
    return { ok: false, message: 'That reminder time is no longer in the future. Please choose a later time.' };
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('jarvis-reminders', {
      name: 'Jarvis reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Jarvis reminder', body: title, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, ...(Platform.OS === 'android' ? { channelId: 'jarvis-reminders' } : {}) },
  });
  return { ok: true, message: `Reminder scheduled for ${date.toLocaleString()}.`, data: { notificationId: id, scheduledAt: date.toISOString() } };
}

/**
 * Connects the validated action engine to safe Expo APIs. This deliberately
 * does not provide arbitrary taps, shell commands, or unattended UI control.
 */
export function createExpoActionHandlers(): Partial<Record<ActionId, ActionHandler>> {
  return {
    openUrl: async (args) => {
      const url = String(args.url);
      try {
        await Linking.openURL(url);
        return { ok: true, message: 'Opened the requested link.' };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : 'Could not open that link.' };
      }
    },
    searchWeb: async (args) => {
      const provider = String(args.provider ?? 'google') as keyof typeof SEARCH_URLS;
      const url = SEARCH_URLS[provider](String(args.query));
      try {
        await Linking.openURL(url);
        return { ok: true, message: `Opened a ${provider} search.` };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : 'Could not open the browser search.' };
      }
    },
    setReminder: scheduleReminder,
    openClock: async (args) => {
      if (Platform.OS !== 'android') return { ok: false, message: 'Direct Clock app launch is currently Android-only. Open the Clock app manually on this device.' };
      const kind = args.kind === 'timer' ? 'timer' : 'alarm';
      const intentUri = kind === 'timer'
        ? 'intent:#Intent;action=android.intent.action.SET_TIMER;end'
        : 'intent:#Intent;action=android.intent.action.SET_ALARM;end';
      try {
        await Linking.openURL(intentUri);
        return { ok: true, message: `Requested that Android open Clock for a ${kind}.` };
      } catch {
        return { ok: false, message: `Android did not accept the Clock ${kind} intent on this device. Open Clock manually; a native Android intent bridge may be needed for your phone's Clock app.` };
      }
    },
    openApp: async (args) => openFirstAvailable(APP_URLS[String(args.app)] ?? []),
    setAlarm: async (args) => {
      if (!nativeAutomation) return { ok: false, message: 'Setting a precise Android alarm requires a native Android build with the Jarvis automation module.' };
      try {
        await nativeAutomation.setAlarm(Number(args.hour), Number(args.minute), String(args.label ?? 'Jarvis alarm'));
        return { ok: true, message: 'Requested an alarm in Android Clock. Check the Clock screen to confirm the alarm was saved.' };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : 'Android Clock did not accept the alarm request.' };
      }
    },
    openAccessibilitySettings: async () => {
      if (!nativeAutomation) return { ok: false, message: 'Accessibility setup is only available in a native Android build, not Expo Go or web preview.' };
      await nativeAutomation.openAccessibilitySettings();
      return { ok: true, message: 'Opened Android Accessibility settings. Enable Jarvis Accessibility Actions only if you want screen-control workflows.' };
    },
    clickVisibleText: async (args) => {
      if (!nativeAutomation) return { ok: false, message: 'Screen actions require a native Android build with the Jarvis automation module.' };
      if (!nativeAutomation.isAccessibilityServiceEnabled()) return { ok: false, message: 'Jarvis Accessibility is not enabled. Run the Open Accessibility Settings action first.' };
      const clicked = await nativeAutomation.clickVisibleText(String(args.label));
      return clicked
        ? { ok: true, message: 'Tapped the matching visible control.' }
        : { ok: false, message: 'No clickable visible control matched that text. The app may use a custom UI or the label may have changed.' };
    },
    typeIntoLabeledField: async (args) => {
      if (!nativeAutomation) return { ok: false, message: 'Screen actions require a native Android build with the Jarvis automation module.' };
      if (!nativeAutomation.isAccessibilityServiceEnabled()) return { ok: false, message: 'Jarvis Accessibility is not enabled. Run the Open Accessibility Settings action first.' };
      const typed = await nativeAutomation.typeIntoLabeledField(String(args.label), String(args.text));
      return typed
        ? { ok: true, message: 'Entered text into the matching visible field.' }
        : { ok: false, message: 'No matching editable field was found. This may not work with unlabeled or custom fields.' };
    },
    pressBack: async () => {
      if (!nativeAutomation) return { ok: false, message: 'Screen actions require a native Android build with the Jarvis automation module.' };
      if (!nativeAutomation.isAccessibilityServiceEnabled()) return { ok: false, message: 'Jarvis Accessibility is not enabled. Run the Open Accessibility Settings action first.' };
      const pressed = await nativeAutomation.pressBack();
      return pressed ? { ok: true, message: 'Pressed Android Back.' } : { ok: false, message: 'Android Back action was not accepted.' };
    },
  };
}
