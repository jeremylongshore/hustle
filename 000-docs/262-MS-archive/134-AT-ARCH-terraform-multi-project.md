# 🏗️ Hustle - Multi-Project Terraform Architecture

**Date:** 2025-10-29
**Architecture:** Multi-Project GCP with Full Terraform IaC
**Status:** Design Document

---

## 🎯 Multi-Project Architecture

Each agent gets its own GCP project for complete isolation, security, and independent scaling:

```
hustleapp-platform (Billing Account Root)
├── hustleapp-frontend-prod        # Firebase Hosting, Firestore, Cloud Storage
├── hustleapp-data-prod            # BigQuery, Cloud SQL PostgreSQL
├── hustleapp-agent-coach-prod     # Performance Coach Agent + Tools
├── hustleapp-agent-analyst-prod   # Stats Analyst Agent + Tools
├── hustleapp-agent-logger-prod    # Game Logger Agent + Tools
├── hustleapp-agent-scout-prod     # Scout Report Agent + Tools
└── hustleapp-agent-verify-prod    # Verification Agent + Tools
```

---

## 📁 Project Responsibilities

| Project | Services | Purpose |
|---------|----------|---------|
| `hustleapp-frontend-prod` | Firebase Hosting, Firestore, Cloud Storage | User-facing app, real-time data, file storage |
| `hustleapp-data-prod` | BigQuery, Cloud SQL | Analytics warehouse, transactional DB |
| `hustleapp-agent-coach-prod` | Vertex AI Engine, Cloud Run | Performance coaching agent + tools |
| `hustleapp-agent-analyst-prod` | Vertex AI Engine, Cloud Run | Stats analysis agent + tools |
| `hustleapp-agent-logger-prod` | Vertex AI Engine, Cloud Run, Vision API | Game logging agent + multimodal tools |
| `hustleapp-agent-scout-prod` | Vertex AI Engine, Cloud Run | Scout report generation agent + tools |
| `hustleapp-agent-verify-prod` | Vertex AI Engine, Cloud Run | Game stats verification agent + tools |

---

## 🔗 Cross-Project Networking

```
VPC Peering & Shared VPC Setup:
- All agent projects peer with data project for DB access
- Frontend project has Service Account access to all agents
- IAM policies enforce least-privilege access
```

---

## 📂 Terraform Directory Structure

```
terraform/
├── main.tf                    # Root module - orchestrates everything
├── variables.tf               # Global variables
├── terraform.tfvars           # Variable values
├── backend.tf                 # GCS backend for state
├── outputs.tf                 # Output values
│
├── modules/
│   ├── firebase/              # Firebase Hosting + Firestore module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── vertex-ai-agent/       # Vertex AI Agent Engine module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── cloud-storage/         # Cloud Storage buckets module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── cloud-run/             # Cloud Run services module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── bigquery/              # BigQuery datasets module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── cloud-sql/             # Cloud SQL PostgreSQL module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── vpc/                   # VPC networking module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
├── environments/
│   ├── dev/                   # Development environment
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   │
│   └── prod/                  # Production environment
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
│
└── agents/
    ├── performance-coach/     # Coach agent infrastructure
    │   ├── main.tf
    │   └── terraform.tfvars
    │
    ├── stats-analyst/         # Analyst agent infrastructure
    │   ├── main.tf
    │   └── terraform.tfvars
    │
    ├── game-logger/           # Logger agent infrastructure
    │   ├── main.tf
    │   └── terraform.tfvars
    │
    ├── scout-report/          # Scout agent infrastructure
    │   ├── main.tf
    │   └── terraform.tfvars
    │
    └── verification/          # Verification agent infrastructure
        ├── main.tf
        └── terraform.tfvars
```

---

## 🚀 Sequential Deployment Plan

### Phase 1: Core Infrastructure (Week 1)
```bash
# 1. Create all GCP projects
terraform apply -target=module.projects

# 2. Set up VPC networking
terraform apply -target=module.vpc

# 3. Deploy data layer (BigQuery + Cloud SQL)
terraform apply -target=module.bigquery
terraform apply -target=module.cloud_sql
```

### Phase 2: Frontend & Storage (Week 2)
```bash
# 4. Deploy Firebase infrastructure
terraform apply -target=module.firebase

# 5. Deploy Cloud Storage buckets
terraform apply -target=module.cloud_storage

# 6. Set up Firestore
terraform apply -target=module.firestore
```

### Phase 3: First Agent (Week 3)
```bash
# 7. Deploy Performance Coach agent
cd agents/performance-coach
terraform init
terraform apply

# 8. Deploy tool backends (Cloud Run)
terraform apply -target=module.cloud_run_tools
```

### Phase 4: Remaining Agents (Week 4-5)
```bash
# 9. Deploy Stats Analyst
cd agents/stats-analyst && terraform apply

# 10. Deploy Game Logger
cd agents/game-logger && terraform apply

# 11. Deploy Scout Report
cd agents/scout-report && terraform apply

# 12. Deploy Verification
cd agents/verification && terraform apply
```

### Phase 5: Integration & Testing (Week 6)
```bash
# 13. Enable cross-project IAM
terraform apply -target=module.iam

# 14. Test end-to-end flows
# 15. Production cutover
```

---

## 💰 Cost Estimate (Multi-Project)

**Monthly costs (production):**

```
GCP Projects (7 projects × $0): Free

Frontend Project:
- Firebase Hosting: $0 (Spark plan) or $25 (Blaze)
- Firestore: $5
- Cloud Storage: $2

Data Project:
- BigQuery: $10
- Cloud SQL: $50 (db-g1-small)

Agent Projects (5 agents):
- Vertex AI Engine: $10 each = $50
- Cloud Run (tools): $5 each = $25

Networking:
- VPC peering: $10
- Load balancing: $20

Total: ~$172/month
```

---

## 🔒 Security & IAM

### Service Account Structure

```
hustleapp-frontend-prod:
└── frontend-sa@hustleapp-frontend-prod.iam.gserviceaccount.com
    ├── Roles: Cloud Run Invoker (all agent projects)
    ├── Roles: Firestore User
    └── Roles: Storage Object Viewer

hustleapp-agent-*-prod:
└── agent-sa@hustleapp-agent-*-prod.iam.gserviceaccount.com
    ├── Roles: Vertex AI User
    ├── Roles: Cloud SQL Client (to data project)
    └── Roles: BigQuery Data Viewer (to data project)
```

---

## 📊 Terraform State Management

**Backend:** Google Cloud Storage

```hcl
# backend.tf
terraform {
  backend "gcs" {
    bucket = "hustleapp-terraform-state"
    prefix = "prod/infrastructure"
  }
}
```

**State files:**
```
gs://hustleapp-terraform-state/
├── prod/
│   ├── infrastructure/      # Root infrastructure
│   ├── agent-coach/        # Performance Coach
│   ├── agent-analyst/      # Stats Analyst
│   ├── agent-logger/       # Game Logger
│   ├── agent-scout/        # Scout Report
│   └── agent-verify/       # Verification
```

---

## 🛠️ Terraform Variables

**Global variables (terraform.tfvars):**

```hcl
organization_id = "YOUR_ORG_ID"
billing_account = "YOUR_BILLING_ACCOUNT"

project_prefix = "hustleapp"
environment    = "prod"
region         = "us-central1"

# Firebase
firebase_location = "us-central"

# BigQuery
bigquery_dataset_location = "US"

# Cloud SQL
postgres_version = "POSTGRES_15"
postgres_tier    = "db-g1-small"

# Vertex AI
vertex_ai_region = "us-central1"
gemini_model     = "gemini-2.0-flash-001"

# Agent configurations
agents = {
  performance_coach = {
    name         = "performance-coach"
    display_name = "Performance Coach Agent"
    tools_count  = 3
  }
  stats_analyst = {
    name         = "stats-analyst"
    display_name = "Stats Analyst Agent"
    tools_count  = 4
  }
  game_logger = {
    name         = "game-logger"
    display_name = "Game Logger Agent"
    tools_count  = 5
  }
  scout_report = {
    name         = "scout-report"
    display_name = "Scout Report Agent"
    tools_count  = 3
  }
  verification = {
    name         = "verification"
    display_name = "Verification Agent"
    tools_count  = 2
  }
}
```

---

## 🎯 Next Steps

1. Review this architecture
2. Approve project structure
3. I'll create all Terraform files
4. Sequential deployment begins

**Ready to proceed?** I'll create all the Terraform modules next! 🚀
