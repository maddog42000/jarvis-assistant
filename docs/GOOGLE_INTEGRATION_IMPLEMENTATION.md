# Jarvis Google integration implementation

## Goal

Provide one Google connection entry point in Settings, followed by incremental, user-approved access to Gemini, Gmail, Calendar, Drive, and Contacts. The app must never show a service as connected until a real authorization and service health check succeeds.

## Current baseline

- Android package: `com.app.jarvisassistant`
- Expo SDK: 54
- React Native: 0.81
- Existing secure storage dependency: `expo-secure-store`
- Existing browser/deep-link dependencies: `expo-web-browser`, `expo-linking`
- Current Gemini implementation: API-key based Google Generative Language API.
- Existing generic OAuth helper is for the app's Manus portal, not Google OAuth. Do not reuse its portal URL or callback as Google's OAuth implementation.

## Required Google Cloud setup

1. Create/select a Google Cloud project owned by the app operator.
2. Configure the OAuth consent screen, app name, support email, privacy policy, and test users while in testing.
3. Create Android OAuth client using package `com.app.jarvisassistant` and the SHA-1/SHA-256 fingerprints of the actual release signing certificate.
4. Create a Web OAuth client only if the chosen authorization/backend exchange architecture requires it. Keep client secrets on a server, never in the APK.
5. Enable only the Google APIs required for the selected services.
6. Configure server-side token exchange/verification and refresh-token storage if long-lived Google API access is required.
7. Publish or add tester accounts as required by Google's consent-screen rules.

The release signing certificate fingerprint is not currently recorded in this repository. A debug fingerprint is not a substitute for the final APK signing fingerprint.

## Authorization design

- Authenticate the account first using Google's supported Android sign-in flow.
- Keep identity sign-in separate from API authorization.
- Request scopes incrementally when a user enables a feature. Do not request Gmail, Calendar, Drive, and Contacts access all at once without a clear need.
- Use least-privilege scopes. Prefer read-only scopes initially; request write scopes only when the user enables creation/editing features.
- Handle partial consent. A declined scope must not block unrelated services.
- Store short-lived access tokens in memory where practical. Persist refresh credentials only in a secure backend or platform secure storage, never AsyncStorage or logs.
- Provide disconnect/revoke controls and handle expired/revoked credentials.
- Never embed a Gemini API key, OAuth client secret, refresh token, or service-account private key in the APK.
- Do not claim that Google sign-in automatically provisions a Gemini API key. Gemini OAuth and API-key access are distinct supported authentication approaches and must be configured/tested explicitly for the selected Gemini API and project.

## Planned delivery phases

### Phase A: Google identity
- Native Android account sign-in.
- Verified identity and clear connected/disconnected state.
- Secure sign-out and account switching.
- Deep-link return and cancellation/error handling.

### Phase B: Gemini
- Implement the selected supported Gemini OAuth architecture.
- Verify project/API access and model availability.
- Run a real test generation request.
- Keep API-key fallback optional and clearly labelled.

### Phase C: Google services
- Gmail, Calendar, Drive, Contacts as separate opt-in integrations.
- Scope-by-scope consent and partial access.
- Read-only first, then explicitly enabled write actions.
- User confirmation before sending mail, modifying events, or deleting/moving files.

### Phase D: Connection center and workflows
- Per-service status, last successful check, required permissions, reconnect, and disconnect.
- Allowlist Google actions exposed to the automation builder.
- Confirmation and audit history for consequential actions.

### Phase E: verification and release
- Automated unit tests for OAuth state, cancellation, partial scopes, token expiry, and service status.
- Android device tests for account chooser, callback, reinstall, reconnect, and offline behavior.
- End-to-end tests for Gemini, Gmail, Calendar, and Drive using dedicated test accounts.
- Release APK only after CI and artifact verification.

## Release blockers / external inputs

The codebase alone cannot create the owner's Google Cloud project, accept Google's consent-screen terms, or produce the final signing-certificate fingerprints. These are account-owner / release-operator configuration steps. Until supplied, the app must show Google connection as **Not configured**, not Connected.

## Acceptance criteria

- One clearly labelled Connect Google entry point.
- Android account selection and verified identity.
- Separate per-service permission controls.
- No secrets embedded in APK.
- No false-positive connected states.
- User can disconnect/revoke and reconnect.
- Each enabled service passes a real API health check.
- CI passes and an installable APK artifact is uploaded.
