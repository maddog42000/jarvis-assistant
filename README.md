# Jarvis Assistant

Jarvis Assistant is an Expo SDK 54 / React Native app focused on offline-first commands, AI chat, local chat history, configurable assistant personalities, and spoken responses.

## Current capabilities

- Chat UI and local conversation history (AsyncStorage).
- Offline command handling and fallback guidance.
- Optional user-configured AI provider keys for Google Gemini, OpenAI-compatible endpoints, Anthropic-compatible endpoints, and custom compatible endpoints.
- Optional server-side AI fallback through the `assistant.complete` tRPC procedure when the backend is deployed and configured.
- Text-to-speech via `expo-speech`, including voice/rate/pitch preferences where supported by the device.
- Onboarding, provider connection tests, settings, and local companion notes.
- Allowlisted action workflows for web search/link opening, app shortcuts, local reminders, and Android Clock alarm requests.
- Optional Android accessibility actions (visible-text tap, labeled-field typing, Back) behind a manual Settings opt-in and native build.

## Known limitations

- The microphone control currently opens Android keyboard dictation guidance. It is **not** a dedicated in-app speech-recognition engine.
- An always-listening “Hey Jarvis” wake word is not implemented.
- Android speech playback does not currently provide true pause/resume/seek through the app's Expo Speech API.
- Chat search and chat-file export are not yet implemented.
- A successful TypeScript check or web preview does not guarantee a successful release APK. Test on a physical Android device before relying on a build.

## Requirements

- Node.js 20 or newer recommended.
- pnpm 9.12.0 (matches the package manager recorded in `package.json`).
- Android Studio / Android SDK for local native Android workflows, or an Expo/EAS build environment for cloud builds.

## Install and run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The `dev` script starts the backend and Expo web/Metro development server together. For Android, use `pnpm android` in an environment with the Android tooling configured.

## Validation commands

Run these from the repository root:

```bash
pnpm check
pnpm test
pnpm test:fallback
pnpm lint
npx expo config --type public
```

The repository's GitHub Actions workflow runs the type check, automated tests, fallback-routing simulation, lint, and Expo public-config validation on pushes and pull requests.

## Configure an AI provider

1. Install and launch the app.
2. Open **Settings → AI provider**.
3. Select Google Gemini or another supported provider.
4. Paste your own API key into the app and run **Auto setup & test**.
5. Save the setup after the connection test succeeds.

Provider API keys entered in the app are stored on the device using the app's current configuration persistence. Treat a device backup or a compromised device accordingly. Do not paste API keys into source files, screenshots, issue reports, or commits.

## Backend environment

The server reads these optional environment variables in `server/_core/env.ts`:

- `VITE_APP_ID`
- `JWT_SECRET`
- `DATABASE_URL`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

See [`.env.example`](.env.example) for variable names only. It contains no credentials. Configure real secrets in your local untracked environment or deployment secret manager. Never commit `.env` files containing credentials.

The server-side AI fallback depends on a valid backend deployment and its configured AI credential. The app can still use locally configured provider keys or offline commands when the server fallback is unavailable.

## Action workflows and screen control

Open the **Actions** tab to run built-in workflows or edit/import/export validated workflow JSON. Each run requires an explicit confirmation and stops at the first failed action. See [workflow examples and limits](docs/action-workflows.md).

Screen-control actions require a native Android build with the local `JarvisAutomation` module and a user manually enabling **Jarvis Accessibility Actions** in Android Accessibility settings. They are not available in Expo Go or the web preview. This permission is powerful; the service intentionally does not retain or transmit screen contents, and text entry is blocked for common password, verification, payment, and banking field labels. Those safeguards are not perfect. Review platform policy and test thoroughly before distributing a build.

## Build an Android APK

This repository contains application source code, not a prebuilt APK. An `eas.json` is included with a **preview profile that produces an installable APK** and a production profile that produces an Android App Bundle (AAB). Follow the official [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/).

### Easiest cloud build

1. Merge the release-preparation pull request into `main` after reviewing it, or use the `codex/jarvis-release-apk` branch if you want to build before merging.
2. Open a terminal in the repository and install/login to EAS if prompted:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build:configure
   ```

   `build:configure` may ask you to create or link an Expo project and will add the project ID to the app configuration. Keep that ID change in the repository; never commit API keys or signing credentials.
3. Start the APK build:

   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

4. When the build finishes, open the build URL printed by EAS and download the APK to your Android phone. Allow installation from that download source if Android asks, install the APK, and test the new Actions tab, app launch, reminders, Clock intent, and accessibility opt-in.

For later production distribution, use `npx eas-cli@latest build --platform android --profile production`; that profile produces an AAB, normally used for store distribution. The first APK build still requires an Expo account/project setup. Review the build output and test the resulting artifact on your actual device.

## Security notes

- Never commit provider keys, server credentials, signing keys, or local environment files.
- If a key is exposed, revoke it with its provider and create a replacement.
- The server fallback is an internet-facing endpoint. Before public deployment, review authentication, durable rate limiting, usage quotas, and abuse monitoring for the hosting environment.
- Avoid adding microphone/background permissions until the feature using them is implemented and tested.

## Project notes

- `AGENT_HANDOFF.md` contains detailed implementation handoff notes.
- `todo.md` tracks planned features and release testing.
- `verification-notes.md` records previous development checks; those notes are not a substitute for running the current test suite or testing a release APK.
