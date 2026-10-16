# Jarvis Assistant

Jarvis Assistant is an Expo SDK 54 / React Native app focused on offline-first commands, AI chat, local chat history, configurable assistant personalities, and spoken responses.

## Current capabilities

- Chat UI and local conversation history (AsyncStorage).
- Offline command handling and fallback guidance.
- Optional user-configured AI provider keys for Google Gemini, OpenAI-compatible endpoints, Anthropic-compatible endpoints, and custom compatible endpoints.
- Optional server-side AI fallback through the `assistant.complete` tRPC procedure when the backend is deployed and configured.
- Text-to-speech via `expo-speech`, including voice/rate/pitch preferences where supported by the device.
- Onboarding, provider connection tests, settings, and local companion notes.

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

## Build an Android APK

This repository contains application source code, not a prebuilt APK. The project does not currently include an `eas.json` build profile, so configure an Expo Application Services project and build profile before running a cloud build. Follow the official [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/).

Typical EAS flow after EAS is configured:

```bash
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

Check the generated configuration and choose an APK-producing profile if you want a directly installable APK. A default Android production build may produce an AAB instead. Review the build output and install/test the resulting artifact on your actual device.

## Security notes

- Never commit provider keys, server credentials, signing keys, or local environment files.
- If a key is exposed, revoke it with its provider and create a replacement.
- The server fallback is an internet-facing endpoint. Before public deployment, review authentication, durable rate limiting, usage quotas, and abuse monitoring for the hosting environment.
- Avoid adding microphone/background permissions until the feature using them is implemented and tested.

## Project notes

- `AGENT_HANDOFF.md` contains detailed implementation handoff notes.
- `todo.md` tracks planned features and release testing.
- `verification-notes.md` records previous development checks; those notes are not a substitute for running the current test suite or testing a release APK.
