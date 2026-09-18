# Mobile App Setup Guide

**Document ID:** 257-DR-GUID
**Created:** 2025-12-13
**Status:** Active
**Applies To:** Hustle Stats React Native Mobile App

---

## Overview

This guide covers setting up the Hustle Stats mobile app for local development, testing, and production deployment.

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 20.x LTS | JavaScript runtime |
| npm | 10.x | Package manager |
| Expo CLI | Latest | Development tooling |
| EAS CLI | Latest | Build & submit |
| Xcode | 15+ | iOS development (macOS only) |
| Android Studio | Latest | Android development |

## Initial Setup

### 1. Clone and Install

```bash
cd /home/jeremy/000-projects/hustle
git checkout feature/react-native-mobile-app
cd mobile
npm install
```

### 2. Configure Firebase

Copy the environment template and add Firebase credentials:

```bash
cp .env.example .env
```

Edit `.env` with production Firebase values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=REDACTED_ROTATED_GOOGLE_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hustleapp-production.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=hustleapp-production
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hustleapp-production.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=335713777643
EXPO_PUBLIC_FIREBASE_APP_ID=1:335713777643:web:209e728afd5aee07c80bae
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-3H6DBQLBV2
```

### 3. Verify TypeScript

```bash
npx tsc --noEmit
```

Expected: No errors.

### 4. Run Expo Doctor

```bash
npx expo-doctor
```

Expected: All checks pass (duplicate react warning from parent node_modules is acceptable).

## Running the App

### Development Server

```bash
npx expo start
```

Options:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

### Specific Platforms

```bash
# iOS only
npx expo start --ios

# Android only
npx expo start --android

# Web (limited support)
npx expo start --web
```

### Clear Metro Cache

```bash
npx expo start --clear
```

## EAS Build Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

Use Expo account credentials (create at expo.dev if needed).

### 3. Configure Project

```bash
eas build:configure
```

This links the project to your Expo account.

### 4. Update eas.json

Ensure `eas.json` has correct Apple Team ID and App Store Connect App ID:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "internal"
      }
    }
  }
}
```

## Building

### Development Build

Includes Expo dev tools, React DevTools, and debug features.

```bash
eas build --platform all --profile development
```

### Preview Build

For internal testing (TestFlight/Internal Testing track).

```bash
eas build --platform all --profile preview
```

### Production Build

For App Store and Play Store submission.

```bash
eas build --platform all --profile production
```

## App Store Submission

### iOS (App Store Connect)

1. Build production iOS:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to App Store Connect:
   ```bash
   eas submit --platform ios --latest
   ```

3. In App Store Connect:
   - Add app description, keywords, screenshots
   - Set pricing (Free)
   - Submit for review

### Android (Google Play Console)

1. Build production Android:
   ```bash
   eas build --platform android --profile production
   ```

2. Submit to Play Console:
   ```bash
   eas submit --platform android --latest
   ```

3. In Play Console:
   - Complete store listing
   - Upload screenshots
   - Submit for review

## GitHub Actions CI/CD

The mobile app has two workflows:

### mobile-ci.yml

Triggers on PRs and pushes to mobile directory:
- TypeScript type checking
- Expo doctor validation
- Preview builds on PRs

### mobile-deploy.yml

Manual workflow dispatch for production deployments:
- Select platform (ios/android/all)
- Select profile (development/preview/production)
- Optional app store submission

### Required Secrets

Add these to GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo access token (expo.dev) |
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | For iOS submissions |

## Troubleshooting

### Metro Bundler Port Conflict

```bash
# Use different port
npx expo start --port 19000
```

### Node Modules Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase Auth Persistence

If auth state isn't persisting, verify:
1. `@react-native-async-storage/async-storage` is installed
2. Firebase config uses `getReactNativePersistence`

### Build Failures

Check EAS build logs:
```bash
eas build:list
eas build:view [BUILD_ID]
```

---

**Document ID:** 257-DR-GUID
**Last Updated:** 2025-12-13
