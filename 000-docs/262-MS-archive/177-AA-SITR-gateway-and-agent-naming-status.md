# Gateway Architecture & Agent Naming Status

**Date:** 2025-11-10T09:00:00Z
**Status:** ⚠️ NEEDS CONFIGURATION
**Type:** Situation Report - Gateway & Agent Configuration

---

## EXECUTIVE SUMMARY

**Current State:**
- ✅ Cloud Run service exists (`hustle-app`) - serving Next.js frontend
- ⚠️ Cloud Functions NOT yet deployed (orchestrator agent gateway)
- ⚠️ Vertex AI agents NOT yet deployed (waiting for GitHub Actions)
- ⚠️ Agent naming is configured but needs proper labels/tags

**What Needs to Happen:**
1. Deploy Cloud Functions as API gateway between frontend and Vertex AI agents
2. Deploy Vertex AI agents with proper display names and labels
3. Configure agent endpoints in Cloud Functions
4. Test end-to-end flow

---

## QUESTION 1: Cloud Run as Gateway?

### Current Architecture

**Existing Cloud Run Service:**
```
Service: hustle-app
Region: us-central1
URL: https://hustle-app-335713777643.us-central1.run.app
Last Deployed: 2025-10-29 (via GitHub Actions)
Purpose: Next.js frontend application
```

**Problem:** This Cloud Run service is just the **Next.js frontend**, NOT an API gateway to Vertex AI agents.

### Correct Architecture (What We're Building)

```
User Request
    ↓
Next.js Frontend (Cloud Run: hustle-app)
    ↓
Cloud Functions (orchestrator) ← **THIS IS THE GATEWAY**
    ↓
Vertex AI Orchestrator Agent
    ↓
Vertex AI Sub-Agents (validation, creation, onboarding, analytics)
    ↓
Firestore Database
```

### Gateway Layer: Cloud Functions

**Cloud Functions as Gateway:**

The `functions/src/index.ts` file defines the **orchestrator** Cloud Function which acts as the gateway between the frontend and Vertex AI agents:

```typescript
export const orchestrator = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 30,
    memory: '512MB'
  })
  .https.onCall(async (data, context) => {
    // Receives requests from Next.js frontend
    const { intent, data: requestData } = data;

    // Forwards to Vertex AI orchestrator agent
    const a2aClient = getA2AClient();
    const response = await a2aClient.sendTask({
      intent,
      data: requestData,
      auth: context.auth
    });

    return response;
  });
```

**Gateway Responsibilities:**
- ✅ Authentication check (via Firebase Auth context)
- ✅ Request logging
- ✅ Forward to Vertex AI agent via A2A protocol
- ✅ Error handling and retries
- ✅ Return response to frontend

**Status:** ❌ NOT YET DEPLOYED

The Cloud Functions are defined in code but NOT yet deployed. GitHub Actions workflow will deploy them after agents are deployed.

---

## QUESTION 2: Agent Display Names & Labels

### Current Agent Naming Configuration

**Agent Names in Vertex AI:**

The deployment script (`deploy_agent.py`) uses the `agent_name` as the `display_name`:

```python
agent = Agent(
    display_name=agent_name,  # e.g., "hustle-operations-manager"
    description=agent_config.get('description', ''),
    default_language_code='en',
)
```

**5 Agents with Display Names:**

| Agent Name | Display Name | Description | Status |
|------------|--------------|-------------|--------|
| `hustle-operations-manager` | hustle-operations-manager | Team manager orchestrating all Hustle operations via A2A protocol | ⚠️ Not deployed |
| `hustle-validation-agent` | hustle-validation-agent | Input validation and security checks | ⚠️ Not deployed |
| `hustle-user-creation-agent` | hustle-user-creation-agent | Database writes to Firestore | ⚠️ Not deployed |
| `hustle-onboarding-agent` | hustle-onboarding-agent | Welcome emails and verification flow | ⚠️ Not deployed |
| `hustle-analytics-agent` | hustle-analytics-agent | Metrics tracking and dashboard updates | ⚠️ Not deployed |

**Problem:** These names are **distinguishable** but NOT human-friendly in the Vertex AI console.

### Recommended: Add Friendly Display Names

**Current (Technical Names):**
```
hustle-operations-manager
hustle-validation-agent
hustle-user-creation-agent
hustle-onboarding-agent
hustle-analytics-agent
```

**Recommended (Human-Friendly Display Names):**
```
Hustle Operations Manager
Hustle Validation Agent
Hustle User Creation Agent
Hustle Onboarding Agent
Hustle Analytics Agent
```

**How to Fix:**

Update `agent.yaml` files to have both technical `name` and friendly `display_name`:

```yaml
agent:
  name: hustle-operations-manager              # Technical ID
  display_name: "Hustle Operations Manager"    # Human-friendly
  description: "Team manager orchestrating all Hustle operations"
```

Then update `deploy_agent.py` to use the friendly display name:

```python
agent = Agent(
    display_name=agent_config.get('display_name', agent_name),  # Use friendly name
    description=agent_config.get('description', ''),
)
```

### Add Labels/Tags for Organization

**Recommended Labels:**

Add labels to agents for better organization in Vertex AI console:

```python
agent = Agent(
    display_name=agent_config.get('display_name', agent_name),
    description=agent_config.get('description', ''),
    labels={
        'project': 'hustle',
        'environment': 'production',
        'role': agent_config.get('role', 'sub-agent'),  # orchestrator | sub-agent
        'capability': agent_config.get('capability', ''),  # validation | creation | onboarding | analytics
        'version': '1.0.0'
    }
)
```

**Benefits:**
- Filter agents by project in Vertex AI console
- Distinguish production vs staging agents
- Organize by capability (validation, creation, etc.)
- Track agent versions

---

## CURRENT STATUS BREAKDOWN

### ✅ What's Ready

1. **Cloud Run Frontend**
   - Service: `hustle-app` deployed and running
   - Serves Next.js application
   - URL: https://hustle-app-335713777643.us-central1.run.app

2. **Cloud Functions Code**
   - Gateway function defined: `orchestrator`
   - A2A client implemented: `functions/src/a2a-client.ts`
   - Sub-agent stub functions created (4 functions)

3. **Agent Configurations**
   - Orchestrator agent config: `vertex-agents/orchestrator/config/agent.yaml`
   - Orchestrator agent card: `vertex-agents/orchestrator/config/agent-card.json`
   - Agent deployment scripts: `.github/scripts/*.py`

4. **GitHub Actions Workflow**
   - Workflow file: `.github/workflows/deploy-vertex-agents.yml`
   - Deployment automation ready
   - Workload Identity Federation configured

### ⚠️ What's Missing

1. **Cloud Functions NOT Deployed**
   - Gateway function (`orchestrator`) not yet deployed
   - Sub-agent functions not yet deployed
   - Command to deploy: `firebase deploy --only functions`

2. **Vertex AI Agents NOT Deployed**
   - No agents exist in Vertex AI console
   - Command to deploy: Push to GitHub (triggers workflow)
   - Or manual: `python .github/scripts/deploy_agent.py ...`

3. **Agent Configurations Incomplete**
   - 4 sub-agents missing `agent.yaml` files
   - 4 sub-agents missing `agent-card.json` files
   - Need to create configs for: validation, user-creation, onboarding, analytics

4. **Agent Labels/Tags NOT Configured**
   - Agents will deploy with basic names only
   - No labels for filtering/organization
   - No version tracking

---

## DEPLOYMENT FLOW (What Happens When)

### Step 1: User Pushes to GitHub

```bash
git push origin main
```

### Step 2: GitHub Actions Workflow Triggers

```yaml
# .github/workflows/deploy-vertex-agents.yml
on:
  push:
    branches: [main]
    paths:
      - 'vertex-agents/**'
```

### Step 3: Deploy Vertex AI Agents

```bash
# GitHub Actions runs these steps:
1. Authenticate to Google Cloud (WIF)
2. Deploy Orchestrator Agent
3. Deploy Validation Agent
4. Deploy User Creation Agent
5. Deploy Onboarding Agent
6. Deploy Analytics Agent
7. Verify all agents deployed
```

### Step 4: Update Cloud Functions

```bash
# GitHub Actions generates agent endpoints:
python .github/scripts/update_function_endpoints.py \
  --output=functions/src/agent-endpoints.json

# Creates:
{
  "agents": {
    "hustle-operations-manager": "projects/.../agents/...",
    "hustle-validation-agent": "projects/.../agents/...",
    ...
  }
}
```

### Step 5: Deploy Cloud Functions

```bash
# GitHub Actions deploys Cloud Functions:
cd functions
npm install
npm run build
firebase deploy --only functions:orchestrator
```

### Step 6: Test Integration

```bash
# GitHub Actions runs integration tests:
python .github/scripts/test_agents.py \
  --test-suite=integration
```

### Step 7: Ready for Use

```
User → Next.js Frontend → Cloud Function (orchestrator) → Vertex AI Agents → Firestore
```

---

## CURRENT ARCHITECTURE GAPS

### Gap 1: No Gateway Deployed

**Problem:**
- Next.js frontend exists on Cloud Run
- But NO Cloud Functions deployed to act as gateway
- Vertex AI agents can't be called without gateway

**Solution:**
Deploy Cloud Functions after agents are deployed (GitHub Actions does this automatically)

### Gap 2: Agents Not in Vertex AI

**Problem:**
- Agent configs exist in code
- But NO agents deployed to Vertex AI
- Can't test agent communication until deployed

**Solution:**
Push to GitHub to trigger deployment, or deploy manually:

```bash
# Add Vertex AI permissions first
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:github-actions@hustleapp-production.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"

# Push to GitHub
git push origin main

# Or deploy manually
python .github/scripts/deploy_agent.py \
  --project=hustleapp-production \
  --region=us-central1 \
  --agent-name=hustle-operations-manager \
  --config=vertex-agents/orchestrator/config/agent.yaml
```

### Gap 3: Sub-Agent Configs Missing

**Problem:**
- 4 sub-agents have empty config directories
- No `agent.yaml` files for validation, user-creation, onboarding, analytics
- No `agent-card.json` files for sub-agents

**Solution:**
Create agent configs for each sub-agent (can be done now or agents will use defaults)

### Gap 4: No Agent Labels/Tags

**Problem:**
- Agents will deploy with basic names only
- Hard to filter/organize in Vertex AI console
- No version tracking or environment tags

**Solution:**
Update deployment script to add labels:

```python
agent = Agent(
    display_name=agent_config.get('display_name', agent_name),
    description=agent_config.get('description', ''),
    labels={
        'project': 'hustle',
        'environment': 'production',
        'role': agent_config.get('role', 'sub-agent'),
        'version': '1.0.0'
    }
)
```

---

## RECOMMENDED ACTIONS

### Priority 1: Deploy Agents (Do This First)

```bash
# Add Vertex AI permissions
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:github-actions@hustleapp-production.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"

# Push to GitHub to trigger deployment
git push origin main

# Monitor GitHub Actions
# Go to: https://github.com/your-org/hustle/actions
```

### Priority 2: Verify Agents in Console

After deployment, verify agents appear in Vertex AI console:

```
https://console.cloud.google.com/vertex-ai/agents?project=hustleapp-production
```

**Expected to see:**
- hustle-operations-manager
- hustle-validation-agent
- hustle-user-creation-agent
- hustle-onboarding-agent
- hustle-analytics-agent

### Priority 3: Test Cloud Functions

After agents deploy, test the Cloud Functions gateway:

```bash
# Test orchestrator function
gcloud functions call orchestrator \
  --project=hustleapp-production \
  --region=us-central1 \
  --data='{
    "intent": "user_registration",
    "data": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "password": "TestPass123!"
    }
  }'
```

### Priority 4 (Optional): Improve Agent Naming

Create friendly display names and add labels:

1. Update `agent.yaml` files with `display_name` field
2. Update `deploy_agent.py` to add labels
3. Redeploy agents

---

## QUICK ANSWERS

### Q: Do we have Cloud Run set up to act as a medium between outside and inside?

**A:** **Partially.**

- ✅ **Cloud Run (`hustle-app`)** exists and serves the Next.js frontend
- ❌ **Cloud Functions (`orchestrator`)** is the actual gateway and is NOT YET DEPLOYED
- ❌ **Vertex AI agents** are NOT YET DEPLOYED

**The gateway is Cloud Functions, not Cloud Run.** Cloud Run serves the frontend, Cloud Functions act as the API gateway to Vertex AI agents.

### Q: Are the agents properly labeled in Vertex Engine so they are distinguishable?

**A:** **Not yet, but they will be distinguishable by name.**

- ✅ Agents have unique names: `hustle-operations-manager`, `hustle-validation-agent`, etc.
- ⚠️ Agents do NOT have friendly display names or labels/tags
- ⚠️ Agents are NOT YET DEPLOYED to Vertex AI

**Recommendation:** Add friendly display names and labels before deploying.

---

## DEPLOYMENT READINESS

### Pre-Flight Checklist

- ✅ Agent configs exist (orchestrator has full config)
- ✅ GitHub Actions workflow ready
- ✅ Cloud Functions code ready
- ✅ Deployment scripts created
- ⚠️ Sub-agent configs missing (will use defaults)
- ⚠️ Agent labels/tags not configured
- ❌ Vertex AI permissions NOT added to service account
- ❌ Agents NOT deployed
- ❌ Cloud Functions NOT deployed

### Next Steps to Go Live

1. **Add Vertex AI permissions** (5 minutes)
2. **Push to GitHub** (triggers deployment, 5-10 minutes)
3. **Verify agents in console** (2 minutes)
4. **Test end-to-end flow** (5 minutes)
5. **Monitor logs** (ongoing)

**Total time to deployment:** ~20 minutes

---

## ARCHITECTURE DIAGRAM

### Current State (What Exists Now)

```
User
  ↓
Next.js Frontend (Cloud Run: hustle-app) ✅
  ↓
❌ No gateway deployed yet
  ↓
❌ No agents deployed yet
  ↓
Firestore Database ✅
```

### Target State (After Deployment)

```
User
  ↓
Next.js Frontend (Cloud Run: hustle-app) ✅
  ↓
Cloud Functions (orchestrator) ⚠️ Ready to deploy
  ↓
Vertex AI Orchestrator Agent ⚠️ Ready to deploy
  ├─→ Validation Agent ⚠️ Ready to deploy
  ├─→ User Creation Agent ⚠️ Ready to deploy
  ├─→ Onboarding Agent (parallel) ⚠️ Ready to deploy
  └─→ Analytics Agent (parallel) ⚠️ Ready to deploy
  ↓
Firestore Database ✅
```

---

## SUMMARY

**Gateway Status:**
- Cloud Run serves Next.js frontend ✅
- Cloud Functions will act as gateway (not deployed yet) ⚠️
- Vertex AI agents are the backend (not deployed yet) ⚠️

**Agent Naming Status:**
- Agents have unique technical names ✅
- Agents do NOT have friendly display names ⚠️
- Agents do NOT have labels/tags for organization ⚠️
- Agents are distinguishable by name but not yet deployed ⚠️

**Ready to Deploy:**
- All code is committed and ready ✅
- GitHub Actions will handle deployment ✅
- Just need to push to GitHub after adding Vertex AI permissions ⚠️

---

**Document:** 177-AA-SITR-gateway-and-agent-naming-status.md
**Status:** ⚠️ NEEDS DEPLOYMENT
**Next Action:** Add Vertex AI permissions, then push to GitHub

**Date:** 2025-11-10T09:00:00Z
