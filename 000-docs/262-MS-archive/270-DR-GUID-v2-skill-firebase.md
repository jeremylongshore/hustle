# Hustle Firebase Patterns

> **All database operations go through service layers, not direct SDK calls in components.**

---

## 🏗 Architecture

```
Components (UI)
      ↓
   Hooks (useAthletes, useGames, etc.)
      ↓
   Services (athleteService, gameService, etc.)
      ↓
   Firebase SDK (client or admin)
```

---

## 📁 File Structure

```
src/lib/firebase/
├── client.ts           # Client SDK init
├── admin.ts            # Admin SDK init
├── auth.ts             # Auth helpers
└── services/
    ├── athletes.ts     # Athlete CRUD
    ├── games.ts        # Game CRUD
    ├── workouts.ts     # Dream Gym workouts
    ├── users.ts        # User profiles
    └── workspaces.ts   # Billing/subscriptions
```

---

## 🗄 Firestore Collections

```
users/{userId}
  - email, firstName, lastName, phone
  - isParentGuardian, planId, stripeCustomerId
  - createdAt, updatedAt

users/{userId}/athletes/{athleteId}
  - name, birthday, gender, position
  - secondaryPositions[], team, league
  - photoUrl, createdAt, updatedAt

users/{userId}/athletes/{athleteId}/games/{gameId}
  - date, opponent, result, score
  - goals, assists, minutes, position
  - verified, verificationData
  - createdAt

users/{userId}/athletes/{athleteId}/dreamGym/
  ├── profile (onboarding data)
  ├── schedule/{weekId}
  ├── workouts/{workoutId}
  ├── cardio/{cardioId}
  ├── mental/{entryId}
  ├── assessments/{assessmentId}
  └── practices/{practiceId}

workspaces/{workspaceId}
  - ownerId, planId, status
  - stripeSubscriptionId
  - currentPeriodStart, currentPeriodEnd
  - athleteCount, gamesThisMonth
```

---

## 📝 Service Pattern

### Basic CRUD Service

```typescript
// src/lib/firebase/services/athletes.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../client';

const COLLECTION = 'athletes';

function getAthletesCollection(userId: string) {
  return collection(db, 'users', userId, COLLECTION);
}

export const athleteService = {
  // Get all athletes for a user
  async getAll(userId: string) {
    const q = query(
      getAthletesCollection(userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Get single athlete
  async getById(userId: string, athleteId: string) {
    const docRef = doc(db, 'users', userId, COLLECTION, athleteId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() };
  },

  // Create athlete
  async create(userId: string, data: CreateAthleteData) {
    const docRef = await addDoc(getAthletesCollection(userId), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Update athlete
  async update(userId: string, athleteId: string, data: Partial<AthleteData>) {
    const docRef = doc(db, 'users', userId, COLLECTION, athleteId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete athlete
  async delete(userId: string, athleteId: string) {
    const docRef = doc(db, 'users', userId, COLLECTION, athleteId);
    await deleteDoc(docRef);
  },
};
```

---

## 🪝 Hook Pattern

```typescript
// src/hooks/useAthletes.ts
'use client';

import { useState, useEffect } from 'react';
import { athleteService } from '@/lib/firebase/services/athletes';
import { useAuth } from './useAuth';

export function useAthletes() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setAthletes([]);
      setLoading(false);
      return;
    }

    const fetchAthletes = async () => {
      try {
        setLoading(true);
        const data = await athleteService.getAll(user.uid);
        setAthletes(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [user]);

  const addAthlete = async (data: CreateAthleteData) => {
    if (!user) throw new Error('Not authenticated');
    const id = await athleteService.create(user.uid, data);
    const newAthlete = { id, ...data };
    setAthletes(prev => [newAthlete, ...prev]);
    return id;
  };

  const updateAthlete = async (id: string, data: Partial<AthleteData>) => {
    if (!user) throw new Error('Not authenticated');
    await athleteService.update(user.uid, id, data);
    setAthletes(prev => 
      prev.map(a => a.id === id ? { ...a, ...data } : a)
    );
  };

  const deleteAthlete = async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    await athleteService.delete(user.uid, id);
    setAthletes(prev => prev.filter(a => a.id !== id));
  };

  return {
    athletes,
    loading,
    error,
    addAthlete,
    updateAthlete,
    deleteAthlete,
  };
}
```

---

## 🔄 Real-time Subscriptions

```typescript
// For real-time updates (e.g., notifications)
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';

export function useRealtimeGames(userId: string, athleteId: string) {
  const [games, setGames] = useState<Game[]>([]);
  
  useEffect(() => {
    const q = query(
      collection(db, 'users', userId, 'athletes', athleteId, 'games'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGames(gamesData);
    });

    return () => unsubscribe();
  }, [userId, athleteId]);

  return games;
}
```

---

## 📤 File Upload (Storage)

```typescript
// src/lib/firebase/services/storage.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../client';

export const storageService = {
  async uploadPlayerPhoto(
    userId: string, 
    athleteId: string, 
    file: File
  ): Promise<string> {
    const fileRef = ref(
      storage, 
      `users/${userId}/athletes/${athleteId}/photo.${file.name.split('.').pop()}`
    );
    
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    
    return downloadUrl;
  },

  async deletePlayerPhoto(userId: string, athleteId: string) {
    const fileRef = ref(storage, `users/${userId}/athletes/${athleteId}/photo`);
    await deleteObject(fileRef);
  },
};
```

### Upload Hook

```typescript
// src/hooks/usePlayerPhotoUpload.ts
export function usePlayerPhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadPhoto = async (
    userId: string,
    athleteId: string,
    file: File
  ): Promise<string> => {
    setUploading(true);
    setProgress(0);

    try {
      const url = await storageService.uploadPlayerPhoto(userId, athleteId, file);
      setProgress(100);
      return url;
    } finally {
      setUploading(false);
    }
  };

  return { uploadPhoto, uploading, progress };
}
```

---

## 🔐 Server-Side Operations (Admin SDK)

Use admin SDK in API routes for secure operations:

```typescript
// src/app/api/athletes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/firebase/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const snapshot = await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('athletes')
      .orderBy('createdAt', 'desc')
      .get();

    const athletes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(athletes);

  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

---

## 📊 Aggregation Queries

```typescript
// Get game stats for an athlete
async function getAthleteStats(userId: string, athleteId: string) {
  const gamesRef = collection(db, 'users', userId, 'athletes', athleteId, 'games');
  const snapshot = await getDocs(gamesRef);
  
  const stats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    goals: 0,
    assists: 0,
    minutes: 0,
  };

  snapshot.docs.forEach(doc => {
    const game = doc.data();
    stats.totalGames++;
    stats.goals += game.goals || 0;
    stats.assists += game.assists || 0;
    stats.minutes += game.minutes || 0;
    
    if (game.result === 'win') stats.wins++;
    if (game.result === 'loss') stats.losses++;
    if (game.result === 'draw') stats.draws++;
  });

  stats.winRate = stats.totalGames > 0 
    ? Math.round((stats.wins / stats.totalGames) * 100) 
    : 0;

  return stats;
}
```

---

## 🔒 Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Athletes subcollection
      match /athletes/{athleteId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Games subcollection
        match /games/{gameId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        // Dream Gym subcollections
        match /dreamGym/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    
    // Workspaces (billing)
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
      // Write only through Cloud Functions
      allow write: if false;
    }
  }
}
```

---

## 🚫 Avoid

- Direct Firestore calls in components
- Mixing client and admin SDK in same file
- Storing sensitive data client-side
- Unbounded queries (always use limits)
- Ignoring error handling

---

## ✅ Do

- Use service layer for all DB operations
- Use admin SDK in API routes
- Add proper TypeScript types
- Handle loading and error states
- Use optimistic updates for better UX
- Index frequently queried fields

---

*Structure data well, query efficiently* 🔥
