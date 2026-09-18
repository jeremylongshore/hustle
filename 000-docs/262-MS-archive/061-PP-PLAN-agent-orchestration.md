# CTO Agent Orchestration Plan - Hustle MVP Completion

**Document Type:** Strategic Plan
**Date Created:** 2025-10-09
**Status:** Active Execution
**Version:** 1.0.0
**CTO:** Claude (AI Orchestrator)

---

## Executive Summary

After analyzing 70+ available sub-agents, I've assembled a **lean, specialized strike team of 8 agents** to complete the Hustle MVP user journey. This document outlines the team structure, task assignments, critical path, and execution strategy using Taskwarrior for project management.

**Project:** Complete Hustle MVP User Journey
**Timeline:** 3 days
**Total Tasks:** 31 tasks across 7 phases
**Team Size:** 8 specialized agents + CTO coordination
**Completion Target:** 2025-10-12

---

## 📊 Strategic Analysis

### Current State Assessment
✅ **Complete:**
- NextAuth v5 authentication with email verification
- Landing page with professional branding
- Registration flow with password strength validation
- Add Athlete form with photo upload
- Database schema (User → Player → Game)
- API routes: `/api/players`, `/api/games`

❌ **Missing (Blocking MVP):**
- Athletes List page (can't see created athletes)
- Athlete Detail page (no individual profile view)
- Game Logging interface (can't record game stats)
- Dashboard shows static "0" instead of real data
- No edit/delete athlete functionality

### Gap Analysis
**Critical Gap:** After creating an athlete, parents have nowhere to go. The "Log a Game" button exists but doesn't work. This is the **dead end** in user journey.

**Technical Debt:**
- Dashboard queries need optimization (N+1 risk)
- TypeScript types need refinement for complex joins
- Testing infrastructure incomplete

---

## 👥 Team Composition & Justification

### 🎨 Frontend Division (3 agents)

#### 1. **frontend-developer**
**Role:** Primary UI Builder
**Responsibilities:**
- Build Athletes List page (server component with data fetching)
- Build Athlete Detail page (profile + games list)
- Build Game Logging form (position-specific fields)
- Update Dashboard with real data fetching
- Add Edit/Delete Athlete functionality
- Build Games History view

**Why Selected:** Specializes in React components, Next.js App Router patterns, responsive layouts, and client-side state management. Hustle is a Next.js 15 app requiring App Router expertise.

**Task Assignment:** 9 tasks (29% of workload)

---

#### 2. **typescript-pro**
**Role:** Type Safety Enforcer
**Responsibilities:**
- Define TypeScript types for Player display components
- Create types for Athlete+Games join queries
- Build validation schemas for game data (field player vs goalkeeper)
- Ensure strict type safety across all new components

**Why Selected:** Hustle uses TypeScript strict mode. Form data (game stats) has complex conditional types (goalkeeper vs field player). Need advanced TypeScript patterns for Prisma query result types.

**Task Assignment:** 4 tasks (13% of workload)

---

#### 3. **ui-ux-designer**
**Role:** Design Consistency Guardian
**Responsibilities:**
- Design Athletes List UI/UX flow
- Design Dashboard stats card layout
- Create Athlete Detail page wireframe
- Design Game Logging form flow (field player vs goalkeeper)
- Mobile responsiveness audit

**Why Selected:** Hustle has an established design language (zinc colors, Kiranism dashboard). Must maintain consistency. Need to ensure user flow is intuitive for parents managing multiple athletes.

**Task Assignment:** 5 tasks (16% of workload)

---

### 🔧 Backend Division (2 agents)

#### 4. **backend-architect**
**Role:** API Design Reviewer
**Responsibilities:**
- Review POST /api/games endpoint security
- Ensure proper parent-child data isolation
- Validate RESTful patterns
- Check authentication/authorization logic

**Why Selected:** Game logging involves sensitive data (athlete performance stats). Must ensure parents can ONLY log games for THEIR athletes. Need security review of API routes to prevent data leakage.

**Task Assignment:** 1 task (3% of workload - advisory role)

---

#### 5. **database-optimizer**
**Role:** Query Performance Specialist
**Responsibilities:**
- Optimize Athletes List query (check for N+1 problems)
- Optimize Dashboard aggregation query (totals across players + games)
- Optimize Athlete Detail query (include games with player)

**Why Selected:** Dashboard will query across Players + Games tables (potential N+1). Athletes List fetches all players for a parent. Athlete Detail page loads player + all games. Need Prisma query optimization expertise.

**Task Assignment:** 3 tasks (10% of workload)

---

### ✅ Quality Assurance Division (3 agents)

#### 6. **code-reviewer**
**Role:** Pre-Merge Gatekeeper
**Responsibilities:**
- Code review: Athletes List implementation
- Code review: Dashboard stats implementation
- Code review: Athlete Detail page
- Code review: Game Logging form

**Why Selected:** Mandatory quality gate. Must review all code before integration to prevent bugs from reaching production. Ensures adherence to Next.js patterns, TypeScript best practices, and security standards.

**Task Assignment:** 4 tasks (13% of workload - blocking reviews)

---

#### 7. **test-automator**
**Role:** Testing Infrastructure Creator
**Responsibilities:**
- Write E2E test: Add Athlete → View Profile → Log Game (complete user journey)
- Write unit tests for new components (LoadingButton, form validation, etc.)

**Why Selected:** MVP completion requires testing. Playwright already configured for E2E. Vitest for unit tests. Need automated tests to ensure user journey works end-to-end.

**Task Assignment:** 2 tasks (6% of workload)

---

#### 8. **debugger**
**Role:** Rapid Response Troubleshooter
**Responsibilities:**
- Debug any test failures from test-automator
- Fix blocking issues encountered by other agents
- On-call for production bugs

**Why Selected:** Safety net. When tests fail or bugs appear, need dedicated debugging specialist to unblock other agents quickly.

**Task Assignment:** 1 task + on-call (3% of workload + reactive)

---

### 🎖️ Command & Control

#### CTO (Me - Claude)
**Role:** Orchestration & Taskwarrior Management
**Responsibilities:**
- Create and manage Taskwarrior task hierarchy
- Delegate tasks to specialized agents
- Monitor dependencies and critical path
- Resolve conflicts between agents
- Make final technical decisions
- Coordinate Git workflow
- Track time with Timewarrior

**Task Assignment:** 1 master milestone task + ongoing coordination

---

## 🗂️ Taskwarrior Structure

### Project Hierarchy
```
hustle.mvp (Project)
├── Milestone: Complete User Journey (Task 35)
│
├── Phase 1: Foundation (P0 - Critical Path)
│   ├── Task 36: LoadingButton component [frontend-developer]
│   ├── Task 37: RadioGroup component [frontend-developer]
│
├── Phase 2: Athletes List (P0)
│   ├── Task 38: Design UI/UX [ui-ux-designer]
│   ├── Task 39: Build page [frontend-developer] depends:38
│   ├── Task 40: TypeScript types [typescript-pro] depends:39
│   ├── Task 41: Optimize query [database-optimizer] depends:39
│   └── Task 42: Code review [code-reviewer] depends:39,40,41
│
├── Phase 3: Dashboard Real Data (P0)
│   ├── Task 43: Design layout [ui-ux-designer]
│   ├── Task 44: Fetch real stats [frontend-developer] depends:43
│   ├── Task 45: Optimize query [database-optimizer] depends:44
│   └── Task 46: Code review [code-reviewer] depends:44,45
│
├── Phase 4: Athlete Detail (P0 - Critical Missing Piece)
│   ├── Task 47: Design wireframe [ui-ux-designer] depends:42
│   ├── Task 48: Build profile page [frontend-developer] depends:47
│   ├── Task 49: Add games list [frontend-developer] depends:48
│   ├── Task 50: TypeScript types [typescript-pro] depends:48,49
│   ├── Task 51: Optimize query [database-optimizer] depends:48,49
│   └── Task 52: Code review [code-reviewer] depends:48,49,50,51
│
├── Phase 5: Game Logging (P0 - Core Feature)
│   ├── Task 53: Design form flow [ui-ux-designer] depends:37
│   ├── Task 54: Build form component [frontend-developer] depends:53
│   ├── Task 55: Position-specific logic [frontend-developer] depends:54
│   ├── Task 56: Validation schemas [typescript-pro] depends:54,55
│   ├── Task 57: Security review [backend-architect] depends:54
│   └── Task 58: Code review [code-reviewer] depends:54,55,56,57
│
├── Phase 6: Testing (P0 - Quality Gate)
│   ├── Task 59: E2E test [test-automator] depends:52,58
│   ├── Task 60: Unit tests [test-automator] depends:52,58
│   └── Task 61: Debug failures [debugger] depends:59,60
│
└── Phase 7: Polish (P1 - Optional)
    ├── Task 62: Edit Athlete [frontend-developer] depends:52
    ├── Task 63: Delete Athlete [frontend-developer] depends:52
    ├── Task 64: Games History [frontend-developer] depends:58
    ├── Task 65: Mobile audit [ui-ux-designer] depends:61
    └── Task 66: Performance pass [performance-engineer] depends:61
```

---

## 🎯 Critical Path Analysis

### Blocking Dependencies (Must Complete in Order)

**Day 1 (Today):**
1. ✅ Task 36: LoadingButton component (30 min) [frontend-developer]
2. ✅ Task 37: RadioGroup install (5 min) [frontend-developer]
3. ✅ Task 38: Athletes List design (1 hr) [ui-ux-designer]
4. ✅ Task 43: Dashboard design (1 hr) [ui-ux-designer]

**Day 2 (Tomorrow):**
5. ✅ Task 39: Build Athletes List (2 hrs) [frontend-developer] ← **BLOCKS everything**
6. ✅ Task 44: Dashboard real data (1 hr) [frontend-developer]
7. ✅ Task 47: Athlete Detail design (1 hr) [ui-ux-designer]
8. ✅ Task 53: Game Logging design (1 hr) [ui-ux-designer]

**Day 3 (Day After Tomorrow):**
9. ✅ Task 48-49: Athlete Detail build (3 hrs) [frontend-developer]
10. ✅ Task 54-55: Game Logging build (3 hrs) [frontend-developer]
11. ✅ Task 59-60: E2E + Unit tests (2 hrs) [test-automator]

**Critical Path Duration:** ~15 hours (realistic for 3 days with interruptions)

---

## 📈 Success Metrics

### Phase Completion Gates

**Phase 1 Complete When:**
- [ ] LoadingButton renders with loading/success states
- [ ] RadioGroup component available for forms

**Phase 2 Complete When:**
- [ ] Athletes List page shows all parent's athletes
- [ ] Clicking athlete card navigates to detail page
- [ ] Empty state shows when no athletes
- [ ] Code review approved

**Phase 3 Complete When:**
- [ ] Dashboard shows real game count (not "0")
- [ ] Stats aggregate across all athletes
- [ ] Code review approved

**Phase 4 Complete When:** ← **MOST CRITICAL**
- [ ] Athlete Detail page displays profile
- [ ] Games list shows all games for athlete
- [ ] "Log Game" button passes playerId to form
- [ ] Code review approved

**Phase 5 Complete When:**
- [ ] Game Logging form shows correct fields for position
- [ ] Goalkeeper sees saves/goals against/clean sheet
- [ ] Field player sees goals/assists
- [ ] Form saves to database successfully
- [ ] Security review approved
- [ ] Code review approved

**Phase 6 Complete When:**
- [ ] E2E test passes: Register → Add Athlete → Log Game
- [ ] Unit tests pass for all new components
- [ ] Zero blocking bugs

---

## 🚦 Risk Management

### High-Risk Areas

#### Risk 1: N+1 Query Problems
**Probability:** Medium
**Impact:** High (slow page loads)
**Mitigation:** database-optimizer reviews all queries BEFORE code review
**Agent:** database-optimizer (Task 41, 45, 51)

#### Risk 2: Type Safety Gaps
**Probability:** Medium
**Impact:** Medium (runtime errors)
**Mitigation:** typescript-pro defines types BEFORE frontend builds components
**Agent:** typescript-pro (Task 40, 50, 56)

#### Risk 3: Design Inconsistency
**Probability:** Low
**Impact:** Medium (poor UX)
**Mitigation:** ui-ux-designer creates wireframes BEFORE implementation
**Agent:** ui-ux-designer (Task 38, 43, 47, 53)

#### Risk 4: Security Vulnerabilities
**Probability:** Low
**Impact:** Critical (data leakage)
**Mitigation:** backend-architect reviews security BEFORE merge
**Agent:** backend-architect (Task 57)

#### Risk 5: Test Failures
**Probability:** High
**Impact:** Medium (delays release)
**Mitigation:** debugger on-call to fix immediately
**Agent:** debugger (Task 61)

---

## 🔄 Agent Communication Protocol

### Handoff Pattern
```
Designer → Developer → Type Expert → Database Expert → Reviewer
```

### Example: Athletes List Flow
1. **ui-ux-designer** (Task 38) creates wireframe → outputs design spec
2. **frontend-developer** (Task 39) builds page following spec → creates PR
3. **typescript-pro** (Task 40) reviews types in PR → suggests improvements
4. **database-optimizer** (Task 41) reviews queries → optimizes if needed
5. **code-reviewer** (Task 42) final review → approves or requests changes
6. **CTO** (me) merges PR → moves to next task

### Blocker Resolution
If any agent is blocked:
1. Agent annotates task: `task <ID> annotate "Blocked by: <reason>"`
2. Agent tags task: `task <ID> modify +blocked`
3. CTO reassigns or debugger intervenes
4. Once unblocked: `task <ID> modify -blocked` → `task <ID> start`

---

## 📊 Progress Tracking

### Daily Standup (via Taskwarrior)
```bash
# What's in progress?
task project:hustle.mvp +ACTIVE

# What's completed today?
task project:hustle.mvp status:completed end:today

# What's blocked?
task project:hustle.mvp +blocked

# What's next (by urgency)?
task project:hustle.mvp next limit:5
```

### Weekly Report
```bash
# Project summary
task project:hustle.mvp summary

# Time tracking
timew summary :ids project:hustle.mvp

# Burndown chart
task project:hustle.mvp burndown.daily
```

---

## 🎯 Next Actions

### Immediate (Starting Now)
```bash
# CTO starts first task
task 36 start

# Delegate to frontend-developer agent
Task: "Create LoadingButton component with loading/success states"
Agent: frontend-developer
Estimated Time: 30 minutes
```

Once Task 36 completes:
```bash
task 36 done
task 37 start  # RadioGroup install (5 min)
```

Once both foundation tasks complete:
```bash
task 37 done
# Parallel start (can work simultaneously)
task 38 start  # Design Athletes List (ui-ux-designer)
task 43 start  # Design Dashboard (ui-ux-designer)
```

---

## 📋 Agent Workload Distribution

| Agent | Tasks Assigned | Estimated Hours | % of Total |
|-------|----------------|-----------------|------------|
| frontend-developer | 9 | 15 hrs | 29% |
| ui-ux-designer | 5 | 5 hrs | 16% |
| typescript-pro | 4 | 4 hrs | 13% |
| code-reviewer | 4 | 4 hrs | 13% |
| database-optimizer | 3 | 3 hrs | 10% |
| test-automator | 2 | 4 hrs | 6% |
| debugger | 1 + on-call | 2 hrs | 3% |
| backend-architect | 1 | 1 hr | 3% |
| performance-engineer | 1 | 2 hrs | 3% |
| **Total** | **31** | **~40 hrs** | **100%** |

**Note:** Parallel work reduces wall-clock time from 40 hrs to ~15 hrs over 3 days.

---

## 🏆 Definition of Done

**MVP Complete When:**
- [ ] User can register and login
- [ ] User can add athlete profile
- [ ] User can view list of all their athletes
- [ ] User can click athlete to see individual profile
- [ ] User can see games list for each athlete
- [ ] User can log new game with correct stats for position
- [ ] Dashboard shows real statistics (not zeros)
- [ ] All code reviewed and approved
- [ ] E2E test passes complete user journey
- [ ] Unit tests pass for all components
- [ ] Mobile responsive on all pages
- [ ] No critical bugs
- [ ] Deployed to production

---

## 📝 Lessons Learned (Post-Implementation)

*To be filled after completion...*

---

**Document Created:** 2025-10-09
**Last Updated:** 2025-10-09
**Next Review:** After Phase 1 completion
**Status:** Active Execution

---

**CTO Signature:** Claude (AI Orchestrator)
**Team Size:** 8 specialized agents
**Project Completion Target:** 2025-10-12
**Taskwarrior Project:** `hustle.mvp`
