# Agentic QA Automation Workflow - Implementation Plan

**Document**: 250-PP-PLAN-agentic-qa-automation-workflow.md
**Created**: 2025-11-19
**Purpose**: Plan for GitHub Actions + Vertex AI agent-driven QA issue automation
**Status**: Planning
**Priority**: High - Automation Infrastructure

---

## 🎯 Goal

Build an automated QA workflow where:
1. Non-technical testers file GitHub issues using structured templates
2. GitHub Actions triggers on new QA issues
3. Vertex AI agent analyzes, reproduces, and fixes bugs autonomously
4. Agent commits fixes, opens PRs, and closes issues
5. Human oversight only for complex/risky changes

---

## 📋 High-Level Architecture

```
[Tester] → [GitHub Issue Template]
              ↓
    [GitHub Actions Workflow]
              ↓
    [Vertex AI Agent (A2A)]
              ↓
   [Agent analyzes issue]
              ↓
   [Agent reproduces bug]
              ↓
   [Agent writes fix + tests]
              ↓
    [Agent opens PR/commits]
              ↓
   [Agent comments & closes]
```

---

## 🔧 Components to Build

### Phase 1: Issue Templates (✅ Ready)
**Status**: Templates designed, need to add to repo

**Files to create**:
- `.github/ISSUE_TEMPLATE/qa-bug-report.yml`
- `.github/ISSUE_TEMPLATE/qa-ux-feedback.yml`
- `.github/ISSUE_TEMPLATE/qa-question.yml`
- `.github/ISSUE_TEMPLATE/qa-data-issue.yml`
- `.github/ISSUE_TEMPLATE/qa-feature-idea.yml`

**Action**: Copy templates from user message above

---

### Phase 2: GitHub Actions Workflow
**Status**: Needs creation

**File**: `.github/workflows/qa-agent-handler.yml`

**Triggers**:
- `issues` event with labels: `source:qa-playtest`
- Issue opened, labeled, or commented

**Workflow steps**:
1. **Checkout code**
2. **Authenticate to GCP** (WIF)
3. **Parse issue body** (extract structured fields)
4. **Call Vertex AI Agent** via A2A protocol
5. **Agent performs triage**:
   - Analyzes issue type
   - Reproduces bug (if applicable)
   - Writes fix + tests
   - Commits to branch
   - Opens PR
6. **Update issue** with agent findings
7. **Label issue** (`status:fixed`, `status:needs-info`, etc.)

---

### Phase 3: Vertex AI Agent System
**Status**: Need to design and deploy

#### Agent Architecture

**Primary Agent**: `hustle-qa-orchestrator`
- **Purpose**: Main coordinator for QA automation
- **A2A Protocol**: Receives tasks from GitHub Actions
- **Tools**:
  - Code search and analysis
  - Test execution
  - Git operations
  - Issue parsing

**Sub-Agents** (specialized):

1. **`hustle-bug-reproducer`**
   - Analyzes bug reports
   - Reproduces issues in staging/local
   - Identifies root cause
   - Returns reproduction steps + evidence

2. **`hustle-code-fixer`**
   - Receives root cause analysis
   - Writes minimal fix
   - Adds/updates tests
   - Validates fix locally

3. **`hustle-ux-analyzer`**
   - Evaluates UX feedback
   - Determines fix complexity
   - Proposes copy/UI improvements
   - Implements low-risk changes

4. **`hustle-data-validator`**
   - Checks stats calculations
   - Verifies Stripe billing logic
   - Validates data integrity
   - Proposes data fixes

**Agent Files** (to create in `vertex-agents/`):
- `qa-orchestrator/agent.yml` - Main QA coordinator
- `bug-reproducer/agent.yml` - Bug reproduction specialist
- `code-fixer/agent.yml` - Code fix implementer
- `ux-analyzer/agent.yml` - UX improvement handler
- `data-validator/agent.yml` - Data integrity checker

---

### Phase 4: Cloud Function - GitHub ↔ Vertex AI Bridge
**Status**: Needs creation

**File**: `functions/src/qa-agent-handler.ts`

**Purpose**: Translate GitHub issue → A2A task → GitHub response

**Inputs**:
- GitHub webhook payload (issue event)
- Issue body (parsed structured fields)
- Repository context (files, tests, docs)

**Process**:
1. Parse issue template fields (summary, steps, severity, etc.)
2. Build A2A task payload for orchestrator agent
3. Send task to Vertex AI Agent Engine
4. Poll for agent completion
5. Parse agent response
6. Update GitHub issue with findings
7. Apply labels, close issue (if fixed)

**Outputs**:
- GitHub issue comment with fix details
- Labels applied (`status:fixed`, `status:needs-retest`, etc.)
- PR opened (if code changes made)

---

## 📐 Phase Breakdown

### **PHASE 1: Foundation** (Week 1)
**Goal**: Get basic GitHub → Vertex AI → GitHub loop working

**Tasks**:
1. ✅ Create QA issue templates
   - Copy 5 templates to `.github/ISSUE_TEMPLATE/`
   - Test by filing dummy issues

2. ⏳ Create basic GitHub Actions workflow
   - File: `.github/workflows/qa-agent-handler.yml`
   - Trigger on `issues` labeled `source:qa-playtest`
   - Parse issue body using `jq` or custom script
   - Echo parsed fields (validation step)

3. ⏳ Create Vertex AI orchestrator agent
   - File: `vertex-agents/qa-orchestrator/agent.yml`
   - Simple agent that receives issue → logs it → returns "acknowledged"
   - Deploy: `gcloud alpha agent-engine agents create`

4. ⏳ Create Cloud Function bridge
   - File: `functions/src/qa-agent-handler.ts`
   - Receives GitHub webhook → sends to orchestrator → returns dummy response
   - Deploy: `firebase deploy --only functions`

5. ⏳ Wire GitHub Actions → Cloud Function → Vertex AI
   - Actions workflow calls Cloud Function
   - Function calls Vertex AI orchestrator
   - Orchestrator logs task and returns
   - Function updates GitHub issue

**Success Criteria**:
- File QA bug report → Actions triggers → Function calls agent → Issue gets comment "Received by QA agent"

---

### **PHASE 2: Bug Reproduction** (Week 2)
**Goal**: Agent can analyze and reproduce simple bugs

**Tasks**:
1. ⏳ Create `hustle-bug-reproducer` agent
   - Parses bug report fields
   - Reads code context (routes, components, APIs)
   - Attempts reproduction using staging environment
   - Returns: reproducible (yes/no) + root cause hypothesis

2. ⏳ Integrate bug reproducer with orchestrator
   - Orchestrator sends `type:bug` issues to reproducer
   - Reproducer returns findings
   - Orchestrator updates GitHub issue with reproduction results

3. ⏳ Add reproduction script support
   - Create `scripts/qa-reproduce/` directory
   - Agents can generate reproduction scripts
   - Scripts run in isolated environment (Docker/staging)

**Success Criteria**:
- File bug report → Agent attempts reproduction → Issue updated with "Reproducible: Yes/No" + evidence

---

### **PHASE 3: Automated Fixes** (Week 3)
**Goal**: Agent can implement simple fixes autonomously

**Tasks**:
1. ⏳ Create `hustle-code-fixer` agent
   - Receives root cause + reproduction steps
   - Reads relevant code files
   - Generates minimal fix (patch)
   - Writes/updates tests
   - Validates fix passes tests

2. ⏳ Add Git operations to agents
   - Agents can create branches (`fix/<issue-number>-slug`)
   - Agents can commit with proper messages
   - Agents can push to remote

3. ⏳ Integrate fixer with orchestrator
   - Orchestrator sends reproducible bugs to fixer
   - Fixer returns: branch name, commit hash, test results
   - Orchestrator opens PR via GitHub API

4. ⏳ Add safety gates
   - Only fix bugs labeled `severity:low` or `severity:medium` automatically
   - `severity:high` and `blocker` require human approval
   - Changes limited to specific safe directories (components, routes, utils)
   - No auto-deploy to production

**Success Criteria**:
- File low-severity bug → Agent reproduces → Agent fixes → PR opened → Tests pass → Issue labeled `status:fixed`

---

### **PHASE 4: UX & Data Fixes** (Week 4)
**Goal**: Handle UX improvements and data validation issues

**Tasks**:
1. ⏳ Create `hustle-ux-analyzer` agent
   - Evaluates UX feedback complexity
   - Implements safe UX changes (copy, labels, tooltips)
   - Flags complex UX for human review

2. ⏳ Create `hustle-data-validator` agent
   - Checks stats calculations (goals, assists, totals)
   - Validates Stripe billing logic
   - Proposes data integrity fixes

3. ⏳ Add domain-specific knowledge
   - Hustle game stats schema
   - Stripe subscription lifecycle
   - League/team/player relationships

**Success Criteria**:
- File UX feedback → Agent implements copy change → PR opened
- File data issue → Agent validates stats → Issue updated with findings

---

### **PHASE 5: Monitoring & Refinement** (Ongoing)
**Goal**: Track agent performance, improve over time

**Tasks**:
1. ⏳ Add agent telemetry
   - Track: issues processed, fixes attempted, success rate
   - Log agent decisions for review
   - Dashboard in Cloud Logging

2. ⏳ Implement feedback loop
   - QA can mark agent fixes as correct/incorrect
   - Failed fixes improve agent prompts
   - Track patterns of issues agent struggles with

3. ⏳ Expand agent capabilities
   - Handle more complex bugs
   - Support e2e test generation
   - Auto-update documentation

---

## 🔐 Security & Safety

### Agent Permissions (IAM)
```
hustle-qa-orchestrator service account:
- roles/source.reader (read code)
- roles/cloudfunctions.invoker (call sub-agents)
- roles/logging.logWriter (write logs)

hustle-code-fixer service account:
- roles/source.writer (create branches, commit)
- roles/cloudbuild.builds.builder (run tests)
```

### Safety Gates
1. **Code changes limited to**:
   - `src/routes/` (frontend pages)
   - `src/lib/components/` (UI components)
   - `src/lib/utils/` (utility functions)
   - Tests only

2. **Blocked changes**:
   - `functions/` (Cloud Functions)
   - `vertex-agents/` (agent definitions)
   - `.github/workflows/` (CI/CD)
   - `firestore.rules` (security rules)
   - Stripe billing logic (unless explicit approval)

3. **Human approval required for**:
   - `severity:blocker` or `severity:high` bugs
   - Changes to billing/payments
   - Database schema changes
   - Breaking API changes

4. **Auto-fix budget limits**:
   - Max 5 auto-fixes per day (prevents runaway costs)
   - Max 3 files changed per fix
   - Max 200 lines changed per fix

---

## 📊 Success Metrics

### Week 1
- [ ] QA templates live and testers can file issues
- [ ] Basic workflow triggers and calls agent
- [ ] Agent acknowledges issues via comment

### Week 2
- [ ] Agent reproduces 50%+ of filed bugs
- [ ] Reproduction accuracy: 80%+ (verified by human)

### Week 3
- [ ] Agent fixes 30%+ of low-severity bugs autonomously
- [ ] Auto-fix success rate: 70%+ (PRs merge without changes)

### Week 4
- [ ] Agent handles UX and data issues
- [ ] QA satisfaction: 4/5+ stars on agent helpfulness

### Ongoing
- [ ] Issues closed within 24 hours: 60%+
- [ ] Human intervention required: <40%
- [ ] Agent cost per issue: <$2

---

## 💰 Cost Estimate

### Vertex AI Agent Engine
- **Orchestrator**: ~$0.50/issue (analysis + coordination)
- **Bug Reproducer**: ~$0.75/issue (code search + reproduction)
- **Code Fixer**: ~$1.00/issue (fix generation + testing)
- **Total per issue**: ~$2.25 average

### Expected volume: 20 issues/week
- **Monthly cost**: ~$180/month (20 issues/week × 4 weeks × $2.25)

### Cost controls:
- Budget alert at $200/month
- Auto-pause if >30 issues/week
- Rate limit: 5 auto-fixes/day

---

## 🛠️ Technical Requirements

### Repository Changes
```
hustle/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── qa-bug-report.yml
│   │   ├── qa-ux-feedback.yml
│   │   ├── qa-question.yml
│   │   ├── qa-data-issue.yml
│   │   └── qa-feature-idea.yml
│   └── workflows/
│       └── qa-agent-handler.yml
├── functions/
│   └── src/
│       └── qa-agent-handler.ts
├── vertex-agents/
│   ├── qa-orchestrator/
│   │   └── agent.yml
│   ├── bug-reproducer/
│   │   └── agent.yml
│   ├── code-fixer/
│   │   └── agent.yml
│   ├── ux-analyzer/
│   │   └── agent.yml
│   └── data-validator/
│       └── agent.yml
└── scripts/
    └── qa-reproduce/
        └── README.md
```

### GCP Services
- Vertex AI Agent Engine (A2A protocol)
- Cloud Functions (GitHub webhook handler)
- Cloud Logging (agent telemetry)
- Secret Manager (GitHub token, API keys)

### GitHub Configuration
- Personal access token with `repo` scope
- Webhook configured for `issues` events
- Branch protection rules (require PR for main)

---

## 📝 Next Immediate Actions

### Action 1: Create Issue Templates (15 min)
```bash
# Copy templates to repo
mkdir -p .github/ISSUE_TEMPLATE
# Copy 5 templates from user message
# Commit and push
```

### Action 2: Create Basic Workflow (30 min)
```bash
# Create .github/workflows/qa-agent-handler.yml
# Basic structure: trigger on issues, parse body, echo fields
# Test with dummy issue
```

### Action 3: Deploy Orchestrator Agent (45 min)
```bash
# Create vertex-agents/qa-orchestrator/agent.yml
# Deploy agent to Vertex AI Agent Engine
gcloud alpha agent-engine agents create qa-orchestrator \
  --location=us-central1 \
  --config=vertex-agents/qa-orchestrator/agent.yml
```

### Action 4: Create Cloud Function (1 hour)
```bash
# Create functions/src/qa-agent-handler.ts
# Implement GitHub webhook → A2A task → GitHub response
firebase deploy --only functions:qaAgentHandler
```

### Action 5: Wire Everything Together (30 min)
```bash
# Update GitHub Actions to call Cloud Function
# Test end-to-end: Issue → Actions → Function → Agent → Response
```

---

## 🚀 Deployment Checklist

**Pre-deployment**:
- [ ] All 5 QA issue templates created
- [ ] GitHub Actions workflow created
- [ ] Orchestrator agent deployed
- [ ] Cloud Function deployed and tested
- [ ] WIF authentication working
- [ ] Budget alerts configured ($200/month)

**Phase 1 Launch**:
- [ ] Test with 3 dummy issues (bug, UX, question)
- [ ] Verify agent acknowledges all 3
- [ ] Check Cloud Logging for agent activity
- [ ] Validate GitHub comments appear

**Phase 2 Launch**:
- [ ] Test bug reproduction with 5 real bugs
- [ ] Verify 80%+ reproduction accuracy
- [ ] Check agent reasoning in logs

**Phase 3 Launch**:
- [ ] Enable auto-fix for `severity:low` bugs
- [ ] Monitor first 10 auto-fixes closely
- [ ] Validate PRs are clean and tests pass
- [ ] Adjust safety gates as needed

---

## 📚 Documentation to Create

1. **For QA Testers**:
   - `000-docs/251-OD-GUID-qa-issue-filing-guide.md`
   - How to file issues
   - Template explanations
   - What to expect from agent

2. **For Developers**:
   - `000-docs/252-OD-GUID-qa-agent-system-overview.md`
   - Architecture overview
   - How to review agent PRs
   - How to override/disable agent

3. **For Operations**:
   - `000-docs/253-OD-GUID-qa-agent-monitoring.md`
   - Monitoring dashboards
   - Cost tracking
   - Incident response (if agent misbehaves)

---

## 🎓 Learning from OpenAI Codex Integration

**User mentioned**: "i have a codez api key"

**OpenAI Codex integration** (alternative/complement to Vertex AI):

### Option A: Codex for Code Generation
- Use Codex API for fix generation
- Vertex AI for orchestration/reasoning
- Codex generates diffs/patches
- Agent validates and commits

### Option B: Hybrid Approach
- Vertex AI handles triage + reproduction
- Codex generates actual code fixes
- Vertex AI validates + tests
- Best of both: Google's reasoning + OpenAI's code gen

### Implementation:
```typescript
// functions/src/codex-fixer.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateFix(bug: BugReport, context: CodeContext) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: HUSTLE_CODE_FIXER_PROMPT },
      { role: 'user', content: `Bug: ${bug.summary}\nContext: ${context.files}` }
    ]
  });
  return response.choices[0].message.content;
}
```

**Recommendation**: Start with Vertex AI only (Phase 1-3), add Codex in Phase 4 if Vertex AI code generation quality is insufficient.

---

## 🔄 Iteration Plan

### Iteration 1 (Current)
- Planning and architecture design
- This document created

### Iteration 2 (Next 2 hours)
- Create all 5 issue templates
- Create basic GitHub Actions workflow
- Test end-to-end with dummy issue

### Iteration 3 (Next day)
- Deploy orchestrator agent
- Create Cloud Function
- Wire Actions → Function → Agent

### Iteration 4 (Next week)
- Add bug reproduction agent
- Implement code analysis tools
- Test with real bugs

### Iteration 5 (Week 2)
- Add code fixer agent
- Implement Git operations
- Enable auto-fix for low-severity bugs

---

**Status**: Plan complete, ready for implementation
**Next Step**: Create issue templates and basic workflow
**Owner**: Jeremy + Claude Code
**Timeline**: 4 weeks to full automation