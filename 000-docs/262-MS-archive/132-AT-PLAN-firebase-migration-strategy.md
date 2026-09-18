# Firebase + Google Agent Engine Migration Strategy
## Hustle Project: PostgreSQL/NextAuth → Firebase/Firestore + ADK + A2A

**Created**: 2025-11-07
**Project**: Hustle (Youth Soccer Stats Platform)
**Status**: Planning Phase
**Priority**: High

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Target Architecture](#target-architecture)
4. [Technology Stack Overview](#technology-stack-overview)
5. [Migration Strategy](#migration-strategy)
6. [Firestore Schema Design](#firestore-schema-design)
7. [Authentication Migration Plan](#authentication-migration-plan)
8. [ADK + A2A Agent Integration](#adk--a2a-agent-integration)
9. [Vertex AI Search Integration](#vertex-ai-search-integration)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Risk Assessment](#risk-assessment)
12. [Resources & References](#resources--references)

---

## Executive Summary

### Migration Goals
- **Replace PostgreSQL** → Firebase Firestore (NoSQL document database)
- **Replace NextAuth v5** → Firebase Authentication
- **Add Agent Engine** with Google ADK (Agent Development Kit)
- **Implement A2A Protocol** (Agent-to-Agent communication) - **NON-NEGOTIABLE**
- **Integrate Genkit 1.0** for AI-powered features
- **Add Vertex AI Search** for enhanced search capabilities
- **Leverage Cloud Storage** for player photos and media

### Key Benefits
1. **Serverless Architecture**: No database management overhead
2. **Real-time Capabilities**: Firestore real-time sync for live game updates
3. **Agent-Driven Features**: AI-powered game analysis, coaching insights
4. **A2A Interoperability**: Agents can communicate across platforms
5. **Scalability**: Automatic scaling with Firebase
6. **Unified Platform**: All Google Cloud services integrated

### Timeline Estimate
- **Phase 1**: Foundation (2-3 weeks)
- **Phase 2**: Core Migration (3-4 weeks)
- **Phase 3**: Agent Integration (2-3 weeks)
- **Phase 4**: Testing & Optimization (2 weeks)
- **Total**: 9-12 weeks

---

## Current Architecture Analysis

### Database Layer (PostgreSQL + Prisma)

**Current Models:**
```typescript
User {
  - id, email, password (bcrypt)
  - firstName, lastName, phone
  - emailVerified, agreedToTerms, agreedToPrivacy
  - verificationPinHash
  - Relations: players[], accounts[], sessions[]
}

Player {
  - id, name, birthday, position, teamClub, photoUrl
  - parentId (FK to User)
  - Relations: games[]
  - Index: [parentId, createdAt DESC]
}

Game {
  - id, playerId, date, opponent, result, finalScore
  - minutesPlayed, goals, assists
  - Defensive stats (nullable): tackles, interceptions, clearances, blocks, aerialDuelsWon
  - Goalkeeper stats (nullable): saves, goalsAgainst, cleanSheet
  - verified, verifiedAt
  - Relations: player
  - Indexes: [playerId], [verified]
}

// Auth Models
Account, Session, VerificationToken
PasswordResetToken, EmailVerificationToken

// Other
Waitlist
```

**Total**: 9 models, 6 core business models, 19 API routes

### Authentication Layer (NextAuth v5)

**Current Implementation:**
- JWT strategy with 30-day sessions
- Credentials provider (email/password)
- bcrypt password hashing (10 rounds)
- Email verification required before login
- Server-side session protection with `await auth()`
- Custom token management for password reset

**Critical Configuration:**
```typescript
// /src/lib/auth.ts
trustHost: true  // Required for custom domains
```

### API Layer (Next.js 15 API Routes)

**19 API Routes:**
- **Auth**: `/api/auth/*` (register, login, verify-email, reset-password, etc.)
- **Players**: `/api/players/*` (CRUD operations, photo upload)
- **Games**: `/api/games` (game logging)
- **Admin**: `/api/admin/verify-user`
- **System**: healthcheck, migrate, db-setup

### Current Tech Stack
- **Framework**: Next.js 15.5.4 (App Router + Turbopack)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15 + Prisma ORM
- **Auth**: NextAuth v5 (beta.29)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Email**: Resend for transactional emails
- **Monitoring**: Sentry
- **Testing**: Vitest + Playwright
- **Deployment**: Docker → Google Cloud Run
- **Infrastructure**: Terraform

---

## Target Architecture

### New Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 Frontend                     │
│              (App Router + Turbopack + React 19)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │   Firestore  │  │    Cloud     │     │
│  │     Auth     │  │   (NoSQL)    │  │   Storage    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │   Genkit 1.0 │  │  Vertex AI   │     │
│  │  Functions   │  │  (AI Logic)  │  │    Search    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│             Google Cloud Agent Infrastructure                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     ADK      │  │    Agent     │  │  A2A Protocol│     │
│  │   (Python)   │  │    Engine    │  │   (v0.3+)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Vertex AI Gemini 2.5 Flash              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Layers

**1. Frontend Layer (Next.js 15)**
- React 19 with Server Components
- Firebase Web SDK v11
- Genkit client integration
- Real-time Firestore listeners

**2. Firebase Services Layer**
- **Firebase Auth**: Email/password, Google OAuth, social providers
- **Firestore**: NoSQL document database with real-time sync
- **Cloud Storage**: Player photos, game videos, media
- **Cloud Functions**: Serverless backend logic (Node.js 20)
- **Genkit 1.0**: AI-powered features and flows

**3. Agent Infrastructure Layer**
- **ADK (Agent Development Kit)**: Multi-agent orchestration
- **Agent Engine**: Managed runtime on Vertex AI
- **A2A Protocol**: Agent-to-agent communication (NON-NEGOTIABLE)
- **Vertex AI**: Gemini 2.5 Flash for analysis

**4. AI/Search Layer**
- **Vertex AI Search**: Semantic search for game history, stats
- **Gemini 2.5 Flash**: Game analysis, coaching tips, performance insights
- **Vector Embeddings**: For similarity search and recommendations

---

## Technology Stack Overview

### 1. Firebase Authentication

**Key Features:**
- Email/password authentication (drop-in for NextAuth)
- Social providers (Google, GitHub, Apple)
- Phone authentication
- Email verification built-in
- Custom claims for role-based access
- Session management with Firebase ID tokens
- Admin SDK for backend operations

**Migration Benefits:**
- No custom token management needed
- Built-in email verification
- Better security with Firebase Security Rules
- Automatic session refresh
- Native mobile support (future iOS/Android apps)

**Example Implementation:**
```typescript
// /src/lib/firebase/auth.ts
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export async function signInUser(email: string, password: string) {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
```

### 2. Cloud Firestore

**Key Features:**
- NoSQL document database
- Real-time synchronization
- Offline support
- Powerful queries with compound indexes
- Automatic scaling
- ACID transactions
- Security Rules for access control

**Data Model:**
```
/users/{userId}
  - firstName, lastName, email, phone
  - emailVerified, createdAt, updatedAt
  - agreedToTerms, agreedToPrivacy, isParentGuardian
  - verificationPinHash

/users/{userId}/players/{playerId}
  - name, birthday, position, teamClub
  - photoUrl (Cloud Storage URL)
  - createdAt, updatedAt

/users/{userId}/players/{playerId}/games/{gameId}
  - date, opponent, result, finalScore
  - minutesPlayed, goals, assists
  - defensiveStats: { tackles, interceptions, ... }
  - goalkeeperStats: { saves, goalsAgainst, cleanSheet }
  - verified, verifiedAt

/waitlist/{waitlistId}
  - email, firstName, lastName, source
  - createdAt
```

**Advantages Over PostgreSQL:**
- No schema migrations
- Real-time updates (live game tracking)
- Automatic backups
- Better for mobile apps
- Simpler queries for hierarchical data

### 3. Agent Development Kit (ADK)

**Overview:**
- Open-source Python framework by Google
- Code-first approach to building agents
- Model-agnostic (Gemini, OpenAI, Anthropic, etc.)
- Deployment-agnostic (Cloud Run, Agent Engine, local)
- Native A2A Protocol support

**GitHub Resources:**
- **Main Repo**: `google/adk-python`
- **Samples**: `google/adk-samples`
- **Agent Starter Pack**: `GoogleCloudPlatform/agent-starter-pack` ⭐

**Installation:**
```bash
pip install agent-starter-pack
agent-starter-pack create hustle-agent
```

**Agent Types for Hustle:**
1. **Game Analysis Agent**: Analyzes game stats, provides insights
2. **Coaching Agent**: Suggests drills, training based on performance
3. **Recruiting Agent**: Highlights stats for college recruitment
4. **Verification Agent**: Validates game stats accuracy
5. **Performance Trends Agent**: Identifies patterns, improvements

**Example ADK Agent:**
```python
from adk import Agent, Tool

@Tool
def analyze_game_stats(player_id: str, game_id: str) -> str:
    """Analyzes game statistics and provides coaching insights."""
    # Fetch game data from Firestore
    # Analyze with Gemini
    # Return structured insights
    pass

game_analysis_agent = Agent(
    name="GameAnalysisAgent",
    tools=[analyze_game_stats],
    model="gemini-2.5-flash",
    instruction="You are a soccer coaching expert..."
)
```

### 4. Agent2Agent (A2A) Protocol - NON-NEGOTIABLE

**Critical Requirements:**
- **Version**: A2A Protocol v0.3+ (latest)
- **Linux Foundation Project**: Open standard for agent interoperability
- **150+ Organizations**: Atlassian, Box, Cohere, Intuit, MongoDB, PayPal, Salesforce, SAP, ServiceNow

**A2A Capabilities:**
- **Stateless Interactions**: REST-like request/response
- **Stateful Sessions**: Long-running conversations
- **gRPC Support**: High-performance communication
- **Security Cards**: Signed authentication/authorization
- **Multi-Framework**: Works with ADK, LangGraph, CrewAI, etc.

**Hustle Use Cases:**
1. **Cross-Platform Stats Sharing**: Share player stats with recruiting platforms
2. **Tournament Integration**: Connect with tournament management systems
3. **Team Communication**: Multi-agent team analysis
4. **Third-Party Tools**: Allow external agents to query player data (with auth)

**A2A Implementation:**
```python
from adk.a2a import A2AServer, A2AClient

# Expose Hustle agents via A2A
a2a_server = A2AServer(
    agents=[game_analysis_agent, recruiting_agent],
    auth_provider=firebase_auth_provider
)

# Deploy to Agent Engine with A2A endpoint
a2a_server.deploy(
    project="hustleapp-production",
    location="us-central1"
)
```

### 5. Firebase Genkit 1.0

**Overview:**
- Framework for building AI-powered features
- Available in JavaScript/TypeScript (v1.0), Go (Beta), Python (Alpha)
- Integrates with Firebase ecosystem
- Built-in evaluation and testing tools

**Key Features:**
- **Flows**: Define AI workflows with observability
- **Prompts**: Manage and version AI prompts
- **Tools**: Function calling for agents
- **Traces**: Debug AI interactions
- **Deployment**: Firebase Functions, Cloud Run, or custom

**Hustle Use Cases:**
1. **Smart Game Logging**: Auto-fill opponent info, predict stats
2. **Performance Summaries**: Generate weekly reports
3. **Recruiting Letters**: Generate personalized recruiting content
4. **Chat Support**: Answer parents' questions about platform

**Example Genkit Flow:**
```typescript
// /src/lib/genkit/flows.ts
import { defineFlow } from '@genkit-ai/core';
import { gemini2_5Flash } from '@genkit-ai/googleai';

export const generatePerformanceSummary = defineFlow(
  {
    name: 'generatePerformanceSummary',
    inputSchema: z.object({ playerId: z.string(), timeframe: z.string() }),
    outputSchema: z.string(),
  },
  async ({ playerId, timeframe }) => {
    const games = await getPlayerGames(playerId, timeframe);

    const summary = await gemini2_5Flash.generate({
      prompt: `Analyze these soccer games and provide a performance summary: ${JSON.stringify(games)}`,
    });

    return summary.text();
  }
);
```

### 6. Vertex AI Search + Cloud Storage

**Vertex AI Search:**
- Semantic search over game history
- Natural language queries ("Show me all games where [player] scored 2+ goals")
- Vector embeddings for similarity search
- Recommendations ("Players with similar performance")

**Cloud Storage Integration:**
- Player photos: `gs://hustle-production/players/{playerId}/photos/`
- Game videos: `gs://hustle-production/games/{gameId}/videos/`
- Generated reports: `gs://hustle-production/reports/{userId}/`

**Storage + Vertex AI Search:**
```typescript
// Index player game data for semantic search
import { VertexAISearchClient } from '@google-cloud/vertex-ai-search';

const searchClient = new VertexAISearchClient({ projectId: 'hustleapp-production' });

// Index game data
await searchClient.upsertDocuments({
  datastoreId: 'hustle-games-datastore',
  documents: gamesData.map(game => ({
    id: game.id,
    structData: {
      playerId: game.playerId,
      date: game.date,
      goals: game.goals,
      assists: game.assists,
      opponent: game.opponent,
    },
    content: `${game.playerName} played against ${game.opponent} on ${game.date}, scored ${game.goals} goals and ${game.assists} assists.`
  }))
});

// Natural language search
const results = await searchClient.search({
  datastoreId: 'hustle-games-datastore',
  query: "Show me high-scoring games in the last month"
});
```

---

## Migration Strategy

### Phase 1: Foundation Setup (Week 1-3)

**Goals:**
- Set up Firebase project
- Configure Firestore database
- Install required packages
- Set up development environment

**Tasks:**

**1.1 Create Firebase Project**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and create project
firebase login
firebase projects:create hustleapp-production

# Initialize Firebase in Hustle project
cd /home/jeremy/000-projects/hustle
firebase init

# Select:
# - Firestore (rules and indexes)
# - Firebase Authentication
# - Cloud Storage
# - Cloud Functions (Node.js 20)
# - Firebase Hosting
```

**1.2 Install Firebase SDKs**
```bash
# Frontend Firebase SDK
npm install firebase @firebase/firestore @firebase/auth @firebase/storage

# Firebase Admin SDK (backend)
npm install firebase-admin

# Genkit
npm install @genkit-ai/core @genkit-ai/firebase @genkit-ai/googleai

# Remove old dependencies
npm uninstall @prisma/client prisma next-auth bcrypt
```

**1.3 Set Up ADK Environment**
```bash
# Create Python virtual environment for ADK agents
cd /home/jeremy/000-projects/hustle
mkdir -p agents
cd agents

python3 -m venv venv
source venv/bin/activate

# Install ADK and Agent Starter Pack
pip install agent-starter-pack
pip install google-cloud-firestore google-cloud-aiplatform

# Create base agent
agent-starter-pack create hustle-agent --template adk_base
```

**1.4 Configure Firebase Project**
```javascript
// /src/lib/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
```

**1.5 Set Up Firestore Security Rules**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User documents - only accessible by owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Player subcollection
      match /players/{playerId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        // Game subcollection
        match /games/{gameId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }

    // Waitlist - public write, admin read
    match /waitlist/{waitlistId} {
      allow create: if true;
      allow read, update, delete: if request.auth.token.admin == true;
    }
  }
}
```

**Deliverables:**
- ✅ Firebase project configured
- ✅ Firebase SDK installed in Next.js app
- ✅ ADK environment set up
- ✅ Security rules deployed
- ✅ Environment variables configured

---

### Phase 2: Database Migration (Week 4-7)

**Goals:**
- Create Firestore schema
- Migrate existing PostgreSQL data
- Implement Firestore service layer
- Update API routes

**Tasks:**

**2.1 Design Firestore Schema**

See [Firestore Schema Design](#firestore-schema-design) section below for complete schema.

**2.2 Create Firestore Service Layer**

Use DiagnosticPro pattern as reference:

```typescript
// /src/lib/firebase/services/users.ts
import {
  collection, doc, getDoc, setDoc, updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
  verificationPinHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const usersRef = collection(firestore, 'users');

export const usersService = {
  async create(userId: string, data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = doc(usersRef, userId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async getById(userId: string): Promise<User | null> {
    const docRef = doc(usersRef, userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as User;
  },

  async update(userId: string, data: Partial<User>) {
    const docRef = doc(usersRef, userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};
```

**2.3 Data Migration Script**

```typescript
// /scripts/migrate-postgres-to-firestore.ts
import { PrismaClient } from '@prisma/client';
import { firestore } from '@/lib/firebase/config';
import { collection, doc, writeBatch } from 'firebase/firestore';

const prisma = new PrismaClient();

async function migrateData() {
  console.log('Starting migration...');

  // Migrate users
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users`);

  for (const user of users) {
    const userRef = doc(firestore, 'users', user.id);
    const batch = writeBatch(firestore);

    // Create user document
    batch.set(userRef, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerified: user.emailVerified !== null,
      phone: user.phone,
      agreedToTerms: user.agreedToTerms,
      agreedToPrivacy: user.agreedToPrivacy,
      isParentGuardian: user.isParentGuardian,
      verificationPinHash: user.verificationPinHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // Migrate players for this user
    const players = await prisma.player.findMany({
      where: { parentId: user.id },
      include: { games: true }
    });

    for (const player of players) {
      const playerRef = doc(firestore, `users/${user.id}/players`, player.id);
      batch.set(playerRef, {
        name: player.name,
        birthday: player.birthday,
        position: player.position,
        teamClub: player.teamClub,
        photoUrl: player.photoUrl,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
      });

      // Migrate games for this player
      for (const game of player.games) {
        const gameRef = doc(firestore, `users/${user.id}/players/${player.id}/games`, game.id);
        batch.set(gameRef, {
          date: game.date,
          opponent: game.opponent,
          result: game.result,
          finalScore: game.finalScore,
          minutesPlayed: game.minutesPlayed,
          goals: game.goals,
          assists: game.assists,
          defensiveStats: {
            tackles: game.tackles,
            interceptions: game.interceptions,
            clearances: game.clearances,
            blocks: game.blocks,
            aerialDuelsWon: game.aerialDuelsWon,
          },
          goalkeeperStats: {
            saves: game.saves,
            goalsAgainst: game.goalsAgainst,
            cleanSheet: game.cleanSheet,
          },
          verified: game.verified,
          verifiedAt: game.verifiedAt,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        });
      }
    }

    await batch.commit();
    console.log(`Migrated user ${user.email} with ${players.length} players`);
  }

  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

**2.4 Update API Routes**

Replace Prisma calls with Firestore service layer:

```typescript
// BEFORE (PostgreSQL + Prisma)
import { prisma } from '@/lib/prisma';
const players = await prisma.player.findMany({
  where: { parentId: session.user.id }
});

// AFTER (Firestore)
import { playersService } from '@/lib/firebase/services/players';
const players = await playersService.getByParentId(session.user.id);
```

**Deliverables:**
- ✅ Firestore schema implemented
- ✅ Service layer created (users, players, games)
- ✅ Data migration script tested
- ✅ All API routes updated
- ✅ PostgreSQL data migrated

---

### Phase 3: Authentication Migration (Week 6-8)

**Goals:**
- Replace NextAuth v5 with Firebase Auth
- Migrate existing user passwords
- Update authentication flows
- Test all auth-related features

See [Authentication Migration Plan](#authentication-migration-plan) section below for details.

**Deliverables:**
- ✅ Firebase Auth integrated
- ✅ User passwords migrated (or reset required)
- ✅ All auth flows working
- ✅ Email verification functional

---

### Phase 4: Agent Integration (Week 7-9)

**Goals:**
- Deploy ADK agents to Agent Engine
- Implement A2A protocol endpoints
- Integrate Genkit flows
- Add AI-powered features

See [ADK + A2A Agent Integration](#adk--a2a-agent-integration) section below for details.

**Deliverables:**
- ✅ 5+ ADK agents deployed
- ✅ A2A endpoints functional
- ✅ Genkit flows integrated
- ✅ Game analysis feature live

---

### Phase 5: Vertex AI Search (Week 9-10)

**Goals:**
- Set up Vertex AI Search datastore
- Index game data
- Implement semantic search UI
- Add recommendations

See [Vertex AI Search Integration](#vertex-ai-search-integration) section below.

**Deliverables:**
- ✅ Search datastore configured
- ✅ Game data indexed
- ✅ Search UI implemented
- ✅ Recommendations working

---

### Phase 6: Testing & Optimization (Week 10-12)

**Goals:**
- End-to-end testing
- Performance optimization
- Security audit
- Documentation

**Tasks:**
- Update E2E tests for Firebase
- Load testing with Firebase
- Security Rules review
- Update CLAUDE.md

**Deliverables:**
- ✅ All tests passing
- ✅ Performance optimized
- ✅ Security validated
- ✅ Documentation complete

---

## Firestore Schema Design

### Collection Structure

```
/users/{userId}
  - firstName: string
  - lastName: string
  - email: string (indexed)
  - emailVerified: boolean
  - phone: string?
  - agreedToTerms: boolean
  - agreedToPrivacy: boolean
  - isParentGuardian: boolean
  - termsAgreedAt: timestamp?
  - privacyAgreedAt: timestamp?
  - verificationPinHash: string?
  - createdAt: timestamp
  - updatedAt: timestamp

  /players/{playerId}
    - name: string
    - birthday: timestamp
    - position: string
    - teamClub: string
    - photoUrl: string? (Cloud Storage URL)
    - createdAt: timestamp
    - updatedAt: timestamp

    /games/{gameId}
      - date: timestamp (indexed)
      - opponent: string
      - result: string (Win/Loss/Draw)
      - finalScore: string
      - minutesPlayed: number
      - goals: number
      - assists: number
      - defensiveStats: {
          tackles: number?
          interceptions: number?
          clearances: number?
          blocks: number?
          aerialDuelsWon: number?
        }
      - goalkeeperStats: {
          saves: number?
          goalsAgainst: number?
          cleanSheet: boolean?
        }
      - verified: boolean (indexed)
      - verifiedAt: timestamp?
      - createdAt: timestamp
      - updatedAt: timestamp

/waitlist/{waitlistId}
  - email: string (indexed)
  - firstName: string?
  - lastName: string?
  - source: string?
  - createdAt: timestamp
  - updatedAt: timestamp

/agents/{agentId}  # NEW: Agent metadata
  - name: string
  - type: string (game-analysis, coaching, recruiting, etc.)
  - status: string (active, inactive)
  - a2aEndpoint: string
  - capabilities: string[]
  - createdAt: timestamp
  - updatedAt: timestamp

/agent-interactions/{interactionId}  # NEW: A2A interaction logs
  - userId: string
  - agentId: string
  - type: string (query, analysis, recommendation)
  - input: any
  - output: any
  - timestamp: timestamp
```

### Composite Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "verified", "order": "ASCENDING" }
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

### Schema Comparison

| PostgreSQL Model | Firestore Collection | Notes |
|-----------------|---------------------|-------|
| User | /users/{userId} | Direct mapping |
| Player | /users/{userId}/players/{playerId} | Subcollection for hierarchy |
| Game | /users/{userId}/players/{playerId}/games/{gameId} | Nested subcollection |
| Account | Removed | Firebase Auth handles this |
| Session | Removed | Firebase Auth manages sessions |
| PasswordResetToken | Removed | Firebase Auth built-in |
| EmailVerificationToken | Removed | Firebase Auth built-in |
| Waitlist | /waitlist/{waitlistId} | Root collection |

---

## Authentication Migration Plan

### Current NextAuth v5 → Firebase Auth

**Step 1: Install Firebase Auth**
```bash
npm install firebase @firebase/auth
```

**Step 2: Create Auth Service**
```typescript
// /src/lib/firebase/auth.ts
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config';

export const authService = {
  // Sign up
  async signUp(email: string, password: string, firstName: string, lastName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`
    });

    // Send verification email
    await sendEmailVerification(userCredential.user);

    // Create user document in Firestore
    await usersService.create(userCredential.user.uid, {
      firstName,
      lastName,
      email,
      emailVerified: false,
      agreedToTerms: true,
      agreedToPrivacy: true,
      isParentGuardian: true,
    });

    return userCredential.user;
  },

  // Sign in
  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Check email verification
    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      throw new Error('Please verify your email before logging in');
    }

    return userCredential.user;
  },

  // Sign out
  async signOut() {
    return signOut(auth);
  },

  // Password reset
  async resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  },

  // Listen to auth state
  onAuthStateChange(callback: (user: any) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
```

**Step 3: Update Frontend Components**

```typescript
// BEFORE (NextAuth)
import { signIn } from 'next-auth/react';
await signIn('credentials', { email, password });

// AFTER (Firebase Auth)
import { authService } from '@/lib/firebase/auth';
await authService.signIn(email, password);
```

**Step 4: Server-Side Auth (Firebase Admin SDK)**

```typescript
// /src/lib/firebase/admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = getAuth();

// Verify ID token in API routes
export async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Unauthorized');
  }
}
```

**Step 5: Protect API Routes**

```typescript
// /src/app/api/players/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  // Get token from Authorization header
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedToken = await verifyAuthToken(token);
    const userId = decodedToken.uid;

    // Fetch players for this user
    const players = await playersService.getByParentId(userId);

    return NextResponse.json({ players });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

**Step 6: Password Migration Strategy**

**Option A: Lazy Migration (Recommended)**
- On first login attempt, check if user exists in old database
- If yes, verify password with bcrypt
- If valid, create Firebase Auth user with same email
- Delete old user from PostgreSQL
- Log user in with Firebase

**Option B: Bulk Password Reset**
- Send password reset emails to all users
- Users set new passwords in Firebase
- Simpler but requires user action

**Option A Implementation:**
```typescript
// /src/app/api/auth/legacy-login/route.ts
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma-legacy'; // Keep temporarily
import { authService } from '@/lib/firebase/auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Check if user exists in old database
  const oldUser = await prisma.user.findUnique({ where: { email } });

  if (oldUser && oldUser.password) {
    // Verify old password
    const isValid = await bcrypt.compare(password, oldUser.password);

    if (isValid) {
      // Create Firebase Auth user (this sets the password in Firebase)
      await authService.signUp(
        email,
        password, // Use same password
        oldUser.firstName,
        oldUser.lastName
      );

      // Delete old user
      await prisma.user.delete({ where: { id: oldUser.id } });

      // Sign in with Firebase
      const user = await authService.signIn(email, password);
      return NextResponse.json({ user });
    }
  }

  // Fall back to normal Firebase login
  try {
    const user = await authService.signIn(email, password);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
```

---

## ADK + A2A Agent Integration

### Agent Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Hustle Frontend                        │
│                    (Next.js + React)                       │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  Firebase Cloud Functions                  │
│                  (Genkit Flows - Node.js)                  │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  Agent Orchestration Layer                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Game      │  │   Coaching   │  │  Recruiting  │    │
│  │   Analysis   │  │    Agent     │  │    Agent     │    │
│  │    Agent     │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ Verification │  │   Performance Trends Agent      │  │
│  │    Agent     │  │                                  │  │
│  └──────────────┘  └──────────────────────────────────┘  │
│                                                             │
│                   A2A Protocol (v0.3+)                     │
│              gRPC + REST Communication                     │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│              Vertex AI Agent Engine Runtime                │
│                   (Fully Managed)                          │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  Vertex AI Gemini 2.5 Flash               │
└────────────────────────────────────────────────────────────┘
```

### Agent Definitions

**1. Game Analysis Agent**

```python
# /agents/game_analysis_agent.py
from adk import Agent, Tool
from google.cloud import firestore
from vertexai.generative_models import GenerativeModel

db = firestore.Client(project="hustleapp-production")

@Tool
def get_game_stats(user_id: str, player_id: str, game_id: str) -> dict:
    """Fetches game statistics from Firestore."""
    doc = db.collection('users').document(user_id) \
            .collection('players').document(player_id) \
            .collection('games').document(game_id).get()
    return doc.to_dict() if doc.exists else {}

@Tool
def analyze_performance(game_stats: dict) -> str:
    """Analyzes game performance using Gemini."""
    model = GenerativeModel("gemini-2.5-flash")

    prompt = f"""
    Analyze this soccer game performance:

    Goals: {game_stats.get('goals', 0)}
    Assists: {game_stats.get('assists', 0)}
    Minutes Played: {game_stats.get('minutesPlayed', 0)}
    Opponent: {game_stats.get('opponent', 'Unknown')}
    Result: {game_stats.get('result', 'Unknown')}

    Defensive Stats: {game_stats.get('defensiveStats', {})}
    Goalkeeper Stats: {game_stats.get('goalkeeperStats', {})}

    Provide:
    1. Overall performance rating (1-10)
    2. Key strengths
    3. Areas for improvement
    4. Specific recommendations
    """

    response = model.generate_content(prompt)
    return response.text

game_analysis_agent = Agent(
    name="GameAnalysisAgent",
    description="Analyzes soccer game statistics and provides coaching insights",
    tools=[get_game_stats, analyze_performance],
    model="gemini-2.5-flash",
    instruction="""
    You are an expert soccer coach with 20+ years of experience.
    Analyze game statistics and provide actionable insights.
    Focus on player development and specific improvement areas.
    Be encouraging but honest about performance.
    """
)

# Export for A2A
if __name__ == "__main__":
    from adk.a2a import A2AServer

    server = A2AServer(
        agents=[game_analysis_agent],
        port=8080
    )
    server.run()
```

**2. Coaching Agent**

```python
# /agents/coaching_agent.py
from adk import Agent, Tool
from vertexai.generative_models import GenerativeModel

@Tool
def generate_training_plan(player_position: str, weaknesses: list[str], age: int) -> str:
    """Generates a personalized training plan."""
    model = GenerativeModel("gemini-2.5-flash")

    prompt = f"""
    Create a 2-week training plan for a {age}-year-old soccer player:

    Position: {player_position}
    Areas to improve: {', '.join(weaknesses)}

    Include:
    - 5-7 specific drills
    - Duration for each drill
    - Equipment needed
    - Progression tips
    """

    response = model.generate_content(prompt)
    return response.text

@Tool
def suggest_drills(skill_area: str) -> list[dict]:
    """Suggests specific drills for a skill area."""
    # Implementation here
    pass

coaching_agent = Agent(
    name="CoachingAgent",
    description="Provides personalized training plans and drill recommendations",
    tools=[generate_training_plan, suggest_drills],
    model="gemini-2.5-flash",
    instruction="""
    You are a youth soccer training specialist.
    Create age-appropriate, effective training plans.
    Focus on skill development and player safety.
    """
)
```

**3. Recruiting Agent**

```python
# /agents/recruiting_agent.py
from adk import Agent, Tool

@Tool
def generate_recruiting_profile(player_data: dict) -> str:
    """Generates a recruiting profile highlighting key stats."""
    model = GenerativeModel("gemini-2.5-flash")

    prompt = f"""
    Create a compelling recruiting profile for:

    Player: {player_data['name']}
    Age: {player_data['age']}
    Position: {player_data['position']}
    Total Games: {player_data['totalGames']}
    Total Goals: {player_data['totalGoals']}
    Total Assists: {player_data['totalAssists']}
    Average Minutes/Game: {player_data['avgMinutes']}

    Season Stats: {player_data['seasonStats']}

    Write a 2-paragraph recruiting summary highlighting achievements.
    """

    response = model.generate_content(prompt)
    return response.text

recruiting_agent = Agent(
    name="RecruitingAgent",
    description="Generates recruiting profiles and highlight reels metadata",
    tools=[generate_recruiting_profile],
    model="gemini-2.5-flash",
)
```

**4. Verification Agent**

```python
# /agents/verification_agent.py
from adk import Agent, Tool

@Tool
def validate_stats(game_stats: dict) -> dict:
    """Validates game statistics for reasonableness."""
    issues = []

    # Check for impossible stats
    if game_stats['goals'] > 10:
        issues.append("Goals seem unusually high (>10)")

    if game_stats['assists'] > game_stats['goals'] * 2:
        issues.append("Assists higher than reasonable ratio to goals")

    if game_stats['minutesPlayed'] > 90:
        issues.append("Minutes played exceeds standard game length")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "recommendation": "Review with parent" if issues else "Stats look reasonable"
    }

verification_agent = Agent(
    name="VerificationAgent",
    description="Validates game statistics for accuracy",
    tools=[validate_stats],
    model="gemini-2.5-flash",
)
```

**5. Performance Trends Agent**

```python
# /agents/performance_trends_agent.py
from adk import Agent, Tool
import pandas as pd

@Tool
def analyze_trends(games_history: list[dict]) -> dict:
    """Analyzes performance trends over time."""
    df = pd.DataFrame(games_history)

    # Calculate trends
    recent_goals = df.tail(5)['goals'].mean()
    season_goals = df['goals'].mean()
    trend = "improving" if recent_goals > season_goals else "declining"

    return {
        "trend": trend,
        "recent_avg_goals": recent_goals,
        "season_avg_goals": season_goals,
        "insights": f"Player is {trend} in goal-scoring"
    }

performance_trends_agent = Agent(
    name="PerformanceTrendsAgent",
    description="Identifies patterns and trends in player performance",
    tools=[analyze_trends],
    model="gemini-2.5-flash",
)
```

### A2A Protocol Implementation

**Deploy All Agents with A2A Support:**

```python
# /agents/deploy_all_agents.py
from adk.a2a import A2AServer
from adk.deploy import AgentEngine
from game_analysis_agent import game_analysis_agent
from coaching_agent import coaching_agent
from recruiting_agent import recruiting_agent
from verification_agent import verification_agent
from performance_trends_agent import performance_trends_agent

# Create A2A server with all agents
a2a_server = A2AServer(
    agents=[
        game_analysis_agent,
        coaching_agent,
        recruiting_agent,
        verification_agent,
        performance_trends_agent,
    ],
    version="0.3",  # A2A Protocol version
    security={
        "auth_provider": "firebase",
        "allowed_origins": [
            "https://hustlestats.io",
            "https://hustleapp-production.web.app"
        ]
    }
)

# Deploy to Agent Engine (fully managed)
deployer = AgentEngine(
    project="hustleapp-production",
    location="us-central1",
    service_account="agent-engine-sa@hustleapp-production.iam.gserviceaccount.com"
)

deployment = deployer.deploy(
    server=a2a_server,
    name="hustle-agents",
    scaling={
        "min_instances": 1,
        "max_instances": 10,
        "target_cpu_utilization": 0.7
    },
    environment={
        "FIREBASE_PROJECT_ID": "hustleapp-production",
        "VERTEX_AI_LOCATION": "us-central1"
    }
)

print(f"Deployed agents to: {deployment.endpoint_url}")
print(f"A2A endpoint: {deployment.a2a_endpoint}")

# Save A2A endpoint to Firestore for frontend
from google.cloud import firestore
db = firestore.Client(project="hustleapp-production")

db.collection('config').document('agents').set({
    'a2a_endpoint': deployment.a2a_endpoint,
    'deployed_at': firestore.SERVER_TIMESTAMP,
    'agents': [
        {'name': 'GameAnalysisAgent', 'capabilities': ['analyze_game', 'get_insights']},
        {'name': 'CoachingAgent', 'capabilities': ['generate_plan', 'suggest_drills']},
        {'name': 'RecruitingAgent', 'capabilities': ['generate_profile']},
        {'name': 'VerificationAgent', 'capabilities': ['validate_stats']},
        {'name': 'PerformanceTrendsAgent', 'capabilities': ['analyze_trends']},
    ]
})
```

**Frontend Integration:**

```typescript
// /src/lib/agents/client.ts
import { A2AClient } from '@adk/a2a-client'; // From npm

// Initialize A2A client
const a2aClient = new A2AClient({
  endpoint: process.env.NEXT_PUBLIC_A2A_ENDPOINT, // From config
  authProvider: async () => {
    // Get Firebase ID token
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }
});

// Call Game Analysis Agent
export async function analyzeGame(userId: string, playerId: string, gameId: string) {
  const response = await a2aClient.call({
    agent: 'GameAnalysisAgent',
    tool: 'analyze_performance',
    input: {
      user_id: userId,
      player_id: playerId,
      game_id: gameId,
    }
  });

  return response.output;
}

// Call Coaching Agent
export async function generateTrainingPlan(position: string, weaknesses: string[], age: number) {
  const response = await a2aClient.call({
    agent: 'CoachingAgent',
    tool: 'generate_training_plan',
    input: {
      player_position: position,
      weaknesses,
      age,
    }
  });

  return response.output;
}

// Multi-agent workflow
export async function getPlayerInsights(userId: string, playerId: string) {
  // 1. Get recent games
  const games = await playersService.getRecentGames(userId, playerId);

  // 2. Analyze each game (parallel)
  const analyses = await Promise.all(
    games.map(game => analyzeGame(userId, playerId, game.id))
  );

  // 3. Get performance trends
  const trends = await a2aClient.call({
    agent: 'PerformanceTrendsAgent',
    tool: 'analyze_trends',
    input: { games_history: games }
  });

  // 4. Generate training recommendations
  const trainingPlan = await a2aClient.call({
    agent: 'CoachingAgent',
    tool: 'generate_training_plan',
    input: {
      player_position: games[0].position,
      weaknesses: trends.output.areas_to_improve,
      age: calculateAge(games[0].birthday)
    }
  });

  return {
    analyses,
    trends: trends.output,
    trainingPlan: trainingPlan.output,
  };
}
```

### A2A Security Configuration

```python
# /agents/a2a_security.py
from adk.a2a import SecurityCard, AuthProvider
from firebase_admin import auth

class FirebaseAuthProvider(AuthProvider):
    """Firebase Authentication provider for A2A."""

    async def verify_token(self, token: str) -> dict:
        """Verify Firebase ID token."""
        try:
            decoded_token = auth.verify_id_token(token)
            return {
                "user_id": decoded_token['uid'],
                "email": decoded_token.get('email'),
                "verified": True
            }
        except Exception as e:
            raise ValueError(f"Invalid token: {e}")

    async def create_security_card(self, user_info: dict) -> SecurityCard:
        """Create signed security card for user."""
        return SecurityCard(
            user_id=user_info['user_id'],
            scopes=['read:player_data', 'write:analysis'],
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=1),
            signature=self.sign(user_info)
        )

# Use in A2A server
a2a_server = A2AServer(
    agents=[...],
    auth_provider=FirebaseAuthProvider(),
    rate_limit={
        "requests_per_minute": 60,
        "requests_per_hour": 1000
    }
)
```

---

## Vertex AI Search Integration

### Setup Vertex AI Search Datastore

```bash
# 1. Enable Vertex AI Search API
gcloud services enable discoveryengine.googleapis.com --project=hustleapp-production

# 2. Create datastore
gcloud alpha discovery-engine data-stores create hustle-games-datastore \
  --location=global \
  --collection=default_collection \
  --industry-vertical=GENERIC \
  --project=hustleapp-production

# 3. Create search app
gcloud alpha discovery-engine engines create hustle-search-engine \
  --data-store-ids=hustle-games-datastore \
  --location=global \
  --collection=default_collection \
  --project=hustleapp-production
```

### Index Game Data

```typescript
// /src/lib/vertex-ai-search/indexer.ts
import { VertexAISearchClient } from '@google-cloud/discoveryengine';

const client = new VertexAISearchClient({
  projectId: 'hustleapp-production',
  location: 'global',
});

export async function indexGameData(userId: string, playerId: string) {
  // Fetch all games for player
  const games = await playersService.getAllGames(userId, playerId);

  // Format for Vertex AI Search
  const documents = games.map(game => ({
    id: `${userId}_${playerId}_${game.id}`,
    structData: {
      userId,
      playerId,
      playerName: game.playerName,
      date: game.date,
      opponent: game.opponent,
      result: game.result,
      goals: game.goals,
      assists: game.assists,
      minutesPlayed: game.minutesPlayed,
      position: game.position,
      teamClub: game.teamClub,
    },
    content: `
      ${game.playerName} played against ${game.opponent} on ${game.date}.
      Result: ${game.result}
      Stats: ${game.goals} goals, ${game.assists} assists in ${game.minutesPlayed} minutes.
      Position: ${game.position} for ${game.teamClub}.
    `
  }));

  // Bulk index
  await client.importDocuments({
    parent: 'projects/hustleapp-production/locations/global/collections/default_collection/dataStores/hustle-games-datastore',
    documents,
  });

  console.log(`Indexed ${documents.length} games`);
}

// Index on game creation
export async function onGameCreated(userId: string, playerId: string, gameId: string) {
  // Index this single game
  await indexGameData(userId, playerId);
}
```

### Semantic Search API

```typescript
// /src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { VertexAISearchClient } from '@google-cloud/discoveryengine';
import { verifyAuthToken } from '@/lib/firebase/admin';

const searchClient = new VertexAISearchClient({
  projectId: 'hustleapp-production',
  location: 'global',
});

export async function POST(request: NextRequest) {
  // Verify auth
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const decodedToken = await verifyAuthToken(token);
  const userId = decodedToken.uid;

  // Parse query
  const { query, filters } = await request.json();

  // Search
  const results = await searchClient.search({
    servingConfig: 'projects/hustleapp-production/locations/global/collections/default_collection/engines/hustle-search-engine/servingConfigs/default_config',
    query,
    filter: `userId="${userId}"`, // Only search user's data
    pageSize: 20,
  });

  return NextResponse.json({ results: results.results });
}
```

### Search UI Component

```typescript
// /src/components/search/game-search.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function GameSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getFirebaseToken()}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search games... (e.g., 'high scoring games last month')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="space-y-2">
        {results.map((result: any) => (
          <GameCard key={result.id} game={result.document.structData} />
        ))}
      </div>
    </div>
  );
}
```

---

## Implementation Roadmap

### Week 1-2: Foundation
- [ ] Create Firebase project and configure services
- [ ] Set up Firestore security rules
- [ ] Install Firebase SDKs in Next.js app
- [ ] Set up ADK Python environment
- [ ] Install Agent Starter Pack
- [ ] Configure environment variables

### Week 3-4: Database Migration
- [ ] Design Firestore schema
- [ ] Create Firestore service layer
- [ ] Write data migration script
- [ ] Test migration on dev data
- [ ] Migrate production data
- [ ] Update all API routes

### Week 5-6: Authentication
- [ ] Implement Firebase Auth service
- [ ] Update frontend auth flows
- [ ] Migrate user passwords (lazy migration)
- [ ] Test email verification
- [ ] Test password reset
- [ ] Remove NextAuth dependencies

### Week 7-8: Agent Development
- [ ] Create 5 ADK agents
- [ ] Test agents locally
- [ ] Implement A2A server
- [ ] Deploy to Agent Engine
- [ ] Configure security and rate limits
- [ ] Test A2A endpoints

### Week 9: Genkit Integration
- [ ] Install Genkit in Cloud Functions
- [ ] Create Genkit flows for AI features
- [ ] Integrate with agents
- [ ] Test flows end-to-end
- [ ] Deploy to Firebase Functions

### Week 10: Vertex AI Search
- [ ] Set up Vertex AI Search datastore
- [ ] Create indexing pipeline
- [ ] Index existing game data
- [ ] Implement search API
- [ ] Build search UI
- [ ] Test semantic search

### Week 11-12: Testing & Optimization
- [ ] Update all E2E tests
- [ ] Load testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment

---

## Risk Assessment

### High Risk

**1. Data Loss During Migration**
- **Mitigation**: Full PostgreSQL backup before migration, gradual rollout, rollback plan
- **Contingency**: Keep PostgreSQL running in parallel for 1 month

**2. Password Migration Issues**
- **Mitigation**: Lazy migration with fallback, clear user communication
- **Contingency**: Bulk password reset as backup option

**3. Agent Engine Costs**
- **Mitigation**: Set budget alerts, implement rate limiting, monitor usage
- **Contingency**: Scale down to Cloud Run if costs exceed budget

### Medium Risk

**4. A2A Protocol Learning Curve**
- **Mitigation**: Use Agent Starter Pack templates, follow official docs closely
- **Contingency**: Start with simple agents, add A2A complexity gradually

**5. Firestore Query Performance**
- **Mitigation**: Design proper indexes, test with production-scale data
- **Contingency**: Add caching layer if needed

**6. Auth Flow Disruption**
- **Mitigation**: Thorough testing of all auth flows before production
- **Contingency**: Keep NextAuth code in branch for quick rollback

### Low Risk

**7. Cloud Storage Costs**
- **Mitigation**: Implement lifecycle policies, compress images
- **Contingency**: Limit photo uploads or implement paid tiers

**8. Vertex AI Search Accuracy**
- **Mitigation**: Test with diverse queries, tune search parameters
- **Contingency**: Fall back to Firestore queries if search quality is poor

---

## Resources & References

### Official Documentation

**Firebase:**
- Firebase Docs: https://firebase.google.com/docs
- Firestore: https://firebase.google.com/docs/firestore
- Firebase Auth: https://firebase.google.com/docs/auth
- Cloud Storage: https://firebase.google.com/docs/storage
- Genkit: https://firebase.google.com/docs/genkit

**Google Cloud Agent Stack:**
- ADK Docs: https://google.github.io/adk-docs/
- ADK Python: https://github.com/google/adk-python
- ADK Samples: https://github.com/google/adk-samples
- Agent Starter Pack: https://github.com/GoogleCloudPlatform/agent-starter-pack ⭐
- Agent Engine: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview

**A2A Protocol:**
- A2A GitHub: https://github.com/a2aproject/A2A
- A2A Spec v0.3: https://github.com/a2aproject/A2A/blob/main/spec.md
- Linux Foundation Project: https://www.linuxfoundation.org/press/a2a-protocol

**Vertex AI:**
- Vertex AI Search: https://cloud.google.com/generative-ai-app-builder/docs/enterprise-search-introduction
- Gemini API: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini

### GitHub Templates & Examples

**Must-Use Templates:**
1. **Agent Starter Pack** ⭐⭐⭐
   `GoogleCloudPlatform/agent-starter-pack`
   Production-ready agent templates with CI/CD, evaluation, observability

2. **ADK Samples**
   `google/adk-samples`
   Official Google ADK agent examples

3. **Awesome ADK Agents**
   `Sri-Krishna-V/awesome-adk-agents`
   90+ production-ready agents and templates

4. **A2A Examples**
   Google Codelabs: https://codelabs.developers.google.com/intro-a2a-purchasing-concierge

### Reference Projects

**DiagnosticPro (Internal):**
- Location: `/home/jeremy/000-projects/diagnostic-platform/DiagnosticPro`
- Firebase config: `06-infrastructure/firebase/firebase.json`
- Firestore service: `02-src/frontend/src/src/services/firestore.ts`
- Successfully migrated from Supabase to Firebase/Firestore
- Uses Firebase Auth + Cloud Functions + Vertex AI Gemini

### Key Learnings from DiagnosticPro

1. **Service Layer Pattern**: Create typed service layers for each collection
2. **Timestamp Conversion**: Always convert Firestore Timestamps to ISO strings
3. **Security Rules**: Test rules thoroughly before production
4. **Firebase Functions**: Use Node.js 20 runtime for best performance
5. **Vertex AI Integration**: Use Cloud Storage for file uploads before processing

---

## Next Steps

### Immediate Actions (This Week)

1. **Review and Approve This Strategy**
   - Stakeholder review
   - Budget approval for Agent Engine costs
   - Timeline confirmation

2. **Set Up Development Environment**
   - Create Firebase development project
   - Install all required tools
   - Clone Agent Starter Pack

3. **Prototype First Agent**
   - Build simple Game Analysis Agent
   - Test locally with ADK
   - Deploy to Agent Engine
   - Verify A2A endpoint works

4. **Schema Design Review**
   - Review Firestore schema with team
   - Validate with example queries
   - Confirm index requirements

### Critical Decisions Needed

1. **Password Migration Strategy**: Lazy migration or bulk reset?
2. **Agent Engine Budget**: What's the monthly budget limit?
3. **Rollout Strategy**: Big bang or gradual feature-by-feature?
4. **Rollback Plan**: How long to keep PostgreSQL running in parallel?

---

## Conclusion

This migration represents a significant architectural shift from a traditional PostgreSQL + NextAuth stack to a modern, serverless, AI-first architecture leveraging Firebase, Google Agent Engine, and the A2A protocol.

**Key Benefits:**
- ✅ Serverless, auto-scaling infrastructure
- ✅ Real-time capabilities for live game tracking
- ✅ AI-powered game analysis and coaching insights
- ✅ A2A Protocol for agent interoperability (non-negotiable requirement met)
- ✅ Unified Google Cloud ecosystem
- ✅ Better mobile app readiness

**Timeline**: 9-12 weeks
**Risk Level**: Medium (mitigated with proper planning and testing)
**Cost**: Estimated $200-500/month (Firebase + Agent Engine)

**Recommendation**: Proceed with migration using phased approach outlined in this document. Start with development environment setup and first agent prototype to validate approach before committing to full migration.

---

**Document Version**: 1.0
**Created By**: Claude (AI Assistant)
**Created**: 2025-11-07
**Status**: Planning / Awaiting Approval
**Next Review**: After stakeholder feedback

---

**Related Documents:**
- `CLAUDE.md` - Current Hustle architecture
- `/home/jeremy/000-projects/diagnostic-platform/DiagnosticPro/CLAUDE.md` - DiagnosticPro Firebase reference
- `/home/jeremy/GCP_PROJECT_MAPPING.md` - GCP project configuration

**Appendices:**
- Appendix A: Cost Estimation Spreadsheet (TODO)
- Appendix B: Firestore Security Rules Full Spec (TODO)
- Appendix C: Agent Testing Checklist (TODO)
- Appendix D: Migration Rollback Procedure (TODO)
