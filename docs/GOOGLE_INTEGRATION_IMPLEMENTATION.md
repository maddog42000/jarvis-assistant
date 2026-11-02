# Jarvis 3.5: Google account and services foundation

## Status

This branch is the implementation foundation, not a completed Google integration. The app currently supports provider API keys (including Gemini) and a separate Manus portal OAuth flow. Neither is Google account sign-in. Do not display a Google account as connected until an ID token has been verified and the identity is persisted securely.

## Scope and order

### 1. Google identity
- Add native Android Google sign-in using an Expo-compatible, maintained authentication integration.
- Use the Android OAuth client associated with the exact application ID and release signing certificate.
- Verify the returned ID token on a trusted backend before marking the account connected.
- Persist only the minimum session/identity data needed. Never ship client secrets, service-account keys, or refresh tokens in the APK.
- Support sign-out and account switching, including clearing cached identity and provider grants.
- Keep Google sign-in separate from Gemini API-key configuration.

### 2. Connection center
- Show Google identity state as Not connected, Connecting, Connected (verified), or Needs attention.
- Show each Google service separately with its own consent state and last successful verification.
- Request scopes incrementally when a user enables a service.
- Explain exactly what access is requested before launching consent.
- Never infer a connection from a stored email address or a successful browser launch.

### 3. Google services, read-only first
Implement and test each service independently:
- Gmail: read-only message listing/search and message summaries first.
- Calendar: read-only event listing and date-range search first.
- Drive: read-only file listing/search and metadata first.
- Contacts: read-only contact lookup first.

Write, send, delete, create, and modify actions remain disabled until the corresponding read-only flow is proven and the user confirms each consequential action.

### 4. Gemini
- Keep the existing Gemini API-key path working.
- Treat Google account sign-in and Gemini API access as distinct capabilities.
- If a future OAuth-based Gemini path is added, validate project configuration, model access, scopes, and token audience on the backend.
- Never report Gemini as connected merely because Google identity sign-in succeeded.

## Current technical constraints

- Expo SDK 54 / React Native 0.81.
- Android application ID: `com.app.jarvisassistant`.
- Existing `constants/oauth.ts` and `app/oauth/callback.tsx` implement the Manus portal flow and must not be repurposed as Google's callback without a separate, reviewed flow.
- Current Gemini setup uses a user-supplied API key stored on-device.
- Native Google OAuth cannot be completed or verified until the owner creates the correct Google Cloud OAuth clients and supplies the public client IDs/configuration. Client IDs are not secrets; client secrets and private keys must never be committed.

## Required owner setup

See [Google Cloud setup checklist](./GOOGLE_CLOUD_SETUP_CHECKLIST.md). The Android OAuth client must match the package ID and the SHA-1/SHA-256 fingerprints of the signing certificate used by the GitHub APK workflow. If the signing certificate changes, Google OAuth configuration must be updated.

## Release gates

1. Unit tests cover state validation, identity verification responses, sign-out, and service consent states.
2. CI typecheck, lint, and tests pass.
3. Android release APK builds successfully.
4. On a physical Android device, sign-in completes and the backend verifies the ID token.
5. A negative test with an invalid/expired token remains disconnected.
6. Each Google service is independently consented and verified before its UI says Connected.
7. No secret material is present in the APK, repository, logs, or client bundle.

## Honest UI rule

Until release gates 1-5 pass, show Google sign-in as setup required / not connected. Until an individual service passes its own consent and API verification, show that service as not connected. A roadmap or setup screen is not an integration.
