# Google Cloud setup checklist for Jarvis

This checklist is for the repository owner. It is intentionally separate from the app implementation: OAuth client IDs, consent configuration, and signing identity belong to the app's Google Cloud project and must not be guessed or committed as secrets.

## Before enabling Android Google sign-in

- [ ] Choose the Google Cloud project that will own Jarvis integrations.
- [ ] Configure the OAuth consent screen with the real app name, support contact, and privacy-policy URL.
- [ ] Add test-user accounts while the consent screen is in testing mode.
- [ ] Create an Android OAuth client for package ID `com.app.jarvisassistant`.
- [ ] Register the SHA-1 and SHA-256 fingerprints for the certificate that signs the APK users will install.
- [ ] Keep the signing key stable across releases. A new ephemeral CI signing key will invalidate the registered Android OAuth client.
- [ ] Record the Android OAuth client ID in GitHub Actions secrets/variables only if the chosen native SDK requires it at build time. A client ID is not a client secret, but it should still be configured deliberately.
- [ ] Never add a Google client secret, refresh token, service-account private key, or user access token to the app bundle or repository.

## API enablement by integration

Enable only the APIs needed for the first release. Do not request every permission at first launch.

- [ ] Gemini API access: decide whether the first release will continue using a user-supplied Gemini API key or implement a supported Google OAuth-based Gemini authorization path for this app's distribution model. Google account sign-in alone does not create a Gemini API key.
- [ ] Gmail API: defer until the user explicitly enables Gmail.
- [ ] Google Calendar API: defer until the user explicitly enables Calendar.
- [ ] Google Drive API: defer until the user explicitly enables Drive.
- [ ] People API (Contacts): defer until the user explicitly enables Contacts.

## Required behavior before release

- Google identity sign-in and each Google API permission are separate states.
- Ask for scopes incrementally, at the point the user enables a feature.
- Handle cancellation, denied scopes, partial consent, expired credentials, account switching, and disconnect.
- Show a connection as active only after a real identity/token check and a successful API capability check.
- Start Gmail, Calendar, Drive, and Contacts with read-only actions. Confirm before sending, editing, deleting, or sharing anything.
- Do not store access tokens in AsyncStorage. Use short-lived in-memory access tokens and platform secure storage or a secure backend for refresh credentials, according to the selected Google SDK flow.

## Release signing blocker

The current repository does not document a stable release-signing certificate. The Android OAuth client cannot be correctly finalized until the signing certificate used for the distributable APK is known and stable. Do not register a temporary CI debug certificate as the permanent production identity.

## Information needed when implementation reaches the configuration gate

The owner will need to supply or configure:
1. Google Cloud project and consent-screen ownership.
2. Android OAuth client ID for `com.app.jarvisassistant`.
3. Stable release signing certificate fingerprints (SHA-1 and SHA-256).
4. Privacy-policy URL and support contact for the consent screen.

No passwords, client secrets, private keys, or user tokens should be sent in chat.
