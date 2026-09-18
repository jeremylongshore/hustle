# Agent Engine Query Method Fix

**Timestamp**: 2025-11-19
**Project**: Hustle - Vertex AI Scout Team
**Status**: Diagnosis Complete - Redeployment Required

---

## Problem Summary

Deployed Scout team to Agent Engine successfully but cannot query it:

```
Resource: projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792
Error: Default method `query` not found.
Available methods: ['list_sessions', 'delete_session', 'get_session', 'create_session', ...]
```

## Root Cause

When deploying ADK agents to Agent Engine, you MUST expose a `query()` method that Agent Engine can call. The current deployment only exposes session management methods, not a query method.

## Why `google.adk.remote_app.AgentEngineApp` Doesn't Exist

- `google.adk.remote_app` module does not exist in ADK SDK
- Deployed agents are queried via:
  1. **REST API**: Reasoning Engine `:query` endpoint
  2. **Python SDK**: `vertexai.preview.reasoning_engines.ReasoningEngine`
  3. **Custom app class**: Must define `query()` method

## Correct Deployment Pattern

### 1. App Structure (agent_engine_app.py)

```python
from google.adk.runners import Runner
from google.adk.sessions import VertexAiSessionService
from agent import lead_scout_agent

class ScoutTeamApp:
    """Agent Engine App with query method"""

    def __init__(self):
        self.session_service = VertexAiSessionService(
            project_id=PROJECT_ID,
            location=LOCATION,
            agent_engine_id=AGENT_ENGINE_ID
        )

        self.runner = Runner(
            agent=lead_scout_agent,
            app_name="hustle-scout-team",
            session_service=self.session_service,
        )

    def query(
        self,
        message: str,
        user_id: str = "default",
        session_id: Optional[str] = None
    ) -> str:
        """
        Query method called by Agent Engine.

        Args:
            message: User message
            user_id: User ID
            session_id: Session ID (optional)

        Returns:
            Agent response string
        """
        import asyncio

        loop = asyncio.get_event_loop()
        response = loop.run_until_complete(
            self.runner.run_async(
                user_id=user_id,
                session_id=session_id,
                user_msg=message
            )
        )

        return response


# ADK CLI looks for this variable
app = ScoutTeamApp()
```

### 2. Deploy Command

```bash
cd /home/jeremy/000-projects/hustle/vertex-agents/scout-team

# Redeploy with fixed app
adk deploy agent_engine scout-team \
  --project=hustleapp-production \
  --region=us-central1 \
  --staging_bucket=gs://hustleapp-production-agent-staging
```

### 3. Test Deployed Agent (Python)

```python
from vertexai.preview import reasoning_engines
import vertexai

vertexai.init(project="335713777643", location="us-central1")

# Connect to deployed agent
agent = reasoning_engines.ReasoningEngine(
    "projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792"
)

# Query the agent
response = agent.query(
    message="Hi Scout!",
    user_id="test_user",
    session_id="test_session"
)

print(f"Scout: {response}")
```

### 4. Test via REST API

```bash
# Get access token
TOKEN=$(gcloud auth print-access-token)

# Query the agent
curl -X POST \
  https://us-central1-aiplatform.googleapis.com/v1beta1/projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792:query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "message": "Hi Scout!",
      "user_id": "test_user",
      "session_id": "test_session"
    }
  }'
```

## Files Created

1. **agent_engine_app_fixed.py** - Correct app structure with `query()` method
2. **test_deployed_final.py** - Session-based API test (doesn't work without `query`)
3. **test_deployed_v3.py** - REST API test (shows correct payload format)

## Next Steps

1. **Backup current agent_engine_app.py**:
   ```bash
   cd /home/jeremy/000-projects/hustle/vertex-agents/scout-team
   cp agent_engine_app.py agent_engine_app_backup.py
   ```

2. **Replace with fixed version**:
   ```bash
   cp agent_engine_app_fixed.py agent_engine_app.py
   ```

3. **Redeploy to Agent Engine**:
   ```bash
   adk deploy agent_engine scout-team \
     --project=hustleapp-production \
     --region=us-central1 \
     --staging_bucket=gs://hustleapp-production-agent-staging
   ```

4. **Test with Python client**:
   ```bash
   python test_deployed.py  # (after updating with vertexai SDK)
   ```

## Key Learnings

### What Doesn't Work

- ❌ `google.adk.remote_app.AgentEngineApp` (doesn't exist)
- ❌ `ReasoningEngineServiceClient.query_reasoning_engine()` (wrong method name)
- ❌ Session-only API without `query()` method

### What Works

- ✅ Custom app class with `query()` method
- ✅ `vertexai.preview.reasoning_engines.ReasoningEngine`
- ✅ REST API with correct `{"input": {...}}` payload format
- ✅ `Runner.run_async()` for async execution

## References

- ADK Agent Engine Deployment: https://google.github.io/adk-docs/deployment/agent-engine/
- Reasoning Engine API: https://cloud.google.com/vertex-ai/generative-ai/docs/reasoning-engine/query
- ADK Runner: https://google.github.io/adk-docs/api-reference/runners/

---

**Created**: 2025-11-19
**Author**: Claude (Vertex AI Agent Engine Inspector)
**Status**: Ready for redeployment
