# Jarvis Action Workflows

Jarvis workflows are JSON data validated against an allowlist. They are not JavaScript and cannot contain shell commands or arbitrary URLs with executable schemes.

## Example: open a web search

```json
{
  "id": "search-weather",
  "name": "Search weather",
  "steps": [
    {
      "id": "weather",
      "action": "searchWeb",
      "args": {
        "query": "weather today",
        "provider": "google"
      }
    }
  ]
}
```

## Example: opt-in screen control

```json
{
  "id": "open-settings-and-back",
  "name": "Open Android accessibility settings",
  "steps": [
    {
      "id": "accessibility-settings",
      "action": "openAccessibilitySettings",
      "args": {}
    }
  ]
}
```

After the user manually enables **Jarvis Accessibility Actions** in Android Settings, workflows may use `clickVisibleText`, `typeIntoLabeledField`, and `pressBack`. Text entry is limited to 500 characters and blocked when the target label appears to refer to passwords, passcodes, verification codes, payment, or banking. This is a best-effort safety guard, not a guarantee that every app labels fields consistently. Do not use screen automation for sensitive accounts, payments, security prompts, or anything the user has not explicitly approved.

## Limits and device-specific behavior

- Maximum 8 steps per workflow.
- Optional delay between steps is 0 to 5,000 milliseconds.
- Workflow execution stops at the first failed action.
- Opening apps depends on installed app URI handlers and Android defaults.
- Clock intents and reminder notifications must be tested on the target device and Android version.
- Screen-control support requires a native Android build, the local Expo module, a generated accessibility service, and the user explicitly enabling that service. It does not work in Expo Go or the web preview.
- Accessibility permission is powerful. The service intentionally does not record, retain, or transmit screen contents. Review the generated manifest, Google Play Accessibility API policy, and disclosure/consent requirements before distributing a public release.
