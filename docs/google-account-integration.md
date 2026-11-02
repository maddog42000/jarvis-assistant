# Google account integration plan

Jarvis currently has two separate Google-related capabilities:

- Gemini AI provider setup uses a Gemini API key supplied by the user and tests it against the Generative Language API.
- The existing app OAuth callback is the app's session sign-in flow. It is not Google API authorization and does not grant Gmail, Calendar, Drive, Contacts, or other Google data access.

Do not present either flow as a connected Google account for personal data.

## Required production flow

1. Create/configure a Google Cloud project and Android OAuth client for the production application ID and signing certificate fingerprints.
2. Add the supported Android Google identity/auth authorization SDK and pin compatible versions in the package manifest and lockfile.
3. Use Credential Manager for sign-in and Google's AuthorizationClient / supported OAuth authorization flow for API scopes. Do not use an embedded WebView for Google sign-in.
4. Keep sign-in and API authorization separate. Ask for Gmail, Calendar, Drive, Contacts, etc. only when the user enables the corresponding integration.
5. Use the minimum scopes required, explain each permission before the consent screen, and handle partial consent and revocation.
6. Store any refresh/access tokens in Android Keystore-backed secure storage. Never put client secrets or user tokens in the app bundle, logs, screenshots, or Git.
7. Add an Integrations screen with per-service connection status, last successful sync, reconnect, and disconnect/revoke controls.
8. Add onboarding as an optional integrations step. It must be skippable and must not block offline use or basic Jarvis setup.
9. Add integration tests with a dedicated test Google account and verify consent, cancellation, partial scopes, expired tokens, revoked access, and account switching.
10. Complete Google's OAuth consent-screen verification requirements for any sensitive or restricted scopes before public distribution.

## Current release limitation

This repository does not yet contain a configured Google Android OAuth client ID or a complete Google API authorization/token lifecycle. Do not show a working-looking "Connect Google" button until those credentials and native authorization code are configured and tested. The safe interim UX is to keep Gemini API-key setup available and label Gmail/Calendar/Drive account linking as not yet connected.

## Official references

- Android authorization: https://developer.android.com/identity/authorization
- Credential Manager / Sign in with Google: https://developers.google.com/identity/sign-in/android
- OAuth security best practices: https://developers.google.com/identity/protocols/oauth2/resources/best-practices
