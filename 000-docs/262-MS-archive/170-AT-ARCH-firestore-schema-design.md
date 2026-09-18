# Firestore Schema Design - Hustle Application

**Date:** 2025-11-09T19:40:00Z
**Status:** Initial Design
**Migration:** From PostgreSQL to Firestore

---

## Overview

This document defines the Firestore schema for the Hustle application, migrating from PostgreSQL/Prisma to Firestore NoSQL structure.

## Design Principles

1. **Denormalization:** Optimize for read performance over write consistency
2. **Security:** Firestore security rules enforce access control
3. **Scalability:** Subcollections for one-to-many relationships
4. **COPPA Compliance:** Proper parent-child data hierarchy

---

## Collection Structure

### Primary Collections

```
/users/{userId}
/players/{playerId}
/games/{gameId}
/emailVerificationTokens/{tokenId}
/passwordResetTokens/{tokenId}
/waitlist/{entryId}
```

---

## Collection: `/users/{userId}`

**Purpose:** User accounts (parents/guardians)

**Document Structure:**
```typescript
{
  // Identity
  id: string,                    // Document ID (Firebase Auth UID)
  firstName: string,             // Required
  lastName: string,              // Required
  email: string,                 // Required, unique
  emailVerified: boolean,        // Email verification status
  phone?: string,                // Optional

  // Authentication
  password: string,              // Bcrypt hash (handled by Firebase Auth)

  // COPPA Compliance
  agreedToTerms: boolean,        // Terms of Service agreement
  agreedToPrivacy: boolean,      // Privacy Policy agreement
  isParentGuardian: boolean,     // 18+ certification
  termsAgreedAt: Timestamp,      // When terms were agreed
  privacyAgreedAt: Timestamp,    // When privacy was agreed

  // Verification
  verificationPinHash?: string,  // Bcrypt hash of 4-6 digit PIN

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `email` (unique, enforced by Firebase Auth)
- `createdAt` (for admin queries)

**Security Rules:**
- Users can read/write their own document
- Updates limited to specific fields
- Creation during registration only

**Estimated Size:** 500 bytes per document
**Expected Volume:** 10,000 users (Year 1)

---

## Collection: `/players/{playerId}`

**Purpose:** Youth player profiles (children)

**Document Structure:**
```typescript
{
  // Identity
  id: string,                    // Document ID (auto-generated)
  name: string,                  // Player full name
  birthday: Timestamp,           // For age calculation
  position: string,              // Primary position
  teamClub: string,              // Team/club name (free text)

  // Parent Relationship
  parentId: string,              // Reference to /users/{userId}

  // Media
  photoUrl?: string,             // Optional player photo (Firebase Storage URL)

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- Composite: `parentId` (ASC) + `createdAt` (DESC)
  - Enables efficient "Athletes List" query

**Security Rules:**
- Read: Parent only
- Write: Parent only
- Cascade delete when parent is deleted

**Estimated Size:** 300 bytes per document
**Expected Volume:** 50,000 players (Year 1)

---

## Collection: `/games/{gameId}`

**Purpose:** Game records with statistics

**Document Structure:**
```typescript
{
  // Identity
  id: string,                    // Document ID (auto-generated)
  playerId: string,              // Reference to /players/{playerId}

  // Game Details
  date: Timestamp,               // Game date
  opponent: string,              // Opponent team name
  result: string,                // "Win" | "Loss" | "Draw"
  finalScore: string,            // e.g., "3-2"
  minutesPlayed: number,         // Minutes played

  // Universal Stats
  goals: number,                 // Default: 0
  assists: number,               // Default: 0

  // Defensive Stats (nullable)
  tackles?: number,
  interceptions?: number,
  clearances?: number,
  blocks?: number,
  aerialDuelsWon?: number,

  // Goalkeeper Stats (nullable)
  saves?: number,
  goalsAgainst?: number,
  cleanSheet?: boolean,

  // Verification
  verified: boolean,             // Default: false
  verifiedAt?: Timestamp,        // When verified

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- Composite 1: `playerId` (ASC) + `date` (DESC)
  - Enables player game history query
- Composite 2: `playerId` (ASC) + `verified` (ASC) + `date` (DESC)
  - Enables filtering by verification status

**Security Rules:**
- Read: Parent of player
- Write: Parent of player
- Requires player document existence check

**Estimated Size:** 400 bytes per document
**Expected Volume:** 500,000 games (Year 1)

---

## Collection: `/emailVerificationTokens/{tokenId}`

**Purpose:** Email verification tokens (system-only)

**Document Structure:**
```typescript
{
  id: string,                    // Document ID (auto-generated)
  token: string,                 // Unique verification token
  userId: string,                // Reference to /users/{userId}
  expires: Timestamp,            // Token expiration
  createdAt: Timestamp
}
```

**Indexes:**
- `token` (unique)
- Composite: `userId` (ASC) + `expires` (DESC)

**Security Rules:**
- No direct user access (system only via Cloud Functions)

**TTL:** Auto-delete after 24 hours (Firestore TTL policy)

**Estimated Size:** 200 bytes per document
**Expected Volume:** 10,000 tokens (active, pruned daily)

---

## Collection: `/passwordResetTokens/{tokenId}`

**Purpose:** Password reset tokens (system-only)

**Document Structure:**
```typescript
{
  id: string,                    // Document ID (auto-generated)
  token: string,                 // Unique reset token
  userId: string,                // Reference to /users/{userId}
  expires: Timestamp,            // Token expiration (1 hour)
  createdAt: Timestamp
}
```

**Indexes:**
- `token` (unique)
- Composite: `userId` (ASC) + `expires` (DESC)

**Security Rules:**
- No direct user access (system only via Cloud Functions)

**TTL:** Auto-delete after 1 hour (Firestore TTL policy)

**Estimated Size:** 200 bytes per document
**Expected Volume:** 1,000 tokens (active, pruned hourly)

---

## Collection: `/waitlist/{entryId}`

**Purpose:** Early access signups

**Document Structure:**
```typescript
{
  id: string,                    // Document ID (auto-generated)
  email: string,                 // Required, unique
  firstName?: string,            // Optional
  lastName?: string,             // Optional
  source?: string,               // Where they came from
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `email` (unique)
- `createdAt` (for chronological listing)

**Security Rules:**
- Read: Admin only
- Create: Public (for signups)

**Estimated Size:** 150 bytes per document
**Expected Volume:** 5,000 entries (Year 1)

---

## Data Migration Strategy

### Phase 1: Schema Mapping

**PostgreSQL → Firestore Mapping:**

| PostgreSQL Table | Firestore Collection | Notes |
|------------------|----------------------|-------|
| `users` | `/users` | Direct mapping |
| `players` | `/players` | Direct mapping |
| `games` | `/games` | Direct mapping |
| `email_verification_tokens` | `/emailVerificationTokens` | Camel case |
| `password_reset_tokens` | `/passwordResetTokens` | Camel case |
| `waitlist` | `/waitlist` | Direct mapping |
| `accounts` | N/A | Firebase Auth handles this |
| `sessions` | N/A | Firebase Auth handles this |
| `verification_tokens` | N/A | Firebase Auth handles this |

### Phase 2: Data Export

```bash
# Export PostgreSQL data
pg_dump -h localhost -U hustle_admin -d hustle_mvp \
  --table=users --table=players --table=games \
  --data-only --format=custom > hustle_export.dump

# Convert to JSON
pg_restore --data-only --format=custom hustle_export.dump | \
  python3 scripts/postgres_to_firestore.py
```

### Phase 3: Data Import

```javascript
// Import to Firestore using Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp();
const db = admin.firestore();

const usersData = JSON.parse(fs.readFileSync('users.json'));
const batch = db.batch();

usersData.forEach(user => {
  const ref = db.collection('users').doc(user.id);
  batch.set(ref, {
    ...user,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(user.createdAt)),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date(user.updatedAt))
  });
});

await batch.commit();
```

---

## Cost Estimation

### Firestore Pricing (Free Tier Limits)

**Free Tier:**
- Stored data: 1 GB
- Document reads: 50,000/day
- Document writes: 20,000/day
- Document deletes: 20,000/day

**Estimated Usage (Year 1):**
- Total documents: ~565,000
- Storage: ~300 MB (well under 1 GB)
- Daily reads: ~5,000 (well under 50K)
- Daily writes: ~1,000 (well under 20K)

**Conclusion:** Fits within free tier for Year 1

**At Scale (Year 2):**
- Total documents: ~2,000,000
- Storage: ~1 GB (at free tier limit)
- Daily reads: ~20,000
- Daily writes: ~5,000
- **Cost:** ~$5-10/month

---

## Performance Optimization

### Read Optimization

1. **Denormalize player name** in games collection for display
2. **Cache player stats** in player document (computed daily)
3. **Use composite indexes** for all list queries

### Write Optimization

1. **Batch writes** for game creation with stats
2. **Transaction for verification** (prevent double verification)
3. **Cloud Functions** for async operations (email, analytics)

### Query Patterns

**Get user's players:**
```javascript
db.collection('players')
  .where('parentId', '==', userId)
  .orderBy('createdAt', 'desc')
  .get()
```

**Get player's games:**
```javascript
db.collection('games')
  .where('playerId', '==', playerId)
  .orderBy('date', 'desc')
  .limit(50)
  .get()
```

**Get verified games:**
```javascript
db.collection('games')
  .where('playerId', '==', playerId)
  .where('verified', '==', true)
  .orderBy('date', 'desc')
  .get()
```

---

## Security Considerations

### Firestore Security Rules

**Key Rules:**
1. Users can only access their own data
2. Players can only be accessed by their parent
3. Games can only be accessed by the player's parent
4. Tokens are system-only (no direct access)
5. Waitlist allows public create, admin-only read

### Data Validation

**Client-side:**
- Zod schemas for all forms
- Type checking with TypeScript

**Server-side:**
- Firestore security rules validate schema
- Cloud Functions validate business logic

---

## Monitoring & Observability

### Firebase Console Dashboards

1. **Usage Dashboard:** Track reads, writes, deletes
2. **Performance Dashboard:** Query performance
3. **Security Rules:** Rule evaluation metrics

### Alerts

- Daily read/write quota approaching 80%
- Database size approaching 1 GB
- Slow queries > 1 second
- Security rule denials > 100/day

---

## Next Steps

1. ✅ Schema designed
2. ⏳ Deploy Firestore rules
3. ⏳ Deploy Firestore indexes
4. ⏳ Create migration scripts
5. ⏳ Test with sample data

---

**Document:** 170-AT-ARCH-firestore-schema-design.md
**Last Updated:** 2025-11-09T19:40:00Z
**Status:** Initial Design - Pending Deployment
