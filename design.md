# Jarvis Assistant - Mobile App Design

## Overview
Jarvis Assistant is a sophisticated AI companion app with voice control, offline capabilities, and a beautiful conversational interface. The app combines online AI capabilities with offline fallback commands for a seamless experience.

## Screen List

1. **Onboarding Screen** — Welcome flow with permission requests
2. **Chat Screen** — Main conversation interface with Jarvis
3. **Settings Screen** — Configure API endpoints, voice settings, appearance
4. **Voice Command Reference** — Built-in command guide
5. **Chat History** — View and manage past conversations

## Primary Content and Functionality

### Chat Screen (Main)
- **Conversation Display** — Scrollable message thread with user and Jarvis messages
- **Message Input** — Text input field with send button
- **Voice Input Button** — Tap to record voice commands
- **Status Indicator** — Shows Jarvis state (idle, listening, thinking, speaking)
- **Animated Avatar** — Jarvis character with state-based animations
- **Quick Actions** — Buttons for common offline commands (battery, time, etc.)

### Onboarding Screen
- **Welcome Message** — Introduction to Jarvis
- **Permission Requests** — Microphone access
- **Quick Setup** — API configuration (optional)
- **Get Started Button** — Navigate to chat

### Settings Screen
- **API Configuration** — Endpoint URL, API key, model selection
- **Voice Settings** — TTS voice selection, speech rate, language
- **Appearance** — Theme selection (light/dark), accent color
- **Offline Commands** — List of built-in commands
- **Clear History** — Wipe chat history

## Key User Flows

### Flow 1: Chat with Jarvis (Online)
1. User taps text input → Types message → Taps send
2. Message appears in chat with user avatar
3. Jarvis shows "thinking" state with animation
4. API response received → Jarvis message appears
5. TTS plays response (optional)

### Flow 2: Voice Command (Offline)
1. User taps voice button → Microphone activates
2. User speaks command (e.g., "Jarvis, status report")
3. Speech recognized and matched to offline command
4. Jarvis executes command and responds
5. TTS reads response aloud

### Flow 3: Offline Fallback
1. User sends message while offline
2. System detects no internet
3. Attempts to match against offline commands
4. If matched, executes locally; if not, shows "offline" message
5. Message queued for sending when online

## Color Choices

- **Primary** — Deep Blue (#0a7ea4) — Represents technology and trust
- **Accent** — Cyan (#00d4ff) — Jarvis's signature glow
- **Background** — Dark Navy (#0f1419) — Futuristic, easy on eyes
- **Surface** — Slate (#1a1f2e) — Card/message backgrounds
- **Success** — Neon Green (#00ff88) — Positive feedback
- **Warning** — Amber (#ffaa00) — Caution states
- **Error** — Coral (#ff4466) — Error states
- **Text** — Off-white (#e8eaed) — Primary text
- **Muted** — Gray (#8a92a0) — Secondary text

## Animations & Interactions

- **Jarvis Avatar** — Subtle pulse when idle, orbiting glow when thinking, mouth animation when speaking
- **Message Entrance** — Fade in with slight scale
- **Button Press** — Scale 0.97 with haptic feedback
- **Voice Recording** — Animated waveform visualization
- **Transitions** — Smooth 250-300ms easing between states

## Offline Commands (Built-in)

- **"Jarvis, status report"** → Battery, storage, network, time
- **"Jarvis, eyes on"** → Capture and describe current screen
- **"Jarvis, stealth mode"** → Reduce visibility and silence responses
- **"Jarvis, take me to [app/setting]"** → Launch app or open settings
- **"Jarvis, clear history"** → Wipe conversation logs
- **"Jarvis, overwatch"** → Continuous screen monitoring summary
- **"Jarvis, what time is it?"** → Speak current time
- **"Jarvis, battery check"** → Battery percentage and status
- **"Jarvis, network status"** → WiFi/cellular info

## Technical Stack

- **Framework** — React Native with Expo SDK 54
- **Language** — TypeScript
- **Styling** — NativeWind (Tailwind CSS)
- **State Management** — React Context + AsyncStorage
- **Voice** — expo-speech (TTS) + expo-speech-recognition (STT)
- **Storage** — AsyncStorage for chat history
- **Networking** — Axios for API calls
- **Animations** — React Native Reanimated 4.x
- **Database** — Optional PostgreSQL for sync (not required initially)
