# Mobile App Store Submission Checklist for Hustle
**Document ID**: 256-PM-PLAN-mobile-app-store-submission-checklist.md
**Created**: 2025-12-13
**Project**: Hustle Youth Soccer Stats Platform
**Status**: Planning Phase
**Purpose**: Comprehensive checklist for Apple App Store and Google Play Store submission

---

## Table of Contents
1. [Pre-Mobile Development Requirements](#pre-mobile-development-requirements)
2. [Apple App Store Submission](#apple-app-store-submission)
3. [Google Play Store Submission](#google-play-store-submission)
4. [COPPA Compliance Checklist](#coppa-compliance-checklist)
5. [GDPR/CCPA Compliance](#gdpr-ccpa-compliance)
6. [Privacy Policy Requirements](#privacy-policy-requirements)
7. [Pre-Submission Testing](#pre-submission-testing)
8. [Post-Submission Monitoring](#post-submission-monitoring)

---

## Pre-Mobile Development Requirements

### Mobile Framework Selection
Current stack is Next.js web app. Choose one:

- [ ] **Option A: React Native + Expo**
  - [ ] Expo SDK 51+ (supports Firebase)
  - [ ] TypeScript configuration
  - [ ] React Native Firebase integration
  - [ ] Expo EAS Build setup
  - [ ] OTA updates configuration

- [ ] **Option B: Capacitor (Web-to-Native)**
  - [ ] Capacitor 6.x installation
  - [ ] iOS platform setup
  - [ ] Android platform setup
  - [ ] Firebase plugin configuration
  - [ ] PWA optimizations

- [ ] **Option C: React Native (vanilla)**
  - [ ] React Native CLI setup
  - [ ] iOS Xcode project
  - [ ] Android Gradle project
  - [ ] React Native Firebase setup

### Firebase Configuration for Mobile
- [ ] Add iOS app to Firebase project
- [ ] Add Android app to Firebase project
- [ ] Download `GoogleService-Info.plist` (iOS)
- [ ] Download `google-services.json` (Android)
- [ ] Configure Firebase Auth for mobile
- [ ] Test Firestore security rules from mobile
- [ ] Configure Firebase Cloud Messaging (push notifications)
- [ ] Set up Firebase Dynamic Links (deep linking)

### Developer Accounts Required
- [ ] **Apple Developer Program** - $99/year
  - [ ] Company or individual account
  - [ ] D-U-N-S number (if company)
  - [ ] Two-factor authentication enabled
  - [ ] Payment information verified

- [ ] **Google Play Console** - $25 one-time
  - [ ] Developer account created
  - [ ] Payment profile completed
  - [ ] Organization details verified
  - [ ] Identity verification complete

---

## Apple App Store Submission

### App Store Connect Setup

#### App Information
- [ ] **App Name** (max 30 characters)
  - Example: "Hustle Stats"
  - Check availability in App Store Connect

- [ ] **Subtitle** (max 30 characters)
  - Example: "Youth Soccer Performance"

- [ ] **Bundle ID**
  - Format: `io.hustlestats.app`
  - Cannot be changed after first submission
  - Must match Xcode project

- [ ] **SKU** (internal reference)
  - Example: `HUSTLE-IOS-001`

- [ ] **Primary Language**
  - English (U.S.)

#### App Category Selection
- [ ] **Primary Category**: Sports
- [ ] **Secondary Category**: Health & Fitness (optional)

#### Age Rating Configuration
**CRITICAL: Youth-focused app with minors' data**

- [ ] Complete Age Rating Questionnaire
  - [ ] "Made for Kids" - **NO** (parent-controlled, not child-directed)
  - [ ] "Third-Party Social Networking" - NO
  - [ ] "Unrestricted Web Access" - NO
  - [ ] "Shares Location" - NO
  - [ ] "Contains In-App Purchases" - YES (if billing implemented)

- [ ] Expected Rating: **4+** (parent-controlled access)
  - [ ] No mature content
  - [ ] No violence
  - [ ] No medical information beyond stats
  - [ ] Parental gate implemented

#### Privacy & Data Collection (App Privacy Section)

**Data Types Collected:**

**Contact Information**
- [ ] Email Address
  - Purpose: Account creation, authentication
  - Linked to user: YES
  - Tracking: NO
  - Parent provides email, not child

**User Content**
- [ ] Name (child's name)
  - Purpose: Player profile creation
  - Linked to user: YES
  - Tracking: NO
- [ ] Photos/Videos (if future feature)
  - Purpose: Player profile picture
  - Linked to user: YES
  - Tracking: NO

**Health & Fitness**
- [ ] Fitness data (game statistics)
  - Purpose: Performance tracking
  - Linked to user: YES
  - Tracking: NO

**Usage Data**
- [ ] Product Interaction
  - Purpose: Analytics, app improvement
  - Linked to user: NO
  - Tracking: NO

**Identifiers**
- [ ] User ID (Firebase Auth UID)
  - Purpose: Account management
  - Linked to user: YES
  - Tracking: NO

**CRITICAL Apple Requirements:**
- [ ] Privacy Nutrition Label completed accurately
- [ ] Privacy Policy URL provided (required)
- [ ] Parental Permission section explains COPPA compliance
- [ ] "Ask App Not to Track" (ATT) if using analytics
- [ ] No third-party tracking without consent

#### App Screenshots & Previews

**iPhone Screenshots (REQUIRED)**
- [ ] 6.7" Display (iPhone 15 Pro Max) - **REQUIRED**
  - Resolution: 1290 x 2796 pixels
  - 3-10 screenshots
  - PNG or JPEG format

- [ ] 6.5" Display (iPhone 11 Pro Max, XS Max)
  - Resolution: 1242 x 2688 pixels
  - Optional if 6.7" provided

- [ ] 5.5" Display (iPhone 8 Plus) - **OPTIONAL**
  - Resolution: 1242 x 2208 pixels

**iPad Screenshots (if supporting iPad)**
- [ ] 12.9" Display (iPad Pro 3rd gen+)
  - Resolution: 2048 x 2732 pixels
  - 3-10 screenshots

- [ ] 12.9" Display (iPad Pro 2nd gen)
  - Resolution: 2048 x 2732 pixels

**Screenshot Content Requirements:**
- [ ] Show actual app interface (no mockups)
- [ ] Demonstrate core features:
  - [ ] Player profile view
  - [ ] Game statistics entry
  - [ ] Performance dashboard
  - [ ] Parent account management
- [ ] No "Coming Soon" features
- [ ] Accurate representation of app
- [ ] Localized for each language (if applicable)

**App Preview Videos (OPTIONAL but RECOMMENDED)**
- [ ] 15-30 seconds maximum
- [ ] Portrait orientation
- [ ] Show actual app in use
- [ ] No sound required (add captions)
- [ ] Same resolutions as screenshots

#### App Description

**Promotional Text** (170 characters, updatable without review)
```
Track your athlete's soccer performance with verified stats.
Parent-controlled, COPPA compliant. Built for ECNL, MLS Next,
USYS, and more.
```

**Description** (4000 characters maximum)
- [ ] Write compelling description highlighting:
  - [ ] Parent-controlled youth stats tracking
  - [ ] 13 specialized soccer positions
  - [ ] 56+ supported leagues
  - [ ] Privacy-first, COPPA compliant
  - [ ] Verified performance records
  - [ ] Recruiting transparency

**Keywords** (max 100 characters, comma-separated)
```
soccer,youth sports,statistics,ECNL,MLS Next,recruiting,
performance,tracking,parent,COPPA
```

**Support URL**
- [ ] `https://hustlestats.io/support`
- [ ] Must be publicly accessible
- [ ] Provide contact form or email

**Marketing URL** (optional)
- [ ] `https://hustlestats.io`

**Privacy Policy URL** (REQUIRED)
- [ ] `https://hustlestats.io/privacy`
- [ ] Must be accessible without login
- [ ] Must address all data collection practices

#### App Review Information

**Contact Information**
- [ ] First Name: [Your Name]
- [ ] Last Name: [Your Name]
- [ ] Phone Number: [Valid phone number]
- [ ] Email: [Valid email]

**Sign-In Information (CRITICAL)**
- [ ] Provide demo account credentials
  - [ ] Demo Email: `demo@hustlestats.io`
  - [ ] Demo Password: [Secure password]
  - [ ] Pre-populate demo account with sample data
  - [ ] Include 2-3 sample players
  - [ ] Include 5-10 sample games

**Notes for Reviewer**
```
COPPA Compliance Information:
- This app is for PARENTS/GUARDIANS to track their children's
  youth soccer statistics
- Parents create accounts and manage child profiles
- No direct child access or child-directed marketing
- Parental consent obtained during registration
- All data collected with parental permission
- Firebase Auth used for secure authentication
- Firestore database with security rules enforcing parent ownership

Demo Account Details:
- Email: demo@hustlestats.io
- Password: [provided securely]
- Pre-loaded with sample player "Jordan Smith" (Grade 10, ECNL)
- Sample games populated for demonstration

Testing Instructions:
1. Login with demo credentials
2. Navigate to Dashboard
3. View player profile and game statistics
4. Test game logging flow (Add Game button)
5. Review performance analytics

Contact: support@hustlestats.io for any questions
```

#### Version Release

**Version Information**
- [ ] Version Number: `1.0.0`
- [ ] Copyright: `2025 Intent Solutions IO`
- [ ] Release Type: Manual Release (recommended for v1.0)

**What's New in This Version** (4000 characters)
```
Version 1.0.0 - Initial Release

Welcome to Hustle - the parent-controlled youth soccer statistics
platform built for transparency and verified performance tracking.

Features:
✓ Track statistics for up to 13 specialized soccer positions
✓ Support for 56+ youth soccer leagues (ECNL, MLS Next, USYS, and more)
✓ Real-time performance dashboard
✓ Secure parent account management
✓ COPPA compliant with privacy-first design
✓ Firebase-powered real-time sync across devices

Built for families serious about athletic development and recruiting
transparency.
```

#### Build Upload

**Xcode Archive Requirements**
- [ ] Valid provisioning profile
- [ ] App signing certificate
- [ ] Increment build number for each upload
- [ ] Set deployment target (iOS 15.0+ recommended)
- [ ] Enable Bitcode: NO (deprecated)
- [ ] Archive validation passes
- [ ] Upload via Xcode Organizer or Transporter

**TestFlight Beta Testing (RECOMMENDED)**
- [ ] Internal testing group created
- [ ] Add internal testers (up to 100)
- [ ] Provide beta test notes
- [ ] External testing (optional, requires review)
- [ ] Collect feedback before production

#### App Review Guidelines Compliance

**Guideline 1.4: Physical Harm - Kids**
- [ ] No inappropriate content for minors
- [ ] Parental controls clearly explained
- [ ] No advertising targeting children

**Guideline 2.1: App Completeness**
- [ ] App fully functional
- [ ] No placeholder content
- [ ] No "Coming Soon" features in screenshots
- [ ] All links work properly

**Guideline 2.3: Accurate Metadata**
- [ ] Screenshots match actual app
- [ ] Description accurate
- [ ] No false claims about features

**Guideline 4.0: Design**
- [ ] Native iOS design patterns
- [ ] iOS Human Interface Guidelines followed
- [ ] Responsive to all screen sizes
- [ ] Dark mode support (if implemented)

**Guideline 5.1.1: Data Collection and Storage**
- [ ] Privacy policy accessible
- [ ] Parental consent mechanism
- [ ] COPPA compliance documented
- [ ] Data minimization practiced

**Guideline 5.1.2: Data Use and Sharing**
- [ ] No selling of children's data
- [ ] No third-party advertising targeting children
- [ ] No behavioral advertising

---

## Google Play Store Submission

### Play Console Setup

#### App Details

**App Name** (max 50 characters)
- [ ] `Hustle - Youth Soccer Stats`

**Short Description** (max 80 characters)
- [ ] `Parent-controlled soccer stats for youth athletes. COPPA compliant.`

**Full Description** (max 4000 characters)
- [ ] Write detailed description including:
  - [ ] Parent-controlled platform
  - [ ] Youth soccer focus (grades 8-12)
  - [ ] Privacy-first design
  - [ ] League support
  - [ ] Feature list
  - [ ] COPPA compliance statement

**App Category**
- [ ] **Primary**: Sports
- [ ] **Secondary**: Health & Fitness (optional)

**Store Listing Contact Details**
- [ ] Email: `support@hustlestats.io`
- [ ] Phone: [Optional]
- [ ] Website: `https://hustlestats.io`

#### Graphic Assets

**App Icon**
- [ ] 512 x 512 pixels
- [ ] 32-bit PNG with alpha
- [ ] No rounded corners (Google applies)

**Feature Graphic** (REQUIRED)
- [ ] 1024 x 500 pixels
- [ ] JPEG or 24-bit PNG
- [ ] No transparency
- [ ] Showcases app value proposition

**Phone Screenshots** (REQUIRED)
- [ ] Minimum 2, maximum 8
- [ ] JPEG or 24-bit PNG
- [ ] Minimum dimension: 320px
- [ ] Maximum dimension: 3840px
- [ ] Recommended: 1080 x 1920 pixels (16:9 aspect ratio)
- [ ] Show core features:
  - [ ] Login/registration
  - [ ] Player profile
  - [ ] Game stats entry
  - [ ] Performance dashboard

**7-inch Tablet Screenshots** (OPTIONAL)
- [ ] Minimum 2, maximum 8
- [ ] Recommended: 1200 x 1920 pixels

**10-inch Tablet Screenshots** (OPTIONAL)
- [ ] Minimum 2, maximum 8
- [ ] Recommended: 1600 x 2560 pixels

**Promotional Video** (OPTIONAL)
- [ ] YouTube URL
- [ ] 30 seconds to 2 minutes
- [ ] Demonstrates app features

#### Content Rating (IARC)

**CRITICAL: Youth-focused app with parental controls**

Complete IARC questionnaire honestly:

**App Target Audience**
- [ ] Select "Family" (if targeting parents AND kids)
- [ ] OR select "Everyone" (if parent-only)
- [ ] Target age group: 13+ (parents/guardians)

**Violence**
- [ ] Does your app contain violence? **NO**

**Sexual Content**
- [ ] Does your app contain sexual content? **NO**

**Language**
- [ ] Does your app contain profanity? **NO**

**Controlled Substances**
- [ ] References to alcohol, tobacco, drugs? **NO**

**Gambling**
- [ ] Does your app simulate gambling? **NO**

**User Interaction**
- [ ] Users can communicate? **NO** (no chat/messaging)
- [ ] Users can share location? **NO**
- [ ] Users can share personal information? **NO**

**Advertising**
- [ ] Does your app contain ads? **NO** (update if implementing)

**Data Collection**
- [ ] Does your app collect personal data? **YES**
  - [ ] Name (child's name via parent)
  - [ ] Date of birth (grade level)
  - [ ] Performance data

**Expected Rating**: ESRB: Everyone, PEGI: 3

#### Data Safety Form (CRITICAL)

**REQUIRED: Google's equivalent to Apple's Privacy Nutrition Label**

**Data Collection & Security**
- [ ] Does your app collect or share user data? **YES**

**Types of Data Collected:**

**Personal Information**
- [ ] **Name**
  - Collected: YES
  - Shared: NO
  - Optional: NO
  - Purpose: Account functionality, App functionality
  - Ephemeral: NO
- [ ] **Email address**
  - Collected: YES
  - Shared: NO
  - Optional: NO
  - Purpose: Account functionality
  - Ephemeral: NO

**Health and Fitness**
- [ ] **Fitness info** (game statistics)
  - Collected: YES
  - Shared: NO
  - Optional: NO
  - Purpose: App functionality, Analytics
  - Ephemeral: NO

**App Activity**
- [ ] **App interactions**
  - Collected: YES
  - Shared: NO
  - Optional: YES
  - Purpose: Analytics, App functionality
  - Ephemeral: NO

**App Info and Performance**
- [ ] **Crash logs**
  - Collected: YES
  - Shared: NO
  - Optional: YES
  - Purpose: Analytics, App functionality
  - Ephemeral: NO

**Data Security Practices**
- [ ] Data is encrypted in transit: **YES** (HTTPS, Firebase)
- [ ] Data is encrypted at rest: **YES** (Firestore encryption)
- [ ] Users can request data deletion: **YES**
- [ ] Committed to Google Play Families Policy: **YES** (if targeting families)
- [ ] Independent security review: NO (optional)

**Data Retention and Deletion**
- [ ] Policy URL: `https://hustlestats.io/privacy#data-retention`
- [ ] Users can request deletion via app: **YES** (implement in settings)
- [ ] Users can request deletion via email: **YES** (support@hustlestats.io)

#### Google Play Families Policy (if applicable)

**If targeting children or families:**

- [ ] App follows Teacher Approved guidelines (if educational)
- [ ] No third-party advertising targeting children
- [ ] Complies with COPPA
- [ ] Data collection disclosed in privacy policy
- [ ] Parental consent for data collection
- [ ] App content appropriate for age group

**Ads & Monetization (if applicable)**
- [ ] No ads shown to children
- [ ] No SDKs targeting children for behavioral advertising
- [ ] In-app purchases clearly labeled

#### App Access & Test Account

**App Access**
- [ ] All features accessible: YES
- [ ] Demo account required: **YES**

**Login Credentials** (store securely in Play Console)
```
Username: demo@hustlestats.io
Password: [Secure password]

Instructions for testing:
1. Login with credentials above
2. View pre-loaded demo player "Jordan Smith"
3. Navigate to Dashboard
4. Add new game (test stats entry)
5. View performance analytics
```

**Special Instructions**
```
COPPA Compliance Testing:
- This app requires parental consent during registration
- Test account bypasses registration for review purposes
- Parents create accounts and manage child player profiles
- No child-directed advertising or marketing
- Firebase Authentication and Firestore database
- All data encrypted in transit and at rest

Features to Test:
1. Player profile management
2. Game statistics entry (13 position types)
3. Performance dashboard
4. Multi-player support (demo has 2 players)

Support: support@hustlestats.io
```

#### App Releases

**Production Track**
- [ ] Create production release
- [ ] Upload APK or App Bundle (AAB recommended)
- [ ] Release name: `1.0.0 - Initial Release`
- [ ] Release notes:
  ```
  Version 1.0.0 - Initial Release

  Welcome to Hustle! Track your youth athlete's soccer performance
  with parent-controlled, COPPA-compliant statistics platform.

  Features:
  • 13 specialized soccer positions
  • 56+ youth soccer leagues
  • Real-time performance tracking
  • Secure parent account management
  • Privacy-first design

  Built for families serious about athletic development.
  ```

**Internal Testing Track** (RECOMMENDED before production)
- [ ] Add internal testers (email list)
- [ ] Distribute APK/AAB
- [ ] Collect feedback
- [ ] Test for 1-2 weeks minimum

**Closed Testing Track** (OPTIONAL)
- [ ] Create tester list (up to 500)
- [ ] Invite external beta testers
- [ ] Gather feedback

**Open Testing Track** (OPTIONAL)
- [ ] Anyone can join
- [ ] Use for wider beta before launch

#### App Signing

**Google Play App Signing** (RECOMMENDED)
- [ ] Enroll in Google Play App Signing
- [ ] Google manages signing key
- [ ] Upload app bundle (AAB)
- [ ] Google optimizes APKs for devices

**Manual App Signing** (legacy)
- [ ] Generate keystore file
- [ ] Sign APK manually
- [ ] Keep keystore secure (cannot be recovered)

---

## COPPA Compliance Checklist

**Children's Online Privacy Protection Act (COPPA) - U.S. Federal Law**

### Application Scope
- [ ] App collects information from children under 13: **YES** (via parent)
- [ ] App is not child-directed (parent-controlled): **YES**
- [ ] Parental consent mechanism implemented: **REQUIRED**

### Parental Consent Flow

**Registration Process**
- [ ] **Step 1: Account Creation (Parent)**
  - [ ] Parent provides own email
  - [ ] Parent creates password
  - [ ] Parent acknowledges they are 18+ years old
  - [ ] Parent agrees to Terms of Service
  - [ ] Parent agrees to Privacy Policy

- [ ] **Step 2: Parental Consent**
  - [ ] Clear disclosure of data collection practices
  - [ ] Explanation of what child data is collected
  - [ ] How child data will be used
  - [ ] Whether child data is shared (answer: NO)
  - [ ] Parent's right to review, delete child data
  - [ ] Explicit checkbox: "I am the parent/legal guardian and consent to collection of my child's information"

- [ ] **Step 3: Child Profile Creation**
  - [ ] Parent enters child's first name
  - [ ] Parent enters child's grade level (NOT birth date)
  - [ ] Parent enters child's gender
  - [ ] Parent enters child's position, team, league
  - [ ] NO direct child access to app (parent-controlled)

**Implementation Checklist**
```typescript
// Required UI elements in registration flow

// 1. Parental Status Checkbox
<Checkbox id="isParentGuardian" required />
<Label htmlFor="isParentGuardian">
  I am the parent or legal guardian of the child(ren) whose
  information I will be entering into this app.
</Label>

// 2. COPPA Consent Checkbox
<Checkbox id="coppaConsent" required />
<Label htmlFor="coppaConsent">
  I consent to the collection, use, and storage of my child's
  information as described in the Privacy Policy. I understand
  I can review, modify, or delete this information at any time.
</Label>

// 3. Age Verification
<Checkbox id="ageVerification" required />
<Label htmlFor="ageVerification">
  I certify that I am at least 18 years of age.
</Label>
```

### Data Collection Transparency

**Information Collected About Children (via parent input):**
- [ ] Child's first name (required)
- [ ] Child's grade level (required) - NOT birth date
- [ ] Child's gender (optional)
- [ ] Child's primary position (required)
- [ ] Child's secondary positions (optional)
- [ ] Child's team/club name (optional)
- [ ] Child's league (optional)
- [ ] Game statistics (goals, assists, saves, tackles, passes, shots)
- [ ] Emotional feedback after games (optional)

**Information NOT Collected:**
- [ ] Child's last name (parent's account only)
- [ ] Child's birth date (use grade level instead)
- [ ] Child's photo (unless future feature with consent)
- [ ] Child's location data
- [ ] Child's email address
- [ ] Child's phone number
- [ ] Child's social media profiles

### Parental Rights & Controls

**Access & Review**
- [ ] Parent can view all child data at any time
- [ ] Dashboard shows all collected information
- [ ] Player profile displays all stats

**Modification**
- [ ] Parent can edit child profile information
- [ ] Parent can update game statistics
- [ ] Parent can add/remove secondary positions

**Deletion**
- [ ] Parent can delete individual games
- [ ] Parent can delete entire player profile
- [ ] Parent can delete entire account (cascades to all players)
- [ ] "Delete My Account" button in settings
- [ ] Confirmation dialog with warning
- [ ] Permanent deletion within 30 days

**Implementation Required**
```typescript
// In User Settings component
<Button variant="destructive" onClick={handleDeleteAccount}>
  Delete My Account and All Data
</Button>

// Confirmation dialog
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
    <AlertDialogDescription>
      This will permanently delete your account and ALL child
      player profiles and game statistics. This action cannot
      be undone.
    </AlertDialogDescription>
    <AlertDialogAction onClick={confirmDeletion}>
      Delete Permanently
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### Privacy Policy Requirements

**COPPA-Specific Sections Required**

**Section 1: Children's Privacy**
```
Children's Privacy and Parental Consent

Hustle is designed for parents and legal guardians to track their
children's youth soccer statistics. We do not knowingly collect
information directly from children under 13 years of age.

All child information is entered by parents or legal guardians who
create accounts and manage their children's player profiles. By
creating an account, you certify that you are at least 18 years old
and are the parent or legal guardian of any children whose information
you provide.

Information We Collect About Children (via Parent):
• Child's first name
• Child's grade level (8-12)
• Child's gender
• Child's soccer position, team, and league
• Game statistics (goals, assists, saves, etc.)
• Optional emotional feedback after games

Information We DO NOT Collect:
• Child's last name
• Child's exact birth date or age
• Child's photo or video
• Child's location data
• Child's contact information

Parental Rights:
As a parent, you have the right to:
• Review all information we have collected about your child
• Request correction of your child's information
• Delete your child's player profile at any time
• Delete your entire account and all associated data
• Refuse further collection of your child's information

To exercise these rights, visit your Account Settings or contact us
at support@hustlestats.io.

Data Retention:
We retain your child's information for as long as your account is
active. When you delete a player profile or your account, all
associated data is permanently deleted within 30 days.

Third-Party Sharing:
We do NOT sell, rent, or share your child's information with third
parties for marketing purposes. We do not display advertisements
targeting children.
```

**Section 2: Contact Information**
- [ ] Support email: `support@hustlestats.io`
- [ ] Physical address (if company)
- [ ] Phone number (optional)
- [ ] Response time commitment (e.g., 48 hours)

### FTC Compliance

**Verifiable Parental Consent Methods (choose one):**
- [ ] **Email Plus** (current implementation)
  - Parent provides email
  - Confirmation email sent
  - Parent must click link to verify
  - Suitable for internal operations only (not sharing data)

- [ ] **Credit Card Verification** (if implementing paid tiers)
  - Small charge ($0.01-$0.99) to verify adult
  - Immediately refunded
  - Proves cardholder is adult

- [ ] **Government ID** (high assurance, complex)
  - Parent uploads ID
  - Manual verification
  - High friction, use only if required

**Current Recommendation**: Email Plus is sufficient for internal data collection (not sharing with third parties)

---

## GDPR/CCPA Compliance

### GDPR (European Users)

**If serving EU users, implement:**

- [ ] **Cookie Consent Banner**
  - [ ] Opt-in required (not opt-out)
  - [ ] Granular consent (analytics separate from functional)
  - [ ] Easy to withdraw consent

- [ ] **Data Subject Rights**
  - [ ] Right to access (data export)
  - [ ] Right to rectification (edit profile)
  - [ ] Right to erasure (delete account)
  - [ ] Right to data portability (JSON export)
  - [ ] Right to object (opt-out analytics)

- [ ] **Legal Basis for Processing**
  - [ ] Consent (for analytics)
  - [ ] Contractual necessity (for service delivery)
  - [ ] Legitimate interest (for app functionality)

- [ ] **Data Processing Agreement**
  - [ ] Firebase/Google Cloud is data processor
  - [ ] Review Google's DPA
  - [ ] Ensure GDPR compliance in contracts

**Implementation Required**
```typescript
// Data export functionality
<Button onClick={exportUserData}>
  Download My Data (JSON)
</Button>

// Exports all user data:
// - Account info
// - All player profiles
// - All game statistics
// - Account settings
```

### CCPA (California Users)

**If serving California residents:**

- [ ] **Privacy Policy Disclosures**
  - [ ] Categories of personal information collected
  - [ ] Sources of information
  - [ ] Business purposes for collection
  - [ ] Categories of third parties (Firebase, Stripe)

- [ ] **Consumer Rights**
  - [ ] Right to know (what data collected)
  - [ ] Right to delete
  - [ ] Right to opt-out of sale (not applicable - we don't sell)
  - [ ] Right to non-discrimination

- [ ] **"Do Not Sell My Personal Information" Link**
  - [ ] Required even if you don't sell data
  - [ ] Can say "We do not sell personal information"

---

## Privacy Policy Requirements

### Required Sections

**Privacy Policy Hosting**
- [ ] URL: `https://hustlestats.io/privacy`
- [ ] Publicly accessible (no login required)
- [ ] Last updated date displayed
- [ ] Version history maintained

**Section 1: Introduction**
- [ ] App name and operator
- [ ] Effective date
- [ ] Contact information
- [ ] Overview of privacy practices

**Section 2: Information We Collect**
- [ ] Parent account information
  - [ ] Email address
  - [ ] Password (hashed, not stored plaintext)
- [ ] Child information (via parent)
  - [ ] First name
  - [ ] Grade level
  - [ ] Gender
  - [ ] Position, team, league
  - [ ] Game statistics
- [ ] Usage information
  - [ ] Device type
  - [ ] Operating system
  - [ ] App version
  - [ ] Crash logs

**Section 3: How We Use Information**
- [ ] Provide and maintain the service
- [ ] Authenticate users
- [ ] Store and display statistics
- [ ] Send email notifications (if implemented)
- [ ] Improve app functionality
- [ ] Respond to support requests

**Section 4: How We Share Information**
- [ ] Firebase/Google Cloud (hosting, authentication, database)
- [ ] Stripe (if billing implemented)
- [ ] No third-party advertising networks
- [ ] No social media sharing without consent
- [ ] No data brokers or marketing companies

**Section 5: Data Security**
- [ ] Firebase Authentication (industry-standard)
- [ ] Firestore security rules (parent ownership)
- [ ] HTTPS encryption in transit
- [ ] Encryption at rest (Firestore default)
- [ ] No server-side storage of passwords (Firebase Auth)

**Section 6: Data Retention**
- [ ] Active account: indefinitely
- [ ] Deleted account: 30 days to purge
- [ ] Backup retention: 30 days

**Section 7: Your Rights and Choices**
- [ ] Access your data (dashboard)
- [ ] Edit your data (profile settings)
- [ ] Delete your data (account settings)
- [ ] Export your data (data portability)
- [ ] Opt-out of analytics (if implemented)

**Section 8: Children's Privacy (COPPA)**
- [ ] See detailed section above
- [ ] Parental consent process
- [ ] Parental rights
- [ ] No child-directed marketing

**Section 9: International Users**
- [ ] GDPR compliance (if serving EU)
- [ ] Data transfer mechanisms
- [ ] Regional privacy rights

**Section 10: Changes to Privacy Policy**
- [ ] How users will be notified
- [ ] Effective date of changes
- [ ] Continued use implies acceptance

**Section 11: Contact Us**
- [ ] Email: support@hustlestats.io
- [ ] Response timeframe
- [ ] Physical address (if company)

---

## Pre-Submission Testing

### Functionality Testing

**Authentication**
- [ ] Email/password registration works
- [ ] Email verification (if implemented)
- [ ] Login/logout flow functional
- [ ] Password reset works
- [ ] Session persistence

**Player Management**
- [ ] Create player profile
- [ ] Edit player profile
- [ ] Delete player profile
- [ ] Multiple players per account (test 2-3)
- [ ] Profile validation (required fields)

**Game Logging**
- [ ] Add new game
- [ ] Edit existing game
- [ ] Delete game
- [ ] All position types work (13 positions)
- [ ] Stat validation (no negative numbers)
- [ ] Date picker functional

**Dashboard**
- [ ] Statistics display correctly
- [ ] Charts/graphs render
- [ ] Performance trends accurate
- [ ] Multi-player view works

**Account Settings**
- [ ] Edit account information
- [ ] Delete account flow
- [ ] Data export (if implemented)

### Device Testing

**iOS Testing**
- [ ] iPhone 13 or newer
- [ ] iPhone SE (smaller screen)
- [ ] iPad (if supported)
- [ ] iOS 15.0 minimum
- [ ] iOS 17+ (latest)
- [ ] Dark mode (if supported)
- [ ] Portrait orientation
- [ ] Landscape orientation (tablets)

**Android Testing**
- [ ] Pixel 6 or newer (stock Android)
- [ ] Samsung Galaxy (One UI)
- [ ] Small screen (5.5")
- [ ] Large screen (6.7"+)
- [ ] Tablet (if supported)
- [ ] Android 10 minimum
- [ ] Android 14+ (latest)
- [ ] Dark mode (if supported)

### Performance Testing

**Load Times**
- [ ] App launch: < 3 seconds
- [ ] Login: < 2 seconds
- [ ] Dashboard load: < 2 seconds
- [ ] Game logging: < 1 second
- [ ] Image upload (if applicable): < 5 seconds

**Offline Functionality**
- [ ] Cached data displays offline
- [ ] Offline indicators shown
- [ ] Queue writes for sync when online
- [ ] Graceful error handling

**Battery Usage**
- [ ] Not in top 10 battery consumers
- [ ] Background activity minimal
- [ ] No memory leaks

### Security Testing

**Authentication Security**
- [ ] Passwords not visible in logs
- [ ] No hardcoded credentials
- [ ] Firebase API keys properly configured
- [ ] App Transport Security enabled (iOS)
- [ ] Certificate pinning (optional, advanced)

**Data Security**
- [ ] Firestore security rules tested
- [ ] Users can only access own data
- [ ] No unauthorized data access
- [ ] No SQL injection vectors (N/A for Firestore)
- [ ] No XSS vulnerabilities

**Privacy Testing**
- [ ] No analytics without consent
- [ ] No third-party trackers
- [ ] No location data collection
- [ ] No camera/microphone access (unless needed)
- [ ] Permissions properly requested

### Compliance Testing

**COPPA Compliance**
- [ ] Parental consent flow works
- [ ] All checkboxes required
- [ ] Cannot skip consent steps
- [ ] Privacy policy linked and accessible
- [ ] Terms of service linked and accessible

**Age Verification**
- [ ] "I am 18+" checkbox enforced
- [ ] Cannot register as child
- [ ] No child-directed content

**Data Deletion**
- [ ] Delete player works
- [ ] Delete account works
- [ ] Confirmation dialogs shown
- [ ] Data actually removed from Firestore
- [ ] Cascade deletion works (players → games)

### Accessibility Testing

**iOS Accessibility**
- [ ] VoiceOver support
- [ ] Dynamic Type (text scaling)
- [ ] High contrast mode
- [ ] Reduce motion
- [ ] Accessibility labels on buttons

**Android Accessibility**
- [ ] TalkBack support
- [ ] Font size scaling
- [ ] Color contrast
- [ ] Touch target sizes (48x48 dp minimum)

### Localization Testing (if applicable)

- [ ] English (U.S.) - default
- [ ] Spanish (es) - if targeting Latino communities
- [ ] Date/time formats correct
- [ ] Number formats correct
- [ ] Currency formats (if billing)

---

## Pre-Submission Checklist

### Final Review (iOS)

**App Store Connect**
- [ ] All metadata complete
- [ ] Screenshots uploaded for all required sizes
- [ ] Privacy policy URL works
- [ ] Support URL works
- [ ] Demo account credentials correct
- [ ] Age rating appropriate (4+)
- [ ] Privacy Nutrition Label complete

**Xcode Build**
- [ ] No warnings in build log
- [ ] No errors in build log
- [ ] Archive validated successfully
- [ ] Build uploaded to App Store Connect
- [ ] Build appears in TestFlight

**Legal**
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] COPPA compliance documented
- [ ] Parental consent flow implemented

### Final Review (Android)

**Play Console**
- [ ] All metadata complete
- [ ] Graphics assets uploaded
- [ ] Data safety form complete
- [ ] Content rating (IARC) complete
- [ ] Demo account credentials correct
- [ ] Privacy policy URL works

**Build**
- [ ] App bundle (AAB) signed
- [ ] No build errors
- [ ] ProGuard rules configured (if using)
- [ ] Version code incremented

**Legal**
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] COPPA compliance documented
- [ ] Data safety declarations accurate

---

## Post-Submission Monitoring

### App Store Review (iOS)

**Timeline**
- [ ] Review typically takes 24-48 hours
- [ ] Can take up to 7 days during peak times
- [ ] Expedited review available (2 per year)

**Common Rejection Reasons**
- [ ] Inaccurate metadata/screenshots
- [ ] Privacy policy missing or incorrect
- [ ] Demo account doesn't work
- [ ] App crashes during review
- [ ] COPPA compliance unclear
- [ ] Missing parental consent mechanism

**If Rejected**
- [ ] Read rejection message carefully
- [ ] Address all issues mentioned
- [ ] Reply to reviewer with explanation
- [ ] Resubmit (enters queue again)

### Play Store Review (Android)

**Timeline**
- [ ] Review typically takes 1-3 days
- [ ] Can take up to 7 days
- [ ] Automatic review for some apps

**Common Rejection Reasons**
- [ ] Data safety form incomplete
- [ ] Privacy policy missing
- [ ] Target audience unclear
- [ ] COPPA compliance unclear
- [ ] Demo account doesn't work

### Post-Launch Monitoring

**Week 1**
- [ ] Monitor crash reports daily
- [ ] Check reviews daily
- [ ] Respond to support emails
- [ ] Monitor server costs (Firebase/Cloud Functions)
- [ ] Check authentication success rate

**Week 2-4**
- [ ] Analyze usage patterns
- [ ] Identify common user flows
- [ ] Track retention rates
- [ ] Plan first update

**Ongoing**
- [ ] Monthly review of analytics
- [ ] Quarterly privacy policy review
- [ ] Annual COPPA compliance audit
- [ ] Update for new OS versions (iOS/Android)

---

## Implementation Timeline

**Phase 1: Mobile Framework Setup (2-3 weeks)**
- [ ] Choose mobile framework (React Native/Capacitor)
- [ ] Set up iOS project
- [ ] Set up Android project
- [ ] Configure Firebase for mobile
- [ ] Implement authentication

**Phase 2: Core Features (4-6 weeks)**
- [ ] Player profile management
- [ ] Game logging UI
- [ ] Dashboard/analytics
- [ ] Account settings
- [ ] Data deletion

**Phase 3: COPPA Compliance (1-2 weeks)**
- [ ] Implement parental consent flow
- [ ] Add required checkboxes
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Test consent mechanism

**Phase 4: Testing (2-3 weeks)**
- [ ] Internal testing on devices
- [ ] Beta testing (TestFlight/Internal Track)
- [ ] Accessibility testing
- [ ] Performance optimization
- [ ] Security audit

**Phase 5: App Store Preparation (1 week)**
- [ ] Create screenshots
- [ ] Write app descriptions
- [ ] Set up developer accounts
- [ ] Configure app store listings
- [ ] Create demo accounts

**Phase 6: Submission (1 week)**
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store
- [ ] Monitor review status
- [ ] Address any rejections

**Total Estimated Timeline: 11-16 weeks**

---

## Resources & References

### Official Documentation
- **Apple**: https://developer.apple.com/app-store/review/guidelines/
- **Google**: https://support.google.com/googleplay/android-developer/
- **COPPA**: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- **GDPR**: https://gdpr.eu/
- **CCPA**: https://oag.ca.gov/privacy/ccpa

### Helpful Tools
- **App Store Screenshots**: https://www.appstorescreenshot.com/
- **Privacy Policy Generator**: https://www.privacypolicies.com/
- **COPPA Compliance Checker**: https://www.ftc.gov/business-guidance/resources/coppa-compliance-self-assessment

### Professional Services (if needed)
- **Legal Review**: Privacy attorney specializing in COPPA
- **ASO (App Store Optimization)**: Optimize metadata for discovery
- **Beta Testing**: TestFlight (iOS), Google Play Internal Track

---

**Document End**
**Last Updated**: 2025-12-13
**Next Review**: Before mobile development begins

---

## Notes for Development Team

1. **Mobile Framework Decision**: Need to decide between React Native (Expo) or Capacitor. Capacitor may be faster since the web app is already built in React.

2. **COPPA Implementation**: This is CRITICAL and must be done correctly. Consider legal review before submission.

3. **Demo Account**: Create a dedicated demo account with realistic sample data before submission. This account should NOT be deletable.

4. **Privacy Policy**: Must be written and published BEFORE submission. Consider hiring a lawyer to review COPPA compliance.

5. **Parental Consent Flow**: The registration flow needs significant updates to include all required consent checkboxes and disclosures.

6. **Data Deletion**: Implement account deletion and player deletion features in app settings. Must actually delete data from Firestore.

7. **Age Rating**: Target 4+ (iOS) and Everyone (Android) since app is parent-controlled, not child-directed.

8. **Testing**: Plan for 2-3 weeks of beta testing before submission. Use TestFlight and Google Play Internal Track.

9. **Budget**: Factor in $99/year (Apple) + $25 one-time (Google) + potential legal fees ($500-$2000) for privacy policy review.

10. **Timeline**: Realistically 3-4 months from start to app store approval if starting from scratch with mobile development.
