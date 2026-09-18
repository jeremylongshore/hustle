# Mobile App API Reference

**Document ID:** 259-DR-REFF
**Created:** 2025-12-13
**Status:** Active
**Type:** Technical Reference

---

## Overview

API reference for the Hustle Stats mobile app internal services and hooks.

---

## Firebase Services

### Location: `src/lib/firebase/`

### auth.ts - Authentication Service

#### signUp(data: SignUpData): Promise<UserCredential>

Creates a new user account with Firebase Auth and Firestore profile.

```typescript
interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isParentGuardian: boolean;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

// Usage
const credential = await signUp({
  email: 'parent@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  isParentGuardian: true,
  agreedToTerms: true,
  agreedToPrivacy: true,
});
```

#### signIn(data: SignInData): Promise<UserCredential>

Signs in an existing user.

```typescript
interface SignInData {
  email: string;
  password: string;
}

const credential = await signIn({
  email: 'parent@example.com',
  password: 'SecurePass123!',
});
```

#### signOut(): Promise<void>

Signs out the current user.

```typescript
await signOut();
```

#### resetPassword(email: string): Promise<void>

Sends password reset email.

```typescript
await resetPassword('parent@example.com');
```

#### onAuthChange(callback): () => void

Subscribes to auth state changes. Returns unsubscribe function.

```typescript
const unsubscribe = onAuthChange((user) => {
  if (user) {
    console.log('Signed in:', user.uid);
  } else {
    console.log('Signed out');
  }
});

// Cleanup
unsubscribe();
```

#### getUserDocument(userId: string): Promise<UserDocument | null>

Fetches user profile from Firestore.

```typescript
const profile = await getUserDocument('user-123');
```

---

### players.ts - Player CRUD Service

#### getPlayers(userId: string): Promise<Player[]>

Fetches all players for a user.

```typescript
const players = await getPlayers('user-123');
```

#### getPlayer(userId: string, playerId: string): Promise<Player | null>

Fetches a single player.

```typescript
const player = await getPlayer('user-123', 'player-456');
```

#### createPlayer(userId: string, data: CreatePlayerData): Promise<string>

Creates a new player. Returns player ID.

```typescript
interface CreatePlayerData {
  name: string;
  teamClub: string;
  primaryPosition: SoccerPositionCode;
  leagueCode: LeagueCode;
  gender: PlayerGender;
  birthday: Date;
}

const playerId = await createPlayer('user-123', {
  name: 'Alex Smith',
  teamClub: 'FC United Academy',
  primaryPosition: 'CM',
  leagueCode: 'local_travel',
  gender: 'male',
  birthday: new Date(2012, 5, 15),
});
```

#### updatePlayer(userId: string, playerId: string, data: Partial<CreatePlayerData>): Promise<void>

Updates an existing player.

```typescript
await updatePlayer('user-123', 'player-456', {
  teamClub: 'New Team FC',
});
```

#### deletePlayer(userId: string, playerId: string): Promise<void>

Deletes a player and all their games.

```typescript
await deletePlayer('user-123', 'player-456');
```

---

### games.ts - Game CRUD Service

#### getGames(userId: string, playerId: string): Promise<Game[]>

Fetches all games for a player, sorted by date descending.

```typescript
const games = await getGames('user-123', 'player-456');
```

#### getGame(userId: string, playerId: string, gameId: string): Promise<Game | null>

Fetches a single game.

```typescript
const game = await getGame('user-123', 'player-456', 'game-789');
```

#### createGame(userId: string, playerId: string, data: CreateGameData): Promise<string>

Creates a new game. Returns game ID.

```typescript
interface CreateGameData {
  date: Date;
  opponent: string;
  result: GameResult; // 'Win' | 'Loss' | 'Draw'
  finalScore: string; // e.g., '3-2'
  minutesPlayed: number;
  goals: number;
  assists: number;
}

const gameId = await createGame('user-123', 'player-456', {
  date: new Date(),
  opponent: 'Rival FC',
  result: 'Win',
  finalScore: '3-2',
  minutesPlayed: 80,
  goals: 2,
  assists: 1,
});
```

#### deleteGame(userId: string, playerId: string, gameId: string): Promise<void>

Deletes a game.

```typescript
await deleteGame('user-123', 'player-456', 'game-789');
```

#### calculatePlayerStats(games: Game[]): PlayerStats

Calculates aggregate statistics from games array.

```typescript
interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  goalsPerGame: number;
  assistsPerGame: number;
}

const stats = calculatePlayerStats(games);
// { totalGames: 10, wins: 6, losses: 2, draws: 2, goals: 15, ... }
```

---

## React Query Hooks

### Location: `src/hooks/`

### usePlayers.ts

#### usePlayers()

Fetches all players for the current user.

```typescript
const { data: players, isLoading, error, refetch } = usePlayers();
```

#### usePlayer(playerId: string)

Fetches a single player.

```typescript
const { data: player, isLoading } = usePlayer('player-456');
```

#### useCreatePlayer()

Mutation hook for creating players.

```typescript
const createPlayer = useCreatePlayer();

await createPlayer.mutateAsync({
  name: 'Alex Smith',
  teamClub: 'FC United',
  primaryPosition: 'CM',
  leagueCode: 'local_travel',
  gender: 'male',
  birthday: new Date(2012, 5, 15),
});
```

#### useUpdatePlayer()

Mutation hook for updating players.

```typescript
const updatePlayer = useUpdatePlayer();

await updatePlayer.mutateAsync({
  playerId: 'player-456',
  data: { teamClub: 'New Team' },
});
```

#### useDeletePlayer()

Mutation hook for deleting players.

```typescript
const deletePlayer = useDeletePlayer();

await deletePlayer.mutateAsync('player-456');
```

---

### useGames.ts

#### useGames(playerId: string)

Fetches all games for a player.

```typescript
const { data: games, isLoading } = useGames('player-456');
```

#### usePlayerStats(playerId: string)

Fetches games and calculates statistics.

```typescript
const { stats, games, isLoading } = usePlayerStats('player-456');
// stats: PlayerStats | null
// games: Game[] | undefined
```

#### useCreateGame()

Mutation hook for creating games.

```typescript
const createGame = useCreateGame();

await createGame.mutateAsync({
  playerId: 'player-456',
  data: {
    date: new Date(),
    opponent: 'Rival FC',
    result: 'Win',
    finalScore: '3-2',
    minutesPlayed: 80,
    goals: 2,
    assists: 1,
  },
});
```

#### useDeleteGame()

Mutation hook for deleting games.

```typescript
const deleteGame = useDeleteGame();

await deleteGame.mutateAsync({
  playerId: 'player-456',
  gameId: 'game-789',
});
```

---

### useAuth.ts

#### useAuth()

Access auth state and user profile.

```typescript
const { user, firebaseUser, isLoading, isAuthenticated, signOut } = useAuth();

// user: User | null (profile with firstName, lastName, etc.)
// firebaseUser: FirebaseUser | null (Firebase auth user)
// isLoading: boolean
// isAuthenticated: boolean
// signOut: () => Promise<void>
```

---

## Type Definitions

### Location: `src/types/index.ts`

### Core Types

```typescript
type SoccerPositionCode =
  | 'GK' | 'CB' | 'RB' | 'LB' | 'RWB' | 'LWB'
  | 'DM' | 'CM' | 'AM' | 'RW' | 'LW' | 'ST' | 'CF';

type LeagueCode =
  | 'recreational' | 'local_travel' | 'regional_travel'
  | 'state_select' | 'national_premier' | 'mls_next'
  | 'ecnl' | 'ga' | 'academy' | 'high_school' | 'college' | 'other';

type PlayerGender = 'male' | 'female';

type GameResult = 'Win' | 'Loss' | 'Draw';
```

### Document Types (Firestore)

```typescript
interface UserDocument {
  defaultWorkspaceId: string | null;
  ownedWorkspaces: string[];
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
  termsAgreedAt: Timestamp | null;
  privacyAgreedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PlayerDocument {
  name: string;
  teamClub: string;
  primaryPosition: SoccerPositionCode;
  leagueCode: LeagueCode;
  gender: PlayerGender;
  birthday: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface GameDocument {
  date: Timestamp;
  opponent: string;
  result: GameResult;
  finalScore: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  createdAt: Timestamp;
}
```

### Client Types (Date instead of Timestamp)

```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  // ... (Timestamp -> Date conversion)
}

interface Player {
  id: string;
  name: string;
  teamClub: string;
  primaryPosition: SoccerPositionCode;
  // ... (Timestamp -> Date conversion)
}

interface Game {
  id: string;
  date: Date;
  opponent: string;
  result: GameResult;
  // ...
}
```

---

## Constants

### Position Labels

```typescript
const POSITION_LABELS: Record<SoccerPositionCode, string> = {
  GK: 'Goalkeeper',
  CB: 'Center Back',
  RB: 'Right Back',
  LB: 'Left Back',
  RWB: 'Right Wing Back',
  LWB: 'Left Wing Back',
  DM: 'Defensive Mid',
  CM: 'Central Mid',
  AM: 'Attacking Mid',
  RW: 'Right Wing',
  LW: 'Left Wing',
  ST: 'Striker',
  CF: 'Center Forward',
};
```

### League Labels

```typescript
const LEAGUE_LABELS: Record<LeagueCode, string> = {
  recreational: 'Recreational',
  local_travel: 'Local Travel',
  regional_travel: 'Regional Travel',
  state_select: 'State Select',
  national_premier: 'National Premier',
  mls_next: 'MLS NEXT',
  ecnl: 'ECNL',
  ga: "Girls Academy",
  academy: 'Academy',
  high_school: 'High School',
  college: 'College',
  other: 'Other',
};
```

---

**Document ID:** 259-DR-REFF
**Last Updated:** 2025-12-13
