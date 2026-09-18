# Phase 4 — Firestore → Drizzle schema mapping

**Branch:** `feat/phase-4-data-port` (stacked on `feat/phase-3-auth-port`, PR #41)
**Source of truth:** `src/types/firestore.ts` (1008 lines, fully typed)
**Target dir:** `src/lib/db/schema/*.ts` (drizzle.config picks up everything)
**Data import policy:** ship empty per user direction — no Firestore export.

## Collection inventory

15 top-level collections + 2 derived child tables for dream-gym nested arrays.

| # | Firestore path | Doc interface | New schema file | Notes |
|---|---|---|---|---|
| 1 | `/users/{uid}` | `UserDocument` | extend `auth.ts:users` | Phase 3 left users minimal. Add COPPA + profile fields. |
| 2 | `/workspaces/{wid}` | `WorkspaceDocument` | `workspaces.ts` | Flatten `billing` + `usage`. Members → child table. |
| 3 | (derived) | `WorkspaceMember[]` | `workspaces.ts:workspaceMembers` | Junction table workspace↔user with role. |
| 4 | `/users/{uid}/players/{pid}` | `PlayerDocument` | `players.ts` | FK `userId`. `secondaryPositions` → JSON array. |
| 5 | `/users/{uid}/players/{pid}/games/{gid}` | `GameDocument` | `games.ts` | FK `playerId`. `emotionTags` → JSON array. |
| 6 | `/waitlist/{email}` | `WaitlistDocument` | `waitlist.ts` | Flat. PK is email. |
| 7 | `/workspace-invites/{iid}` | `WorkspaceInviteDocument` | `workspace-invites.ts` | Flat. |
| 8 | `/users/{uid}/players/{pid}/dreamGym` | `DreamGymDocument` | `dream-gym.ts` | One row per player. Flatten `profile` + `schedule`. |
| 9 | (derived) | `DreamGymEvent[]` | `dream-gym.ts:dreamGymEvents` | Child table — events queried independently. |
| 10 | (derived) | `DreamGymMentalCheckIn[]` | `dream-gym.ts:dreamGymCheckIns` | Child table — time-series check-ins. |
| 11 | `/users/{uid}/players/{pid}/workoutLogs/{lid}` | `WorkoutLogDocument` | `workout-logs.ts` | FK `playerId`. Deep `exercises[].sets[]` → JSON. |
| 12 | `/users/{uid}/players/{pid}/journal/{jid}` | `JournalEntryDocument` | `journal.ts` | FK `playerId`. |
| 13 | `/users/{uid}/players/{pid}/biometrics/{lid}` | `BiometricsLogDocument` | `biometrics.ts` | FK `playerId`. |
| 14 | `/users/{uid}/players/{pid}/assessments/{aid}` | `FitnessAssessmentDocument` | `fitness-assessments.ts` | FK `playerId`. |
| 15 | `/users/{uid}/players/{pid}/cardioLogs/{lid}` | `CardioLogDocument` | `cardio-logs.ts` | FK `playerId`. |
| 16 | `/users/{uid}/scheduleEvents/{eid}` | `ScheduleEventDocument` | `schedule-events.ts` | FK `userId` (not playerId — events are user-level). `playerIds[]` → JSON array. |
| 17 | `/users/{uid}/players/{pid}/practiceLogs/{lid}` | `PracticeLogDocument` | `practice-logs.ts` | FK `playerId`. `focusAreas[]` + `drillsCompleted[]` → JSON arrays. |
| 18 | `/users/{uid}/players/{pid}/mealLogs/{lid}` | `MealLogDocument` | `meal-logs.ts` | FK `playerId`. |

**Total: 14 new schema files (#3 + #9 + #10 are exported from their parent files).**

## FK chain

```
users (auth.ts)
  ├─ workspaces.ownerUserId
  ├─ workspaceMembers.userId
  ├─ players.userId
  │   ├─ games.playerId
  │   ├─ workoutLogs.playerId
  │   ├─ journalEntries.playerId
  │   ├─ biometricsLogs.playerId
  │   ├─ fitnessAssessments.playerId
  │   ├─ cardioLogs.playerId
  │   ├─ practiceLogs.playerId
  │   ├─ mealLogs.playerId
  │   └─ dreamGym.playerId (1:1)
  │       ├─ dreamGymEvents.dreamGymId
  │       └─ dreamGymCheckIns.dreamGymId
  └─ scheduleEvents.userId
workspaces
  └─ workspaceInvites.workspaceId
```

All FKs cascade-delete except where noted. Player deletion cascades all log tables. Workspace soft-delete via `deletedAt` (not cascade).

## Array / nested-object handling

| Field | Strategy | Why |
|---|---|---|
| `workspace.members` | child table `workspaceMembers` | Need to query "what workspaces does user X belong to" |
| `workspace.billing.*` | flatten to columns (`billingStripeCustomerId`, etc.) | Always read with the workspace; queryable by Stripe webhooks |
| `workspace.usage.*` | flatten to columns | Queryable for limit checks |
| `player.secondaryPositions` | JSON column | Display-only, no need to query by position |
| `game.emotionTags` | JSON column | Display-only |
| `dreamGym.profile.*` | flatten to columns | Queryable + small |
| `dreamGym.schedule.*` | flatten (7 day columns) | Tiny + queryable |
| `dreamGym.events` | child table | Queried independently for upcoming events |
| `dreamGym.mental.checkIns` | child table | Time-series, queried by date range |
| `dreamGym.mental.favoriteTips` | JSON column on parent | Tiny display-only array |
| `workoutLog.exercises[].sets[]` | JSON column | Deeply nested; never query individual sets |
| `scheduleEvent.playerIds` | JSON array | Display-only; multi-player events are display-only |
| `practiceLog.focusAreas` | JSON column | Display-only |
| `practiceLog.drillsCompleted` | JSON column | Display-only |

## Migration strategy

1. Author each schema file
2. Run `pnpm exec drizzle-kit generate` — produces `drizzle/000N_*.sql`
3. Review SQL by hand before committing
4. Migration runs at container boot via `src/lib/db/migrate.ts` (already in Phase 3)

## Query module replacement

Each `src/lib/firebase/admin-services/*.ts` gets a corresponding `src/lib/db/queries/*.ts` with **identical exported function signatures**. Callers don't need to change imports yet — we do an `s/firebase\/admin-services/db\/queries/g` cutover at the end.

| Source (delete after cutover) | Target |
|---|---|
| `src/lib/firebase/admin-services/users.ts` | `src/lib/db/queries/users.ts` |
| `src/lib/firebase/admin-services/workspaces.ts` | `src/lib/db/queries/workspaces.ts` |
| `src/lib/firebase/admin-services/players.ts` | `src/lib/db/queries/players.ts` |
| `src/lib/firebase/admin-services/games.ts` | `src/lib/db/queries/games.ts` |
| `src/lib/firebase/admin-services/waitlist.ts` | `src/lib/db/queries/waitlist.ts` |
| `src/lib/firebase/admin-services/journal.ts` | `src/lib/db/queries/journal.ts` |
| `src/lib/firebase/admin-services/biometrics.ts` | `src/lib/db/queries/biometrics.ts` |
| `src/lib/firebase/admin-services/assessments.ts` | `src/lib/db/queries/fitness-assessments.ts` |
| `src/lib/firebase/admin-services/cardio-logs.ts` | `src/lib/db/queries/cardio-logs.ts` |
| `src/lib/firebase/admin-services/practice-logs.ts` | `src/lib/db/queries/practice-logs.ts` |
| `src/lib/firebase/admin-services/meal-logs.ts` | `src/lib/db/queries/meal-logs.ts` |
| `src/lib/firebase/admin-services/schedule-events.ts` | `src/lib/db/queries/schedule-events.ts` |
| `src/lib/firebase/admin-services/dream-gym.ts` | `src/lib/db/queries/dream-gym.ts` |
| `src/lib/firebase/admin-services/workout-logs.ts` | `src/lib/db/queries/workout-logs.ts` |

15 query modules total.

## Deferred to follow-on phases

- **Client-side fetch swaps**: replace direct Firestore client queries with `fetch('/api/...')` to new API routes. Tracked separately — touches every dashboard page.
- **`firestore.rules` deletion**: end of Phase 8.
- **`src/lib/firebase/admin-services/*.ts` deletion**: end of Phase 4 after cutover.
- **`src/types/firestore.ts` retention**: keep as the canonical type source even after Firestore is gone. Phase 4 schemas should `infer` types from Drizzle where possible, but legacy callers still import these types — leave them in place.

## Risks

- **Phase 3 PR #41 not merged yet** (CI green except Pre-merge Validation requiring review). Phase 4 work assumes #41 merges first. Branch is stacked: `feat/phase-4-data-port` ← `feat/phase-3-auth-port` ← `main`.
- **Workspace member denormalization**: Firestore had `workspace.members[]` embedded. Splitting to a junction table is cleaner but means every workspace read needs a JOIN. Drizzle relations handle this — performance acceptable for SQLite at this scale.
- **`users.id` type**: Phase 3 uses `crypto.randomUUID()` for new users. Firestore UIDs are 28-char strings. Since data ships empty, no collision risk.
