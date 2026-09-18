# Vertex AI A2A Agent Deployment Guide - Hustle Operations Manager

**Date:** 2025-11-10T00:00:00Z
**Status:** Ready for Deployment
**Phase:** Week 2 - Vertex AI Integration
**Classification:** Operations - Deployment

---

## EXECUTIVE SUMMARY

This guide provides comprehensive instructions for deploying the Hustle Operations Manager multi-agent system to Vertex AI Agent Engine using the Agent-to-Agent (A2A) protocol.

**What Will Be Deployed:**
- Orchestrator Agent (hustle-operations-manager)
- 4 Sub-Agents (validation, user-creation, onboarding, analytics)
- A2A Protocol Communication Layer
- Cloud Functions API Gateway
- Session Management with Memory Bank

**Architecture:**
```
Frontend → Cloud Functions → Orchestrator Agent (A2A) → Sub-Agents → Firestore
                                   ↓
                            Memory Bank (Session Persistence)
```

**Performance Targets:**
- Total execution time (p95): < 2 seconds
- Success rate: > 99%
- Cost: ~$0.01 per registration

---

## TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Agent Deployment](#agent-deployment)
4. [A2A Protocol Configuration](#a2a-protocol-configuration)
5. [Cloud Functions Update](#cloud-functions-update)
6. [Testing & Validation](#testing--validation)
7. [Monitoring & Observability](#monitoring--observability)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## PREREQUISITES

### Required Tools & Access

**1. Google Cloud SDK**
```bash
# Verify gcloud installation
gcloud --version

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project hustleapp-production
```

**2. Required APIs**
```bash
# Enable required APIs (already enabled)
gcloud services enable aiplatform.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Verify APIs are enabled
gcloud services list --enabled | grep -E "(aiplatform|firestore|cloudfunctions)"
```

**3. IAM Permissions**
You need these roles:
- `roles/aiplatform.admin` - Create and manage agents
- `roles/cloudfunctions.developer` - Deploy Cloud Functions
- `roles/iam.serviceAccountAdmin` - Create service accounts
- `roles/datastore.owner` - Firestore access

**4. Service Account**
```bash
# Create service account for agents
gcloud iam service-accounts create hustle-agent-sa \
  --display-name="Hustle A2A Agent Service Account" \
  --project=hustleapp-production

# Grant required roles
SA_EMAIL="hustle-agent-sa@hustleapp-production.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/logging.logWriter"
```

---

## ARCHITECTURE OVERVIEW

### A2A Protocol Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Cloud Functions (API Gateway)                  │
│                    - orchestrator()                          │
│                    - A2A Client                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Orchestrator Agent (Vertex AI)                  │
│           hustle-operations-manager                          │
│           Model: Gemini 2.0 Flash                            │
└────┬────────────────┬─────────────┬────────────┬────────────┘
     │                │             │            │
     ▼                ▼             ▼            ▼
┌─────────┐    ┌──────────┐  ┌──────────┐  ┌──────────┐
│Validation│    │  User    │  │Onboarding│  │Analytics │
│ Agent   │    │ Creation │  │  Agent   │  │  Agent   │
│         │    │  Agent   │  │          │  │          │
└────┬────┘    └────┬─────┘  └────┬─────┘  └────┬─────┘
     │              │             │            │
     └──────────────┴─────────────┴────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │    Firestore     │
          │  (Data Storage)  │
          └──────────────────┘
```

### Agent Responsibilities

**Orchestrator Agent (hustle-operations-manager)**
- Receives requests from Cloud Functions
- Decomposes tasks into subtasks
- Routes to appropriate sub-agents
- Aggregates responses
- Maintains session state via Memory Bank

**Validation Agent (hustle-validation-agent)**
- Input validation (email, password, dates)
- Duplicate checking (Firestore queries)
- Security checks
- Returns: `{valid: boolean, errors: []}`

**User Creation Agent (hustle-user-creation-agent)**
- Creates users in Firestore
- Creates player profiles
- Creates game records
- Password hashing (bcrypt)
- Returns: `{id: string, created: boolean}`

**Onboarding Agent (hustle-onboarding-agent)**
- Sends welcome emails (Resend)
- Generates verification tokens
- Email templates
- Returns: `{emailSent: boolean, tokenId: string}`

**Analytics Agent (hustle-analytics-agent)**
- Tracks metrics
- Updates dashboards
- Logs events
- Returns: `{tracked: boolean}`

### A2A Protocol Flow

**Example: User Registration**

```
1. Frontend submits registration form
   POST /api/orchestrator
   {
     intent: "user_registration",
     data: {firstName, lastName, email, password}
   }

2. Cloud Function calls Orchestrator Agent
   A2A Protocol:
   - session_id: "abc-123" (Memory Bank)
   - message: "Execute user_registration intent"
   - context: {intent, data, auth}

3. Orchestrator Agent orchestrates sub-agents:

   Sequential:
   a) Validation Agent
      - Validates email format
      - Checks password strength
      - Queries Firestore for duplicates
      → Returns: {valid: true}

   b) User Creation Agent
      - Hashes password (bcrypt)
      - Creates user doc in Firestore
      → Returns: {userId: "xyz-789"}

   Parallel:
   c) Onboarding Agent
      - Generates verification token
      - Sends welcome email
      → Returns: {emailSent: true, tokenId: "token-123"}

   d) Analytics Agent
      - Increments registration counter
      - Logs event
      → Returns: {tracked: true}

4. Orchestrator Agent aggregates results
   {
     success: true,
     data: {userId, emailVerificationSent: true},
     message: "Account created...",
     agent_execution: {
       validation: {status: "success", duration_ms: 150},
       creation: {status: "success", duration_ms: 320},
       onboarding: {status: "success", duration_ms: 450},
       analytics: {status: "success", duration_ms: 200}
     }
   }

5. Cloud Function returns response to frontend
```

---

## AGENT DEPLOYMENT

### Option 1: Manual Deployment via Vertex AI Console (RECOMMENDED)

Since Vertex AI Agent Builder is still in preview and ADK CLI tools are evolving, manual deployment via the Console is the most reliable method.

**Step 1: Navigate to Vertex AI Agents**

1. Open Google Cloud Console: https://console.cloud.google.com/vertex-ai/agents?project=hustleapp-production
2. Click "Create Agent"

**Step 2: Create Orchestrator Agent**

**Basic Information:**
- Agent Name: `hustle-operations-manager`
- Display Name: `Hustle Operations Manager`
- Description: `Team manager orchestrating all Hustle operations`
- Region: `us-central1`

**Model Configuration:**
- Model: `gemini-2.0-flash-001`
- Temperature: `0.3`
- Top P: `0.95`
- Top K: `40`
- Max Output Tokens: `2048`

**System Prompt:**
Copy from: `vertex-agents/orchestrator/config/agent.yaml` (agent section)

Or use this:
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

**Tools Configuration:**

Add these tools:

1. **firestore_query**
   - Type: Cloud Function
   - Description: Query Firestore database
   - Function: (will be created separately)

2. **firestore_write**
   - Type: Cloud Function
   - Description: Write to Firestore database
   - Function: (will be created separately)

3. **call_sub_agent**
   - Type: Cloud Function
   - Description: Call sub-agent via A2A protocol
   - Function: (will be created separately)

**Intents:**

Add these intents with training phrases:

1. **user_registration**
   - "register new user"
   - "create account"
   - "sign up"
   - "new user registration"

2. **player_creation**
   - "add player"
   - "create athlete profile"
   - "new player"

3. **game_logging**
   - "log game"
   - "record stats"
   - "add game data"

**Advanced Settings:**
- Enable Memory Bank: ✓
- Session TTL: 3600 seconds (1 hour)
- Max Concurrent Tasks: 10
- Execution Timeout: 30 seconds

**Step 3: Deploy Agent**

Click "Deploy Agent" and wait for deployment to complete (~2-3 minutes).

**Step 4: Get Agent Endpoint**

After deployment, copy the agent endpoint URL:
```
https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/agents/hustle-operations-manager
```

**Step 5: Repeat for Sub-Agents**

Deploy the following agents using the same process:

1. **hustle-validation-agent**
   - Prompt: See `171-AT-DSGN-orchestrator-agent-prompt.md` (Validation section)
   - Timeout: 10 seconds
   - Tools: firestore_query

2. **hustle-user-creation-agent**
   - Prompt: See `171-AT-DSGN-orchestrator-agent-prompt.md` (User Creation section)
   - Timeout: 15 seconds
   - Tools: firestore_write

3. **hustle-onboarding-agent**
   - Prompt: See `171-AT-DSGN-orchestrator-agent-prompt.md` (Onboarding section)
   - Timeout: 20 seconds
   - Tools: send_email

4. **hustle-analytics-agent**
   - Prompt: See `171-AT-DSGN-orchestrator-agent-prompt.md` (Analytics section)
   - Timeout: 10 seconds
   - Tools: firestore_write

### Option 2: Programmatic Deployment (FUTURE)

Once the ADK Python SDK is stable, you can deploy programmatically:

```bash
# Navigate to agent directory
cd vertex-agents/orchestrator

# Deploy using ADK CLI (when available)
# adk deploy --config config/agent.yaml

# Or use Python script
python src/orchestrator_agent.py --deploy
```

**Note:** This option is not yet available as of November 2025.

---

## A2A PROTOCOL CONFIGURATION

### Agent Card Discovery

Each agent has an AgentCard that describes its capabilities:

**Orchestrator Agent Card:**
Location: `vertex-agents/orchestrator/config/agent-card.json`

Key fields:
- `name`: Agent identifier
- `capabilities`: code_execution, memory_bank, async_tasks
- `tools`: Available tools and their schemas
- `intents`: Supported intents with input/output schemas
- `deployment.endpoint`: Agent endpoint URL

**Fetching AgentCard Programmatically:**

```typescript
import { getA2AClient } from './a2a-client';

const client = getA2AClient();

// AgentCard is available at:
// https://[agent-endpoint]/.well-known/agent-card

const agentCard = await fetch(
  'https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/agents/hustle-operations-manager/.well-known/agent-card'
).then(r => r.json());

console.log('Agent capabilities:', agentCard.capabilities);
console.log('Available tools:', agentCard.tools);
```

### Session Management

Sessions enable Memory Bank persistence across multiple agent calls:

**Session Lifecycle:**

```
1. User logs in → Create session
   sessionId = uuid.v4()

2. User submits registration → Use session
   A2A call with session_id

3. Agent stores context in Memory Bank
   {
     session_id: "abc-123",
     user_email: "john@example.com",
     registration_step: "email_sent"
   }

4. User verifies email → Same session
   A2A call with same session_id
   Agent retrieves context from Memory Bank

5. Session expires after 1 hour
   Memory Bank cleared
```

**Implementation in Cloud Functions:**

```typescript
// functions/src/a2a-client.ts

const sessionId = uuidv4(); // Create session

const response = await a2aClient.sendTask({
  intent: 'user_registration',
  data: registrationData,
  sessionId: sessionId, // Pass session ID
});

// Session ID is returned in response
console.log('Session ID:', response.sessionId);

// Subsequent calls can reuse session
const response2 = await a2aClient.sendTask({
  intent: 'player_creation',
  data: playerData,
  sessionId: sessionId, // Reuse session
});
```

### Error Handling & Retry Logic

**Retry Policy:**

```yaml
retry_policy:
  max_attempts: 3
  backoff_multiplier: 2
  initial_delay_ms: 1000
  max_delay_ms: 10000
```

**Transient Errors (Retry):**
- Network timeouts
- Firestore quota exceeded
- Agent temporarily unavailable
- 429 Too Many Requests
- 503 Service Unavailable

**Permanent Errors (Fail immediately):**
- Invalid input format (400)
- Unauthorized (401)
- Forbidden (403)
- Not found (404)
- Validation failed

**Implementation:**

```typescript
// functions/src/a2a-client.ts

async callAgentWithRetry(
  agentName: string,
  payload: any,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.callAgent(agentName, payload);
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (this.isTransientError(error)) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Permanent error, fail immediately
      throw error;
    }
  }

  throw lastError;
}

private isTransientError(error: any): boolean {
  const statusCode = error.statusCode || error.code;
  return [408, 429, 500, 502, 503, 504].includes(statusCode);
}
```

---

## CLOUD FUNCTIONS UPDATE

### Update package.json

```bash
cd functions

# Add uuid dependency
npm install uuid
npm install --save-dev @types/uuid
```

### Update functions/package.json

Add to dependencies:
```json
{
  "dependencies": {
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^5.1.3",
    "@google-cloud/aiplatform": "^3.27.0",
    "uuid": "^11.0.3"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0"
  }
}
```

### Build and Deploy

```bash
# Build TypeScript
npm run build

# Deploy orchestrator function
cd ..
firebase deploy --only functions:orchestrator --project=hustleapp-production

# Verify deployment
firebase functions:list --project=hustleapp-production
```

### Test Deployed Function

```bash
# Get function URL
FUNCTION_URL=$(firebase functions:config:get --project=hustleapp-production | jq -r '.orchestrator.url')

# Test with curl
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "intent": "user_registration",
      "data": {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "TestPass123!"
      }
    }
  }'
```

---

## TESTING & VALIDATION

### Unit Tests

**Test A2A Client:**

```typescript
// tests/unit/a2a-client.test.ts

import { A2AClient } from '../../functions/src/a2a-client';

describe('A2AClient', () => {
  let client: A2AClient;

  beforeEach(() => {
    client = new A2AClient('hustleapp-production');
  });

  it('should create session ID', () => {
    const sessionId = client.createSession();
    expect(sessionId).toBeDefined();
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it('should send task to orchestrator', async () => {
    const response = await client.sendTask({
      intent: 'user_registration',
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'TestPass123!',
      },
    });

    expect(response.success).toBe(true);
    expect(response.data.userId).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const response = await client.sendTask({
      intent: 'invalid_intent',
      data: {},
    });

    expect(response.success).toBe(false);
    expect(response.errors).toBeDefined();
  });
});
```

### Integration Tests

**Test Full Registration Flow:**

```typescript
// tests/integration/registration.test.ts

import { getA2AClient } from '../../functions/src/a2a-client';
import * as admin from 'firebase-admin';

describe('User Registration Flow', () => {
  let client: A2AClient;
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    admin.initializeApp();
    db = admin.firestore();
    client = getA2AClient();
  });

  it('should complete full registration', async () => {
    const testUser = {
      firstName: 'Integration',
      lastName: 'Test',
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
    };

    // Send registration request
    const response = await client.sendTask({
      intent: 'user_registration',
      data: testUser,
    });

    // Verify response
    expect(response.success).toBe(true);
    expect(response.data.userId).toBeDefined();
    expect(response.data.emailVerificationSent).toBe(true);

    // Verify user created in Firestore
    const userId = response.data.userId;
    const userDoc = await db.collection('users').doc(userId).get();

    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()?.email).toBe(testUser.email);

    // Verify agent execution details
    expect(response.agent_execution.validation.status).toBe('success');
    expect(response.agent_execution.creation.status).toBe('success');
    expect(response.agent_execution.onboarding.status).toBe('success');
    expect(response.agent_execution.analytics.status).toBe('success');

    // Cleanup
    await db.collection('users').doc(userId).delete();
  });
});
```

### Performance Tests

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 -p registration.json -T application/json \
  https://us-central1-hustleapp-production.cloudfunctions.net/orchestrator

# Monitor performance
gcloud logging read "resource.type=cloud_function" \
  --project=hustleapp-production \
  --limit=50 \
  --format=json | jq '.[] | select(.jsonPayload.duration_ms > 2000)'
```

---

## MONITORING & OBSERVABILITY

### Cloud Logging Queries

**All orchestrator executions:**
```
resource.type="cloud_function"
resource.labels.function_name="orchestrator"
```

**Failed requests:**
```
resource.type="cloud_function"
resource.labels.function_name="orchestrator"
jsonPayload.success=false
```

**Slow requests (> 2s):**
```
resource.type="cloud_function"
resource.labels.function_name="orchestrator"
jsonPayload.duration_ms>2000
```

**Agent-specific logs:**
```
resource.type="vertex_agent"
resource.labels.agent_name="hustle-operations-manager"
```

### Metrics Dashboard

Create a Cloud Monitoring dashboard with these metrics:

**1. Execution Metrics**
- Requests per minute
- Average execution time
- P50, P95, P99 latency
- Success rate (%)

**2. Error Metrics**
- Error rate (%)
- Errors by type
- Errors by agent

**3. Agent Metrics**
- Agent call duration (by agent)
- Agent success rate (by agent)
- Parallel execution efficiency

**4. Cost Metrics**
- Vertex AI API calls
- Firestore reads/writes
- Cloud Functions invocations

### Alerts

**Critical Alerts:**
- Error rate > 5% (5 minutes)
- Execution time > 5s (p95, 10 minutes)
- Firestore quota exceeded

**Warning Alerts:**
- Error rate > 1% (10 minutes)
- Execution time > 2s (p95, 30 minutes)
- High cost per request (> $0.02)

**Alert Configuration:**

```bash
# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Orchestrator Error Rate" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_function"
    AND resource.labels.function_name="orchestrator"
    AND jsonPayload.success=false'
```

---

## TROUBLESHOOTING

### Common Issues

**1. Agent Not Found**

Error:
```
Error: Agent 'hustle-operations-manager' not found
```

Solution:
```bash
# List all agents
gcloud ai agents list --region=us-central1 --project=hustleapp-production

# Verify agent exists
gcloud ai agents describe hustle-operations-manager \
  --region=us-central1 \
  --project=hustleapp-production
```

**2. Authentication Errors**

Error:
```
Error: Permission denied (403)
```

Solution:
```bash
# Check service account permissions
SA_EMAIL="hustle-agent-sa@hustleapp-production.iam.gserviceaccount.com"

gcloud projects get-iam-policy hustleapp-production \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SA_EMAIL"

# Grant missing permissions
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user"
```

**3. Timeout Errors**

Error:
```
Error: Agent execution timeout (30s)
```

Solution:
```yaml
# Update agent timeout in agent.yaml
performance:
  execution_timeout: 60  # Increase to 60 seconds
```

**4. Memory Bank Issues**

Error:
```
Error: Session not found in Memory Bank
```

Solution:
```typescript
// Ensure session ID is passed correctly
const sessionId = uuidv4();

const response = await client.sendTask({
  intent: 'user_registration',
  data: userData,
  sessionId: sessionId, // MUST include this
});
```

### Debug Mode

Enable verbose logging:

```typescript
// functions/src/a2a-client.ts

// Add at top of file
process.env.DEBUG = 'a2a:*';

// Logs will show:
// a2a:client Sending task to orchestrator
// a2a:client Agent response: {...}
// a2a:error Agent call failed: {...}
```

### Health Checks

**Check Cloud Functions:**
```bash
# Get function status
gcloud functions describe orchestrator \
  --region=us-central1 \
  --project=hustleapp-production \
  --format=json | jq '.status'

# View recent invocations
gcloud functions logs read orchestrator \
  --region=us-central1 \
  --limit=10
```

**Check Vertex AI Agents:**
```bash
# Get agent status
gcloud ai agents describe hustle-operations-manager \
  --region=us-central1 \
  --project=hustleapp-production \
  --format=json | jq '.state'

# View agent logs
gcloud logging read "resource.type=vertex_agent" \
  --limit=20
```

---

## ROLLBACK PROCEDURES

### Scenario 1: Agent Deployment Failed

If agent deployment fails or behaves unexpectedly:

```bash
# 1. Disable agent
gcloud ai agents update hustle-operations-manager \
  --region=us-central1 \
  --project=hustleapp-production \
  --no-enable

# 2. Cloud Functions will fall back to mock responses
# (A2A client has fallback logic)

# 3. Fix agent configuration and redeploy
```

### Scenario 2: Cloud Functions Issues

If Cloud Functions fail after deployment:

```bash
# 1. Rollback to previous version
firebase functions:rollback orchestrator --project=hustleapp-production

# 2. Verify rollback
firebase functions:log orchestrator --limit=10

# 3. Test with curl
curl -X POST [FUNCTION_URL] -d '{"data": {...}}'
```

### Scenario 3: Complete Rollback

If entire system needs rollback:

```bash
# 1. Disable all agents
for agent in orchestrator validation user-creation onboarding analytics; do
  gcloud ai agents update "hustle-$agent-agent" \
    --region=us-central1 \
    --project=hustleapp-production \
    --no-enable
done

# 2. Rollback Cloud Functions
firebase functions:rollback orchestrator --project=hustleapp-production

# 3. System will use mock responses
# 4. No data loss (Firestore unchanged)
```

---

## SUCCESS CRITERIA

### Deployment Complete When:

- [ ] All 5 agents deployed to Vertex AI Agent Engine
- [ ] AgentCards accessible via `.well-known/agent-card` endpoint
- [ ] Cloud Functions updated with A2A client
- [ ] Service account has correct permissions
- [ ] Cloud Logging shows agent execution logs

### Ready for Production When:

- [ ] Integration tests pass (100% success rate)
- [ ] Performance targets met (< 2s p95)
- [ ] Error rate < 1%
- [ ] Monitoring dashboard configured
- [ ] Alerts configured and tested
- [ ] Load testing passed (1000 concurrent requests)
- [ ] Runbook documented

### Production Cutover When:

- [ ] 100 test registrations completed successfully
- [ ] No critical errors in 48 hours
- [ ] Cost per registration < $0.02
- [ ] User acceptance testing passed
- [ ] Rollback procedure tested

---

## NEXT STEPS

### Immediate (Today)

1. Deploy orchestrator agent via Vertex AI Console
2. Deploy 4 sub-agents
3. Update Cloud Functions with A2A client
4. Run unit tests

### This Week (Days 1-7)

**Days 1-2:**
- Deploy all agents
- Test agent communication
- Verify AgentCards

**Days 3-4:**
- Update Cloud Functions
- Run integration tests
- Performance testing

**Days 5-7:**
- Set up monitoring
- Configure alerts
- Documentation review
- Staging deployment

### Next Week (Days 8-14)

- Load testing (1000+ concurrent users)
- Security audit
- Production deployment
- 48-hour monitoring period

---

## COST ESTIMATION

### Vertex AI Agent Costs

**Pricing (as of November 2025):**
- Gemini 2.0 Flash: $0.00001 per input token, $0.00003 per output token
- Average tokens per registration: ~500 input, ~300 output
- Cost per registration: ~$0.014

**Monthly Projections:**

**Scenario 1: 1,000 registrations/month**
```
Vertex AI:    $14
Firestore:    $2
Functions:    $3
Total:        $19/month
```

**Scenario 2: 10,000 registrations/month**
```
Vertex AI:    $140
Firestore:    $15
Functions:    $20
Total:        $175/month
```

**Scenario 3: 100,000 registrations/month**
```
Vertex AI:    $1,400
Firestore:    $100
Functions:    $150
Total:        $1,650/month
```

**Cost Optimization:**
- Use Gemini 2.0 Flash (cheapest model)
- Batch analytics calls
- Cache validation results
- Optimize prompts for token efficiency

---

## APPENDIX

### File Locations

**Agent Configurations:**
```
vertex-agents/
├── orchestrator/
│   ├── config/
│   │   ├── agent.yaml
│   │   └── agent-card.json
│   └── src/
│       └── orchestrator_agent.py
├── validation/
├── user-creation/
├── onboarding/
└── analytics/
```

**Cloud Functions:**
```
functions/
└── src/
    ├── index.ts              (Updated with A2A)
    └── a2a-client.ts         (NEW)
```

**Documentation:**
```
000-docs/
├── 171-AT-DSGN-orchestrator-agent-prompt.md
├── 172-OD-DEPL-firebase-a2a-setup-complete.md
└── 173-OD-DEPL-vertex-ai-a2a-deployment-guide.md (This doc)
```

### Reference Links

- Vertex AI Agent Builder: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview
- A2A Protocol Spec: https://google.github.io/adk-docs/a2a/
- ADK Documentation: https://google.github.io/adk-docs/
- Firebase Cloud Functions: https://firebase.google.com/docs/functions
- Firestore Documentation: https://firebase.google.com/docs/firestore

### Glossary

- **A2A**: Agent-to-Agent protocol for inter-agent communication
- **ADK**: Agent Development Kit (Google)
- **AgentCard**: Metadata describing agent capabilities
- **Memory Bank**: Session persistence layer for agents
- **Orchestrator**: Main agent coordinating sub-agents
- **Session ID**: Unique identifier for conversation context

---

## CONCLUSION

This deployment guide provides comprehensive instructions for deploying the Hustle Operations Manager multi-agent system to Vertex AI Agent Engine using the A2A protocol.

**Key Points:**
- 5 agents total (1 orchestrator + 4 sub-agents)
- A2A protocol enables parallel execution
- Memory Bank provides session persistence
- Cloud Functions serve as thin API gateway
- Cost-effective: ~$0.01 per registration
- Performance target: < 2s execution time

**Next Action:**
Begin deployment by creating the orchestrator agent in Vertex AI Console (see [Agent Deployment](#agent-deployment) section).

---

**Document:** 173-OD-DEPL-vertex-ai-a2a-deployment-guide.md
**Status:** Complete - Ready for Deployment
**Last Updated:** 2025-11-10T00:00:00Z
**Classification:** Operations - Deployment
