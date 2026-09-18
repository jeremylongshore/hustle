# CTO Report: Hustle Agent Architecture Plan

**Date**: 2025-11-19
**Author**: CTO (Acting)
**Reference**: Bob's Brain Architecture (Template)
**Status**: Ready for Implementation

---

## Executive Summary

**STOP OVERCOMPLICATING THIS.**

Hustle is a **youth soccer stats tracker** (grades 8-12). Parents log game stats. Parents verify with PIN. Export PDF for coaches. That's the MVP.

The conversational agent is **OPTIONAL** - a nice-to-have for easier stat logging, NOT the core product. The Next.js web app with Firebase/Firestore already works. Don't block on Agent Engine deployment.

**Decision**: Build agent using **Bob's Brain as exact template**. Deploy when Agent Engine is unblocked. Ship web app first.

---

## Product Goal (From PRD v2 - Lean MVP)

### The One Critical Question
**Will parents and players consistently log game data if it creates a verified performance record?**

### MVP Scope (Ruthlessly Simple)
1. **Parent creates account** + adds player profile
2. **Log game stats**: opponent, score, minutes, goals, assists
3. **Parent verifies with PIN**
4. **Dashboard shows verified stats**
5. **Export PDF report** for coaches

**Success Metric**: 60% of users log 3+ games in first 30 days with parent verification.

---

## Current State

### What Works ✅
- Next.js 15 web app (`hustlestats.io`)
- Firebase Auth (email/password)
- Firestore database (users, players, games)
- Forms for logging stats
- Dashboard for viewing stats

### What's Missing ❌
- Parent PIN verification system
- PDF export for coaches
- Conversational stat logging (optional)

### What's Blocked 🚫
- Agent Engine deployment (400 error, no logs, cause unknown)
- Both single agent AND multi-agent team fail

---

## Bob's Brain Architecture (Template to Follow)

### Directory Structure
```
bobs-brain/
├── my_agent/                    # Agent code
│   ├── agent.py                 # LlmAgent definition
│   ├── agent_engine_app.py     # ADK CLI entrypoint (exports 'app')
│   ├── a2a_card.py             # A2A AgentCard
│   ├── __init__.py
│   └── tools/                  # Agent tools
│       ├── adk_tools.py
│       └── vertex_search_tool.py
├── service/                     # Gateway services
│   ├── a2a_gateway/            # A2A protocol gateway
│   └── slack_webhook/          # Slack integration
├── infra/terraform/            # Infrastructure as Code
├── scripts/                     # Deployment scripts
├── .github/workflows/
│   ├── deploy-agent-engine.yml # ADK CLI deployment
│   └── ci.yml
└── requirements.txt
```

### Key Patterns from Bob's Brain

**1. Agent Definition (agent.py)**
- **Single LlmAgent** (not multi-agent team)
- **VertexAiSessionService** (short-term conversation cache)
- **VertexAiMemoryBankService** (long-term persistent memory)
- **Tools in separate files** (`tools/` directory)
- **SPIFFE ID** for security/logging
- **Environment validation** (PROJECT_ID, LOCATION, AGENT_ENGINE_ID required)
- **after_agent_callback** for auto-saving sessions to Memory Bank

**2. Agent Engine Entrypoint (agent_engine_app.py)**
```python
from my_agent.agent import create_runner

# CRITICAL: ADK CLI expects Runner instance named 'app'
app = create_runner()
```

**3. Deployment (GitHub Actions + ADK CLI)**
```bash
adk deploy agent_engine my_agent \
  --project bobs-brain-dev \
  --region us-central1 \
  --staging_bucket gs://bobs-brain-dev-adk-staging \
  --display_name "bobs-brain-dev" \
  --description "Bob's Brain AI Assistant" \
  --trace_to_cloud \
  --env_file .env.example
```

**4. Service Separation**
- **Agent code** (`my_agent/`) runs on Agent Engine
- **Gateway code** (`service/`) runs on Cloud Run
- Gateway NEVER imports agent code (isolation)

---

## Hustle Agent Architecture Plan

### Phase 1: Replicate Bob's Brain Structure

**Goal**: Copy Bob's Brain architecture exactly, adapt for Hustle domain.

#### 1.1 Directory Structure
```
hustle/
├── my_agent/                    # NEW - Agent code (Bob's pattern)
│   ├── agent.py                 # Single LlmAgent for stat logging
│   ├── agent_engine_app.py     # ADK CLI entrypoint
│   ├── a2a_card.py             # A2A AgentCard
│   ├── __init__.py
│   └── tools/                  # Agent tools
│       ├── firestore_tools.py  # Log game stats to Firestore
│       └── stats_tools.py      # Get player stats, verify PIN
├── service/                     # NEW - Gateway services
│   └── a2a_gateway/            # A2A protocol gateway for Next.js
├── vertex-agents/              # ARCHIVE - Old failed approach
│   ├── scout/                  # Single agent (failed deployment)
│   └── scout-team/             # Multi-agent team (failed deployment)
├── src/                         # Existing Next.js app
├── functions/                   # Existing Firebase Functions
├── .github/workflows/
│   ├── deploy-agent-engine.yml # NEW - ADK CLI deployment
│   └── ci.yml                  # Existing CI
└── requirements.txt            # NEW - Python deps for agent
```

#### 1.2 Agent Definition (my_agent/agent.py)

**Single LlmAgent** (NOT multi-agent team):
```python
from google.adk.agents import LlmAgent
from google.adk import Runner
from google.adk.sessions import VertexAiSessionService
from google.adk.memory import VertexAiMemoryBankService
from my_agent.tools.firestore_tools import log_game_stats, get_player_stats
from my_agent.tools.stats_tools import verify_with_pin, calculate_stats

# Environment validation (required)
PROJECT_ID = os.getenv("PROJECT_ID")  # Must be set
LOCATION = os.getenv("LOCATION", "us-central1")
AGENT_ENGINE_ID = os.getenv("AGENT_ENGINE_ID")  # Must be set
AGENT_SPIFFE_ID = os.getenv("AGENT_SPIFFE_ID")  # Must be set

# Single agent with tools
hustle_agent = LlmAgent(
    name="hustle_stats_assistant",
    model="gemini-2.0-flash",  # Stable model
    description="Youth soccer stats assistant for Hustle",
    instruction="""
    You are a helpful assistant for tracking youth soccer statistics.

    Parents can ask you to:
    - Log game stats (opponent, score, minutes, goals, assists, saves)
    - View player statistics
    - Get season summaries

    Always confirm data before saving. Be encouraging and positive about
    player performance.
    """,
    tools=[
        log_game_stats,
        get_player_stats,
        verify_with_pin,
        calculate_stats,
    ],
    after_agent_callback=auto_save_session_to_memory,  # Auto-persist
)

def create_runner() -> Runner:
    """Create Runner with dual memory (Bob's pattern)"""
    session_service = VertexAiSessionService(
        project_id=PROJECT_ID,
        location=LOCATION,
        agent_engine_id=AGENT_ENGINE_ID
    )

    memory_service = VertexAiMemoryBankService(
        project=PROJECT_ID,
        location=LOCATION,
        agent_engine_id=AGENT_ENGINE_ID
    )

    return Runner(
        agent=hustle_agent,
        app_name="hustle-stats",
        session_service=session_service,
        memory_service=memory_service
    )
```

#### 1.3 Agent Tools (my_agent/tools/)

**firestore_tools.py** - Game stat logging:
```python
from google.cloud import firestore
from typing import Optional
from google.adk.tools.tool_context import ToolContext

def log_game_stats(
    player_id: str,
    opponent: str,
    result: str,  # "Win", "Loss", "Tie"
    score: str,   # "3-2"
    minutes_played: int,
    goals: int = 0,
    assists: int = 0,
    saves: int = 0,
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Log game statistics for a player to Firestore.

    This saves game data in unverified state. Parent must verify with PIN.

    Args:
        player_id: Firestore player document ID
        opponent: Opponent team name
        result: "Win", "Loss", or "Tie"
        score: Final score (e.g., "3-2")
        minutes_played: Minutes played
        goals: Goals scored
        assists: Assists
        saves: Saves (goalkeeper only)

    Returns:
        dict with status and game_id
    """
    db = firestore.Client()

    game_data = {
        "player_id": player_id,
        "opponent": opponent,
        "result": result,
        "score": score,
        "minutes_played": minutes_played,
        "goals": goals,
        "assists": assists,
        "saves": saves,
        "verified": False,  # Unverified until parent PIN
        "created_at": firestore.SERVER_TIMESTAMP,
    }

    game_ref = db.collection("games").add(game_data)

    # Save to session state
    if tool_context:
        tool_context.state["last_game_logged"] = game_data

    return {
        "status": "success",
        "message": f"✅ Logged game vs {opponent}. Awaiting parent verification.",
        "game_id": game_ref[1].id,
        "verified": False,
    }

def get_player_stats(
    player_id: str,
    verified_only: bool = True,
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Get player statistics from Firestore.

    Args:
        player_id: Firestore player document ID
        verified_only: Only count parent-verified games

    Returns:
        dict with season stats
    """
    db = firestore.Client()

    query = db.collection("games").where("player_id", "==", player_id)
    if verified_only:
        query = query.where("verified", "==", True)

    games = list(query.stream())

    total_goals = sum(g.to_dict().get("goals", 0) for g in games)
    total_assists = sum(g.to_dict().get("assists", 0) for g in games)
    total_saves = sum(g.to_dict().get("saves", 0) for g in games)

    return {
        "status": "success",
        "games_played": len(games),
        "total_goals": total_goals,
        "total_assists": total_assists,
        "total_saves": total_saves,
        "goals_per_game": round(total_goals / len(games), 2) if games else 0,
        "assists_per_game": round(total_assists / len(games), 2) if games else 0,
    }
```

**stats_tools.py** - PIN verification:
```python
def verify_with_pin(
    parent_id: str,
    pin: str,
    game_id: str,
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Verify game stats with parent PIN.

    Args:
        parent_id: Firestore parent/user ID
        pin: 4-6 digit PIN
        game_id: Firestore game document ID

    Returns:
        dict with verification status
    """
    db = firestore.Client()

    # Check PIN
    user_ref = db.collection("users").document(parent_id)
    user = user_ref.get()

    if not user.exists:
        return {"status": "error", "message": "User not found"}

    if user.to_dict().get("verification_pin") != pin:
        return {"status": "error", "message": "Invalid PIN"}

    # Mark game as verified
    game_ref = db.collection("games").document(game_id)
    game_ref.update({"verified": True, "verified_at": firestore.SERVER_TIMESTAMP})

    return {
        "status": "success",
        "message": "✅ Game stats verified by parent!",
        "verified": True,
    }
```

#### 1.4 Deployment (GitHub Actions)

Copy Bob's Brain workflow exactly:

**.github/workflows/deploy-agent-engine.yml**:
```yaml
name: Deploy to Vertex AI Agent Engine

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - prod

permissions:
  contents: read
  id-token: write  # Required for WIF

jobs:
  deploy-agent-engine:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment || 'dev' }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install ADK CLI
        run: |
          pip install --upgrade pip
          pip install 'google-adk>=1.15.1'
          adk --version

      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Agent Engine
        env:
          PROJECT_ID: hustleapp-production
          REGION: us-central1
          STAGING_BUCKET: gs://hustleapp-production-agent-staging
        run: |
          adk deploy agent_engine my_agent \
            --project "$PROJECT_ID" \
            --region "$REGION" \
            --staging_bucket "$STAGING_BUCKET" \
            --display_name "hustle-stats-assistant" \
            --description "Youth soccer stats assistant" \
            --trace_to_cloud
```

#### 1.5 Next.js Integration

**Current** (forms-based):
```
User → Form → /api/games → Firestore
```

**With Agent** (conversational):
```
User → Chat UI → /api/agent/chat → A2A Gateway → Agent Engine
                                  ↓
                               Firestore
```

**A2A Gateway** (`service/a2a_gateway/`):
- Cloud Run service
- Receives chat messages from Next.js
- Calls Agent Engine via A2A protocol
- Returns agent responses

---

## Implementation Phases

### Phase 1: Fix Core MVP (Web App)
**Priority**: HIGH
**Timeline**: 1-2 weeks

**Tasks**:
1. ✅ Implement parent PIN verification system (Firestore)
2. ✅ Add PDF export for season reports
3. ✅ Polish game logging UX (< 60 seconds)
4. ✅ Deploy to Firebase Hosting

**Deliverable**: Working MVP at `hustlestats.io`

### Phase 2: Build Agent (Bob's Pattern)
**Priority**: MEDIUM
**Timeline**: 1-2 weeks
**Blocked on**: Agent Engine deployment issue resolution

**Tasks**:
1. Create `my_agent/` directory with Bob's structure
2. Build single LlmAgent with Firestore tools
3. Add VertexAiSessionService + VertexAiMemoryBankService
4. Create agent_engine_app.py with `app = create_runner()`
5. Set up GitHub Actions for ADK CLI deployment
6. Test locally with InMemorySessionService

**Deliverable**: Agent code ready, deployment blocked

### Phase 3: Deploy Agent (When Unblocked)
**Priority**: LOW (Nice-to-Have)
**Timeline**: 1 day (when Agent Engine works)

**Tasks**:
1. Trigger GitHub Actions workflow
2. Verify Agent Engine deployment
3. Build A2A Gateway on Cloud Run
4. Add chat UI to Next.js app
5. Test end-to-end conversational logging

**Deliverable**: Chat-based stat logging as alternative to forms

### Phase 4: Advanced Features (Post-MVP)
**Priority**: LOW
**Timeline**: 2-4 weeks

**Tasks**:
- Coach portal with verification PIN
- Global stats comparison (verified only)
- Gamification (badges, points)
- Practice session logging
- Highlight video uploads
- TikTok-style content feed

---

## Architecture Decisions

### ✅ Do This (Bob's Pattern)
1. **Single LlmAgent** (not multi-agent team)
2. **ADK CLI deployment** (not Python SDK)
3. **VertexAiSessionService + VertexAiMemoryBankService** (dual memory)
4. **Tools in separate files** (`tools/` directory)
5. **SPIFFE ID** for security
6. **GitHub Actions + WIF** (no service account keys)
7. **A2A Gateway** for Next.js integration
8. **Firestore for data** (agent tools use Firestore client)

### ❌ Don't Do This (Our Mistakes)
1. ~~Multi-agent team~~ (single agent is simpler)
2. ~~Python SDK deployment~~ (use ADK CLI)
3. ~~Direct Python deploy.py~~ (use GitHub Actions)
4. ~~Mock data in tools~~ (use real Firestore)
5. ~~Overcomplicate agent~~ (keep it simple: log stats, verify PIN)

### 🎯 Focus
- **Ship web app FIRST** (forms work fine)
- **Agent is OPTIONAL** (conversational logging is nice-to-have)
- **Don't block on Agent Engine** (deploy when it works)

---

## Risk Assessment

### High Risk ✅ MITIGATED
**Risk**: Agent Engine deployment failure blocks entire product
**Mitigation**: Build web app first, agent is optional enhancement

### Medium Risk ⚠️ MONITOR
**Risk**: Bob's Brain pattern might not work for our domain
**Mitigation**: Test locally with InMemorySessionService before deployment

### Low Risk ✅ ACCEPT
**Risk**: Conversational UI might confuse users vs forms
**Mitigation**: A/B test, keep forms as primary option

---

## Success Criteria

### Phase 1 (Web App)
- ✅ 60% of users log 3+ games in first 30 days
- ✅ Parent PIN verification works
- ✅ PDF export downloads clean report
- ✅ < 60 second game logging time

### Phase 2 (Agent Ready)
- ✅ Agent code follows Bob's Brain pattern exactly
- ✅ Local testing passes with InMemorySessionService
- ✅ Tools successfully read/write Firestore
- ✅ GitHub Actions workflow configured

### Phase 3 (Agent Deployed)
- ✅ Agent Engine deployment succeeds
- ✅ A2A Gateway responds to chat messages
- ✅ Chat UI logs stats to Firestore
- ✅ 20% of users try conversational logging

---

## Next Steps (Immediate)

1. **Read this report** ✅
2. **Approve architecture** (confirm Bob's pattern is correct)
3. **Ship web app first** (don't wait for agent)
4. **Build agent code** (when Phase 1 complete)
5. **Deploy agent** (when Agent Engine unblocked)

---

## Appendix: Bob's Brain vs Hustle

| Aspect | Bob's Brain | Hustle |
|--------|-------------|--------|
| **Domain** | ADK documentation assistant | Youth soccer stats tracking |
| **Agent Type** | Single LlmAgent | Single LlmAgent (NOT multi-agent) |
| **Tools** | Search ADK docs, Vertex AI Search | Log game stats, verify PIN, get stats |
| **Memory** | Session + Memory Bank | Session + Memory Bank |
| **Deployment** | ADK CLI via GitHub Actions | ADK CLI via GitHub Actions |
| **Gateway** | A2A + Slack webhook | A2A for Next.js |
| **Data Source** | Vertex AI Search corpus | Firestore |
| **Model** | gemini-2.0-flash | gemini-2.0-flash |

**Conclusion**: Exact same architecture, different domain tools.

---

**Document Created**: 2025-11-19
**Last Updated**: 2025-11-19
**Status**: Ready for Review
