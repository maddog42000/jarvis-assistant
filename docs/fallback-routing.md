# Jarvis fallback routing

Jarvis keeps the conversation in one chat while trying the safest available online route.

## Route order

1. **Offline command processor** handles supported device-style commands without network access.
2. **Selected personal provider** uses the key saved in Settings for Gemini, OpenAI, Anthropic, or a custom OpenAI-compatible endpoint.
3. **Jarvis secure backup** calls `assistant.complete` on the project server. The server-side LLM credential is not bundled in the APK and is not sent to the phone.
4. **Offline guidance** appears only when the selected provider and secure backup are both unavailable.

The app never reads keys from Gemini, ChatGPT, Chrome, widgets, or other installed apps. Android isolates those apps. A user must paste a provider key into Jarvis Settings, or use the secure backup route.

## `lib/fallback-routing.ts`

### `runFallbackChain(steps, timeoutMs?)`

Runs the supplied steps in order and returns the first non-empty response.

```ts
const result = await runFallbackChain([
  { id: 'Google Gemini', run: () => callGemini() },
  { id: 'Jarvis secure backup', run: () => callServerAssistant() },
]);
```

- `steps`: ordered `{ id, run }` operations.
- `timeoutMs`: per-step timeout; defaults to 15 seconds.
- Return value: `{ value, used, failures }`.
- If every step fails, the function throws one compact error containing each route failure.

A timeout advances to the next route. Provider fetches also use `AbortController`, so direct HTTP requests are cancelled after 15 seconds. The server proxy has its own 20-second ceiling.

### `getFallbackDiagnostic(result)`

Turns a successful result into a short diagnostic such as:

> Connected through Jarvis secure backup after Google Gemini was unavailable.

### `timeoutError(id, timeoutMs)`

Creates the normalized timeout error used by the chain and tests.

## Server endpoint

`POST /api/trpc/assistant.complete?batch=1`

Input:

```json
{
  "0": {
    "json": {
      "systemPrompt": "...",
      "messages": [
        { "role": "user", "content": "..." }
      ]
    }
  }
}
```

Limits:

- System prompt: 4,000 characters.
- Up to 12 chat turns.
- Each message: 3,000 characters.
- Per-client rate limit: 20 requests per 10 minutes.
- Server LLM timeout: 20 seconds.

## Diagnostics and tests

From the project root:

```bash
pnpm test
pnpm test:fallback
```

`pnpm test:fallback` simulates a failed Gemini route, a failed OpenAI route, and a successful secure backup. It also simulates a hung provider and verifies that the timeout advances to backup.

In the mobile app, **Settings → Test Jarvis online backup** performs a real small server request without requiring a personal API key. This is the first diagnostic to use when the user says online answers are not working.

## Practical troubleshooting

- If the online-backup diagnostic succeeds but Gemini fails, the problem is the Gemini key, model, endpoint, or Google API restriction.
- If the online-backup diagnostic fails, check the device connection and deployment health; retrying another provider key will not fix a server outage.
- Gemini model discovery runs against the key’s `/models` endpoint and chooses a model supporting `generateContent`, preferring the current Flash model.
- API keys remain local to the device’s app storage. Never commit them, place them in source code, or paste them into public issue reports.
