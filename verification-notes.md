# Companion Assistant Upgrade Validation

- TypeScript check: `pnpm check` passes with no errors.
- Live dev server: running; WebDev health reports dependencies OK, LSP clean, TypeScript clean.
- Phone viewport review: Home tab is the default destination, quick actions render as a readable two-column layout, the companion memory form scrolls beneath the tab bar, and Settings remains reachable.
- Stability choice: no new native modules, permissions, or paid AI generation were introduced.
- Local memory behavior: name, focus, and notes persist through AsyncStorage and can be cleared from Settings.

## Provider and keyboard quick-fix validation

The Gemini provider now defaults to `gemini-3.6-flash` and normalizes legacy Gemini 2.0/2.5/3.0 Flash model IDs before requests and saves. The Expo Android configuration uses `softwareKeyboardLayoutMode: "resize"` so the chat input can remain visible above the soft keyboard. The mic button focuses the input so Android keyboard dictation is immediately available, and Chat includes an explicit Google AI in Chrome handoff when no provider key is configured. TypeScript and Expo config validation pass; the preview screenshots show the updated controls.
