# React Native Mobile Architecture Plan - Hustle

**Document ID**: 256-RN-ARCH-react-native-mobile-architecture
**Created**: 2025-12-13
**Status**: Planning
**Platform**: iOS & Android
**Live Web**: https://hustlestats.io

---

## Executive Summary

Comprehensive architecture plan for building native iOS and Android apps for Hustle - a youth soccer statistics tracking platform. This plan reuses existing Firebase/Firestore backend, TypeScript types, validation schemas, and business logic while building a native mobile experience.

**Key Decision**: Use Expo (managed workflow) for rapid development, excellent developer experience, and simplified deployment to both app stores.

---

## 1. React Native Setup

### 1.1 Expo vs Bare React Native

**RECOMMENDATION: Expo SDK 52 (Managed Workflow)**

**Rationale**:
- Firebase integration fully supported via `@react-native-firebase/app`
- Expo Router (file-based routing) similar to Next.js App Router
- EAS Build handles native builds without needing macOS/Xcode locally
- Over-the-air updates for bug fixes without app store review
- Excellent developer experience with TypeScript
- Can eject to bare workflow later if needed (unlikely)

**Version**: Expo SDK 52 (React Native 0.76.x)

### 1.2 Initial Setup Commands

```bash
# Create new Expo app in mobile/ directory
cd /home/jeremy/000-projects/hustle
npx create-expo-app@latest mobile --template expo-template-blank-typescript

# Install dependencies
cd mobile
npm install

# Install Expo Router (file-based navigation)
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Install Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# Install UI libraries
npm install react-native-paper react-native-vector-icons
npm install @react-navigation/native @react-navigation/stack

# Install state management
npm install zustand @tanstack/react-query

# Install forms & validation
npm install react-hook-form @hookform/resolvers zod

# Install utilities
npm install date-fns async-storage/async-storage
npm install expo-image-picker expo-camera
npm install react-native-mmkv # Fast key-value storage for offline queue

# Install dev dependencies
npm install --save-dev @types/react @types/react-native
```

---

## 2. Project Structure

```
hustle/
├── mobile/                          # NEW: React Native app
│   ├── app/                        # Expo Router (file-based routing)
│   │   ├── (auth)/                # Auth group (login, signup, forgot-password)
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (tabs)/                # Main app tabs (authenticated)
│   │   │   ├── _layout.tsx        # Tab navigation layout
│   │   │   ├── index.tsx          # Dashboard (home)
│   │   │   ├── players.tsx        # Players list
│   │   │   ├── add-game.tsx       # Quick add game
│   │   │   └── settings.tsx       # User settings
│   │   ├── player/                # Player detail stack
│   │   │   ├── [id].tsx           # Player detail screen
│   │   │   └── edit/[id].tsx      # Edit player screen
│   │   ├── game/                  # Game stack
│   │   │   ├── [id].tsx           # Game detail screen
│   │   │   └── edit/[id].tsx      # Edit game screen
│   │   ├── _layout.tsx            # Root layout
│   │   └── +not-found.tsx         # 404 screen
│   ├── src/
│   │   ├── components/            # React Native components
│   │   │   ├── ui/               # Shared UI (Button, Card, Input)
│   │   │   ├── players/          # Player-specific components
│   │   │   ├── games/            # Game-specific components
│   │   │   └── common/           # Common components (Header, Loading)
│   │   ├── lib/
│   │   │   ├── firebase/         # REUSED: Firebase services
│   │   │   ├── validations/      # REUSED: Zod schemas
│   │   │   └── utils/            # REUSED: Utility functions
│   │   ├── types/                # REUSED: TypeScript types
│   │   ├── hooks/                # React Native hooks
│   │   │   ├── useAuth.ts       # ADAPTED: Firebase auth hook
│   │   │   ├── usePlayers.ts    # React Query for players
│   │   │   ├── useGames.ts      # React Query for games
│   │   │   └── useOfflineSync.ts # Offline queue management
│   │   ├── store/                # Zustand stores
│   │   │   ├── authStore.ts     # Auth state
│   │   │   ├── offlineStore.ts  # Offline queue state
│   │   │   └── settingsStore.ts # App settings
│   │   ├── services/             # Business logic
│   │   │   ├── offline-queue.ts # Offline sync service
│   │   │   └── analytics.ts     # Firebase Analytics
│   │   └── constants/            # Theme, colors, sizes
│   ├── assets/                   # Images, fonts, icons
│   ├── app.json                  # Expo configuration
│   ├── eas.json                  # EAS Build configuration
│   ├── package.json
│   └── tsconfig.json
├── src/                           # EXISTING: Next.js web app (unchanged)
├── functions/                     # EXISTING: Cloud Functions (unchanged)
├── vertex-agents/                 # EXISTING: AI agents (unchanged)
└── 000-docs/                      # Documentation
```

---

## 3. Navigation Structure

### 3.1 Expo Router File-Based Navigation

Expo Router uses file-based routing similar to Next.js App Router. Navigation is automatic based on file structure.

**Root Layout** (`app/_layout.tsx`):
```typescript
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Tab Navigation** (`app/(tabs)/_layout.tsx`):
```typescript
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-game"
        options={{
          title: 'Add Game',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-circle" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 3.2 Navigation Patterns

**Dynamic Routes**:
- `/player/[id]` - Player detail screen
- `/game/[id]` - Game detail screen
- `/player/edit/[id]` - Edit player screen

**Navigation Examples**:
```typescript
import { router } from 'expo-router';

// Navigate to player detail
router.push(`/player/${playerId}`);

// Navigate back
router.back();

// Replace current route (after login)
router.replace('/(tabs)');
```

---

## 4. State Management Strategy

### 4.1 Multi-Layer State Architecture

**Layer 1: Server State (React Query)**
- Fetching, caching, and synchronizing Firestore data
- Automatic background refetching
- Optimistic updates
- Query invalidation

**Layer 2: Client State (Zustand)**
- Auth state (user, workspace)
- Offline queue
- App settings (theme, notifications)
- UI state (modals, filters)

**Layer 3: Form State (React Hook Form)**
- Player forms
- Game forms
- Settings forms

### 4.2 React Query Configuration

**Setup** (`src/lib/react-query.ts`):
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

**Usage Example** (`src/hooks/usePlayers.ts`):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '@/lib/firebase/services/players';
import { useAuth } from './useAuth';

export function usePlayers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch players
  const playersQuery = useQuery({
    queryKey: ['players', user?.uid],
    queryFn: () => getPlayers(user!.uid),
    enabled: !!user,
  });

  // Create player mutation
  const createPlayerMutation = useMutation({
    mutationFn: (data: PlayerFormData) => createPlayer(user!.uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', user?.uid] });
    },
  });

  return {
    players: playersQuery.data ?? [],
    isLoading: playersQuery.isLoading,
    error: playersQuery.error,
    createPlayer: createPlayerMutation.mutateAsync,
  };
}
```

### 4.3 Zustand Stores

**Auth Store** (`src/store/authStore.ts`):
```typescript
import { create } from 'zustand';
import { User as FirebaseUser } from '@react-native-firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
```

**Offline Queue Store** (`src/store/offlineStore.ts`):
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineAction {
  id: string;
  type: 'create_game' | 'update_game' | 'delete_game' | 'create_player' | 'update_player';
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  queue: OfflineAction[];
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  incrementRetry: (id: string) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      addToQueue: (action) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...action,
              id: `${Date.now()}_${Math.random()}`,
              timestamp: Date.now(),
              retryCount: 0,
            },
          ],
        })),
      removeFromQueue: (id) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        })),
      clearQueue: () => set({ queue: [] }),
      incrementRetry: (id) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
          ),
        })),
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## 5. Firebase Integration

### 5.1 Package Choice: @react-native-firebase

**RECOMMENDATION: @react-native-firebase/app (NOT Firebase JS SDK)**

**Rationale**:
- Native modules for better performance (especially auth, analytics, crashlytics)
- Offline persistence built-in for Firestore
- Push notifications support (FCM)
- Better background task support
- Industry standard for React Native

**Trade-off**: Requires native builds (handled by EAS Build, not a concern with Expo)

### 5.2 Firebase Configuration

**File**: `mobile/app.json` (Expo config)
```json
{
  "expo": {
    "name": "Hustle Stats",
    "slug": "hustle-stats",
    "scheme": "hustlestats",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "io.hustlestats.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "io.hustlestats.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/firestore"
    ]
  }
}
```

**Firebase Initialization** (`src/lib/firebase/config.ts`):
```typescript
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Enable offline persistence (automatic with @react-native-firebase)
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

export { auth, firestore };
```

### 5.3 Reusable Firebase Services

**Strategy**: Adapt existing web services to use React Native Firebase SDK

**Web Service** (`src/lib/firebase/services/players.ts` - EXISTING):
```typescript
// Uses Firebase JS SDK (web)
import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from '../config';
```

**Mobile Service** (`mobile/src/lib/firebase/services/players.ts` - NEW):
```typescript
// Uses React Native Firebase SDK (native)
import firestore from '@react-native-firebase/firestore';
import type { Player, PlayerDocument } from '@/types/firestore';

function toPlayer(id: string, data: FirebaseFirestoreTypes.DocumentData): Player {
  const playerDoc = data as PlayerDocument;
  return {
    id,
    ...playerDoc,
    birthday: playerDoc.birthday.toDate(),
    createdAt: playerDoc.createdAt.toDate(),
    updatedAt: playerDoc.updatedAt.toDate(),
  };
}

export async function getPlayers(userId: string): Promise<Player[]> {
  const snapshot = await firestore()
    .collection(`users/${userId}/players`)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => toPlayer(doc.id, doc.data()));
}

export async function createPlayer(userId: string, data: CreatePlayerData): Promise<Player> {
  const docRef = await firestore()
    .collection(`users/${userId}/players`)
    .add({
      ...data,
      birthday: firestore.Timestamp.fromDate(data.birthday),
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

  const doc = await docRef.get();
  return toPlayer(doc.id, doc.data()!);
}
```

**Reusable Parts** (100% compatible):
- `src/types/firestore.ts` - All TypeScript types
- `src/lib/validations/player.ts` - Zod schemas
- `src/lib/validations/game-schema.ts` - Zod schemas
- Business logic functions (age calculation, stats aggregation)

---

## 6. Offline-First Strategy

### 6.1 Architecture Overview

```
User Action (offline)
  ↓
Add to Offline Queue (MMKV storage)
  ↓
Show Optimistic UI Update
  ↓
Network Reconnects
  ↓
Process Queue (FIFO)
  ↓
Sync to Firestore
  ↓
Update React Query Cache
  ↓
Remove from Queue
```

### 6.2 Offline Queue Implementation

**Queue Service** (`src/services/offline-queue.ts`):
```typescript
import { useOfflineStore } from '@/store/offlineStore';
import { createGame, updateGame, deleteGame } from '@/lib/firebase/services/games';
import { createPlayer, updatePlayer } from '@/lib/firebase/services/players';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 20;

export class OfflineQueueService {
  private queryClient: ReturnType<typeof useQueryClient>;
  private isProcessing = false;

  constructor(queryClient: ReturnType<typeof useQueryClient>) {
    this.queryClient = queryClient;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async addAction(action: OfflineAction) {
    const { queue, addToQueue } = useOfflineStore.getState();

    if (queue.length >= MAX_QUEUE_SIZE) {
      throw new Error('Offline queue is full (max 20 entries). Please sync when online.');
    }

    addToQueue(action);

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const { queue, removeFromQueue, incrementRetry } = useOfflineStore.getState();

    for (const action of queue) {
      try {
        await this.executeAction(action);
        removeFromQueue(action.id);

        // Invalidate relevant queries
        this.queryClient.invalidateQueries({ queryKey: this.getQueryKey(action) });
      } catch (error) {
        console.error('Failed to process offline action:', error);

        if (action.retryCount >= MAX_RETRIES) {
          // Remove from queue after max retries
          removeFromQueue(action.id);
          // TODO: Log to analytics or show error to user
        } else {
          incrementRetry(action.id);
        }
      }
    }

    this.isProcessing = false;
  }

  private async executeAction(action: OfflineAction) {
    switch (action.type) {
      case 'create_game':
        await createGame(action.payload.userId, action.payload.playerId, action.payload.data);
        break;
      case 'update_game':
        await updateGame(
          action.payload.userId,
          action.payload.playerId,
          action.payload.gameId,
          action.payload.data
        );
        break;
      case 'delete_game':
        await deleteGame(action.payload.userId, action.payload.playerId, action.payload.gameId);
        break;
      case 'create_player':
        await createPlayer(action.payload.userId, action.payload.data);
        break;
      case 'update_player':
        await updatePlayer(action.payload.userId, action.payload.playerId, action.payload.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private getQueryKey(action: OfflineAction): string[] {
    if (action.type.includes('game')) {
      return ['games', action.payload.userId, action.payload.playerId];
    }
    return ['players', action.payload.userId];
  }
}
```

**Hook for Offline Actions** (`src/hooks/useOfflineSync.ts`):
```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineStore } from '@/store/offlineStore';
import { OfflineQueueService } from '@/services/offline-queue';

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { queue } = useOfflineStore();

  useEffect(() => {
    const service = new OfflineQueueService(queryClient);
    return () => {
      // Cleanup if needed
    };
  }, [queryClient]);

  return {
    queueSize: queue.length,
    isQueueFull: queue.length >= 20,
  };
}
```

### 6.3 Optimistic UI Updates

**Example: Create Game Offline**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineStore } from '@/store/offlineStore';
import { useAuth } from './useAuth';
import NetInfo from '@react-native-community/netinfo';

export function useCreateGame(playerId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToQueue } = useOfflineStore();

  return useMutation({
    mutationFn: async (data: GameFormData) => {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        // Offline: Add to queue and show optimistic update
        const tempGame = {
          id: `temp_${Date.now()}`,
          ...data,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistic update
        queryClient.setQueryData(['games', user?.uid, playerId], (old: Game[]) => [
          tempGame,
          ...(old || []),
        ]);

        // Add to offline queue
        addToQueue({
          type: 'create_game',
          payload: { userId: user!.uid, playerId, data },
        });

        return tempGame;
      }

      // Online: Create immediately
      return createGame(user!.uid, playerId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', user?.uid, playerId] });
    },
  });
}
```

---

## 7. Key Libraries & Versions

### 7.1 Core Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",

    "@react-native-firebase/app": "^21.5.0",
    "@react-native-firebase/auth": "^21.5.0",
    "@react-native-firebase/firestore": "^21.5.0",
    "@react-native-firebase/analytics": "^21.5.0",
    "@react-native-firebase/crashlytics": "^21.5.0",

    "@tanstack/react-query": "^5.62.3",
    "zustand": "^5.0.8",
    "react-hook-form": "^7.64.0",
    "@hookform/resolvers": "^5.2.2",
    "zod": "^4.1.11",

    "react-native-paper": "^5.15.8",
    "@react-navigation/native": "^7.0.13",
    "@react-navigation/stack": "^7.1.1",

    "@react-native-async-storage/async-storage": "^2.1.0",
    "@react-native-community/netinfo": "^12.0.2",
    "react-native-mmkv": "^3.4.1",

    "expo-image-picker": "~16.0.5",
    "expo-camera": "~16.0.8",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.12",
    "@types/react-native": "^0.76.0",
    "typescript": "^5.3.0"
  }
}
```

### 7.2 Library Decisions

| Library | Purpose | Why |
|---------|---------|-----|
| **Expo Router** | Navigation | File-based routing like Next.js, automatic deep linking |
| **@react-native-firebase** | Backend | Native Firebase SDK, offline support, better performance |
| **React Query** | Server state | Automatic caching, background sync, optimistic updates |
| **Zustand** | Client state | Lightweight, TypeScript-first, no boilerplate |
| **React Hook Form** | Forms | Reuses existing Zod schemas, minimal re-renders |
| **React Native Paper** | UI components | Material Design, accessible, customizable |
| **MMKV** | Fast storage | 30x faster than AsyncStorage, perfect for queue |
| **NetInfo** | Network detection | Detect online/offline for sync strategy |

---

## 8. Reusable Code from Next.js

### 8.1 100% Reusable (Copy Directly)

**TypeScript Types**:
- `src/types/firestore.ts` - All Firestore document types
- `src/types/player.ts` - Player display types
- `src/types/game.ts` - Game and stats types
- `src/types/league.ts` - League codes and types

**Validation Schemas**:
- `src/lib/validations/player.ts` - Player form validation (Zod)
- `src/lib/validations/game-schema.ts` - Game form validation (Zod)

**Utility Functions**:
- Age calculation logic
- Stats aggregation functions
- Date formatting helpers
- Position mapping (GK, CB, ST, etc.)

**Business Logic**:
- Player stats calculation
- Game result validation
- League validation rules
- COPPA compliance checks

### 8.2 Requires Adaptation (API Changes)

**Firebase Services** (API differences between JS SDK and React Native SDK):

Web (`firebase/firestore`):
```typescript
import { collection, getDocs } from 'firebase/firestore';
const snapshot = await getDocs(collection(db, 'users'));
```

Mobile (`@react-native-firebase/firestore`):
```typescript
import firestore from '@react-native-firebase/firestore';
const snapshot = await firestore().collection('users').get();
```

**Strategy**: Create mobile-specific service files that mirror web API but use native SDK.

### 8.3 Platform-Specific Replacements

| Web | Mobile | Notes |
|-----|--------|-------|
| `next/image` | `expo-image` | Image optimization |
| `next/link` | `expo-router` Link | Navigation |
| `localStorage` | `AsyncStorage` or `MMKV` | Persistent storage |
| `React.Suspense` | Manual loading states | RN doesn't support Suspense fully |
| CSS-in-JS | StyleSheet API | React Native styling |

---

## 9. UI Component Strategy

### 9.1 Component Library: React Native Paper

**Rationale**:
- Material Design (consistent with web aesthetic)
- Fully accessible out of the box
- Theming support (light/dark mode)
- TypeScript-first
- Active community

**Base Components**:
- `Button`, `Card`, `TextInput`, `Surface`
- `List`, `Avatar`, `Chip`, `Badge`
- `Modal`, `Dialog`, `Snackbar`

**Customization** (`src/constants/theme.ts`):
```typescript
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb', // Blue (matches web)
    secondary: '#10b981', // Green
    background: '#ffffff',
    surface: '#f9fafb',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    secondary: '#34d399',
    background: '#0f172a',
    surface: '#1e293b',
  },
};
```

### 9.2 Custom Components

**Reusable UI** (`src/components/ui/`):
- `PlayerCard.tsx` - Player list item
- `GameCard.tsx` - Game list item
- `StatsBadge.tsx` - Stat display (e.g., "12G, 8A")
- `EmptyState.tsx` - No data placeholder
- `LoadingSpinner.tsx` - Loading indicator
- `ErrorBoundary.tsx` - Error fallback

**Form Components** (`src/components/forms/`):
- `PlayerForm.tsx` - Create/edit player
- `GameForm.tsx` - Create/edit game
- `PositionPicker.tsx` - Soccer position selector
- `LeaguePicker.tsx` - League dropdown

---

## 10. Authentication Flow

### 10.1 Firebase Auth Integration

**Auth Hook** (`src/hooks/useAuth.ts`):
```typescript
import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
```

**Auth Service** (`src/lib/firebase/auth.ts`):
```typescript
import auth from '@react-native-firebase/auth';

export async function signInWithEmail(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  return auth().createUserWithEmailAndPassword(email, password);
}

export async function signOut() {
  return auth().signOut();
}

export async function resetPassword(email: string) {
  return auth().sendPasswordResetEmail(email);
}
```

### 10.2 Protected Routes

**Root Layout** (`app/_layout.tsx`):
```typescript
import { Slot, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
```

---

## 11. Platform-Specific Features

### 11.1 iOS Specific

**App Store Requirements**:
- Privacy Manifest (App Privacy Details)
- Sign in with Apple (if social auth added)
- Push notification permissions
- Camera/Photo Library permissions

**Info.plist Additions**:
```xml
<key>NSCameraUsageDescription</key>
<string>Take photos of your player for their profile</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Select photos from your library for player profiles</string>
```

### 11.2 Android Specific

**Play Store Requirements**:
- Data safety form (Firebase data collection)
- Target SDK 34+ (Android 14)
- 64-bit support (handled by Expo)

**AndroidManifest.xml Additions**:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 11.3 Deep Linking

**Universal Links** (iOS) and **App Links** (Android):

**app.json Configuration**:
```json
{
  "expo": {
    "scheme": "hustlestats",
    "ios": {
      "associatedDomains": ["applinks:hustlestats.io"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "hustlestats.io"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**Usage**:
- `hustlestats://player/abc123` - Open player detail
- `https://hustlestats.io/player/abc123` - Universal link

---

## 12. Build & Deployment Strategy

### 12.1 EAS Build Configuration

**File**: `eas.json`
```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "123456789",
        "appleTeamId": "ABCD1234"
      },
      "android": {
        "serviceAccountKeyPath": "./android-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 12.2 Build Commands

```bash
# Development build (with dev client)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build (TestFlight/Internal Testing)
eas build --profile preview --platform all

# Production build (App Store/Play Store)
eas build --profile production --platform all

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### 12.3 Over-the-Air Updates (OTA)

**Update Strategy**:
- Bug fixes and UI changes: OTA update (instant)
- Native code changes: Full app store release

**Commands**:
```bash
# Publish OTA update
eas update --branch production --message "Fix player stats calculation"

# Rollback update
eas update --branch production --message "Rollback" --republish
```

---

## 13. Testing Strategy

### 13.1 Unit Testing (Jest + React Native Testing Library)

**Setup**:
```bash
npm install --save-dev @testing-library/react-native jest
```

**Example Test** (`src/components/ui/PlayerCard.test.tsx`):
```typescript
import { render, screen } from '@testing-library/react-native';
import { PlayerCard } from './PlayerCard';

describe('PlayerCard', () => {
  it('renders player name and position', () => {
    const player = {
      id: '1',
      name: 'Alex Johnson',
      primaryPosition: 'ST',
      teamClub: 'FC Stars',
    };

    render(<PlayerCard player={player} />);

    expect(screen.getByText('Alex Johnson')).toBeTruthy();
    expect(screen.getByText('ST')).toBeTruthy();
  });
});
```

### 13.2 E2E Testing (Detox)

**Setup**:
```bash
npm install --save-dev detox
```

**Example Test** (`e2e/login.test.ts`):
```typescript
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await expect(element(by.text('Dashboard'))).toBeVisible();
  });
});
```

### 13.3 Manual Testing Checklist

**Core Flows**:
- [ ] Sign up new user
- [ ] Login existing user
- [ ] Create player profile
- [ ] Upload player photo
- [ ] Add game stats
- [ ] Edit game stats
- [ ] View player detail
- [ ] Offline mode (airplane mode test)
- [ ] Sync queue after reconnect
- [ ] Deep link navigation

---

## 14. Performance Optimization

### 14.1 Image Optimization

**Use expo-image** (lazy loading, caching):
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: player.photoUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### 14.2 List Performance

**Use FlashList** instead of FlatList:
```bash
npm install @shopify/flash-list
```

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={players}
  renderItem={({ item }) => <PlayerCard player={item} />}
  estimatedItemSize={80}
/>
```

### 14.3 Bundle Size Optimization

**Hermes Engine** (enabled by default in Expo):
- Faster startup time
- Smaller bundle size
- Better memory usage

**Tree Shaking**:
- Import specific icons: `import Icon from 'react-native-vector-icons/MaterialCommunityIcons'`
- Avoid barrel imports: Use specific imports instead of `import * as`

---

## 15. Monitoring & Analytics

### 15.1 Firebase Analytics

**Setup**:
```bash
npm install @react-native-firebase/analytics
```

**Usage** (`src/services/analytics.ts`):
```typescript
import analytics from '@react-native-firebase/analytics';

export async function logScreenView(screenName: string) {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });
}

export async function logGameCreated(playerId: string) {
  await analytics().logEvent('game_created', {
    player_id: playerId,
  });
}
```

### 15.2 Crashlytics

**Setup**:
```bash
npm install @react-native-firebase/crashlytics
```

**Usage**:
```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Log non-fatal errors
crashlytics().recordError(new Error('Something went wrong'));

// Set user context
crashlytics().setUserId(user.uid);
```

### 15.3 Performance Monitoring

**Setup**:
```bash
npm install @react-native-firebase/perf
```

**Usage**:
```typescript
import perf from '@react-native-firebase/perf';

const trace = await perf().startTrace('load_players');
await getPlayers(userId);
await trace.stop();
```

---

## 16. Migration & Rollout Plan

### 16.1 Phase 1: MVP (Weeks 1-4)

**Goal**: Feature parity with web app core features

**Scope**:
- [ ] Authentication (email/password)
- [ ] Player CRUD (create, read, update, delete)
- [ ] Game CRUD
- [ ] Player detail with stats
- [ ] Basic offline support (read-only cache)
- [ ] iOS TestFlight build
- [ ] Android Internal Testing build

**Tech Debt Accepted**:
- No photo upload (web only)
- No Stripe billing (workspace limits enforced but no in-app purchase)
- No Vertex AI agents (future)

### 16.2 Phase 2: Offline Sync (Weeks 5-6)

**Scope**:
- [ ] Offline queue implementation
- [ ] Sync indicator UI
- [ ] Queue full error handling
- [ ] Network status banner
- [ ] Optimistic UI updates

### 16.3 Phase 3: Polish & Beta (Weeks 7-8)

**Scope**:
- [ ] Photo upload (camera + gallery)
- [ ] Push notifications (game reminders)
- [ ] Onboarding flow
- [ ] App Store screenshots
- [ ] Privacy policy & terms
- [ ] Beta testing (50 users)

### 16.4 Phase 4: Launch (Week 9)

**Scope**:
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)
- [ ] Marketing assets
- [ ] App Store Optimization (ASO)
- [ ] Public launch announcement

---

## 17. Code Sharing Strategy

### 17.1 Monorepo Structure (Recommended)

**Option A: Keep web and mobile separate** (Current)
```
hustle/
├── src/          # Next.js web app
├── mobile/       # React Native app
└── shared/       # NEW: Shared TypeScript code
    ├── types/
    ├── validations/
    └── utils/
```

**Option B: Unified monorepo with workspace**
```
hustle/
├── apps/
│   ├── web/      # Next.js
│   └── mobile/   # React Native (Expo)
├── packages/
│   ├── shared/   # Shared code
│   └── ui/       # Shared components (future)
├── package.json  # Workspace root
└── turbo.json    # Turborepo config (optional)
```

### 17.2 Shared Package (`shared/`)

**Setup**:
```bash
mkdir -p shared/src/{types,validations,utils}

# Copy existing files
cp src/types/firestore.ts shared/src/types/
cp src/lib/validations/player.ts shared/src/validations/
cp src/lib/validations/game-schema.ts shared/src/validations/
```

**package.json** (`shared/package.json`):
```json
{
  "name": "@hustle/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "dependencies": {
    "zod": "^4.1.11"
  }
}
```

**Usage in mobile**:
```typescript
import { playerSchema } from '@hustle/shared/validations';
import type { Player, Game } from '@hustle/shared/types';
```

---

## 18. Key Differences: Web vs Mobile

| Feature | Web (Next.js) | Mobile (React Native) |
|---------|---------------|----------------------|
| **Routing** | App Router (file-based) | Expo Router (file-based) |
| **Styling** | Tailwind CSS | StyleSheet API / NativeWind |
| **Firebase SDK** | JS SDK (`firebase`) | Native SDK (`@react-native-firebase`) |
| **Images** | `next/image` | `expo-image` |
| **Storage** | `localStorage` | AsyncStorage / MMKV |
| **Offline** | Service Worker | Firestore offline persistence + queue |
| **Auth** | Firebase Auth (web SDK) | Firebase Auth (native SDK) |
| **Navigation** | `next/link`, `useRouter` | `expo-router`, `Link` |
| **Deployment** | Vercel / Firebase Hosting | App Store / Play Store |
| **Updates** | Deploy anytime | OTA (minor) or store review (major) |

---

## 19. Development Workflow

### 19.1 Local Development

```bash
# Start Expo dev server
cd mobile
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on physical device (scan QR code)
# Install Expo Go app on phone, scan QR
```

### 19.2 Firebase Emulators (Optional)

**Setup** (`firebase.json`):
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    }
  }
}
```

**Usage**:
```bash
# Start emulators
firebase emulators:start

# Point mobile app to emulators (dev only)
# src/lib/firebase/config.ts
if (__DEV__) {
  firestore().useEmulator('localhost', 8080);
  auth().useEmulator('http://localhost:9099');
}
```

### 19.3 CI/CD Pipeline (GitHub Actions)

**File**: `.github/workflows/mobile.yml`
```yaml
name: Mobile CI

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: cd mobile && npm ci

      - name: Run tests
        run: cd mobile && npm test

      - name: EAS Build (Preview)
        run: |
          cd mobile
          npx eas-cli build --platform all --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 20. Security Considerations

### 20.1 Secure Storage

**Sensitive Data** (auth tokens, user ID):
- Use `expo-secure-store` (encrypted keychain/keystore)
- Never store passwords or API keys in AsyncStorage

```typescript
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('userToken', token);
const token = await SecureStore.getItemAsync('userToken');
```

### 20.2 Firestore Security Rules

**Rules stay the same** (defined in `firestore.rules`):
- User can only read/write their own data
- Workspace members can access shared players/games
- Cloud Functions bypass rules with Admin SDK

### 20.3 API Key Protection

**Firebase Config**:
- Firebase API keys in `app.json` are safe to commit (scoped by app bundle ID)
- Firestore security rules protect data, not API keys

**Private Keys** (Google Services files):
- `GoogleService-Info.plist` (iOS)
- `google-services.json` (Android)
- Add to `.gitignore`
- Store in EAS Secrets for CI/CD

```bash
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value "$(cat google-services.json)"
```

---

## 21. Cost Analysis

### 21.1 Development Costs

| Service | Cost | Notes |
|---------|------|-------|
| **Expo** | Free (EAS Build 30 builds/month free tier) | $29/mo for unlimited builds |
| **Firebase** | Existing (no change) | Already using Firebase for web |
| **Apple Developer** | $99/year | Required for App Store |
| **Google Play** | $25 one-time | Required for Play Store |
| **Testing Devices** | ~$500 | 1 iPhone, 1 Android (one-time) |

**Total First Year**: ~$750 (one-time setup) + $29/mo (EAS Build)

### 21.2 Ongoing Costs

| Service | Monthly Cost |
|---------|--------------|
| EAS Build Pro | $29 |
| App Store fees | $8.25 (annualized) |
| Play Store fees | $0 (one-time paid) |
| **Total** | **~$37/month** |

---

## 22. Success Metrics

### 22.1 Launch Goals (3 months)

- [ ] 500 app installs
- [ ] 100 DAU (Daily Active Users)
- [ ] 4.5+ star rating (App Store & Play Store)
- [ ] <1% crash rate
- [ ] <5s average app startup time

### 22.2 Key Performance Indicators

**Technical**:
- App startup time: <2s (cold start), <500ms (warm start)
- Firestore read operations: <100ms p95
- Offline queue processing: <5s after reconnect
- Crash-free rate: >99%

**Business**:
- Mobile DAU / Web DAU ratio: >30%
- Mobile games created / Total games: >40%
- Retention (D7): >30%
- Retention (D30): >15%

---

## 23. Next Steps (Immediate Actions)

### Week 1: Project Setup

```bash
# 1. Create Expo app
cd /home/jeremy/000-projects/hustle
npx create-expo-app@latest mobile --template expo-template-blank-typescript

# 2. Install core dependencies
cd mobile
npm install expo-router @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npm install @tanstack/react-query zustand react-hook-form @hookform/resolvers zod

# 3. Setup Firebase configuration
# Download GoogleService-Info.plist (iOS) and google-services.json (Android)
# from Firebase Console

# 4. Copy shared types and validations
mkdir -p src/types src/lib/validations
cp ../src/types/firestore.ts src/types/
cp ../src/lib/validations/player.ts src/lib/validations/
cp ../src/lib/validations/game-schema.ts src/lib/validations/

# 5. Create Firebase services (adapted for React Native)
mkdir -p src/lib/firebase/services

# 6. Setup EAS Build
npm install -g eas-cli
eas login
eas init --id your-project-id
eas build:configure

# 7. Run first build
npx expo start
```

### Week 2: Core Features

- [ ] Implement authentication (login, signup, logout)
- [ ] Create main navigation (tabs)
- [ ] Build player list screen
- [ ] Build player detail screen
- [ ] Implement React Query hooks for Firestore

### Week 3: CRUD Operations

- [ ] Add player form (create/edit)
- [ ] Add game form (create/edit)
- [ ] Delete confirmation dialogs
- [ ] Form validation with Zod

### Week 4: Polish & Testing

- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] TestFlight build (iOS)
- [ ] Internal Testing build (Android)

---

## 24. Risk Mitigation

### 24.1 Technical Risks

| Risk | Mitigation |
|------|------------|
| **Firebase SDK incompatibility** | Use @react-native-firebase (proven, widely used) |
| **Offline sync complexity** | Start with simple queue, iterate based on user feedback |
| **App store rejection** | Follow guidelines, privacy manifest, test thoroughly |
| **Performance issues** | Use Hermes, FlashList, image optimization early |
| **Deep linking bugs** | Test all deep link scenarios before launch |

### 24.2 Business Risks

| Risk | Mitigation |
|------|------------|
| **Low adoption** | Gradual rollout, TestFlight beta, user feedback |
| **Negative reviews** | Beta testing, monitoring, quick OTA updates |
| **Maintenance burden** | Code sharing with web, automated testing |
| **App store fees** | Offset by increased user engagement and retention |

---

## 25. References & Documentation

### 25.1 Official Documentation

- Expo: https://docs.expo.dev/
- Expo Router: https://docs.expo.dev/router/introduction/
- React Native Firebase: https://rnfirebase.io/
- React Query: https://tanstack.com/query/latest/docs/react/overview
- Zustand: https://docs.pmnd.rs/zustand/getting-started/introduction
- React Native Paper: https://callstack.github.io/react-native-paper/

### 25.2 Internal Documentation

- Firebase setup: `/home/jeremy/000-projects/hustle/000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md`
- Firestore schema: `src/types/firestore.ts`
- Web architecture: `CLAUDE.md`

---

**End of Document**

---

**Timestamp**: 2025-12-13
**Author**: Claude (Sonnet 4.5)
**Review Status**: Draft - Ready for review and refinement
