# Simple Firebase Migration - Step 1
## Hustle: PostgreSQL → Firebase/Firestore (No Agents)

**Date:** 2025-11-10T09:30:00Z
**Status:** Ready to Execute
**Timeline:** 1 Week
**Complexity:** Low

---

## EXECUTIVE SUMMARY

**What We're Doing:**
- Move from PostgreSQL → Firestore
- Replace NextAuth v5 → Firebase Auth
- Keep everything else the same (Next.js, React, UI)
- Deploy to Firebase Hosting (ready for phone app later)

**What We're NOT Doing:**
- ❌ NO AI agents
- ❌ NO A2A protocol
- ❌ NO Vertex AI
- ❌ NO fancy orchestration
- ❌ NO Cloud Functions (yet)

**Why This Is Simple:**
- Firebase Auth is a drop-in replacement for NextAuth
- Your data model already maps 1:1 to Firestore
- Everything stays client-side (Next.js app)

---

## CURRENT STATE

**What You Have:**
```
Next.js 15 App
    ↓
NextAuth v5 (email/password)
    ↓
PostgreSQL Database
    ↓
Prisma ORM
```

**9 Database Tables:**
1. User (parent accounts)
2. Player (kids)
3. Game (stats)
4. Account (NextAuth)
5. Session (NextAuth)
6. PasswordResetToken
7. EmailVerificationToken
8. VerificationToken
9. Waitlist

---

## TARGET STATE

**What You'll Have:**
```
Next.js 15 App
    ↓
Firebase Auth (email/password)
    ↓
Firestore Database
    ↓
Firebase SDK (no ORM needed)
```

**3 Firestore Collections:**
1. `users` (parent accounts + all user data)
2. `players` (subcollection under users)
3. `games` (subcollection under players)
4. `waitlist` (root collection)

**What Happens to Other Tables:**
- Account, Session, VerificationToken → **Deleted** (Firebase Auth handles this)
- PasswordResetToken → **Deleted** (Firebase Auth has built-in password reset)
- EmailVerificationToken → **Deleted** (Firebase Auth has built-in email verification)

---

## MIGRATION STEPS (1 WEEK)

### Day 1: Setup Firebase Project

**1. Create Firebase Project**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new Firebase project (or use existing)
firebase projects:create hustleapp-firebase

# Initialize Firebase in your project
cd /home/jeremy/000-projects/hustle
firebase init

# Select these services:
# ✓ Firestore (rules and indexes)
# ✓ Authentication
# ✓ Hosting
# ✓ Storage (for player photos later)
```

**2. Install Firebase SDKs**
```bash
# Frontend Firebase SDK
npm install firebase

# Firebase Admin SDK (for server-side operations)
npm install firebase-admin

# Remove old dependencies (LATER, after migration works)
# npm uninstall @prisma/client prisma next-auth bcrypt
```

**3. Configure Firebase in Next.js**
```typescript
// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**4. Add Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

### Day 2: Design Firestore Schema

**Firestore Collections Structure:**

```
/users/{userId}
  - firstName: string
  - lastName: string
  - email: string
  - phone: string
  - emailVerified: boolean
  - agreedToTerms: boolean
  - agreedToPrivacy: boolean
  - isParentGuardian: boolean
  - verificationPinHash: string
  - createdAt: timestamp
  - updatedAt: timestamp

  /players/{playerId} (SUBCOLLECTION)
    - name: string
    - birthday: timestamp
    - position: string
    - teamClub: string
    - photoUrl: string
    - createdAt: timestamp
    - updatedAt: timestamp

    /games/{gameId} (SUBCOLLECTION)
      - date: timestamp
      - opponent: string
      - result: string
      - finalScore: string
      - minutesPlayed: number
      - goals: number
      - assists: number
      - tackles: number
      - interceptions: number
      - clearances: number
      - blocks: number
      - aerialDuelsWon: number
      - saves: number
      - goalsAgainst: number
      - cleanSheet: boolean
      - verified: boolean
      - verifiedAt: timestamp
      - createdAt: timestamp
      - updatedAt: timestamp

/waitlist/{waitlistId}
  - email: string
  - firstName: string
  - lastName: string
  - source: string
  - createdAt: timestamp
```

**Why This Works:**
- ✅ Hierarchical structure: users → players → games
- ✅ Automatic security: users can only access their own data
- ✅ No foreign keys needed (Firestore uses paths)
- ✅ Real-time updates (bonus feature for free)

**Firestore Security Rules:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // Players subcollection
      match /players/{playerId} {
        allow read, write: if isOwner(userId);

        // Games subcollection
        match /games/{gameId} {
          allow read, write: if isOwner(userId);
        }
      }
    }

    // Waitlist is write-only for new signups
    match /waitlist/{email} {
      allow create: if true;  // Anyone can join waitlist
      allow read, update, delete: if false;  // Admin only (via Firebase Admin SDK)
    }
  }
}
```

**Firestore Indexes:**
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "verified", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "players",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

### Day 3: Replace NextAuth with Firebase Auth

**1. Create Firebase Auth Service**
```typescript
// src/lib/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, firstName: string, lastName: string, phone: string) {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update display name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    // 3. Send email verification
    await sendEmailVerification(user);

    // 4. Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      firstName,
      lastName,
      email,
      phone,
      emailVerified: false,
      agreedToTerms: true,
      agreedToPrivacy: true,
      isParentGuardian: true,
      verificationPinHash: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return user;
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error('Please verify your email before logging in. Check your inbox.');
    }

    return user;
  },

  // Sign out
  async signOut() {
    return firebaseSignOut(auth);
  },

  // Send password reset email
  async resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  },

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Get ID token for API calls
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }
};
```

**2. Update Registration Page**
```typescript
// src/app/register/page.tsx (simplified example)
'use client';

import { useState } from 'react';
import { authService } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phone = formData.get('phone') as string;

    try {
      await authService.signUp(email, password, firstName, lastName, phone);
      router.push('/verify-email');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your existing form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

**3. Update Login Page**
```typescript
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { authService } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await authService.signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your existing form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

**4. Create Auth Context Provider**
```typescript
// src/components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/lib/firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**5. Wrap App in Auth Provider**
```typescript
// src/app/layout.tsx
import { AuthProvider } from '@/components/providers/auth-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

### Day 4: Create Firestore Service Layer

**1. Users Service**
```typescript
// src/lib/firebase/services/users.ts
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
  verificationPinHash: string | null;
  createdAt: any;
  updatedAt: any;
}

export const usersService = {
  async getById(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as User;
  },

  async update(userId: string, data: Partial<User>) {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};
```

**2. Players Service**
```typescript
// src/lib/firebase/services/players.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config';

export interface Player {
  id: string;
  name: string;
  birthday: any;
  position: string;
  teamClub: string;
  photoUrl: string | null;
  createdAt: any;
  updatedAt: any;
}

export const playersService = {
  async getAll(userId: string): Promise<Player[]> {
    const playersRef = collection(db, `users/${userId}/players`);
    const q = query(playersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Player[];
  },

  async getById(userId: string, playerId: string): Promise<Player | null> {
    const docRef = doc(db, `users/${userId}/players`, playerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as Player;
  },

  async create(userId: string, data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) {
    const playersRef = collection(db, `users/${userId}/players`);
    const docRef = await addDoc(playersRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async update(userId: string, playerId: string, data: Partial<Player>) {
    const docRef = doc(db, `users/${userId}/players`, playerId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(userId: string, playerId: string) {
    const docRef = doc(db, `users/${userId}/players`, playerId);
    await deleteDoc(docRef);
  },
};
```

**3. Games Service**
```typescript
// src/lib/firebase/services/games.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config';

export interface Game {
  id: string;
  date: any;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  finalScore: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  tackles: number | null;
  interceptions: number | null;
  clearances: number | null;
  blocks: number | null;
  aerialDuelsWon: number | null;
  saves: number | null;
  goalsAgainst: number | null;
  cleanSheet: boolean | null;
  verified: boolean;
  verifiedAt: any;
  createdAt: any;
  updatedAt: any;
}

export const gamesService = {
  async getAll(userId: string, playerId: string): Promise<Game[]> {
    const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
    const q = query(gamesRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Game[];
  },

  async getVerified(userId: string, playerId: string): Promise<Game[]> {
    const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
    const q = query(
      gamesRef,
      where('verified', '==', true),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Game[];
  },

  async getById(userId: string, playerId: string, gameId: string): Promise<Game | null> {
    const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as Game;
  },

  async create(userId: string, playerId: string, data: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) {
    const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
    const docRef = await addDoc(gamesRef, {
      ...data,
      verified: false,
      verifiedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async update(userId: string, playerId: string, gameId: string, data: Partial<Game>) {
    const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async verify(userId: string, playerId: string, gameId: string) {
    const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
    await updateDoc(docRef, {
      verified: true,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async delete(userId: string, playerId: string, gameId: string) {
    const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
    await deleteDoc(docRef);
  },
};
```

---

### Day 5: Update API Routes

**OPTION 1: Keep API Routes (Recommended for Now)**

Update your existing API routes to use Firestore instead of Prisma:

```typescript
// src/app/api/players/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { playersService } from '@/lib/firebase/services/players';
import { authService } from '@/lib/firebase/auth';

export async function GET(request: NextRequest) {
  // Get current user
  const user = authService.getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const players = await playersService.getAll(user.uid);
    return NextResponse.json({ players });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = authService.getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const playerId = await playersService.create(user.uid, data);

    return NextResponse.json({ id: playerId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**OPTION 2: Go Fully Client-Side (Simpler)**

Remove API routes entirely and call Firestore directly from components:

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { playersService } from '@/lib/firebase/services/players';

export default function DashboardPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadPlayers() {
      const data = await playersService.getAll(user.uid);
      setPlayers(data);
      setLoading(false);
    }

    loadPlayers();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Players</h1>
      {players.map(player => (
        <div key={player.id}>{player.name}</div>
      ))}
    </div>
  );
}
```

---

### Day 6: Data Migration

**1. Export Data from PostgreSQL**
```typescript
// scripts/export-postgres-data.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  // Export all users with their players and games
  const users = await prisma.user.findMany({
    include: {
      players: {
        include: {
          games: true
        }
      }
    }
  });

  fs.writeFileSync('migration-data.json', JSON.stringify(users, null, 2));
  console.log(`Exported ${users.length} users`);
}

exportData();
```

**2. Import Data to Firestore**
```typescript
// scripts/import-to-firestore.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  // Your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importData() {
  const data = JSON.parse(fs.readFileSync('migration-data.json', 'utf-8'));

  for (const user of data) {
    console.log(`Importing user: ${user.email}`);

    // Create user document
    await setDoc(doc(db, 'users', user.id), {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      emailVerified: user.emailVerified !== null,
      agreedToTerms: user.agreedToTerms,
      agreedToPrivacy: user.agreedToPrivacy,
      isParentGuardian: user.isParentGuardian,
      verificationPinHash: user.verificationPinHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // Import players for this user
    for (const player of user.players) {
      const playerRef = doc(db, `users/${user.id}/players`, player.id);

      await setDoc(playerRef, {
        name: player.name,
        birthday: player.birthday,
        position: player.position,
        teamClub: player.teamClub,
        photoUrl: player.photoUrl,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
      });

      // Import games for this player
      const batch = writeBatch(db);
      for (const game of player.games) {
        const gameRef = doc(db, `users/${user.id}/players/${player.id}/games`, game.id);
        batch.set(gameRef, {
          date: game.date,
          opponent: game.opponent,
          result: game.result,
          finalScore: game.finalScore,
          minutesPlayed: game.minutesPlayed,
          goals: game.goals,
          assists: game.assists,
          tackles: game.tackles,
          interceptions: game.interceptions,
          clearances: game.clearances,
          blocks: game.blocks,
          aerialDuelsWon: game.aerialDuelsWon,
          saves: game.saves,
          goalsAgainst: game.goalsAgainst,
          cleanSheet: game.cleanSheet,
          verified: game.verified,
          verifiedAt: game.verifiedAt,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        });
      }
      await batch.commit();

      console.log(`  Imported ${player.games.length} games for player ${player.name}`);
    }
  }

  console.log('Migration complete!');
}

importData();
```

**3. Migrate User Passwords**

**Problem:** Firebase Auth uses a different password hash than bcrypt.

**Solution:** Lazy migration - on first login:
```typescript
// src/lib/firebase/legacy-migration.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authService } from './firebase/auth';

const prisma = new PrismaClient();

export async function tryLegacyLogin(email: string, password: string) {
  // Check if user exists in old database
  const oldUser = await prisma.user.findUnique({
    where: { email }
  });

  if (!oldUser || !oldUser.password) {
    return null;  // Not a legacy user
  }

  // Verify old password with bcrypt
  const isValid = await bcrypt.compare(password, oldUser.password);

  if (!isValid) {
    return null;  // Wrong password
  }

  // Password is correct! Create Firebase Auth user with same password
  try {
    const user = await authService.signUp(
      email,
      password,  // Use same password
      oldUser.firstName,
      oldUser.lastName,
      oldUser.phone || ''
    );

    // Delete old user from PostgreSQL
    await prisma.user.delete({ where: { id: oldUser.id } });

    return user;
  } catch (error) {
    console.error('Failed to migrate user:', error);
    return null;
  }
}
```

---

### Day 7: Deploy to Firebase Hosting

**1. Build Next.js for Static Export**
```bash
# Build Next.js app
npm run build

# Test locally
npm start
```

**2. Deploy to Firebase**
```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy hosting
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

**3. Configure Custom Domain (Optional)**
```bash
firebase hosting:channel:deploy production
```

**4. Test Production**
- Visit your Firebase Hosting URL
- Test sign up
- Test login
- Test adding player
- Test logging game

---

## WHAT CHANGES IN YOUR CODE

### Files to DELETE (After Migration Works)
```
src/lib/auth.ts (NextAuth config)
src/lib/prisma.ts
prisma/
node_modules/@prisma/
node_modules/next-auth/
```

### Files to CREATE
```
src/lib/firebase/config.ts (Firebase init)
src/lib/firebase/auth.ts (Auth service)
src/lib/firebase/services/users.ts
src/lib/firebase/services/players.ts
src/lib/firebase/services/games.ts
src/components/providers/auth-provider.tsx
firestore.rules
firestore.indexes.json
firebase.json
.firebaserc
```

### Files to UPDATE
```
src/app/register/page.tsx (use authService)
src/app/login/page.tsx (use authService)
src/app/dashboard/page.tsx (use playersService)
src/app/api/* (replace Prisma with Firestore services)
.env.local (add Firebase env vars)
```

---

## TESTING CHECKLIST

**Before Migration:**
- [ ] Backup PostgreSQL database
- [ ] Export all user data to JSON
- [ ] Document current user count
- [ ] Take screenshots of working app

**After Migration:**
- [ ] New user can sign up
- [ ] New user receives verification email
- [ ] User can verify email
- [ ] User can log in
- [ ] User can create player
- [ ] User can log game
- [ ] User can view dashboard
- [ ] User can log out
- [ ] Forgot password works
- [ ] All migrated users can log in
- [ ] All player data is visible
- [ ] All game stats are correct

---

## ROLLBACK PLAN

If something goes wrong:

1. **Keep PostgreSQL Running**
   - Don't delete PostgreSQL until migration is confirmed working
   - Keep old code in a Git branch

2. **Quick Rollback**
   ```bash
   git checkout main  # Old working code
   docker-compose up -d postgres  # Restart PostgreSQL
   npm run dev
   ```

3. **Gradual Rollout**
   - Test with 1-2 users first
   - Verify everything works
   - Migrate rest of users

---

## COST COMPARISON

### Current (PostgreSQL on Cloud SQL)
- Cloud SQL db-f1-micro: **$40/month**
- Cloud Run: **$20/month**
- **Total: $60/month**

### After (Firebase)
- Firebase Hosting: **FREE** (10GB/month)
- Firestore: **FREE** (1GB storage, 50K reads/day)
- Firebase Auth: **FREE** (unlimited users)
- **Total: $0/month** (until you exceed free tier)

**Savings: $60/month = $720/year**

---

## TIMELINE

```
Day 1: Setup Firebase project ✓
Day 2: Design Firestore schema ✓
Day 3: Replace NextAuth with Firebase Auth ✓
Day 4: Create Firestore service layer ✓
Day 5: Update API routes ✓
Day 6: Migrate data ✓
Day 7: Deploy and test ✓
```

**Total: 7 days**

---

## NEXT STEPS (AFTER MIGRATION)

Once Firebase migration is complete, you can add:

1. **Real-time Updates** (Firestore realtime listeners)
2. **Photo Uploads** (Firebase Storage)
3. **Push Notifications** (Firebase Cloud Messaging)
4. **Phone App** (React Native + Firebase SDK)

**But for now: Just migrate. Keep it simple.**

---

## SUMMARY

**What You're Doing:**
- Replacing PostgreSQL with Firestore
- Replacing NextAuth with Firebase Auth
- Keeping everything else the same

**Why It's Easy:**
- Your data model maps 1:1 to Firestore
- Firebase Auth is a drop-in NextAuth replacement
- No fancy AI stuff - just a database swap

**Timeline:** 1 week

**Cost:** $0/month (vs $60/month now)

**Ready to start?** Let's do Day 1.

---

**Document:** 178-PP-PLAN-simple-firebase-migration.md
**Status:** Ready to Execute
**Next Action:** Create Firebase project

**Date:** 2025-11-10T09:30:00Z
