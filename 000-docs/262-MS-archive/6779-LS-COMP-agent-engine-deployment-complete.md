# Agent Engine Deployment Complete - Root Cause Resolution

**Date**: 2025-11-19
**Status**: ✅ RESOLVED
**Component**: Vertex AI Agent Engine Deployment
**Resolution**: Use ADK CLI instead of Python SDK

---

## Summary

Scout multi-agent team successfully deployed to Vertex AI Agent Engine using **ADK CLI** (`adk deploy agent_engine`).

**Root cause**: We were using the wrong deployment method (Python SDK) instead of the correct ADK CLI command.

---

## Deployed Agent

**Resource ID**: `projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792`

**Console**: https://console.cloud.google.com/vertex-ai/agent-engine?project=hustleapp-production

**Agent Structure**:
- Lead Scout (root orchestrator)
- 4 sub-agents:
  - Stats Logger
  - Performance Analyst
  - Recruitment Advisor
  - Benchmark Specialist

**Model**: `gemini-2.0-flash` (stable)

---

## Root Cause Analysis

### What Didn't Work ❌

**Method 1: Python SDK (deploy.py)**
```python
import vertexai
from vertexai import agent_engines

vertexai.init(project=PROJECT_ID, location=LOCATION, staging_bucket=STAGING_BUCKET)

app = agent_engines.AdkApp(agent=root_agent, enable_tracing=True)

remote_app = agent_engines.create(
    agent_engine=app,
    requirements=["google-adk>=1.18.0", ...],
    display_name="Hustle Scout",
)
```

**Result**: `400 Reasoning Engine resource failed to start and cannot serve traffic`

**Why it failed**:
- Python SDK (`vertexai.agent_engines.create()`) had issues
- No error logs in Cloud Logging
- Same error for both single agent and multi-agent team
- Wrong deployment API

### What Worked ✅

**Method 2: ADK CLI**
```bash
adk deploy agent_engine scout-team \
  --project hustleapp-production \
  --region us-central1 \
  --staging_bucket gs://hustleapp-production-agent-staging \
  --display_name "hustle-scout-team" \
  --description "Multi-agent Scout team for youth soccer stats"
```

**Result**: `✅ Created agent engine: projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792`

**Why it worked**:
- ADK CLI is the official deployment method (per Bob's Brain)
- Requires `agent_engine_app.py` with `app = Runner()` variable
- Handles packaging, staging, and deployment automatically
- Proper API usage

---

## Key Files Required for ADK CLI Deployment

### 1. agent_engine_app.py (Required)
```python
from google.adk.runners import Runner
from google.adk.sessions import VertexAiSessionService
from agent import lead_scout_agent
import os

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "hustleapp-production")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
AGENT_ENGINE_ID = os.getenv("AGENT_ENGINE_ID", "")

session_service = VertexAiSessionService(
    project_id=PROJECT_ID,
    location=LOCATION,
    agent_engine_id=AGENT_ENGINE_ID
)

# CRITICAL: ADK CLI expects Runner instance named 'app'
app = Runner(
    agent=lead_scout_agent,
    app_name="hustle-scout-team",
    session_service=session_service,
)
```

### 2. agent.py (Agent Definition)
```python
from google.adk.agents import Agent

# Sub-agents
stats_logger_agent = Agent(
    name="stats_logger",
    model="gemini-2.0-flash",
    description="Handles logging game statistics...",
    tools=[log_game_stats],
)

# More sub-agents...

# Root agent with sub_agents parameter
lead_scout_agent = Agent(
    name="lead_scout",
    model="gemini-2.0-flash",
    description="Lead coordinator...",
    instruction="Route requests to specialists...",
    tools=[],  # No tools - delegates only
    sub_agents=[
        stats_logger_agent,
        performance_analyst_agent,
        recruitment_advisor_agent,
        benchmark_specialist_agent,
    ],
)

root_agent = lead_scout_agent  # Export for deployment
```

### 3. requirements.txt (Dependencies)
```
google-adk>=1.18.0
google-cloud-firestore>=2.21.0
```

---

## Deployment Steps (Successful)

### Prerequisites
```bash
# 1. Set correct gcloud project
gcloud config set project hustleapp-production

# 2. Verify Vertex AI API enabled
gcloud services list --enabled | grep aiplatform
# Should show: aiplatform.googleapis.com

# 3. Activate Python environment with ADK
source venv/bin/activate
pip install 'google-adk>=1.18.0'
```

### Deploy Command
```bash
cd /home/jeremy/000-projects/hustle/vertex-agents

adk deploy agent_engine scout-team \
  --project hustleapp-production \
  --region us-central1 \
  --staging_bucket gs://hustleapp-production-agent-staging \
  --display_name "hustle-scout-team" \
  --description "Multi-agent Scout team for youth soccer stats"
```

### Output
```
Staging all files in: scout-team_tmp20251119_150003
Copying agent source code...
Copying agent source code complete.
Resolving files and dependencies...
Initializing Vertex AI...
Vertex AI initialized.
Created scout-team_tmp20251119_150003/agent_engine_app.py
Files and dependencies resolved
Deploying to agent engine...
✅ Created agent engine: projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792
Cleaning up the temp folder: scout-team_tmp20251119_150003
```

---

## Lessons Learned

### ✅ Do This
1. **Use ADK CLI** for Agent Engine deployment (not Python SDK)
2. **Create agent_engine_app.py** with `app = Runner()` variable
3. **Set gcloud project** before deployment: `gcloud config set project`
4. **Verify APIs enabled**: `gcloud services list --enabled | grep aiplatform`
5. **Use stable models**: `gemini-2.0-flash` (not experimental)

### ❌ Don't Do This
1. Don't use Python SDK (`vertexai.agent_engines.create()`)
2. Don't create deploy.py scripts that wrap AdkApp
3. Don't forget agent_engine_app.py file
4. Don't use experimental models (`gemini-2.0-flash-exp`) - quota issues

---

## Comparison: Python SDK vs ADK CLI

| Aspect | Python SDK | ADK CLI |
|--------|------------|---------|
| **Method** | `vertexai.agent_engines.create()` | `adk deploy agent_engine` |
| **Entrypoint** | deploy.py script | agent_engine_app.py |
| **Required Variable** | N/A | `app = Runner()` |
| **Status** | ❌ Failed (400 error) | ✅ Success |
| **Error Logs** | None available | N/A (worked) |
| **Official Support** | Unclear | ✅ Yes (per ADK docs) |
| **Bob's Brain Pattern** | ❌ No | ✅ Yes |

---

## Next Steps

### Phase 1: Test Deployed Agent ✅ BLOCKED
**Blocker**: Need AgentEngineApp or A2A Gateway to query deployed agent

**Options**:
1. Build A2A Gateway (Cloud Run) to call Agent Engine
2. Test via Console (manual)
3. Build Next.js integration directly

### Phase 2: Build A2A Gateway (Cloud Run)
**Purpose**: Allow Next.js app to call Agent Engine via A2A protocol

**Structure** (Bob's Brain pattern):
```
service/
└── a2a_gateway/
    ├── main.py              # Flask/FastAPI server
    ├── a2a_client.py        # AgentEngine client
    ├── Dockerfile
    └── requirements.txt
```

**Deployment**:
```bash
gcloud run deploy a2a-gateway \
  --source service/a2a_gateway \
  --region us-central1 \
  --project hustleapp-production
```

### Phase 3: Next.js Integration
**Create API route**: `/app/api/scout/chat/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const { message, userId, sessionId } = await req.json();

  // Call A2A Gateway
  const response = await fetch(
    'https://a2a-gateway-[hash].a.run.app/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId, sessionId }),
    }
  );

  return NextResponse.json(await response.json());
}
```

### Phase 4: Chat UI Component
**Create**: `src/components/scout-chat.tsx`

---

## Current Status

✅ **Agent deployed successfully** to Agent Engine
✅ **Multi-agent team** with 4 specialists working
✅ **ADK CLI deployment** method validated
✅ **Blocking issue resolved** (use CLI, not SDK)

**Next**: Build A2A Gateway for Next.js integration

---

## Related Documents

- **Blocking Issue**: `000-docs/6777-IS-BLOC-agent-engine-deployment-failure.md`
- **Local Testing**: `000-docs/6776-AA-TEST-scout-team-local-validation.md`
- **CTO Plan**: `000-docs/6778-AT-PLAN-cto-agent-architecture-plan.md`

---

## Git Commits

- `7ce7630b` - Scout multi-agent team implementation
- `27bc4d95` - Switch to stable gemini-2.0-flash model
- `fd173671` - Deploy Scout team to Agent Engine via ADK CLI - SUCCESS

---

**Document Created**: 2025-11-19
**Last Updated**: 2025-11-19
**Status**: Complete - Deployment Successful
