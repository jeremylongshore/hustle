# Mobile App Deployment Runbook

**Document ID:** 258-OD-DEPL
**Created:** 2025-12-13
**Status:** Active
**Type:** Operations Runbook

---

## Overview

Step-by-step runbook for deploying Hustle Stats mobile app to iOS App Store and Google Play Store.

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
- [ ] Expo doctor passes (`npx expo-doctor`)
- [ ] Feature branch merged to main
- [ ] Version bumped in `app.json`

### App Store Assets
- [ ] App icon (1024x1024 PNG, no alpha)
- [ ] Screenshots for all required device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL

### Configuration
- [ ] Firebase production credentials in EAS secrets
- [ ] Apple Team ID configured
- [ ] Google Play service account key uploaded

---

## Deployment Procedures

### Procedure 1: Version Bump

**When:** Before any production release

```bash
cd mobile

# Edit app.json version
# "version": "1.0.0" -> "1.0.1"

# Commit
git add app.json
git commit -m "chore(mobile): bump version to 1.0.1"
git push
```

### Procedure 2: Development Build

**When:** Testing new native modules or development client features

```bash
# Build for all platforms
eas build --platform all --profile development

# Or single platform
eas build --platform ios --profile development
eas build --platform android --profile development
```

**Duration:** 15-30 minutes per platform

### Procedure 3: Preview Build (Internal Testing)

**When:** Before production release for QA testing

```bash
# Build preview
eas build --platform all --profile preview

# After build completes, distribute via:
# iOS: TestFlight (automatic if configured)
# Android: Internal testing track
```

**Duration:** 15-30 minutes per platform

### Procedure 4: Production Build

**When:** Ready for App Store submission

```bash
# Build production
eas build --platform all --profile production
```

**Duration:** 20-40 minutes per platform

### Procedure 5: App Store Submission

**When:** Production build completed and tested

#### iOS (App Store Connect)

```bash
# Submit to App Store Connect
eas submit --platform ios --latest
```

Then in App Store Connect (appstoreconnect.apple.com):
1. Select the app
2. Go to "App Store" tab
3. Create new version if needed
4. Add build to version
5. Complete metadata (screenshots, description)
6. Submit for review

**Review Time:** 24-48 hours typically

#### Android (Google Play Console)

```bash
# Submit to Play Console
eas submit --platform android --latest
```

Then in Play Console (play.google.com/console):
1. Select the app
2. Go to "Release" > "Production"
3. Create new release
4. Add build
5. Complete store listing
6. Submit for review

**Review Time:** 24-72 hours typically

---

## Rollback Procedures

### Procedure R1: Rollback iOS

1. In App Store Connect:
   - Go to "App Store" > "App Store Versions"
   - Find previous version
   - If still in review: Reject current submission
   - If live: Remove current version from sale

2. Submit previous build:
   ```bash
   eas submit --platform ios --id [PREVIOUS_BUILD_ID]
   ```

### Procedure R2: Rollback Android

1. In Play Console:
   - Go to "Release" > "Production" > "Releases"
   - Halt current rollout if in progress
   - Create new release with previous build

2. Or submit previous build:
   ```bash
   eas submit --platform android --id [PREVIOUS_BUILD_ID]
   ```

---

## Monitoring

### Build Status
```bash
# List recent builds
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

### Submission Status
```bash
# List submissions
eas submit:list

# View submission details
eas submit:view [SUBMISSION_ID]
```

### App Store Status

| Platform | Dashboard |
|----------|-----------|
| iOS | appstoreconnect.apple.com |
| Android | play.google.com/console |

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| App Owner | jeremy@intentsolutions.io |
| Apple Support | developer.apple.com/contact |
| Google Support | play.google.com/console/contact |

---

## Appendix: EAS Build Profiles

### development
- Development client enabled
- Debug symbols included
- Slower but debuggable

### preview
- Production-like build
- Internal distribution only
- No App Store signing

### production
- Full optimization
- App Store signing
- Auto version increment

---

## Appendix: GitHub Actions Trigger

### Manual Production Deploy

1. Go to Actions tab in GitHub
2. Select "Mobile Deploy" workflow
3. Click "Run workflow"
4. Select options:
   - Platform: `all` / `ios` / `android`
   - Profile: `production`
   - Submit: `true` (to submit to stores)
5. Click "Run workflow"

---

**Document ID:** 258-OD-DEPL
**Last Updated:** 2025-12-13
