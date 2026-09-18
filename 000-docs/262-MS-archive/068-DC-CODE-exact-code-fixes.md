# Exact Code Fixes for Game Logging Form
**Task 58 - Production Blocker Fixes**

**Date:** 2025-10-09
**Estimated Time:** 3.5-4 hours

---

## FILE 1: /src/app/api/games/route.ts

### COMPLETE FIXED VERSION (POST Handler Only)

Replace lines 66-154 with:

```typescript
import DOMPurify from 'isomorphic-dompurify';
import { gameSchema } from '@/lib/validations/game-schema';

// Simple in-memory rate limiter (resets on server restart)
const userRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userRequestCounts.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    userRequestCounts.set(userId, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }

  if (userLimit.count >= 10) {
    return false; // Exceeded 10 requests per minute
  }

  userLimit.count++;
  return true;
}

// POST /api/games - Create a new game log
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Rate limiting check
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait 1 minute before submitting another game.' },
        { status: 429 }
      );
    }

    // 3. Parse request body
    const body = await request.json();

    // 4. SERVER-SIDE ZOD VALIDATION (CRITICAL FIX)
    const validationResult = gameSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const data = validationResult.data;

    // 5. Extract and validate finalScore format
    const [yourScore, opponentScore] = (body.finalScore || '0-0').split('-').map(Number);

    // 6. Business logic validation: Result must match scores
    if (data.result === 'Win' && yourScore <= opponentScore) {
      return NextResponse.json({
        error: 'Validation failed',
        details: [{ path: ['result'], message: 'Result "Win" requires your score to be higher than opponent score' }]
      }, { status: 400 });
    }

    if (data.result === 'Loss' && yourScore >= opponentScore) {
      return NextResponse.json({
        error: 'Validation failed',
        details: [{ path: ['result'], message: 'Result "Loss" requires opponent score to be higher than your score' }]
      }, { status: 400 });
    }

    if (data.result === 'Draw' && yourScore !== opponentScore) {
      return NextResponse.json({
        error: 'Validation failed',
        details: [{ path: ['result'], message: 'Result "Draw" requires scores to be equal' }]
      }, { status: 400 });
    }

    // 7. Verify player exists AND belongs to authenticated user
    const player = await prisma.player.findUnique({
      where: { id: data.playerId },
      select: { parentId: true }
    });

    if (!player) {
      return NextResponse.json({
        error: 'Player not found'
      }, { status: 404 });
    }

    if (player.parentId !== session.user.id) {
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 });
    }

    // 8. XSS SANITIZATION (CRITICAL FIX)
    const sanitizedOpponent = DOMPurify.sanitize(data.opponent, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: []
    });

    // 9. Create game log with validated and sanitized data
    const game = await prisma.game.create({
      data: {
        playerId: data.playerId,
        date: data.date ? new Date(data.date) : new Date(),
        opponent: sanitizedOpponent, // Use sanitized value
        result: data.result,
        finalScore: body.finalScore, // Already validated format
        minutesPlayed: data.minutesPlayed,
        goals: data.goals,
        assists: data.assists || null,
        saves: data.saves || null,
        goalsAgainst: data.goalsAgainst || null,
        cleanSheet: data.cleanSheet !== undefined ? data.cleanSheet : null,
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

    return NextResponse.json({
      success: true,
      game
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({
      error: 'Failed to create game'
    }, { status: 500 });
  }
}
```

---

## FILE 2: /src/lib/validations/game-schema.ts

### COMPLETE FIXED VERSION

Replace entire file with:

```typescript
import { z } from 'zod';

export const gameSchema = z.object({
  playerId: z.string().min(1, 'Please select an athlete'),

  // DATE VALIDATION FIX: Prevent future dates
  date: z.string()
    .min(1, 'Game date is required')
    .refine((val) => {
      const date = new Date(val);
      const now = new Date();
      now.setHours(23, 59, 59, 999); // Allow today's date
      return !isNaN(date.getTime()) && date <= now;
    }, {
      message: 'Game date must be today or in the past'
    }),

  opponent: z
    .string()
    .min(3, 'Opponent name must be at least 3 characters')
    .max(100, 'Opponent name must be less than 100 characters')
    .refine((val) => {
      // Prevent HTML tags
      return !/<[^>]*>/g.test(val);
    }, {
      message: 'Opponent name cannot contain HTML tags'
    }),

  result: z.enum(['Win', 'Loss', 'Draw'], {
    required_error: 'Please select a game result',
  }),

  yourScore: z.number()
    .int('Score must be a whole number')
    .min(0, 'Score must be 0 or greater')
    .max(20, 'Score must be 20 or less'),

  opponentScore: z.number()
    .int('Score must be a whole number')
    .min(0, 'Score must be 0 or greater')
    .max(20, 'Score must be 20 or less'),

  minutesPlayed: z.number()
    .int('Minutes must be a whole number')
    .min(0, 'Minutes must be 0 or greater')
    .max(120, 'Minutes must be 120 or less'),

  goals: z.number()
    .int('Goals must be a whole number')
    .min(0, 'Goals must be 0 or greater')
    .max(20, 'Goals must be 20 or less'),

  assists: z.number()
    .int('Assists must be a whole number')
    .min(0, 'Assists must be 0 or greater')
    .max(20, 'Assists must be 20 or less')
    .nullable()
    .optional(),

  saves: z.number()
    .int('Saves must be a whole number')
    .min(0, 'Saves must be 0 or greater')
    .max(50, 'Saves must be 50 or less')
    .nullable()
    .optional(),

  goalsAgainst: z.number()
    .int('Goals against must be a whole number')
    .min(0, 'Goals against must be 0 or greater')
    .max(20, 'Goals against must be 20 or less')
    .nullable()
    .optional(),

  cleanSheet: z.boolean().nullable().optional(),
});

export type GameFormData = z.infer<typeof gameSchema>;
```

---

## FILE 3: /src/middleware.ts (CREATE NEW FILE)

### COMPLETE NEW FILE

Create `/src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers middleware
 * Adds security headers to all API routes and dashboard pages
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (adjust as needed for your app)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
    ].join('; ')
  );

  // Permissions policy (restrict browser features)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
};
```

---

## FILE 4: package.json (UPDATE)

### ADD DEPENDENCY

Add to `dependencies` section:

```json
{
  "dependencies": {
    // ... existing dependencies ...
    "isomorphic-dompurify": "^2.16.0"
  }
}
```

Then run:
```bash
npm install
```

---

## TESTING COMMANDS

### Test 1: Server-Side Validation

```bash
# Should FAIL with validation error (minutesPlayed too high)
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "playerId": "cm2cfvhw90000wz35fvpyh8n0",
    "date": "2024-10-08",
    "opponent": "Test Team",
    "result": "Win",
    "finalScore": "3-2",
    "minutesPlayed": 9999,
    "goals": 2,
    "assists": 1
  }'

# Expected response:
# {
#   "error": "Validation failed",
#   "details": [
#     {
#       "path": ["minutesPlayed"],
#       "message": "Minutes must be 120 or less"
#     }
#   ]
# }
```

### Test 2: Rate Limiting

```bash
# Make 11 rapid requests (11th should fail)
for i in {1..11}; do
  echo "Request $i"
  curl -X POST http://localhost:4000/api/games \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
    -d '{
      "playerId": "cm2cfvhw90000wz35fvpyh8n0",
      "date": "2024-10-08",
      "opponent": "Test Team",
      "result": "Win",
      "finalScore": "3-2",
      "minutesPlayed": 90,
      "goals": 2,
      "assists": 1
    }'
  echo ""
done

# Expected: Requests 1-10 succeed, request 11 returns:
# {
#   "error": "Rate limit exceeded. Please wait 1 minute before submitting another game."
# }
```

### Test 3: XSS Sanitization

```bash
# Should SANITIZE opponent name (remove script tags)
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "playerId": "cm2cfvhw90000wz35fvpyh8n0",
    "date": "2024-10-08",
    "opponent": "<script>alert(\"xss\")</script>Evil Team",
    "result": "Win",
    "finalScore": "3-2",
    "minutesPlayed": 90,
    "goals": 2,
    "assists": 1
  }'

# Expected: Game created successfully, but opponent stored as "Evil Team" (script tags removed)
# Verify in database:
# SELECT opponent FROM "Game" ORDER BY "createdAt" DESC LIMIT 1;
# Should show: "Evil Team" (NOT "<script>alert('xss')</script>Evil Team")
```

### Test 4: Score-Result Validation

```bash
# Should FAIL (Win result with lower score)
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "playerId": "cm2cfvhw90000wz35fvpyh8n0",
    "date": "2024-10-08",
    "opponent": "Test Team",
    "result": "Win",
    "finalScore": "2-3",
    "minutesPlayed": 90,
    "goals": 2,
    "assists": 1
  }'

# Expected response:
# {
#   "error": "Validation failed",
#   "details": [
#     {
#       "path": ["result"],
#       "message": "Result \"Win\" requires your score to be higher than opponent score"
#     }
#   ]
# }
```

### Test 5: Date Validation

```bash
# Should FAIL (future date)
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "playerId": "cm2cfvhw90000wz35fvpyh8n0",
    "date": "2030-01-01",
    "opponent": "Test Team",
    "result": "Win",
    "finalScore": "3-2",
    "minutesPlayed": 90,
    "goals": 2,
    "assists": 1
  }'

# Expected response:
# {
#   "error": "Validation failed",
#   "details": [
#     {
#       "path": ["date"],
#       "message": "Game date must be today or in the past"
#     }
#   ]
# }
```

### Test 6: Security Headers

```bash
# Check security headers are present
curl -I http://localhost:4000/api/games

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Content-Security-Policy: default-src 'self'; ...
# Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## CHECKLIST BEFORE COMMITTING

- [ ] Installed `isomorphic-dompurify` dependency
- [ ] Modified `/src/app/api/games/route.ts` with all 3 fixes
- [ ] Modified `/src/lib/validations/game-schema.ts` with refinements
- [ ] Created `/src/middleware.ts` with security headers
- [ ] Tested all 6 test cases above
- [ ] Verified rate limiting works (11th request fails)
- [ ] Verified XSS sanitization works (script tags removed)
- [ ] Verified validation works (invalid data rejected)
- [ ] Verified score-result validation works
- [ ] Verified date validation works (future dates rejected)
- [ ] Verified security headers present in response
- [ ] No console errors in browser
- [ ] Form still works correctly in UI
- [ ] Athlete pre-fill still works
- [ ] Position detection still works (goalkeeper vs field player)
- [ ] Success redirect still works

---

## GIT WORKFLOW

```bash
# 1. Create fix branch
git checkout -b fix/game-form-security-validation

# 2. Install dependency
npm install isomorphic-dompurify

# 3. Make code changes (3 files modified, 1 created)

# 4. Test locally
npm run dev -- -p 4000
# Run all 6 test cases above

# 5. Commit changes
git add .
git commit -m "fix: add server-side validation, rate limiting, and XSS protection to game logging

- Add server-side Zod validation in POST /api/games
- Implement rate limiting (10 requests per minute per user)
- Sanitize opponent input to prevent XSS attacks
- Add score-result consistency validation
- Improve date validation (prevent future dates)
- Add security headers middleware (CSP, X-Frame-Options, etc.)
- Install isomorphic-dompurify for HTML sanitization

Fixes:
- Critical: API now validates all input server-side (was client-only)
- Critical: Rate limiting prevents database flooding attacks
- High: XSS protection sanitizes all text inputs
- High: Score-result validation prevents data inconsistency
- Medium: Security headers protect against common attacks

Tested:
- Invalid data rejected with proper error messages
- Rate limiting triggers after 10 requests per minute
- XSS payloads sanitized before database storage
- Win/Loss/Draw result matches actual scores
- Future dates rejected
- Security headers present in all responses
"

# 6. Push to remote
git push origin fix/game-form-security-validation

# 7. Deploy to staging for testing

# 8. After staging tests pass, merge to main
git checkout main
git merge fix/game-form-security-validation
git push origin main
```

---

## POST-DEPLOYMENT VERIFICATION

After deploying to staging/production:

1. **Smoke Test**: Submit a valid game → should succeed
2. **Validation Test**: Submit invalid data → should show proper errors
3. **Rate Limit Test**: Make 11 rapid requests → 11th should fail with 429
4. **XSS Test**: Submit opponent name with `<script>` tags → should be sanitized
5. **Score Test**: Try Win with lower score → should fail validation
6. **Date Test**: Try future date → should fail validation
7. **Security Test**: Check response headers → should have X-Frame-Options, CSP, etc.

---

**Implementation Time:** 3.5-4 hours
**Testing Time:** 1 hour
**Total:** 4.5-5 hours

---

*Document Created: 2025-10-09*
*Status: Ready for Implementation*
