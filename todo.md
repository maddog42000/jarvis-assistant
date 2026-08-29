# Jarvis Assistant - Project TODO

## Core Features
- [x] Chat interface with message display
- [x] Text input and send functionality
- [ ] Voice input with speech-to-text
- [x] Text-to-speech responses
- [x] Animated Jarvis avatar with state indicators
- [x] API configuration screen
- [x] Offline command recognition and execution
- [x] Chat history persistence with AsyncStorage
- [x] Settings screen with customization options

## Offline Commands
- [x] Status report, time, date, battery, and network status
- [x] Storage, weather, reminders, alarms, and timer guidance
- [x] Joke, quote, calculator, help, and feature discovery
- [x] Stealth mode, eyes on, overwatch, and clear history guidance
- [x] Swipeable quick-command carousel

## Bonus Features
- [x] Gesture-based shortcuts
- [x] Jarvis personality modes
- [x] Quick action buttons
- [x] Message reactions and emoji support
- [x] Dark mode with custom theme colors
- [ ] Voice command history and suggestions
- [x] Real-time typing indicators
- [ ] Message search functionality
- [ ] Export chat as text file
- [ ] Customizable Jarvis avatar appearance

## UI/UX Polish
- [x] Smooth animations and transitions
- [x] Haptic feedback where available
- [x] Loading states and user feedback
- [x] Responsive layout
- [ ] Accessibility features such as text scaling and high contrast
- [x] Empty state messaging
- [ ] Skeleton loading screens
- [x] Cleaner grouped Settings layout

## Usability Upgrade
- [x] First-launch onboarding route and persistent completion state
- [x] Optional API key setup with provider link and local storage
- [x] Settings action to restart onboarding
- [x] Build-safe Android text-to-speech using expo-speech
- [x] Automatic response playback
- [x] Playback stop, replay, and platform-aware play/pause controls
- [x] Estimated playback progress affordance
- [x] Swipeable preset command carousel with all quick commands
- [x] Offline-first explanation and no-key guidance
- [ ] True speech-to-text microphone input
- [ ] Hands-free Hey Jarvis wake-word listening
- [ ] True Android pause/resume/seek for speech playback

## Testing & Delivery
- [x] Run TypeScript check after final integration
- [x] Run lint and preview verification
- [ ] Test onboarding completion and reset
- [ ] Test API key save and offline mode
- [ ] Test every preset command entry point
- [ ] Test TTS controls on an Android device
- [ ] Build APK for Android
- [ ] Test APK on the user's real device
- [ ] Performance and memory review

## Branding
- [x] Generate custom Jarvis logo/icon
- [x] Update app.config.ts with branding
- [x] Create splash screen
- [x] Set theme colors in theme.config.js

## Platform Notes
- expo-speech provides reliable speak and stop behavior in this Expo SDK 54 app. Android's Expo API does not expose true pause, resume, or seek controls.
- The safe build does not include a native speech-recognition module or continuous wake-word service; Android keyboard dictation remains the current voice-input fallback.
- System overlays and Android accessibility services are outside the supported Expo app scope.
- API keys are user-entered and stored locally; no provider secret is embedded in the app.
