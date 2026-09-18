# Orchestrator Agent Prompt - Hustle Operations Manager

**Agent Name:** hustle-operations-manager
**Platform:** Vertex AI Gen AI Studio
**Model:** Gemini 2.0 Flash
**Role:** Team Manager for all Hustle operations

---

## System Prompt

```
You are the Hustle Operations Manager, an AI agent responsible for coordinating all operations in the Hustle youth sports statistics platform.

Your role is to:
1. Receive requests from the frontend application
2. Decompose complex tasks into subtasks
3. Coordinate sub-agents to execute subtasks
4. Aggregate results and respond to the frontend

You have access to four sub-agents:
- Validation Agent: Input validation and security checks
- User Creation Agent: User account creation and management
- Onboarding Agent: Welcome emails and onboarding flow
- Analytics Agent: Metrics tracking and dashboard updates

When you receive a request, follow this process:
1. Understand the intent (registration, player_creation, game_logging, etc.)
2. Validate the request structure
3. Call appropriate sub-agents in parallel when possible
4. Handle errors gracefully with retries
5. Aggregate results and return to frontend

You must always respond in JSON format with this structure:
{
  "success": true|false,
  "data": {...},
  "errors": [...],
  "agent_execution": {
    "validation": {...},
    "creation": {...},
    "onboarding": {...},
    "analytics": {...}
  }
}

Always be efficient, fault-tolerant, and user-focused.
```

---

## Intent Definitions

### Intent: USER_REGISTRATION

**Trigger:** POST /api/agent/register

**Input Schema:**
```json
{
  "intent": "user_registration",
  "data": {
    "firstName": "string (required)",
    "lastName": "string (required)",
    "email": "string (required, email format)",
    "phone": "string (optional)",
    "password": "string (required, min 8 chars)"
  }
}
```

**Agent Workflow:**
```
[Orchestrator] receives request
  ↓
[Validation Agent] validates input
  - Email format check
  - Password strength check (min 8 chars, complexity)
  - Duplicate email check (Firestore query)
  → Returns: {valid: true|false, errors: [...]}
  ↓
[User Creation Agent] creates user (if validation passed)
  - Hash password with bcrypt (10 rounds)
  - Create user document in Firestore /users/{userId}
  - Set COPPA compliance fields
  → Returns: {userId: string, created: boolean}
  ↓
[Onboarding Agent] sends welcome email (parallel with Analytics)
  - Generate email verification token
  - Send verification email via Resend
  - Log email sent event
  → Returns: {emailSent: boolean, tokenId: string}
  ↓
[Analytics Agent] tracks registration metric (parallel with Onboarding)
  - Increment daily registration counter
  - Log user source/referrer
  - Update dashboard
  → Returns: {tracked: boolean}
  ↓
[Orchestrator] aggregates results and returns to frontend
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "userId": "abc123",
    "email": "user@example.com",
    "emailVerificationSent": true
  },
  "message": "Account created successfully. Please check your email to verify your account.",
  "agent_execution": {
    "validation": {
      "status": "success",
      "duration_ms": 150
    },
    "creation": {
      "status": "success",
      "userId": "abc123",
      "duration_ms": 320
    },
    "onboarding": {
      "status": "success",
      "emailSent": true,
      "duration_ms": 450
    },
    "analytics": {
      "status": "success",
      "duration_ms": 200
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": [
    {
      "agent": "validation",
      "code": "DUPLICATE_EMAIL",
      "message": "An account with this email already exists"
    }
  ],
  "agent_execution": {
    "validation": {
      "status": "failed",
      "error": "DUPLICATE_EMAIL",
      "duration_ms": 180
    }
  }
}
```

---

### Intent: PLAYER_CREATION

**Trigger:** POST /api/agent/player/create

**Input Schema:**
```json
{
  "intent": "player_creation",
  "auth": {
    "userId": "string (required, from Firebase Auth)"
  },
  "data": {
    "name": "string (required)",
    "birthday": "ISO8601 date (required)",
    "position": "string (required)",
    "teamClub": "string (required)",
    "photoUrl": "string (optional, Firebase Storage URL)"
  }
}
```

**Agent Workflow:**
```
[Orchestrator] receives request
  ↓
[Validation Agent] validates input
  - Name format check
  - Birthday validity (must be under 18 for COPPA)
  - Position validity (from allowed list)
  - Photo URL validity (if provided)
  → Returns: {valid: true|false, errors: [...]}
  ↓
[User Creation Agent] creates player
  - Create player document in Firestore /players/{playerId}
  - Link to parent (userId)
  - Upload photo to Firebase Storage (if provided)
  → Returns: {playerId: string, created: boolean}
  ↓
[Analytics Agent] tracks player creation
  - Increment player count for user
  - Log player position (for position distribution analytics)
  → Returns: {tracked: boolean}
  ↓
[Orchestrator] aggregates results and returns to frontend
```

---

### Intent: GAME_LOGGING

**Trigger:** POST /api/agent/game/log

**Input Schema:**
```json
{
  "intent": "game_logging",
  "auth": {
    "userId": "string (required)"
  },
  "data": {
    "playerId": "string (required)",
    "date": "ISO8601 date (required)",
    "opponent": "string (required)",
    "result": "Win|Loss|Draw (required)",
    "finalScore": "string (required, e.g. '3-2')",
    "minutesPlayed": "number (required)",
    "goals": "number (default 0)",
    "assists": "number (default 0)",
    "tackles": "number (optional)",
    "saves": "number (optional)",
    // ... other stats
  }
}
```

**Agent Workflow:**
```
[Orchestrator] receives request
  ↓
[Validation Agent] validates input
  - Player ownership check (playerId belongs to userId)
  - Date validity (not in future)
  - Stats validity (non-negative numbers)
  → Returns: {valid: true|false, errors: [...]}
  ↓
[User Creation Agent] logs game
  - Create game document in Firestore /games/{gameId}
  - Link to player
  - Calculate derived stats if needed
  → Returns: {gameId: string, created: boolean}
  ↓
[Analytics Agent] updates player stats
  - Aggregate goals, assists, games played
  - Update player career stats
  - Update team analytics
  → Returns: {statsUpdated: boolean}
  ↓
[Orchestrator] aggregates results and returns to frontend
```

---

## Error Handling

### Retry Policy

**Transient Errors (Retry 3 times with exponential backoff):**
- Network timeouts
- Firestore quota exceeded
- Email service temporarily unavailable

**Permanent Errors (Fail immediately):**
- Invalid input format
- Duplicate email
- Permission denied
- Invalid authentication

### Error Codes

| Code | Description | Agent | Retry |
|------|-------------|-------|-------|
| INVALID_EMAIL | Email format invalid | Validation | No |
| DUPLICATE_EMAIL | Email already exists | Validation | No |
| WEAK_PASSWORD | Password too weak | Validation | No |
| PLAYER_NOT_FOUND | Player doesn't exist | Validation | No |
| UNAUTHORIZED | User lacks permission | Validation | No |
| FIRESTORE_TIMEOUT | Database timeout | Creation | Yes |
| EMAIL_FAILED | Email send failed | Onboarding | Yes |
| QUOTA_EXCEEDED | Firestore quota hit | Creation | Yes |
| UNKNOWN_ERROR | Unexpected error | Any | No |

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Total execution time (p95) | < 2 seconds | > 5 seconds |
| Validation Agent (p95) | < 200ms | > 500ms |
| Creation Agent (p95) | < 500ms | > 1000ms |
| Onboarding Agent (p95) | < 800ms | > 2000ms |
| Analytics Agent (p95) | < 300ms | > 1000ms |
| Success rate | > 99% | < 95% |
| Error rate | < 1% | > 5% |

---

## Agent Communication Protocol

### Pub/Sub Topics

**Registration Flow:**
```
user.registration.requested        → Orchestrator publishes
user.validation.requested          → Orchestrator publishes
user.validation.completed          → Validation Agent publishes
user.creation.requested            → Orchestrator publishes
user.creation.completed            → Creation Agent publishes
user.onboarding.requested          → Orchestrator publishes
user.onboarding.completed          → Onboarding Agent publishes
user.analytics.requested           → Orchestrator publishes
user.analytics.completed           → Analytics Agent publishes
user.registration.completed        → Orchestrator publishes
```

### Message Format

**Standard Pub/Sub Message:**
```json
{
  "requestId": "uuid",
  "timestamp": "ISO8601",
  "intent": "user_registration",
  "agent": "orchestrator",
  "data": {...},
  "metadata": {
    "userId": "string (if authenticated)",
    "source": "web|mobile|api",
    "version": "1.0"
  }
}
```

---

## Deployment Configuration

### Vertex AI Agent Builder Setup

**Agent Configuration:**
```yaml
agent:
  name: hustle-operations-manager
  display_name: "Hustle Operations Manager"
  description: "Team manager for all Hustle operations"
  model: gemini-2.0-flash-001
  region: us-central1

  tools:
    - name: firestore_query
      description: Query Firestore database
    - name: firestore_write
      description: Write to Firestore database
    - name: call_agent
      description: Call sub-agent
    - name: send_email
      description: Send email via Resend

  intents:
    - name: user_registration
      training_phrases:
        - "register new user"
        - "create account"
        - "sign up"
    - name: player_creation
      training_phrases:
        - "add player"
        - "create athlete profile"
    - name: game_logging
      training_phrases:
        - "log game"
        - "record stats"
        - "add game data"
```

### Cloud Function Trigger

**HTTP Endpoint:**
```javascript
// functions/src/orchestrator.ts
import * as functions from 'firebase-functions';
import { VertexAI } from '@google-cloud/aiplatform';

export const orchestrator = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    const { intent, data: requestData } = data;

    // Call Vertex AI agent
    const vertex = new VertexAI({
      project: 'hustleapp-production',
      location: 'us-central1'
    });

    const response = await vertex.agents.execute({
      agent: 'hustle-operations-manager',
      input: {
        intent,
        data: requestData,
        auth: context.auth
      }
    });

    return response;
  });
```

---

## Monitoring & Logging

### Cloud Logging Queries

**Get all orchestrator executions:**
```
resource.type="vertex_agent"
resource.labels.agent_name="hustle-operations-manager"
```

**Get failed requests:**
```
resource.type="vertex_agent"
resource.labels.agent_name="hustle-operations-manager"
jsonPayload.success=false
```

**Get slow requests (> 2s):**
```
resource.type="vertex_agent"
resource.labels.agent_name="hustle-operations-manager"
jsonPayload.duration_ms>2000
```

### Dashboard Metrics

**Key Metrics:**
1. Requests per minute
2. Success rate
3. Average execution time
4. Error rate by error code
5. Agent execution breakdown (by sub-agent)

---

## Testing

### Unit Tests

```javascript
// Test orchestrator intent recognition
describe('Orchestrator Agent', () => {
  it('should recognize user_registration intent', async () => {
    const response = await orchestrator.execute({
      intent: 'user_registration',
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      }
    });

    expect(response.success).toBe(true);
    expect(response.data.userId).toBeDefined();
  });
});
```

### Integration Tests

```javascript
// Test full registration flow
it('should complete full registration flow', async () => {
  const response = await callOrchestrator({
    intent: 'user_registration',
    data: testUser
  });

  // Verify user created in Firestore
  const user = await db.collection('users').doc(response.data.userId).get();
  expect(user.exists).toBe(true);

  // Verify email sent
  expect(response.data.emailVerificationSent).toBe(true);

  // Verify analytics tracked
  const metrics = await getMetrics('daily_registrations');
  expect(metrics.count).toBeGreaterThan(0);
});
```

---

**Document:** 171-AT-DSGN-orchestrator-agent-prompt.md
**Last Updated:** 2025-11-09T19:45:00Z
**Status:** Ready for Deployment
