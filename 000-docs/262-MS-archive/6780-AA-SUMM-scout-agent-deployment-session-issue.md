# Scout Agent - Deployment & Session Management Issue

**Date**: 2025-11-19
**Status**: ⚠️ PARTIAL - Agent deployed but testing blocked
**Component**: Vertex AI Agent Engine Deployment + Testing

---

## Summary

Scout multi-agent team successfully **deployed** to Vertex AI Agent Engine using ADK CLI, but **testing is blocked** due to Firestore session serialization issues. The agent is running but cannot be queried directly via Python SDK.

**Deployed Resource**: `projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792`

---

## What Works ✅

1. **ADK CLI Deployment**: `adk deploy agent_engine scout-team` succeeds
2. **Agent Structure**: Lead Scout + 4 sub-agents deployed correctly
3. **Session Methods Exposed**: Agent Engine exposes session management methods via SDK
4. **List Sessions**: `engine.list_sessions(user_id)` works

## What Doesn't Work ❌

1. **Create Session**: Fails with `"cannot pickle 'socket' object"`
2. **Get Session**: Fails with same pickle error
3. **Direct Query**: No `query()`, `run()`, or `invoke()` methods available on SDK
4. **Local Testing**: Can't test agent with Python SDK

---

## Root Cause

### Firestore VertexAiSessionService Serialization Issue

When using `VertexAiSessionService` with Firestore backend:

```python
session_service = VertexAiSessionService(
    project_id=PROJECT_ID,
    location=LOCATION,
    agent_engine_id=AGENT_ENGINE_ID
)
```

Agent Engine tries to serialize the session service, which contains Firestore client connections (sockets). **Sockets cannot be pickled**, causing deployment to fail when session methods are called.

**Error**:
```
"cannot pickle 'socket' object"
```

### Missing Direct Invocation Methods

The `ReasoningEngine` Python SDK only exposes:
- `create_session()`
- `get_session()`
- `list_sessions()`
- `delete_session()`

**NO** direct invocation methods like:
- `query()`
- `run()`
- `invoke()`
- `execute()`

This means you **cannot** directly test the agent from Python without building additional infrastructure.

---

## Investigation Steps Taken

### Step 1: Initial Deployment (SUCCESS)
```bash
adk deploy agent_engine scout-team \
  --project hustleapp-production \
  --region us-central1 \
  --staging_bucket gs://hustleapp-production-agent-staging
```

**Result**: ✅ `Created agent engine: .../6962648586798497792`

### Step 2: Testing with REST API (FAIL)
Tried direct REST API calls to `:query` endpoint → 404 Not Found

**Reason**: Agent doesn't expose `query()` method

### Step 3: Testing with Session API (FAIL)
Tried:
1. `engine.create_session(user_id="test", session_id="test")` → "cannot pickle 'socket' object"
2. `engine.get_session(...)` → Same pickle error
3. `engine.list_sessions(...)` → ✅ Works but returns empty list

### Step 4: Tried Query Method Fix (FAIL)
Created `agent_engine_app.py` with custom `query()` method:
- Wrapped Runner in class with `query()` method
- Redeployed → Agent Engine error: "Default method `query` not found"
- Payload size too large (567MB venv included)
- Removed venv, redeployed successfully
- Still no `query()` method exposed

**Reason**: ADK's Runner doesn't automatically expose `query()` to Agent Engine REST API

---

## Solutions (In Priority Order)

### Solution 1: Build A2A Gateway (Cloud Run) - RECOMMENDED ✅

**What**: FastAPI/Flask service on Cloud Run that proxies requests to Agent Engine via REST API

**Structure** (from CTO plan):
```
service/
└── a2a_gateway/
    ├── main.py              # FastAPI server
    ├── a2a_client.py        # AgentEngine client
    ├── Dockerfile
    └── requirements.txt
```

**Benefits**:
- Works around session serialization issues
- Adds authentication, rate limiting
- Provides logging and monitoring
- Standard pattern used by Bob's Brain

**Deployment**:
```bash
gcloud run deploy a2a-gateway \
  --source service/a2a_gateway \
  --region us-central1 \
  --project hustleapp-production
```

**Effort**: ~2 hours
**Status**: Not started

### Solution 2: Use InMemorySessionService (WORKAROUND) ⚠️

**What**: Replace `VertexAiSessionService` with `InMemorySessionService`

```python
from google.adk.sessions import InMemorySessionService

session_service = InMemorySessionService()  # No Firestore
```

**Benefits**:
- No pickle errors
- Can test agent immediately

**Drawbacks**:
- ❌ Sessions don't persist across requests
- ❌ Not production-ready
- ❌ Defeats purpose of Agent Engine session management

**Use Case**: Local testing only

### Solution 3: Use AdkApp Instead of Runner (EXPERIMENTAL) 🔬

**What**: Use `vertexai.agent_engines.templates.adk.AdkApp` wrapper

```python
from vertexai.agent_engines.templates.adk import AdkApp

app = AdkApp(agent=lead_scout_agent, enable_tracing=True)
```

**Benefits**:
- May handle serialization differently
- Designed for Agent Engine deployment

**Drawbacks**:
- Previously failed with 400 errors
- Unclear if it fixes session issues

**Status**: Not tested with current agent structure

### Solution 4: Build Next.js Integration Directly (SKIP TESTING) 🚀

**What**: Don't test locally, build Next.js API route that calls A2A Gateway

```typescript
// /app/api/scout/chat/route.ts
export async function POST(req: NextRequest) {
  const { message, userId } = await req.json();

  const response = await fetch(
    'https://a2a-gateway-[hash].a.run.app/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId }),
    }
  );

  return NextResponse.json(await response.json());
}
```

**Benefits**:
- Focuses on actual product integration
- Skips testing infrastructure
- Gets to user value faster

**Drawbacks**:
- No local testing capability
- Harder to debug agent issues

---

## Comparison: Solutions

| Solution | Effort | Production Ready | Enables Testing | Complexity |
|----------|--------|------------------|-----------------|------------|
| **A2A Gateway** | 2h | ✅ Yes | ✅ Yes | Medium |
| **InMemorySession** | 10min | ❌ No | ✅ Yes | Low |
| **AdkApp** | 1h | ❓ Unknown | ❓ Maybe | Medium |
| **Skip Testing** | 30min | ✅ Yes | ❌ No | Low |

---

## Recommendation

**Build A2A Gateway (Solution 1)**

Reasons:
1. Standard production pattern (Bob's Brain uses this)
2. Enables local testing AND production use
3. Adds authentication, logging, rate limiting
4. Only viable way to test deployed agent currently
5. Required for Next.js integration anyway

**Next Steps**:
1. Create `service/a2a_gateway/` directory
2. Implement FastAPI server with REST endpoint
3. Create AgentEngine REST client
4. Deploy to Cloud Run
5. Test via curl/Postman
6. Build Next.js integration

---

## Files Created

### scout-team/agent_engine_app.py
Simple Runner export (CURRENT):
```python
app = Runner(
    agent=lead_scout_agent,
    app_name=APP_NAME,
    session_service=session_service,
)
```

### scout-team/test_agent_working.py
Test script showing session methods (partial success):
- ✅ list_sessions() works
- ❌ create_session() fails with pickle error
- ❌ get_session() fails with pickle error

---

## Key Learnings

1. **ADK CLI Deployment**: Use `adk deploy agent_engine`, NOT Python SDK
2. **Session Serialization**: VertexAiSessionService with Firestore doesn't serialize to Agent Engine
3. **No Direct SDK Access**: Python SDK only exposes session management, not direct invocation
4. **A2A Gateway Required**: Standard pattern for production Agent Engine deployments
5. **venv Must Be Excluded**: ADK CLI packages everything, hits 8MB payload limit if venv included

---

## Related Documents

- **Deployment Success**: `000-docs/6779-LS-COMP-agent-engine-deployment-complete.md`
- **CTO Plan**: `000-docs/6778-AT-PLAN-cto-agent-architecture-plan.md` (outlines A2A Gateway)
- **Local Testing**: `000-docs/6776-AA-TEST-scout-team-local-validation.md` (InMemoryRunner works)

---

## Next Action

**BUILD A2A GATEWAY** per CTO plan Phase 2.

**Command**:
```bash
cd /home/jeremy/000-projects/hustle
mkdir -p service/a2a_gateway
# Implement FastAPI gateway
# Deploy to Cloud Run
# Test agent via gateway
```

---

**Document Created**: 2025-11-19
**Status**: Agent deployed, testing blocked, A2A Gateway needed
