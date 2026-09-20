# Jarvis Assistant Handoff

This archive contains the complete Jarvis Assistant Expo SDK 54 mobile project. The latest changes simplify Gemini setup and preserve the stable APK-oriented architecture.

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

## Validation

Run `pnpm check`, `pnpm test`, and `npx expo config --type public` from the project root. The project is designed to use the Android keyboard microphone for dictation; native speech-recognition was intentionally not added because it previously caused release-build crashes. The app does not silently send private chat to Chrome or home-screen widgets; Google AI in Chrome is an explicit user action only.

## APK handoff

Use the Expo/EAS Android build workflow appropriate to the receiving environment. Do not add speech-recognition plugins or broad device permissions without testing a release build. Keep API keys out of source control and rotate any key that has appeared in a screenshot or log.
