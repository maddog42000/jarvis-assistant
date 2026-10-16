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

## Latest connection and proxy upgrade

Onboarding now verifies an entered provider key before allowing setup to finish. For Gemini, verification lists the models available to the key, selects a compatible `generateContent` model, sends a small `Connection OK` request, and displays the result in `components/connection-result-card.tsx`. Failed tests stay on the key step and expose a **Retry connection** action. Settings uses the same card for testing and saving feedback.

When no personal provider key is configured, non-offline chat attempts the public `assistant.complete` tRPC route in `server/routers.ts`. That route uses the server’s built-in `invokeLLM` helper, so the provider credential stays server-side and is never sent to the mobile client. Input is bounded to 12 turns and 3,000 characters per message, and the route has a lightweight per-client request limit. If the proxy is unavailable, Jarvis falls back to offline guidance. Keep the server’s LLM credential in the deployment secret configuration; never add it to the mobile bundle or repository.

The server-side LLM environment variables were present in the active deployment environment and were verified with a live health request plus a live `assistant.complete` smoke test. The proxy returned assistant text from the configured built-in model. Do not print or commit the credential while debugging.

Chat now keeps users inside Jarvis in both cases: with no personal key it uses the secure server assistant directly; when a configured Gemini/OpenAI/Anthropic request fails, it automatically retries through the same server assistant and labels the response as a quiet backup. The prior **Open Google AI in Chrome** handoff was removed from the chat UI. No browser or home-screen widget is opened automatically.

## Fallback routing diagnostics

The app now uses `lib/fallback-routing.ts` for timeout-safe provider failover. Direct provider requests abort after 15 seconds; the server proxy fails after 20 seconds. Settings includes **Test Jarvis online backup**, which verifies the server route without requiring a personal key. Run `pnpm test:fallback` to simulate provider errors and a hung route. See `docs/fallback-routing.md` for the route contract and troubleshooting steps.

Android cannot read API keys or answers from other installed apps such as Gemini, ChatGPT, Chrome, or home-screen widgets. The supported paths are: paste a key into Jarvis Settings, use Gemini automatic model discovery, or use the server-side Jarvis backup. No hidden app scraping or background control was added.

## Latest mobile UX improvements

- Chat header now probes connectivity and shows **Online**, **Offline**, or **Checking**; tapping the status retries the probe.
- Settings voice controls now include installed voice selection, Warm/Natural/Bright presets, pitch and speed +/- adjustments, and a voice preview button.
- Provider setup includes official key-page links, current free-tier guidance, a user-initiated **Paste key from clipboard** action, and automatic persistence after a successful connection test. No app can auto-read keys from another Android app.
- Offline commands remain available when the network probe is offline; status/network commands no longer claim a connection is active without checking.

## Offline command and local history expansion

Jarvis now recognizes additional voice-friendly phrases while offline, including good morning/night, motivation, breathing reset, focus mode, coin flip, dice roll, random number, privacy status, local history, and repeat-that guidance. The quick-command carousel exposes these actions as well.

Chat history is validated and bounded to the newest 100 messages before being written to AsyncStorage. Malformed cached entries are ignored, missing IDs/timestamps are repaired, and the cache is written after history loads so startup cannot overwrite an existing cache with an empty state. The chat footer tells users that recent messages are saved on the device.

Security reminder: never commit or send API keys in chat, source files, screenshots, or public issues. Any key pasted into a conversation should be revoked and replaced.

## Provider status and Gemini 404 fix

The Chat header now shows two separate states: internet reachability and whether a provider key is merely saved. A green internet indicator no longer claims that AI requests are ready. Settings shows an animated result card with live stages such as contacting the provider, discovering a model, sending a small test request, and saving verified setup.

Gemini chat requests now retry once with a freshly discovered model when a stale saved model produces a 404. Gemini 404 errors also explain that the model may not be available to the key and show the expected `https://generativelanguage.googleapis.com/v1beta` endpoint.


---

# Sandbox Agent Build Handoff (October 2026)

## User's delivery goal
The user develops from an Android phone and wants a sandbox-capable agent to pick up the repository, finish any remaining build work, compile an installable APK, and return the artifact without requiring the user to manually repeat a long Expo/EAS account setup.

## Truth about project/framework
This repository is still **Expo SDK 54 / React Native / TypeScript**. The user has Godot 4.7.2 Android Editor installed and is considering a Godot migration, but a Godot project has **not** been created in this repository. Do not tell the user this code is already Godot or attempt a partial in-place port without planning it. Existing features and tests should be preserved while choosing a migration strategy.

## New no-EAS APK workflow
Use `.github/workflows/android-apk.yml`. It is designed to:
1. Install pinned pnpm dependencies.
2. Run type checks, tests, fallback tests, lint, and Expo config validation.
3. Generate the Android native project using Expo prebuild.
4. Compile `android/app/build/outputs/apk/debug/app-debug.apk` using Java 17 and Gradle.
5. Upload the APK as a GitHub Actions artifact named `jarvis-assistant-debug-apk` for 14 days.

This debug build should not require an Expo/EAS account or a signing secret. It is a **debug-signed test APK**, not a production release. Run it from GitHub **Actions → Build installable Android APK → Run workflow** on the `codex/jarvis-release-apk` branch. If workflow validation or compilation fails, inspect logs, fix the actual issue on a branch, and rerun. Never report a build as successful unless GitHub shows a successful run and the artifact exists.

## Agent checklist
- Inspect the current default branch, PRs, workflow run state, and branch heads first. The earlier release-preparation PR may have changed state.
- Do not assume prior CI notes prove the current revision passes.
- Run all checks listed above, then compile the APK.
- Download/inspect the artifact metadata and confirm the path exists before reporting completion.
- If possible, install and smoke-test on a physical Android device. If not possible, explicitly report that compile passed but device behavior is unverified.
- Do not commit APKs, generated `android/` folders, credentials, API keys, keystores, or `.env` files.
- Keep provider keys user-entered; keep server credentials in a deployment secret store.
- Keep accessibility actions opt-in and narrowly scoped. No silent screen capture, scraping, or transmission.
- Do not add unsupported claims such as working wake-word listening or in-app speech recognition. Current voice input uses Android keyboard dictation guidance.

## Still unfinished / release-gate items
- Build and install an APK on the user's phone; validate onboarding, online provider, offline commands, local history, TTS, app/web launch, reminders/alarms, and accessibility enable/disable flow.
- Dedicated in-app speech-to-text and hands-free wake word are not implemented.
- Chat search and text export are not implemented.
- Text scaling/high-contrast accessibility options are incomplete.
- Review/migrate provider-key persistence to platform-backed secure storage.
- Review server assistant endpoint authentication, distributed rate limiting, quotas, and abuse monitoring before public deployment.
- Verify native accessibility plugin autolinking and behavior on a clean build and real Android device.
- Review Google Play Accessibility API disclosure and distribution policy before publishing.
- Add cancellation/timeouts for native actions and improve error feedback only after current APK compiles.

## Godot decision
If the user decides to migrate to Godot 4, make it a clearly separated project or repository, not a misleading blend of GDScript and Expo code. Before implementing the full port, prove the available toolchain can export an APK. Godot itself cannot arbitrarily control other Android apps; app launching/intents and cross-app screen interaction require native Android integration and explicit user-granted accessibility access.
