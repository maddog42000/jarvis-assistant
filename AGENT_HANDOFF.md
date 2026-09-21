# Jarvis Assistant Handoff

This repository contains the complete Jarvis Assistant Expo SDK 54 mobile project. The latest changes simplify Gemini setup and preserve the stable APK-oriented architecture.

## API-key location and safety

The Gemini API key does **not** belong in a source file. Do not paste it into `lib/assistant-config.ts`, `lib/chat-context.tsx`, `.env`, GitHub, or any committed file. In the app, open **Settings → AI provider → Google Gemini**, paste the key into the key field, and tap **Auto setup & test** followed by **Save setup**. The app stores the key locally on the device through the existing chat configuration persistence; it is not bundled into the repository. During onboarding, the same key field is available in the optional **Add an API key** step.

Because the repository is public, contributors must treat every API key as a secret. If a key is ever committed, displayed in a screenshot, or written to a log, revoke it immediately and create a replacement. For server-side development, use an untracked local environment file or the hosting provider’s secret manager; never commit that file.

## Gemini setup behavior

Settings now treats Gemini as automatic. The user only pastes a key and taps **Auto setup & test**. Jarvis calls Google’s `GET /v1beta/models` endpoint using that key, filters for models supporting `generateContent`, prefers the current Flash model, and saves the model that works. Legacy Gemini 2.0, 2.5, 3.0, 3.5, and 3.6 Flash IDs are normalized to the current default.

Google’s current documentation says new AI Studio keys are transitioning to authorization keys and that unrestricted standard keys may be rejected. If Google returns a 401/403 or permission error, the app now explains that the key must be an authorization key or a properly restricted key with the Generative Language API enabled. No API key is included in this archive.

## Important files

- `lib/assistant-config.ts` — provider defaults and Gemini model normalization.
- `lib/chat-context.tsx` — Gemini model discovery, request routing, and error messages.
- `app/(tabs)/settings.tsx` — simplified provider setup UI.
- `app/(tabs)/chat.tsx` — keyboard-aware chat input and explicit Google AI browser fallback.
- `app.config.ts` — Android soft-keyboard resize mode and existing safe permissions.
- `tests/assistant-config.test.ts` — provider regression tests.

## Permissions and platform limits

The app requests only the permissions currently needed by its Expo configuration: notifications and the existing audio/microphone declaration. Voice input intentionally uses the Android keyboard microphone rather than the removed native speech-recognition module, which previously caused release-build crashes. Text-to-speech does not require a separate app permission. Do not add broad device permissions or background access without a specific feature, a user-facing explanation, and a release-build test.

## Validation

Run `pnpm check`, `pnpm test`, and `npx expo config --type public` from the project root. The project is designed to use the Android keyboard microphone for dictation; native speech-recognition was intentionally not added because it previously caused release-build crashes. The app does not silently send private chat to Chrome or home-screen widgets; Google AI in Chrome is an explicit user action only.

## APK handoff

Use the Expo/EAS Android build workflow appropriate to the receiving environment. A source repository is not itself an APK; build the Android artifact separately and attach it to a GitHub Release rather than committing generated native output. Do not add speech-recognition plugins or broad device permissions without testing a release build. Keep API keys out of source control and rotate any key that has appeared in a screenshot or log.

## Suggested next-agent sequence

1. Clone the repository and run `pnpm install`.
2. Run `pnpm check`, `pnpm test`, and `npx expo config --type public`.
3. Run the app on Android, enter a fresh Gemini authorization or properly restricted key in Settings, and tap **Auto setup & test**.
4. Build a release APK with the approved Expo/EAS workflow and test onboarding, Settings, Gemini chat, keyboard dictation, and TTS on a physical device.
