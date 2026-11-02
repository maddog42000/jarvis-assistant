# Google Cloud setup checklist for Jarvis

This checklist is required before Google account sign-in can be tested end-to-end. Do not paste secrets, refresh tokens, private keys, or credential JSON into GitHub or chat.

## App identity

- [ ] Confirm Android package ID: `com.app.jarvisassistant`.
- [ ] Obtain SHA-1 and SHA-256 fingerprints for the exact release signing certificate used by the GitHub standalone APK workflow.
- [ ] Keep the signing configuration stable between test and production builds, or register every signing certificate that will be used.

## Google Cloud project

- [ ] Create or select a dedicated Google Cloud project owned by the app owner.
- [ ] Configure the OAuth consent screen and publish/test-user settings appropriate for the intended audience.
- [ ] Configure the app name, support email, authorized domains, and privacy policy as required by Google.
- [ ] Create an Android OAuth client using package ID `com.app.jarvisassistant` and the release certificate SHA-1.
- [ ] Create any required web/server OAuth client separately for backend ID-token verification or authorization-code exchange.
- [ ] Record client IDs in the deployment configuration. Client IDs are public identifiers, not client secrets.
- [ ] Enable only the Google APIs that are actually being implemented.

## Scope strategy

- [ ] Start with basic OpenID Connect identity scopes only: `openid`, `email`, and `profile`.
- [ ] Request Gmail, Calendar, Drive, and Contacts scopes separately, only when the user enables that service.
- [ ] Start each service with the narrowest read-only scope that supports the feature.
- [ ] Review Google's verification and restricted-scope requirements before requesting sensitive or restricted scopes.

## Backend and security

- [ ] Verify ID tokens on a trusted server using Google's supported verification libraries.
- [ ] Validate signature, issuer, audience, expiry, and nonce/state as applicable.
- [ ] Do not trust an email address or profile returned only by the client.
- [ ] Keep client secrets, refresh tokens, and service-account private keys off-device and out of source control.
- [ ] Store any server-side tokens encrypted, restrict access, and support revocation.
- [ ] Implement sign-out and disconnect so local state and server-side grants are cleared or revoked appropriately.

## What to provide to continue

The app owner should provide only the non-secret OAuth client ID(s), and confirm the release signing fingerprint has been registered. Never provide client secrets or private keys in chat. If the signing fingerprint is not readily available, the build workflow needs to expose the signing certificate fingerprint safely before creating the Android OAuth client.

## Verification before calling it connected

- [ ] Successful sign-in on the installed release APK.
- [ ] Backend verifies the ID token and returns the verified subject/email.
- [ ] Invalid or expired token is rejected.
- [ ] Sign-out clears the verified account state.
- [ ] Account switching updates the verified identity.
- [ ] Google services remain individually Not connected until separately authorized and API-tested.
