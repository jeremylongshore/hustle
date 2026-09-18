# Agent Engine Deployment Failure - Blocking Issue

**Date**: 2025-11-19
**Status**: 🚫 BLOCKED
**Severity**: HIGH
**Component**: Vertex AI Agent Engine Deployment
**Error**: `400 Reasoning Engine resource failed to start and cannot serve traffic`

---

## Summary

Both single-agent and multi-agent Scout deployments to Vertex AI Agent Engine fail with the same error during the startup phase. Local testing with Vertex AI models works perfectly (5/5 scenarios pass), but Agent Engine deployment fails consistently.

**Critical**: This blocks the goal of deploying conversational agents to production.

---

## Error Details

### Error Message
```
400 Reasoning Engine resource [projects/335713777643/locations/us-central1/reasoningEngines/XXXXX]
failed to start and cannot serve traffic. Please refer to our documentation
(https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/troubleshooting/deploy)
for checking logs and other troubleshooting tips.
```

### Failed Deployments

**1. Scout Team (Multi-Agent)**
- Resource ID: `3592619059385991168`
- Model: `gemini-2.0-flash` (all 5 agents)
- Operation: `projects/335713777643/locations/us-central1/reasoningEngines/3592619059385991168/operations/48343928545476608`

**2. Scout Single Agent**
- Resource ID: `3871842236282961920`
- Model: `gemini-2.0-flash`
- Operation: `projects/335713777643/locations/us-central1/reasoningEngines/3871842236282961920/operations/6294836611708354560`

---

## Environment Configuration

### Project
```bash
GOOGLE_CLOUD_PROJECT="hustleapp-production"
GOOGLE_CLOUD_LOCATION="us-central1"
PROJECT_NUMBER="335713777643"
```

### Deployment Configuration
```python
# deploy.py
remote_app = agent_engines.create(
    agent_engine=app,
    requirements=[
        "google-adk>=1.18.0",
        "google-cloud-firestore>=2.21.0",
    ],
    display_name="Hustle Scout - Personal Sports Statistician",
    description="Conversational agent for tracking youth athlete statistics...",
)
```

### Staging Bucket
```
gs://hustleapp-production-agent-staging
```
- Location: us-central1
- Created successfully
- Files written successfully:
  - `agent_engine.pkl`
  - `requirements.txt`
  - `dependencies.tar.gz`

---

## Troubleshooting Completed

### ✅ Authentication
```bash
gcloud auth application-default login
# ✅ Authenticated successfully
```

### ✅ Project Access
```bash
gcloud config get project
# ✅ hustleapp-production
```

### ✅ Vertex AI API
```bash
gcloud services list --enabled | grep aiplatform
# ✅ aiplatform.googleapis.com ENABLED
```

### ✅ Service Account
```bash
Service Account: service-335713777643@gcp-sa-aiplatform-re.iam.gserviceaccount.com
Role: roles/aiplatform.reasoningEngineServiceAgent
# ✅ Service account exists with correct role
```

### ✅ Staging Bucket
```bash
gsutil ls gs://hustleapp-production-agent-staging
# ✅ Bucket exists, files written successfully
```

### ✅ VPC-SC Perimeters
```bash
# ❌ API not enabled (not using VPC-SC)
# This is NOT the issue - VPC-SC not configured
```

### ✅ Local Testing
```bash
# Local testing with Vertex AI:
export GOOGLE_CLOUD_PROJECT="hustleapp-production"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_GENAI_USE_VERTEXAI=TRUE
python test_local.py

# Result: ✅ ALL 5 TEST SCENARIOS PASS
# - Simple greeting
# - Log game stats (delegation to Stats Logger)
# - Get player stats (delegation to Performance Analyst)
# - Recruitment insights (delegation to Recruitment Advisor)
# - Clarifying question
```

### ✅ Model Availability
- Model: `gemini-2.0-flash` (generally available)
- Used in official ADK agent team tutorial
- Works locally with GOOGLE_GENAI_USE_VERTEXAI=TRUE
- Not an experimental model (was gemini-2.0-flash-exp before)

### ❌ Deployment Logs
```bash
gcloud logging read "resource.type=vertex_ai_reasoning_engine..." --limit=20
# Result: Empty logs
# No error details available in Cloud Logging
```

---

## Documentation References

### Troubleshooting Doc
https://docs.cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/troubleshooting/deploy

**Common Causes Listed**:
1. **VPC-SC violations** - Missing ingress rules
   - Status: ✅ NOT APPLICABLE (VPC-SC not configured)

2. **Dirty agent state** - Calling `.set_up()` before deployment
   - Status: ✅ NOT APPLICABLE (not calling .set_up())

3. **Package version mismatches** - Incompatible pydantic/aiplatform versions
   - Status: ⚠️ POSSIBLE
   - Our versions:
     - `pydantic==2.12.4` (auto-appended by Agent Engine)
     - `google-cloud-aiplatform==1.128.0` (detected)
     - `google-adk==1.18.0` (specified)
   - Recommended: pydantic≥2.6.4, google-cloud-aiplatform≥1.49.0
   - Our versions exceed minimums ✅

4. **Service Account problems** - Missing permissions
   - Status: ✅ NOT APPLICABLE (service account has correct role)

5. **Cloud Storage access** - Missing Storage Admin permissions
   - Status: ✅ NOT APPLICABLE (files written successfully to staging bucket)

---

## Possible Causes (Unverified)

### 1. Model Name Format
**Issue**: Vertex AI might require versioned model names
- Current: `gemini-2.0-flash`
- Possible fix: `gemini-2.0-flash-001` or `publishers/google/models/gemini-2.0-flash`

**Counter-evidence**: ADK tutorial uses `gemini-2.0-flash` directly

### 2. Multi-Agent Support
**Issue**: Agent Engine might not support `sub_agents` parameter yet
**Counter-evidence**: Single agent also fails with same error

### 3. Firestore Dependencies
**Issue**: Agent tools reference Firestore but use mock data
**Possible issue**: Firestore imports might cause serialization issues during pickle

### 4. Missing IAM Permissions
**Issue**: Service account might need additional permissions beyond reasoningEngineServiceAgent
**Possible permissions needed**:
- `roles/storage.objectViewer` (staging bucket read)
- `roles/artifactregistry.reader` (artifact registry access)
- `roles/aiplatform.user` (Vertex AI model access)

### 5. Region/Model Availability
**Issue**: `gemini-2.0-flash` might not be available in `us-central1` for Agent Engine
**Test**: Try different region or model

### 6. ADK Version Compatibility
**Issue**: `google-adk==1.18.0` might have Agent Engine incompatibilities
**Test**: Try older/newer ADK version

---

## Impact

### Blocks
- ✅ Multi-agent team implementation (COMPLETE)
- ✅ Local testing (COMPLETE)
- 🚫 **Agent Engine deployment** (BLOCKED)
- 🚫 **Production conversational agent** (BLOCKED)
- 🚫 **Next.js integration** (BLOCKED - no endpoint to call)

### Workarounds
**None available** - Agent Engine deployment is required for production use.

Local testing works but requires:
- Vertex AI credentials
- Environment variables set
- Not suitable for production web app

---

## Next Steps (Recommendations)

### Option 1: Try Model Name Variations
```python
# Try versioned model names
model="gemini-2.0-flash-001"
model="publishers/google/models/gemini-2.0-flash"
model="gemini-1.5-flash"  # Fallback to stable 1.5
```

### Option 2: Simplify Agent (Minimal Test)
```python
# Create absolute minimum agent (no tools, no Firestore imports)
minimal_agent = Agent(
    name="minimal_test",
    model="gemini-2.0-flash",
    description="Minimal test agent",
    instruction="You are a test agent. Respond hello.",
    tools=[],
)
```

### Option 3: Check IAM Permissions
```bash
# Grant additional permissions to service account
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:service-335713777643@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:service-335713777643@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Option 4: Try Different Region
```python
LOCATION = "us-west1"  # or "europe-west1"
```

### Option 5: Contact Google Cloud Support
- Open support ticket with Google Cloud
- Provide reasoning engine IDs
- Request detailed error logs from backend

### Option 6: Alternative Deployment (Cloud Run)
- Deploy agents as Cloud Run services instead of Agent Engine
- Use ADK's built-in API server
- More control but requires manual scaling/management

---

## Files

### Agent Implementation
- Single agent: `/home/jeremy/000-projects/hustle/vertex-agents/scout/agent.py`
- Multi-agent team: `/home/jeremy/000-projects/hustle/vertex-agents/scout-team/agent.py`

### Deployment Scripts
- Single agent: `/home/jeremy/000-projects/hustle/vertex-agents/scout/deploy.py`
- Multi-agent team: `/home/jeremy/000-projects/hustle/vertex-agents/scout-team/deploy.py`

### Test Results
- Local validation: `/home/jeremy/000-projects/hustle/000-docs/6776-AA-TEST-scout-team-local-validation.md`

---

## Git Commits

- `7ce7630b` - Scout multi-agent team implementation
- `c77606a4` - Session creation fixes
- `27bc4d95` - Switch to stable gemini-2.0-flash model
- `81994b57` - Local validation documentation

---

## Console Links

### Reasoning Engines (May show deployment status)
https://console.cloud.google.com/vertex-ai/reasoning-engines?project=hustleapp-production

### Cloud Logging
https://console.cloud.google.com/logs/query?project=hustleapp-production

### Staging Bucket
https://console.cloud.google.com/storage/browser/hustleapp-production-agent-staging?project=hustleapp-production

---

**Document Created**: 2025-11-19
**Last Updated**: 2025-11-19
**Status**: Open - Awaiting Resolution
