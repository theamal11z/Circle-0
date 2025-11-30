# Windsurf Notes — Frontend Overview

Short working summary of the Expo/React Native frontend based on `concept.xml` and current folder layout.

## Project Snapshot
- **Platform**: Expo (React Native, TypeScript)
- **Backend (consumed)**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **App Identity**: Anonymous, voice-first, 7-day circles with closure ritual (Stay/Break/Emerge)

## Key Folders
- **app/**: App router/screens (Expo Router expected). Contains navigation entrypoints like onboarding/circle flows.
- **components/**: Reusable UI pieces (e.g., wave bubbles, segment slices, cards, buttons).
- **assets/**: Icons, images, fonts (Inter), audio assets.
- **config/**: Runtime/config helpers (e.g., Firebase setup, environment variables).
- **constants/**: Theme tokens, route names, copy strings.
- **store/**: State management (React Context or optional Recoil per concept).
- **scripts/**: Project automation.

## Navigation & Screens (from concept.xml)
- **Onboarding**: Welcome hero, Begin → HowItWorks.
- **HowItWorks**: Cards explaining circles, voice-first, ritual → VoiceMask.
- **VoiceMask**: Choose voice filter; Continue → CircleMatch.
- **CircleMatch**: Loading/matching, then → MainCircle.
- **MainCircle**: Circular wheel layout with `SegmentSlice` items.
- **VoiceChamber**: Per-segment voice thread list + record bar + optional insights.
- **MySlice**: Personal recordings timeline + reflection prompt.
- **Voting (Day 7)**: Stay / Break / Emerge flow, optional target select.
- **EndOfCycle**: Closure states (stay/break/emerge) + Next → CircleMatch.
- **Settings**: Privacy/data controls, report, export.

## Core Data Model (Firestore)
- **circles**: `circleId`, `createdAt`, `day (1..7)`, `status (active|voting|closed)`, `participants[]`, `settings{maxParticipants, voiceMaskOptions}`.
- **messages**: `messageId`, `circleId`, `authorId (anon)`, `segmentIndex`, `audioPath (Storage)`, `durationMs`, `createdAt`, `transcript?`, `emotionalTags{}`.
- **votes**: `circleId`, `userId`, `choice (stay|break|emerge)`, `emergeTarget?`, `createdAt`.
- **archives**: `archiveId`, `circleId`, `emergedMessageId?`, `snapshot{}`.

## Primary Workflows
- **Upload Audio**: Record (opus/ogg) → upload to Storage (+metadata) → write Firestore `messages` → Cloud Function (transcribe/emotion) → update message doc.
- **Transcription (optional)**: Google STT / ML Kit → transcript, confidence, emotion tags.
- **Voting Resolution**: Cloud Scheduler end-of-day-7 → aggregate → archives update → set circle closed; handle retention/emerge copy.

## Privacy & Safety Defaults
- **Auth**: Anonymous by default; optional phone/email opt-in.
- **Storage**: 30-day retention after circle closes (configurable). Keep emerged memory if voted.
- **Moderation**: Optional on-device scanning, report flow, configurable keyword flagging.
- **PII**: Avoid collecting PII; disable IP logging by default.

## Design System (dark default)
- **Colors**: MidnightBlack, DeepIndigo, accents: VioletGlow, CalmBlue, WarmOrange, Neutral MutedWhite.
- **Typography**: Inter 400/600/700; sizes h1 22, body 16, caption 12.
- **Components**: Button radius 20, Card radius 16 padding 16, WaveBubble radius 12.
- **Motion**: Easing cubic-bezier(0.22, 1, 0.36, 1); durations short 120ms, medium 300ms, long 700ms.

## Notable UI Elements
- **SegmentSlice**: Props: `index`, `hasNew`, `lastTone`; tap → VoiceChamber; visuals: `voiceWave`, `toneBadge`.
- **VoiceChamber**: List of `waveBubble` items with play, timeAgo, duration, silent reactions; record bar with hold-to-record and mask filter; optional insight card.

## Implementation Notes / Next Steps
- **Expo Router**: Map `concept.xml` screens to routes under `app/` (e.g., `app/(auth)/onboarding.tsx`, `app/circle/main.tsx`).
- **Audio**: Use `expo-av` for recording/playback; encode to opus/ogg; chunk uploads; background permissions.
- **Firebase**: Initialize via modular SDK; security rules must enforce anonymity and circle access.
- **State**: Minimal global state for auth, current circle, day, and upload queue.
- **Accessibility**: Provide captions/transcripts when available; clear mic gestures.

## Quick Run Hints
- `npm i` or `yarn` in `frontend/`
- `npx expo start`
- Configure Firebase in `config/` and `.env` (uses `google-services.json` present).

