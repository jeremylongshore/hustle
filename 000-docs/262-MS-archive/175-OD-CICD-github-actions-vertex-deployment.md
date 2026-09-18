# GitHub Actions CI/CD for Vertex AI Agent Deployment

**Date:** 2025-11-10T08:00:00Z
**Status:** Automated Deployment Ready
**Workflow:** `.github/workflows/deploy-vertex-agents.yml`

---

## OVERVIEW

Automated CI/CD pipeline for deploying Vertex AI agents via GitHub Actions. This eliminates the need for manual console deployment and enables continuous delivery of agent updates.

**Key Features:**
- ✅ Automated agent deployment on push to `main`
- ✅ Manual deployment trigger via workflow_dispatch
- ✅ Individual agent deployment or deploy all
- ✅ Automatic Cloud Functions update with agent endpoints
- ✅ Integration testing after deployment
- ✅ Deployment summary and verification

---

## WORKFLOW OVERVIEW

### Trigger Conditions

**Automatic Deployment:**
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'vertex-agents/**'
```

Deploys when changes are pushed to:
- Any file in `vertex-agents/` directory
- The workflow file itself

**Manual Deployment:**
```yaml
workflow_dispatch:
  inputs:
    deploy_target:
      - all
      - orchestrator
      - validation
      - user-creation
      - onboarding
      - analytics
```

Trigger manually from GitHub Actions UI to deploy specific agents or all agents.

---

## DEPLOYMENT PROCESS

### Step 1: Authentication

Uses Workload Identity Federation (no service account keys):

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
```

**Required Secrets:**
- `WIF_PROVIDER`: Workload Identity Provider resource name
- `WIF_SERVICE_ACCOUNT`: Service account email

### Step 2: Deploy Agents

Deploys 5 agents in sequence:

1. **Orchestrator Agent** (`hustle-operations-manager`)
   - Main entry point for A2A protocol
   - Coordinates all sub-agents

2. **Validation Agent** (`hustle-validation-agent`)
   - Input validation and security checks

3. **User Creation Agent** (`hustle-user-creation-agent`)
   - Firestore writes and user management

4. **Onboarding Agent** (`hustle-onboarding-agent`)
   - Welcome emails and onboarding flow

5. **Analytics Agent** (`hustle-analytics-agent`)
   - Metrics tracking and dashboards

Each agent deployment:
```bash
python .github/scripts/deploy_agent.py \
  --project=hustleapp-production \
  --region=us-central1 \
  --agent-name=<agent-name> \
  --config=<config-path> \
  --agent-card=<card-path>
```

### Step 3: Verify Deployments

```bash
python .github/scripts/verify_agents.py \
  --project=hustleapp-production \
  --region=us-central1
```

Checks that all 5 agents are deployed and accessible.

### Step 4: Update Cloud Functions

```bash
python .github/scripts/update_function_endpoints.py \
  --project=hustleapp-production \
  --region=us-central1 \
  --output=functions/src/agent-endpoints.json
```

Generates configuration file with agent endpoints for Cloud Functions to use.

### Step 5: Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions:orchestrator
```

Deploys updated Cloud Functions with new agent endpoints.

### Step 6: Run Integration Tests

```bash
python .github/scripts/test_agents.py \
  --project=hustleapp-production \
  --region=us-central1 \
  --test-suite=integration
```

Tests the full registration flow end-to-end.

### Step 7: Deployment Summary

```bash
python .github/scripts/deployment_summary.py \
  --project=hustleapp-production \
  --region=us-central1
```

Generates summary of what was deployed and next steps.

---

## DEPLOYMENT SCRIPTS

### 1. deploy_agent.py

**Purpose:** Deploy individual Vertex AI agent

**Features:**
- Loads agent configuration from YAML
- Loads AgentCard from JSON
- Creates or updates agent in Vertex AI
- Saves agent endpoint for Cloud Functions
- Handles deployment errors gracefully

**Output:**
- `.github/outputs/{agent-name}-endpoint.json` (on success)
- `.github/outputs/{agent-name}-manual-config.json` (on failure)

**Usage:**
```bash
python .github/scripts/deploy_agent.py \
  --project=hustleapp-production \
  --region=us-central1 \
  --agent-name=hustle-operations-manager \
  --config=vertex-agents/orchestrator/config/agent.yaml \
  --agent-card=vertex-agents/orchestrator/config/agent-card.json
```

### 2. verify_agents.py

**Purpose:** Verify all agents are deployed

**Checks:**
- Lists all agents in project/region
- Verifies 5 required agents are present
- Reports missing agents

**Exit Codes:**
- 0: All agents verified
- 1: Some agents missing

### 3. update_function_endpoints.py

**Purpose:** Update Cloud Functions with agent endpoints

**Process:**
- Reads all `*-endpoint.json` files from `.github/outputs/`
- Generates unified configuration file
- Saves to `functions/src/agent-endpoints.json`

**Output Format:**
```json
{
  "project_id": "hustleapp-production",
  "region": "us-central1",
  "agents": {
    "hustle-operations-manager": "projects/.../agents/...",
    "hustle-validation-agent": "projects/.../agents/...",
    "hustle-user-creation-agent": "projects/.../agents/...",
    "hustle-onboarding-agent": "projects/.../agents/...",
    "hustle-analytics-agent": "projects/.../agents/..."
  },
  "generated_at": "2025-11-10T08:00:00Z"
}
```

### 4. test_agents.py

**Purpose:** Run integration tests

**Test Suites:**
- `integration`: Full registration flow test
- `unit`: Individual agent tests (future)
- `performance`: Load testing (future)

**Example Test:**
```python
def test_agent_registration(project_id, region):
    """Test user registration flow."""
    test_user = {
        'firstName': 'Test',
        'lastName': 'User',
        'email': 'test@example.com',
        'password': 'TestPass123!'
    }

    # Call orchestrator agent
    response = call_agent(test_user)

    # Verify response
    assert response['success'] == True
    assert 'userId' in response['data']
```

### 5. deployment_summary.py

**Purpose:** Generate deployment summary

**Outputs:**
- List of successfully deployed agents
- List of agents requiring manual deployment
- Next steps for completion
- Links to documentation

---

## MANUAL DEPLOYMENT TRIGGER

### Via GitHub Actions UI

1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy Vertex AI Agents" workflow
4. Click "Run workflow"
5. Select deployment target:
   - `all` - Deploy all 5 agents
   - `orchestrator` - Deploy only orchestrator
   - `validation` - Deploy only validation agent
   - etc.
6. Click "Run workflow"

### Via GitHub CLI

```bash
# Deploy all agents
gh workflow run deploy-vertex-agents.yml \
  -f deploy_target=all

# Deploy only orchestrator
gh workflow run deploy-vertex-agents.yml \
  -f deploy_target=orchestrator
```

---

## WORKLOAD IDENTITY FEDERATION SETUP

### Prerequisites

The WIF provider and service account should already be set up from the existing Cloud Run deployment.

**Verify Existing Setup:**
```bash
# Check if WIF provider exists
gcloud iam workload-identity-pools list \
  --location=global \
  --project=hustleapp-production

# Check service account
gcloud iam service-accounts list \
  --project=hustleapp-production
```

### Add Vertex AI Permissions

The service account needs additional permissions for Vertex AI:

```bash
# Get service account email
SERVICE_ACCOUNT="github-actions@hustleapp-production.iam.gserviceaccount.com"

# Add Vertex AI permissions
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.admin"

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"
```

### GitHub Secrets

Secrets should already exist from Cloud Run deployment:

**Required Secrets:**
- `WIF_PROVIDER` - Already configured
- `WIF_SERVICE_ACCOUNT` - Already configured

**No new secrets needed!**

---

## DEPLOYMENT WORKFLOW DIAGRAM

```
GitHub Push to main
  ↓
[Trigger] deploy-vertex-agents.yml
  ↓
[Auth] Workload Identity Federation
  ↓
[Deploy] 5 Agents in Sequence
  ├─→ Orchestrator Agent
  ├─→ Validation Agent
  ├─→ User Creation Agent
  ├─→ Onboarding Agent
  └─→ Analytics Agent
  ↓
[Verify] All agents deployed
  ↓
[Update] Cloud Functions endpoints
  ↓
[Deploy] Cloud Functions
  ↓
[Test] Integration tests
  ↓
[Summary] Deployment report
```

---

## ERROR HANDLING

### Agent Deployment Failure

If agent deployment fails (API not fully ready):
1. Script saves configuration to `.github/outputs/{agent}-manual-config.json`
2. Workflow continues with other agents
3. Summary reports which agents need manual deployment
4. Manual deployment instructions provided

**Graceful Degradation:**
- Workflow doesn't fail if some agents can't deploy automatically
- Provides fallback to manual console deployment
- Saves all configuration for manual use

### Retry Logic

Each agent deployment includes:
- Automatic check for existing agent
- Update existing agent if found
- Create new agent if not found
- Save configuration for manual deployment on failure

---

## MONITORING & OBSERVABILITY

### GitHub Actions Logs

**View Deployment Logs:**
1. Go to GitHub Actions tab
2. Select workflow run
3. View each step's output

**Key Log Sections:**
- Agent deployment (per agent)
- Verification results
- Endpoint updates
- Integration test results

### Cloud Logging

**View Agent Activity:**
```
resource.type="vertex_agent"
resource.labels.project_id="hustleapp-production"
```

**View Deployment Events:**
```
resource.type="vertex_agent"
jsonPayload.event="deployment"
```

### Metrics to Track

**Deployment Metrics:**
- Deployment success rate
- Deployment duration
- Agent update frequency
- Failed deployment count

**Agent Metrics:**
- Agent availability (uptime)
- Agent response time
- Agent error rate
- Cost per agent execution

---

## COST OPTIMIZATION

### Deployment Costs

**GitHub Actions:**
- Free for public repos
- Private repos: 2,000 minutes/month free
- This workflow: ~5 minutes per run
- Estimated: ~$0 (within free tier)

**Vertex AI Deployment:**
- Agent creation/update: FREE
- Agent storage: FREE
- Only pay for agent execution

**Total Deployment Cost:** $0

---

## ROLLBACK PROCEDURE

### Rollback Agents

```bash
# Rollback to previous agent version
gcloud ai agents update <agent-name> \
  --project=hustleapp-production \
  --region=us-central1 \
  --restore-version=<previous-version>
```

### Disable Agent

```bash
# Disable agent without deleting
gcloud ai agents update <agent-name> \
  --project=hustleapp-production \
  --region=us-central1 \
  --disable
```

### Rollback Cloud Functions

```bash
# Rollback to previous Cloud Functions deployment
firebase functions:rollback orchestrator --project=hustleapp-production
```

---

## TESTING LOCALLY

### Run Deployment Script Locally

```bash
# Set up authentication
gcloud auth application-default login

# Run deployment script
python .github/scripts/deploy_agent.py \
  --project=hustleapp-production \
  --region=us-central1 \
  --agent-name=hustle-operations-manager \
  --config=vertex-agents/orchestrator/config/agent.yaml
```

### Run Verification Locally

```bash
python .github/scripts/verify_agents.py \
  --project=hustleapp-production \
  --region=us-central1
```

### Test Integration Locally

```bash
python .github/scripts/test_agents.py \
  --project=hustleapp-production \
  --region=us-central1 \
  --test-suite=integration
```

---

## FUTURE ENHANCEMENTS

### Planned Features

1. **Staging Environment**
   - Deploy to staging first
   - Run tests in staging
   - Promote to production on success

2. **Canary Deployment**
   - Deploy new version to subset of users
   - Monitor performance
   - Gradually increase traffic

3. **Automated Rollback**
   - Monitor agent error rate
   - Auto-rollback if error rate > threshold
   - Notify team on rollback

4. **Performance Testing**
   - Load testing (1,000 concurrent requests)
   - Latency monitoring
   - Cost tracking

5. **Multi-Region Deployment**
   - Deploy to multiple regions
   - Failover between regions
   - Geo-routing

---

## TROUBLESHOOTING

### Deployment Fails with Permission Error

**Error:**
```
Permission denied: Agent deployment requires aiplatform.admin role
```

**Solution:**
```bash
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:github-actions@hustleapp-production.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"
```

### Agent Already Exists Error

**Error:**
```
Agent with name already exists
```

**Solution:**
- Script automatically handles this by updating existing agent
- Check logs for update status

### Cloud Functions Deployment Fails

**Error:**
```
Firebase deployment failed
```

**Solution:**
```bash
# Check Firebase authentication
firebase login --reauth

# Verify project
firebase use hustleapp-production

# Try deployment manually
firebase deploy --only functions:orchestrator
```

### Integration Tests Fail

**Error:**
```
Test failed: Agent endpoint not responding
```

**Solution:**
1. Verify agents are deployed: `verify_agents.py`
2. Check agent endpoints in `.github/outputs/`
3. Test agent directly via API
4. Check Cloud Logging for errors

---

## BEST PRACTICES

### Development Workflow

1. **Branch Protection**
   - Require PR review before merge to `main`
   - Require CI tests to pass
   - Require up-to-date branch

2. **Testing**
   - Test locally before pushing
   - Run integration tests in CI
   - Monitor production after deployment

3. **Documentation**
   - Update agent configs in `vertex-agents/`
   - Document changes in PR description
   - Update 000-docs/ as needed

4. **Monitoring**
   - Check GitHub Actions logs
   - Monitor Cloud Logging
   - Track deployment metrics

### Security

1. **Secrets Management**
   - Use GitHub Secrets for WIF
   - Never commit service account keys
   - Rotate secrets periodically

2. **Access Control**
   - Limit who can trigger manual deployments
   - Require PR reviews for agent changes
   - Audit deployment logs

3. **Least Privilege**
   - Service account has minimal required permissions
   - Separate service accounts for different environments
   - Regular permission audits

---

## SUMMARY

**Automated Deployment Ready:** ✅

The GitHub Actions workflow provides:
- ✅ Automated deployment on push to `main`
- ✅ Manual deployment trigger
- ✅ Individual or bulk agent deployment
- ✅ Automatic Cloud Functions update
- ✅ Integration testing
- ✅ Graceful error handling

**Cost:** $0 (within GitHub Actions free tier)

**Deployment Time:** ~5 minutes for all agents

**Reliability:**
- Automatic retry logic
- Graceful degradation
- Fallback to manual deployment

**Next Steps:**
1. Push changes to `main` branch
2. GitHub Actions automatically deploys agents
3. Verify deployment in Cloud Console
4. Monitor agent performance

---

**Document:** 175-OD-CICD-github-actions-vertex-deployment.md
**Status:** Automation Ready
**Workflow:** `.github/workflows/deploy-vertex-agents.yml`
**Scripts:** `.github/scripts/*.py` (5 scripts)
