# Jarvis 3.1 preview upgrade

## Added

- Dedicated Activity tab for recent automation runs.
- Device-local workflow execution history with success/failure, timestamp, completed step count, and result message.
- History is bounded to the newest 60 records and can be cleared without deleting workflows or scheduled reminders.
- Additional built-in routines for morning launch, focus session, and evening wind-down.
- Google account integration plan clarifying that Gemini API-key setup and app session sign-in are not Gmail/Calendar OAuth authorization.

## Safety boundaries

- Workflows remain allowlisted JSON, never arbitrary JavaScript or shell commands.
- Each run still requires the existing confirmation dialog.
- Accessibility screen actions remain opt-in and depend on Android's user-enabled service.
- Sensitive fields remain blocked by the workflow validator.
- Google account linking remains explicitly unconfigured until an Android OAuth client, authorization SDK, secure token lifecycle, and consent-screen setup are supplied.

## Validation checklist

Run on the preview branch:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm test:fallback
npx expo config --type public
```

Then build and install the release APK on a physical Android device. Verify tab navigation, workflow confirmation, open-app/browser actions, notification permission handling, Activity persistence after force-close/relaunch, clear-history behavior, and accessibility opt-in. A successful CI APK build is not a substitute for this device test.
