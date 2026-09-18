# Hustle Code Patterns & Examples

**Last Updated:** 2025-11-08  
**Purpose:** Common patterns, code snippets, and architectural examples

---

## 1. API Route Pattern

### Standard API Route Structure
**File:** `src/app/api/[feature]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate request
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing playerId parameter' },
        { status: 400 }
      );
    }

    // 3. Query database
    const data = await prisma.game.findMany({
      where: {
        playerId,
        player: { parentId: session.user.id },
      },
      orderBy: { date: 'desc' },
    });

    // 4. Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate with Zod
    const validatedData = gameSchema.parse(body);

    const game = await prisma.game.create({
      data: {
        ...validatedData,
        playerId: body.playerId,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 2. Authentication Pattern

### NextAuth Configuration
**File:** `src/lib/auth.ts`

```typescript
import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error(
            "Please verify your email before logging in."
          );
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        // Add other user properties if needed
      }
      return session;
    },
  },
});
```

---

## 3. Email Service Pattern

### Sending Emails with Resend
**File:** `src/lib/email.ts`

```typescript
import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY || 'dummy-key-for-build';
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const { data, error } = await getResendClient().emails.send({
    from: process.env.EMAIL_FROM || 'HUSTLE <noreply@hustle.app>',
    to: email,
    subject: 'Verify your Hustle account',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>Link expires in 24 hours.</p>
    `,
  });

  if (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
```

---

## 4. Zod Validation Pattern

### Schema Definition & Validation
**File:** `src/lib/validations/game-schema.ts`

```typescript
import { z } from 'zod';

export const gameSchema = z.object({
  date: z.string().datetime().optional(),
  opponent: z.string().min(1, 'Opponent name is required'),
  result: z.enum(['Win', 'Loss', 'Draw']),
  finalScore: z.string().regex(/^\d+-\d+$/, 'Score must be in format X-Y'),
  minutesPlayed: z.number().int().min(0).max(120),
  
  // Universal stats
  goals: z.number().int().min(0).default(0),
  assists: z.number().int().min(0).default(0),
  
  // Defensive stats (optional)
  tackles: z.number().int().min(0).optional(),
  interceptions: z.number().int().min(0).optional(),
  clearances: z.number().int().min(0).optional(),
  blocks: z.number().int().min(0).optional(),
  aerialDuelsWon: z.number().int().min(0).optional(),
  
  // Goalkeeper stats (optional)
  saves: z.number().int().min(0).optional(),
  goalsAgainst: z.number().int().min(0).optional(),
  cleanSheet: z.boolean().optional(),
});

export type GameInput = z.infer<typeof gameSchema>;

// Usage in API
const validatedData = gameSchema.parse(body);
```

---

## 5. Database Query Patterns

### Prisma Query Examples

**Get user with relations:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    players: {
      include: {
        games: {
          orderBy: { date: 'desc' },
          take: 10, // Latest 10 games
        },
      },
    },
  },
});
```

**Get player with stats:**
```typescript
const player = await prisma.player.findUnique({
  where: { id: playerId },
  include: {
    games: {
      where: { verified: true },
      orderBy: { date: 'desc' },
    },
  },
});

// Calculate stats
const totalGames = player.games.length;
const totalGoals = player.games.reduce((sum, g) => sum + g.goals, 0);
const avgGoalsPerGame = totalGoals / totalGames;
```

**List players with pagination:**
```typescript
const players = await prisma.player.findMany({
  where: { parentId: userId },
  include: { games: { select: { id: true } } },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
});

const total = await prisma.player.count({
  where: { parentId: userId },
});
```

**Batch operations:**
```typescript
// Create multiple games in transaction
const games = await prisma.$transaction(
  gameRecords.map(record =>
    prisma.game.create({ data: record })
  )
);
```

---

## 6. React Component Pattern

### Server Component with Data Fetching
**File:** `src/app/dashboard/page.tsx`

```typescript
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch data on server
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      players: {
        include: {
          games: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user.firstName}</h1>
      <section className="players">
        {user.players.map(player => (
          <div key={player.id} className="player-card">
            <h2>{player.name}</h2>
            <p>Position: {player.position}</p>
            <div className="recent-games">
              {player.games.map(game => (
                <div key={game.id} className="game-item">
                  {game.opponent} - {game.result}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
```

### Client Component with Interactivity
**File:** `src/components/player-list.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Player } from '@prisma/client';

interface PlayerListProps {
  initialPlayers: Player[];
  userId: string;
}

export function PlayerList({ initialPlayers, userId }: PlayerListProps) {
  const [players, setPlayers] = useState(initialPlayers);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async (playerId: string) => {
    if (!confirm('Delete player?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setPlayers(p => p.filter(player => player.id !== playerId));
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete player');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="player-list">
      {players.map(player => (
        <div key={player.id} className="player-item">
          <h3>{player.name}</h3>
          <button
            onClick={() => handleDelete(player.id)}
            disabled={isLoading}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 7. Testing Patterns

### Unit Test with Vitest
**File:** `src/lib/game-utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePlayerStats, getRating } from './game-utils';

describe('Game Utils', () => {
  describe('calculatePlayerStats', () => {
    it('should calculate total goals correctly', () => {
      const games = [
        { goals: 2, assists: 1 },
        { goals: 1, assists: 2 },
        { goals: 0, assists: 0 },
      ];

      const stats = calculatePlayerStats(games);
      expect(stats.totalGoals).toBe(3);
    });

    it('should handle empty games array', () => {
      const stats = calculatePlayerStats([]);
      expect(stats.totalGoals).toBe(0);
      expect(stats.gamesPlayed).toBe(0);
    });
  });

  describe('getRating', () => {
    it('should return correct rating based on stats', () => {
      const rating = getRating({ goals: 10, assists: 5, gamesPlayed: 5 });
      expect(rating).toBeGreaterThan(0);
      expect(rating).toBeLessThanOrEqual(10);
    });
  });
});
```

### E2E Test with Playwright
**File:** `03-Tests/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL('/verify-email');
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'verified@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});
```

---

## 8. Environment Configuration Pattern

### Environment Validation
**File:** `src/config/env.mjs`

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  // Required
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 chars'),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),

  // Google Cloud
  GCP_PROJECT: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // App
  NODE_ENV: z.enum(['development', 'production']).optional(),
  APP_VERSION: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
```

---

## 9. Error Handling Pattern

### Custom Error Class
**File:** `src/lib/errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  details?: unknown;
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// Usage
try {
  if (!session) {
    throw new UnauthorizedError('Not authenticated');
  }
} catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
}
```

---

## 10. NWSL Pipeline Pattern

### Render Script Example
**File:** `nwsl/050-scripts/veo_render.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
: "${PROJECT_ID:?missing}"
: "${REGION:=us-central1}"
: "${DRY_RUN:=false}"

MODEL_ID="veo-3.0-generate-001"
VEO_MODEL="projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL_ID}"

# Load canon specification
load_prompt() {
    local n="$1"
    local p="./docs/$(printf '%03d' $((3+n)))-DR-REFF-veo-seg-$(printf '%02d' $n).md"
    
    [[ -f "$p" ]] || { echo "[FATAL] missing canon: $p" >&2; exit 1; }
    
    # Extract prompt from document
    awk '/^---$/,/^(Conditioning:|Aspect:|Audio:)/ {print}' "$p"
}

# Submit Veo API request
submit_veo() {
    local prompt="$1"
    local dur="$2"
    
    echo "Submitting to Veo API..."
    
    local body=$(jq -n \
        --arg p "$prompt" \
        --argjson d "$dur" \
        '{
            instances: [{ prompt: $p }],
            parameters: {
                aspectRatio: "16:9",
                resolution: "1080p",
                durationSeconds: $d,
                generateAudio: false,
                sampleCount: 1
            }
        }')
    
    curl -X POST \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "Content-Type: application/json" \
        "https://${REGION}-aiplatform.googleapis.com/v1/${VEO_MODEL}:predictLongRunning" \
        -d "$body"
}

# Main loop
for i in {1..8}; do
    echo "Processing segment $i..."
    prompt=$(load_prompt $i)
    submit_veo "$prompt" "8.0"
done

echo "All segments submitted!"
```

---

## 11. Logging Pattern

### Structured Logging
**File:** `src/lib/logger.ts`

```typescript
export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...context,
    }));
  },

  error: (message: string, error?: Error, context?: Record<string, any>) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      ...context,
    }));
  },

  warn: (message: string, context?: Record<string, any>) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...context,
    }));
  },
};

// Usage
logger.info('User registered', { userId: user.id, email: user.email });
logger.error('Database connection failed', error, { service: 'prisma' });
```

---

## 12. Type Definitions Pattern

### Shared Types
**File:** `src/types/index.ts`

```typescript
import type { User, Player, Game } from '@prisma/client';

export type UserWithPlayers = User & {
  players: PlayerWithGames[];
};

export type PlayerWithGames = Player & {
  games: Game[];
};

export type GameStats = {
  totalGames: number;
  totalGoals: number;
  totalAssists: number;
  avgGoalsPerGame: number;
  avgAssistsPerGame: number;
  winRate: number;
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## Common Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # Run ESLint
npm run test:unit             # Unit tests
npm run test:e2e              # E2E tests
npm run test:watch            # Watch mode

# Database
npx prisma studio             # Prisma Studio
npx prisma migrate dev         # Create migration
npx prisma generate           # Generate Prisma client

# Docker
docker build -t hustle:latest .
docker run -p 8080:8080 -e DATABASE_URL=... hustle:latest

# Deployment
gcloud run deploy hustle-app --source . --region us-central1
```

---

Generated: 2025-11-08  
Code Patterns Document: Complete
