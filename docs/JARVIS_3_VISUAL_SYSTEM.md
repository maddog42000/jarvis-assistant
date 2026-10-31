# Jarvis 3.0 visual direction

## Reference interpretation
The two supplied design boards are visual references, not production-ready screen exports. Their useful patterns are:
- Deep navy surfaces with restrained cyan highlights.
- Magenta and violet used only as secondary accents.
- Thin cool-toned borders, modest corner radii, and clear spacing.
- Compact status indicators and large, obvious primary actions.
- A persistent four-tab navigation model: Home, Chat, Actions, Settings.

## Applied foundation
- Home is a single scrollable dashboard with one assistant status panel, one primary Chat action, four quick actions, and secondary information panels.
- Personalization fields are collapsed until requested so they do not dominate the first screen.
- Bottom navigation uses a dark fixed surface, cyan active state, and muted inactive states.
- Chat keeps the message area visually quiet and makes the composer the primary control.

## Design guardrails
- Never show a green "connected" state unless the connection was actually tested.
- Do not show decorative controls that do nothing.
- Keep advanced sensor maps, predictive habit systems, biometric verification, and ambient listening out of the initial release unless a real Android capability and permission model is implemented.
- No always-on microphone or wake-word listening by default.
- Keep each screen focused on one primary task and use cards as windows into deeper features, not as a wall of widgets.

## Asset handling
The supplied boards are composite reference sheets with small, partly illegible labels. Their individual elements should be recreated as reusable native components rather than blindly cropped into low-resolution app assets. The avatar already implemented in the project remains the companion visual for this phase.
