# 🏗️ Hustle - Terraform Infrastructure as Code

**Status:** Foundation Created - Ready for Implementation
**Date:** 2025-10-29

---

## 📋 What's Been Created

### ✅ Architecture Design
- **Multi-project GCP setup** (7 isolated projects)
- **Sequential deployment plan** (6 phases)
- **Complete cost estimates** (~$172/month)

### ✅ Terraform Foundation
- **Root configuration** (`main.tf`) - Orchestrates all infrastructure
- **Variables** (`variables.tf`) - Centralized configuration
- **Example values** (`terraform.tfvars.example`) - Template for your values

### 📁 Directory Structure Created

```
terraform/
├── main.tf                          ✅ Created
├── variables.tf                     ✅ Created
├── terraform.tfvars.example         ✅ Created
├── backend.tf                       ⏳ Needs creation
├── outputs.tf                       ⏳ Needs creation
│
├── modules/                         ⏳ Need to create all modules
│   ├── projects/                    # GCP project creation
│   ├── firebase/                    # Firebase Hosting + Firestore
│   ├── vertex-ai-agent/             # Vertex AI Agent Engine
│   ├── vertex-ai-search/            # Vertex AI Search datastores
│   ├── cloud-storage/               # Cloud Storage buckets
│   ├── cloud-run/                   # Cloud Run services (tools)
│   ├── bigquery/                    # BigQuery datasets
│   ├── cloud-sql/                   # PostgreSQL database
│   ├── vpc/                         # VPC networking
│   └── iam/                         # Service accounts & IAM
│
├── prompts/                         ⏳ Need agent system prompts
│   ├── performance-coach/
│   │   └── system.txt
│   ├── stats-analyst/
│   ├── game-logger/
│   ├── scout-report/
│   └── verification/
│
└── schemas/                         ⏳ Need BigQuery table schemas
    └── bigquery/
        ├── player_stats.json
        ├── game_aggregates.json
        └── agent_conversations.json
```

---

## 🎯 GCP Project Architecture

### Projects to be Created

| Project ID | Purpose | Services |
|-----------|---------|----------|
| `hustleapp-frontend-prod` | User-facing app | Firebase Hosting, Firestore, Cloud Storage |
| `hustleapp-data-prod` | Data warehouse | BigQuery, Cloud SQL PostgreSQL |
| `hustleapp-agent-coach-prod` | Performance coaching | Vertex AI Engine, Cloud Run |
| `hustleapp-agent-analyst-prod` | Stats analysis | Vertex AI Engine, Cloud Run |
| `hustleapp-agent-logger-prod` | Game logging | Vertex AI Engine, Cloud Run, Vision API |
| `hustleapp-agent-scout-prod` | Scout reports | Vertex AI Engine, Cloud Run |
| `hustleapp-agent-verify-prod` | Stats verification | Vertex AI Engine, Cloud Run |

---

## 🚀 Sequential Deployment Plan

### Phase 1: Prerequisites (YOU DO THIS FIRST)

```bash
# 1. Get your organization ID
gcloud organizations list

# 2. Get your billing account
gcloud billing accounts list

# 3. Create terraform.tfvars from example
cp terraform.tfvars.example terraform.tfvars

# 4. Edit terraform.tfvars with your values
nano terraform.tfvars
# Fill in organization_id and billing_account

# 5. Create GCS bucket for Terraform state
gsutil mb -p YOUR_EXISTING_PROJECT -l us-central1 gs://hustleapp-terraform-state
gsutil versioning set on gs://hustleapp-terraform-state

# 6. Initialize Terraform
terraform init
```

### Phase 2: Create GCP Projects

```bash
# Create all 7 GCP projects
terraform apply -target=module.projects

# Expected output:
# - hustleapp-frontend-prod created
# - hustleapp-data-prod created
# - hustleapp-agent-coach-prod created
# - hustleapp-agent-analyst-prod created
# - hustleapp-agent-logger-prod created
# - hustleapp-agent-scout-prod created
# - hustleapp-agent-verify-prod created
```

### Phase 3: Enable APIs

```bash
# Enable required APIs in each project (automatic via Terraform)
terraform apply -target=module.projects

# This enables:
# - Firebase Management API
# - Firestore API
# - Cloud Storage API
# - Vertex AI API
# - Discovery Engine API (Vertex AI Search)
# - Cloud Run API
# - BigQuery API
# - Cloud SQL Admin API
```

### Phase 4: Deploy Data Layer

```bash
# Create VPC network
terraform apply -target=module.vpc

# Deploy BigQuery
terraform apply -target=module.bigquery

# Deploy Cloud SQL PostgreSQL
terraform apply -target=module.cloud_sql
```

### Phase 5: Deploy Frontend Infrastructure

```bash
# Deploy Firebase
terraform apply -target=module.firebase

# Deploy Firestore
terraform apply -target=module.firestore

# Deploy Cloud Storage buckets
terraform apply -target=module.cloud_storage_frontend
```

### Phase 6: Deploy First Agent (Performance Coach)

```bash
# Deploy Vertex AI Search knowledge base
terraform apply -target=module.vertex_search_knowledge

# Deploy Performance Coach agent
terraform apply -target=module.agent_performance_coach

# Deploy Cloud Run tool backends
terraform apply -target=module.cloud_run_coach_tools
```

### Phase 7: Deploy Remaining Agents

```bash
# Deploy all other agents
terraform apply

# This deploys:
# - Stats Analyst Agent
# - Game Logger Agent
# - Scout Report Agent
# - Verification Agent
```

### Phase 8: Configure IAM & Permissions

```bash
# Set up cross-project IAM
terraform apply -target=module.iam
```

---

## 📝 What Needs to Be Created Next

### 1. Terraform Modules (Priority Order)

#### **High Priority - Core Infrastructure**
```
modules/projects/          # Creates all GCP projects
modules/firebase/          # Firebase Hosting + Firestore
modules/cloud-storage/     # Cloud Storage buckets
modules/bigquery/          # BigQuery datasets
modules/vpc/               # VPC networking
```

#### **Medium Priority - Agent Infrastructure**
```
modules/vertex-ai-agent/   # Vertex AI Agent Engine
modules/vertex-ai-search/  # Vertex AI Search datastores
modules/cloud-run/         # Cloud Run services for tools
modules/iam/               # Service accounts & permissions
```

#### **Lower Priority - Optional**
```
modules/cloud-sql/         # PostgreSQL (you already have this)
modules/monitoring/        # Cloud Monitoring dashboards
modules/secrets/           # Secret Manager
```

### 2. Agent System Prompts

Create prompts for each agent:

```
prompts/performance-coach/system.txt
prompts/stats-analyst/system.txt
prompts/game-logger/system.txt
prompts/scout-report/system.txt
prompts/verification/system.txt
```

### 3. BigQuery Schemas

Create table schemas:

```
schemas/bigquery/player_stats.json
schemas/bigquery/game_aggregates.json
schemas/bigquery/agent_conversations.json
```

### 4. Backend Configuration

Create `backend.tf`:

```hcl
terraform {
  backend "gcs" {
    bucket = "hustleapp-terraform-state"
    prefix = "prod/infrastructure"
  }
}
```

---

## 💰 Cost Breakdown

**Monthly costs after full deployment:**

| Component | Monthly Cost |
|-----------|-------------|
| GCP Projects (7) | $0 |
| Firebase Hosting | $25 (Blaze plan) |
| Firestore | $5 |
| Cloud Storage | $2 |
| BigQuery | $10 |
| Cloud SQL | $50 (db-g1-small) |
| Vertex AI Agents (5) | $50 |
| Cloud Run Tools (15 services) | $25 |
| VPC Networking | $10 |
| Load Balancing | $20 |
| **Total** | **~$197/month** |

---

## 🔒 Security Features

### Built-in Security

- **Project Isolation**: Each agent in separate project
- **Least Privilege IAM**: Minimal cross-project permissions
- **VPC Peering**: Private database connections
- **Service Accounts**: Dedicated SAs per service
- **Secret Manager**: Encrypted credentials
- **Cloud Armor**: DDoS protection (optional)

### IAM Structure

```
Frontend SA:
- Can invoke all agent endpoints
- Read-only access to Firestore
- Write access to Cloud Storage

Agent SAs:
- Can access data project (read-only)
- Can invoke Cloud Run tools in same project
- No access to other agent projects

Tool SAs:
- Can query BigQuery (read-only)
- Can connect to Cloud SQL (read-only)
- No access to Vertex AI
```

---

## 🧪 Testing Strategy

### 1. Infrastructure Testing
```bash
# Validate Terraform
terraform validate

# Plan without applying
terraform plan

# Apply to dev environment first
cd environments/dev
terraform apply
```

### 2. Agent Testing
```bash
# Test Performance Coach agent
gcloud alpha discovery-engine converse \
  --project=hustleapp-agent-coach-prod \
  --engine=performance-coach \
  --query="How is player123 performing?"

# Expected: Agent responds with analysis
```

### 3. End-to-End Testing
```bash
# Test full flow from Next.js app
curl -X POST https://hustleapp-frontend-prod.web.app/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "performance-coach",
    "playerId": "player123",
    "message": "How is this player doing?"
  }'
```

---

## 📊 Monitoring & Observability

### Cloud Monitoring Dashboards

Terraform will create:

```
- Agent usage dashboard
- Cost monitoring dashboard
- Performance metrics dashboard
- Error rate tracking
```

### Logging

All logs centralized in Cloud Logging:

```
- Agent conversations
- Tool invocations
- API requests
- Errors & warnings
```

---

## 🚨 Troubleshooting

### Common Issues

**Issue: "Organization not found"**
```bash
# Solution: Verify organization ID
gcloud organizations list

# Update terraform.tfvars with correct ID
```

**Issue: "Billing account not active"**
```bash
# Solution: Check billing status
gcloud billing accounts describe YOUR_BILLING_ACCOUNT

# Enable billing if needed
```

**Issue: "API not enabled"**
```bash
# Solution: Manually enable required APIs
gcloud services enable aiplatform.googleapis.com --project=PROJECT_ID
```

**Issue: "Permission denied"**
```bash
# Solution: Grant yourself org admin role
gcloud organizations add-iam-policy-binding ORG_ID \
  --member=user:YOUR_EMAIL \
  --role=roles/resourcemanager.organizationAdmin
```

---

## 📚 Documentation References

### Design Documents

- `claudes-docs/MULTI-PROJECT-TERRAFORM-ARCHITECTURE-2025-10-29.md` - Full architecture
- `claudes-docs/VERTEX-AI-ENGINE-SETUP-2025-10-29.md` - Vertex AI details
- `claudes-docs/AGENT-ARCHITECTURE-DESIGN-2025-10-29.md` - Original agent design

### Terraform Docs

- [Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Vertex AI Resources](https://cloud.google.com/vertex-ai/docs/reference/rest)
- [Firebase Terraform](https://firebase.google.com/docs/projects/terraform/get-started)

---

## 🎯 Next Steps - YOUR ACTION ITEMS

### Immediate (This Week)

1. ✅ Review architecture documents
2. ⏳ Fill in `terraform.tfvars` with your org/billing info
3. ⏳ Create GCS bucket for Terraform state
4. ⏳ Run `terraform init`
5. ⏳ Ask me to create the Terraform modules

### Short Term (Next Week)

6. Deploy core infrastructure (projects, VPC, storage)
7. Deploy first agent (Performance Coach)
8. Test agent functionality
9. Deploy remaining agents

### Medium Term (Weeks 3-4)

10. Integrate agents with Next.js frontend
11. Build chat interface
12. Test end-to-end user flows
13. Production cutover

---

## 🤝 Need Help?

**I can create:**
- ✅ All Terraform modules (15+ modules)
- ✅ Agent system prompts
- ✅ BigQuery table schemas
- ✅ Cloud Run tool code
- ✅ Deployment scripts
- ✅ Testing procedures

**Just say:**
- "Create all Terraform modules"
- "Create the Firebase module"
- "Write the agent prompts"
- "Build the deployment script"

---

**Ready to proceed?** Let me know what you want to create next! 🚀
