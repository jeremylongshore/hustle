# Security Fixes Action Plan - Game Logging Feature

**Date:** 2025-10-09
**Priority:** CRITICAL
**Estimated Time:** 4-6 hours
**Status:** PENDING IMPLEMENTATION

---

## OVERVIEW

This document provides **specific code changes** to fix the 5 CRITICAL and 2 HIGH-severity vulnerabilities identified in the Game Logging security review.

**Reference:** `/claudes-docs/SECURITY-REVIEW-GAME-LOGGING-2025-10-09.md`

---

## CRITICAL FIX 1: SERVER-SIDE VALIDATION

**File:** `/src/app/api/games/route.ts`
**Lines:** 78-98 (replace existing validation)
**Time Estimate:** 30 minutes

### Current Code (INSUFFICIENT):
```typescript
const body = await request.json()
const {
  playerId,
  date,
  opponent,
  result,
  finalScore,
  minutesPlayed,
  goals,
  assists,
  saves,
  goalsAgainst,
  cleanSheet
} = body

// Validation
if (!playerId || !opponent || !result || !finalScore || minutesPlayed === undefined) {
  return NextResponse.json({
    error: 'Missing required fields'
  }, { status: 400 })
}
```

### Fixed Code (SECURE):
```typescript
import { gameSchema } from '@/lib/validations/game-schema';

const body = await request.json();

// SERVER-SIDE VALIDATION (CRITICAL)
const validationResult = gameSchema.safeParse({
  playerId: body.playerId,
  date: body.date || new Date().toISOString().split('T')[0],
  opponent: body.opponent,
  result: body.result,
  yourScore: parseInt(body.finalScore?.split('-')[0]) || 0,
  opponentScore: parseInt(body.finalScore?.split('-')[1]) || 0,
  minutesPlayed: body.minutesPlayed,
  goals: body.goals || 0,
  assists: body.assists || 0,
  saves: body.saves || 0,
  goalsAgainst: body.goalsAgainst || 0,
  cleanSheet: body.cleanSheet || false
});

if (!validationResult.success) {
  return NextResponse.json({
    error: 'Invalid input data',
    details: validationResult.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  }, { status: 400 });
}

const validatedData = validationResult.data;
```

**Benefits:**
- Enforces max values (goals ≤ 20, assists ≤ 20, saves ≤ 50)
- Validates opponent name length (3-100 chars)
- Type-safe data handling
- Prevents data manipulation attacks

---

## CRITICAL FIX 2: RATE LIMITING

**File:** `/src/app/api/games/route.ts`
**Location:** After ownership validation (line 116), before game creation
**Time Estimate:** 45 minutes

### Add Rate Limiting Code:
```typescript
// After ownership validation (line 116)
if (player.parentId !== session.user.id) {
  return NextResponse.json({
    error: 'Forbidden - Not your player'
  }, { status: 403 })
}

// RATE LIMITING (CRITICAL) - Add this section
const twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

const recentGamesCount = await prisma.game.count({
  where: {
    playerId: validatedData.playerId,
    createdAt: {
      gte: twentyFourHoursAgo
    }
  }
});

if (recentGamesCount >= 10) {
  return NextResponse.json({
    error: 'Rate limit exceeded. Maximum 10 games can be logged per athlete per day.',
    retryAfter: 'Please try again in 24 hours'
  }, { status: 429 });
}

// Continue with game creation...
```

**Benefits:**
- Prevents database flooding
- Limits abuse to 10 games/athlete/day
- Reasonable for soccer (typically 1-2 games per week)
- Business logic validation

---

## CRITICAL FIX 3: HTTPS ENFORCEMENT

**File:** `/next.config.ts`
**Action:** Replace entire file
**Time Estimate:** 30 minutes

### Current Code (INSECURE):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
```

### Fixed Code (SECURE):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // SECURITY: Enforce HTTPS and add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },

  async redirects() {
    // Only apply HTTPS redirect in production
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://:host/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
```

**Additional Required Changes:**

**File:** `.env.local` (production environment)
```bash
# Update from HTTP to HTTPS
NEXT_PUBLIC_API_DOMAIN=https://your-domain.com
NEXT_PUBLIC_WEBSITE_DOMAIN=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

**Benefits:**
- Forces HTTPS in production
- Adds security headers (HSTS, X-Frame-Options, etc.)
- Prevents downgrade attacks
- Protects session cookies and passwords

---

## HIGH FIX 1: XSS SANITIZATION

**File:** `/src/app/api/games/route.ts`
**Location:** Game creation data preparation (line 120-132)
**Time Estimate:** 15 minutes

### Current Code (VULNERABLE):
```typescript
const game = await prisma.game.create({
  data: {
    playerId,
    date: date ? new Date(date) : new Date(),
    opponent,  // ❌ Unsanitized
    result,
    // ...
  }
})
```

### Fixed Code (SECURE):
```typescript
// Sanitize opponent name (remove HTML tags)
const sanitizeString = (str: string): string => {
  return str.replace(/<[^>]*>/g, '').trim();
};

const game = await prisma.game.create({
  data: {
    playerId: validatedData.playerId,
    date: validatedData.date ? new Date(validatedData.date) : new Date(),
    opponent: sanitizeString(validatedData.opponent),  // ✅ Sanitized
    result: validatedData.result,
    finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
    minutesPlayed: validatedData.minutesPlayed,
    goals: validatedData.goals,
    assists: validatedData.assists || 0,
    saves: validatedData.saves || null,
    goalsAgainst: validatedData.goalsAgainst || null,
    cleanSheet: validatedData.cleanSheet || null,
    verified: false
  },
  include: {
    player: {
      select: {
        name: true,
        position: true
      }
    }
  }
});
```

**Benefits:**
- Removes potential XSS attack vectors
- Cleans opponent names for display
- Prevents script injection

---

## HIGH FIX 2: DATE VALIDATION

**File:** `/src/app/api/games/route.ts`
**Location:** After rate limiting check, before game creation
**Time Estimate:** 20 minutes

### Add Date Validation:
```typescript
// After rate limiting check

// VALIDATE DATE RANGE
const gameDate = validatedData.date ? new Date(validatedData.date) : new Date();
const now = new Date();

// Check if date is in the future
if (gameDate > now) {
  return NextResponse.json({
    error: 'Invalid date: Game date cannot be in the future'
  }, { status: 400 });
}

// Check if date is too far in the past (5 years)
const fiveYearsAgo = new Date();
fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

if (gameDate < fiveYearsAgo) {
  return NextResponse.json({
    error: 'Invalid date: Game must be within the last 5 years'
  }, { status: 400 });
}

// Continue with game creation...
```

**Benefits:**
- Prevents future-dated games
- Prevents ancient games (data quality)
- Reasonable business logic validation

---

## MEDIUM FIX: GENERIC ERROR MESSAGES

**File:** `/src/app/api/games/route.ts`
**Location:** Lines 106-116 (ownership validation error)
**Time Estimate:** 5 minutes

### Current Code (INFORMATION DISCLOSURE):
```typescript
if (!player) {
  return NextResponse.json({
    error: 'Player not found'
  }, { status: 404 })
}

if (player.parentId !== session.user.id) {
  return NextResponse.json({
    error: 'Forbidden - Not your player'  // ❌ Confirms player exists
  }, { status: 403 })
}
```

### Fixed Code (SECURE):
```typescript
if (!player || player.parentId !== session.user.id) {
  return NextResponse.json({
    error: 'Player not found or access denied'  // ✅ Generic
  }, { status: 404 })  // Use 404 for both cases
}
```

**Benefits:**
- Prevents account enumeration
- No confirmation that player exists
- Better privacy

---

## COMPLETE FIXED CODE

Here's the complete fixed `/src/app/api/games/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { gameSchema } from '@/lib/validations/game-schema'

// Helper function to sanitize strings
const sanitizeString = (str: string): string => {
  return str.replace(/<[^>]*>/g, '').trim();
};

// GET /api/games?playerId=xxx - Get all games for a player
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({
        error: 'playerId is required'
      }, { status: 400 })
    }

    // Verify player belongs to authenticated user
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { parentId: true }
    });

    if (!player || player.parentId !== session.user.id) {
      return NextResponse.json({
        error: 'Player not found or access denied'
      }, { status: 404 })
    }

    const games = await prisma.game.findMany({
      where: { playerId },
      orderBy: { date: 'desc' },
      include: {
        player: {
          select: {
            name: true,
            position: true
          }
        }
      }
    })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({
      error: 'Failed to fetch games'
    }, { status: 500 })
  }
}

// POST /api/games - Create a new game log
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // CRITICAL FIX 1: SERVER-SIDE VALIDATION
    const validationResult = gameSchema.safeParse({
      playerId: body.playerId,
      date: body.date || new Date().toISOString().split('T')[0],
      opponent: body.opponent,
      result: body.result,
      yourScore: parseInt(body.finalScore?.split('-')[0]) || 0,
      opponentScore: parseInt(body.finalScore?.split('-')[1]) || 0,
      minutesPlayed: body.minutesPlayed,
      goals: body.goals || 0,
      assists: body.assists || 0,
      saves: body.saves || 0,
      goalsAgainst: body.goalsAgainst || 0,
      cleanSheet: body.cleanSheet || false
    });

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid input data',
        details: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Verify player exists AND belongs to authenticated user
    const player = await prisma.player.findUnique({
      where: { id: validatedData.playerId },
      select: { parentId: true, position: true }
    })

    // MEDIUM FIX: Generic error message (prevents enumeration)
    if (!player || player.parentId !== session.user.id) {
      return NextResponse.json({
        error: 'Player not found or access denied'
      }, { status: 404 })
    }

    // CRITICAL FIX 2: RATE LIMITING
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentGamesCount = await prisma.game.count({
      where: {
        playerId: validatedData.playerId,
        createdAt: {
          gte: twentyFourHoursAgo
        }
      }
    });

    if (recentGamesCount >= 10) {
      return NextResponse.json({
        error: 'Rate limit exceeded. Maximum 10 games can be logged per athlete per day.',
        retryAfter: 'Please try again in 24 hours'
      }, { status: 429 });
    }

    // HIGH FIX: DATE VALIDATION
    const gameDate = validatedData.date ? new Date(validatedData.date) : new Date();
    const now = new Date();

    if (gameDate > now) {
      return NextResponse.json({
        error: 'Invalid date: Game date cannot be in the future'
      }, { status: 400 });
    }

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    if (gameDate < fiveYearsAgo) {
      return NextResponse.json({
        error: 'Invalid date: Game must be within the last 5 years'
      }, { status: 400 });
    }

    // Create game log with sanitized data
    const game = await prisma.game.create({
      data: {
        playerId: validatedData.playerId,
        date: gameDate,
        opponent: sanitizeString(validatedData.opponent), // HIGH FIX: XSS prevention
        result: validatedData.result,
        finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
        minutesPlayed: validatedData.minutesPlayed,
        goals: validatedData.goals,
        assists: validatedData.assists || 0,
        saves: validatedData.saves || null,
        goalsAgainst: validatedData.goalsAgainst || null,
        cleanSheet: validatedData.cleanSheet || null,
        verified: false
      },
      include: {
        player: {
          select: {
            name: true,
            position: true
          }
        }
      }
    })

    // Audit log (for security monitoring)
    console.log('[AUDIT] Game created:', {
      userId: session.user.id,
      playerId: validatedData.playerId,
      gameId: game.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      game
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({
      error: 'Failed to create game'
    }, { status: 500 })
  }
}
```

---

## TESTING CHECKLIST

After implementing fixes, test each threat scenario:

### Test 1: Server-Side Validation
```bash
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "valid-id",
    "opponent": "Test Team",
    "result": "Win",
    "finalScore": "3-2",
    "minutesPlayed": 90,
    "goals": 999
  }'

Expected: 400 Bad Request with "Goals must be 20 or less"
```

### Test 2: Rate Limiting
```bash
# Create 10 games (should succeed)
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/games \
    -H "Content-Type: application/json" \
    -d '{...}'
done

# 11th game (should fail)
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -d '{...}'

Expected: 429 Too Many Requests
```

### Test 3: XSS Prevention
```bash
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "opponent": "<script>alert(\"XSS\")</script>",
    ...
  }'

Expected: 201 Created, but opponent stored as "alert(\"XSS\")" (tags removed)
```

### Test 4: Date Validation
```bash
# Future date
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-01",
    ...
  }'

Expected: 400 Bad Request "date cannot be in the future"
```

### Test 5: HTTPS Redirect (Production Only)
```bash
curl -I http://your-domain.com/dashboard

Expected: 301 Moved Permanently to https://your-domain.com/dashboard
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All code changes implemented
- [ ] Tests passing (all 5 threat scenarios)
- [ ] Environment variables updated (.env.local → HTTPS URLs)
- [ ] next.config.ts updated with security headers
- [ ] Database connection uses SSL (DATABASE_URL has sslmode=require)

### Cloud Run Deployment
- [ ] Custom domain configured with SSL certificate
- [ ] Ingress set to "all" or "internal-and-cloud-load-balancing"
- [ ] Environment variables updated in Cloud Run (HTTPS URLs)
- [ ] NEXTAUTH_URL set to https://your-domain.com
- [ ] Health check endpoint responding
- [ ] SSL certificate valid and not expiring soon

### Post-Deployment Verification
- [ ] HTTPS redirect working (HTTP → HTTPS)
- [ ] Security headers present (check with curl -I)
- [ ] Game creation working via UI
- [ ] Rate limiting enforced (test with 11 games)
- [ ] XSS attacks blocked (test with script tags)
- [ ] Error messages generic (no info disclosure)

---

## ESTIMATED TIMELINE

| Task | Time | Priority |
|------|------|----------|
| Server-side validation | 30 min | CRITICAL |
| Rate limiting | 45 min | CRITICAL |
| HTTPS enforcement | 30 min | CRITICAL |
| XSS sanitization | 15 min | HIGH |
| Date validation | 20 min | HIGH |
| Generic error messages | 5 min | MEDIUM |
| Testing (all scenarios) | 60 min | CRITICAL |
| Deployment + verification | 45 min | CRITICAL |

**Total Estimated Time:** 4 hours 10 minutes

---

## ROLLBACK PLAN

If issues arise after deployment:

1. **Immediate Rollback:**
   ```bash
   # Revert to previous Cloud Run revision
   gcloud run services update-traffic hustle-app \
     --to-revisions=PREVIOUS_REVISION=100 \
     --region=us-central1
   ```

2. **Partial Rollback:**
   - Disable rate limiting (comment out if causing issues)
   - Keep other security fixes active

3. **Emergency Hotfix:**
   - Create hotfix branch from production
   - Apply minimal fix
   - Fast-track through testing

---

## SUCCESS CRITERIA

**Security Review PASSES when:**
- ✅ All 3 CRITICAL fixes implemented
- ✅ All 2 HIGH fixes implemented
- ✅ All 5 threat scenarios blocked
- ✅ HTTPS enforced in production
- ✅ No regressions in existing functionality
- ✅ Security checklist 100% complete

---

## CONTACT

**Implementation Questions:** Refer to security review document
**Testing Issues:** See testing checklist above
**Deployment Issues:** Follow rollback plan

---

**Document Status:** READY FOR IMPLEMENTATION
**Last Updated:** 2025-10-09
**Next Review:** After fixes deployed to production
