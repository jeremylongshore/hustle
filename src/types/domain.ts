/**
 * Domain Types
 *
 * Shared TypeScript types for Hustle's domain records (workspaces, users,
 * players, games, Dream Gym logs, billing). Persistence is Drizzle on SQLite
 * (src/lib/db/schema); these types describe the shapes the app passes around.
 *
 * History: this module was src/types/firestore.ts during the Firebase era.
 * Several interfaces keep their original `*Document` names for source
 * compatibility; date fields are plain JS Dates.
 */

type Timestamp = Date;
import type { LeagueCode } from './league';
import type { PerformanceRating, GameEmotionTag } from './game';

/**
 * Soccer Position Codes
 * Standardized position abbreviations for player profiles
 */
export type SoccerPositionCode =
  | 'GK'   // Goalkeeper
  | 'CB'   // Center Back
  | 'RB'   // Right Back
  | 'LB'   // Left Back
  | 'RWB'  // Right Wing Back
  | 'LWB'  // Left Wing Back
  | 'DM'   // Defensive Midfielder
  | 'CM'   // Central Midfielder
  | 'AM'   // Attacking Midfielder
  | 'RW'   // Right Winger
  | 'LW'   // Left Winger
  | 'ST'   // Striker
  | 'CF';  // Center Forward

/**
 * Player Gender
 */
export type PlayerGender = 'male' | 'female';

/**
 * Workspace Plan Tiers
 */
export type WorkspacePlan = 'free' | 'starter' | 'plus' | 'pro';

/**
 * Workspace Lifecycle Status
 */
export type WorkspaceStatus =
  | 'active'      // Workspace active and in good standing
  | 'trial'       // Free trial period
  | 'past_due'    // Payment failed, grace period
  | 'canceled'    // Subscription canceled, still accessible until period end
  | 'suspended'   // Access restricted (payment issues, TOS violation)
  | 'deleted';    // Soft deleted, no longer accessible

/**
 * Workspace Member Role (Phase 6 Task 6: Collaborators)
 */
export type WorkspaceMemberRole =
  | 'owner'       // Full access, billing, can delete workspace
  | 'admin'       // Full access to players/games, can invite members
  | 'member'      // Can view/edit players/games
  | 'viewer';     // Read-only access

/**
 * Workspace Member (Phase 6 Task 6: Collaborators)
 */
export interface WorkspaceMember {
  userId: string;              // Firebase UID
  email: string;               // User email
  role: WorkspaceMemberRole;   // Member role
  addedAt: Timestamp;          // When member was added
  addedBy: string;             // Firebase UID of inviter
}

/**
 * Workspace Document
 * Collection: /workspaces/{workspaceId}
 *
 * Represents a billable tenant (typically a parent/guardian account).
 * Owns players, games, and has a Stripe subscription.
 */
export interface WorkspaceDocument {
  // Identity
  ownerUserId: string;       // Firebase UID of workspace owner
  name: string;              // Display name (e.g., "Johnson Family Stats")

  // Plan & Status
  plan: WorkspacePlan;       // Current subscription tier
  status: WorkspaceStatus;   // Lifecycle status

  // Collaborators (Phase 6 Task 6)
  members: WorkspaceMember[]; // Team members with role-based access

  // Billing Integration
  billing: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Timestamp | null;
  };

  // Usage Tracking (denormalized for quick limit checks)
  usage: {
    playerCount: number;       // Current active players
    gamesThisMonth: number;    // Games created this billing cycle
    storageUsedMB: number;     // Storage used (photos, videos - future)
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;  // Soft delete timestamp
}

/**
 * User Document
 * Collection: /users/{userId}
 *
 * Firebase Auth manages authentication.
 * This document stores user profile and COPPA compliance data.
 */
export interface UserDocument {
  // Workspace Ownership (Phase 5)
  defaultWorkspaceId: string | null;  // Primary workspace for this user
  ownedWorkspaces: string[];          // Array of workspace IDs where user is owner

  // Profile
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;

  // Email verification (managed by Firebase Auth)
  emailVerified: boolean;

  // COPPA Compliance
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
  termsAgreedAt: Timestamp | null;
  privacyAgreedAt: Timestamp | null;

  // Game verification PIN (bcrypt hash of 4-6 digit PIN)
  verificationPinHash?: string | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Player Document
 * Subcollection: /users/{userId}/players/{playerId}
 *
 * Child profiles for tracking youth soccer players.
 */
export interface PlayerDocument {
  // Workspace Ownership (Phase 5 - optional until workspace migration)
  workspaceId?: string | null;  // Workspace that owns this player

  // Profile
  name: string;
  birthday: Timestamp;

  // Gender (required for new players)
  gender: PlayerGender;

  // Structured Positions (new fields)
  primaryPosition: SoccerPositionCode;
  secondaryPositions?: SoccerPositionCode[];
  positionNote?: string;

  // Legacy position field (kept for backward compatibility)
  position?: string;

  // League Information
  leagueCode: LeagueCode;
  leagueOtherName?: string;  // Required when leagueCode === 'other'

  // Team/Club Info
  teamClub: string;
  photoUrl?: string | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Game Document
 * Subcollection: /users/{userId}/players/{playerId}/games/{gameId}
 *
 * Individual game statistics.
 */
export interface GameDocument {
  // Workspace Ownership (Phase 5 - optional until workspace migration)
  workspaceId?: string | null;  // Workspace that owns this game

  // Game info
  date: Timestamp;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  finalScore: string;
  minutesPlayed: number;

  // Game context (FR-29, FR-30, FR-31)
  gameName?: string | null;           // Tournament/game name (e.g., "Fall Classic Final")
  gameLocation?: string | null;       // Game location (e.g., "Riverside Sports Complex")
  gameLeagueCode?: LeagueCode | null; // League selector for this game
  gameLeagueOtherName?: string | null; // Custom league name when gameLeagueCode is 'other'

  // Self-assessment (FR-37, FR-38)
  performanceRating?: PerformanceRating | null; // "How did I play?" 1-5 stars
  emotionTags?: GameEmotionTag[] | null;        // Game emotion tags

  // Universal stats
  goals: number;
  assists: number;

  // Defensive stats (null if not defender)
  tackles?: number | null;
  interceptions?: number | null;
  clearances?: number | null;
  blocks?: number | null;
  aerialDuelsWon?: number | null;

  // Goalkeeper stats (null if not goalkeeper)
  saves?: number | null;
  goalsAgainst?: number | null;
  cleanSheet?: boolean | null;

  // Verification
  verified: boolean;
  verifiedAt?: Timestamp | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Waitlist Document
 * Collection: /waitlist/{email}
 *
 * Early access signups (document ID is the email).
 */
export interface WaitlistDocument {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  source?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Workspace Invite Document (Phase 6 Task 6: Collaborators)
 * Collection: /workspace-invites/{inviteId}
 *
 * Pending invitations to join a workspace.
 */
export interface WorkspaceInviteDocument {
  workspaceId: string;         // Workspace being invited to
  workspaceName: string;       // Workspace display name
  invitedEmail: string;        // Email address of invitee
  invitedBy: string;           // Firebase UID of inviter
  inviterName: string;         // Display name of inviter
  role: WorkspaceMemberRole;   // Role to be assigned
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Timestamp;        // Invite expiration (7 days)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// DREAM GYM TYPES
// ============================================================================

/**
 * Dream Gym Training Goals
 */
export type DreamGymGoal =
  | 'fat_loss'
  | 'muscle_build'
  | 'core'
  | 'leg_power'
  | 'soccer_offday';

/**
 * Dream Gym Intensity Level
 */
export type DreamGymIntensity = 'light' | 'normal' | 'beast_mode';

/**
 * Dream Gym Day Type (for practice schedule)
 */
export type DreamGymDayType =
  | 'off'
  | 'practice_light'
  | 'practice_medium'
  | 'practice_hard'
  | 'game'
  | 'tournament';

/**
 * Dream Gym Equipment Tags
 */
export type DreamGymEquipment =
  | 'dumbbells'
  | 'barbell'
  | 'bands'
  | 'kettlebell'
  | 'bench'
  | 'pull_up_bar'
  | 'cable'
  | 'jump_rope'
  | 'foam_roller'
  | 'medicine_ball';

/**
 * Dream Gym Profile
 * Training preferences and physical info for workout generation
 */
export interface DreamGymProfile {
  hasGymAccess: boolean;
  hasHomeEquipment: boolean;
  equipmentTags: DreamGymEquipment[];
  heightCm?: number | null;
  weightKg?: number | null;
  sport: 'soccer';
  position: SoccerPositionCode;
  goals: DreamGymGoal[];
  intensity: DreamGymIntensity;
  onboardingComplete: boolean;
}

/**
 * Dream Gym Practice Schedule
 * Weekly schedule template for load management
 */
export interface DreamGymSchedule {
  monday: DreamGymDayType;
  tuesday: DreamGymDayType;
  wednesday: DreamGymDayType;
  thursday: DreamGymDayType;
  friday: DreamGymDayType;
  saturday: DreamGymDayType;
  sunday: DreamGymDayType;
}

/**
 * Dream Gym Event (game, tournament, special practice)
 */
export interface DreamGymEvent {
  id: string;
  date: Timestamp;
  type: 'game' | 'tournament' | 'tryout' | 'camp';
  name: string;
  notes?: string | null;
}

/**
 * Dream Gym Mental Check-in
 * Daily readiness assessment for load management
 */
export interface DreamGymMentalCheckIn {
  date: Timestamp;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 'low' | 'ok' | 'high';
  soreness: 'low' | 'medium' | 'high';
  stress: 'low' | 'medium' | 'high';
  notes?: string | null;
}

/**
 * Dream Gym Document
 * Subcollection: /users/{userId}/players/{playerId}/dreamGym
 *
 * Complete Dream Gym data for a player
 */
export interface DreamGymDocument {
  // Player reference
  playerId: string;

  // Profile & preferences
  profile: DreamGymProfile;

  // Weekly schedule template
  schedule: DreamGymSchedule;

  // Upcoming events
  events: DreamGymEvent[];

  // Mental game tracking
  mental: {
    checkIns: DreamGymMentalCheckIn[];
    favoriteTips: string[];
    lastCheckIn?: Timestamp | null;
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Exercise Definition (for workout library)
 */
export interface ExerciseDefinition {
  id: string;
  name: string;
  mode: 'gym' | 'home' | 'both';
  equipment: DreamGymEquipment[];
  targets: string[];
  category: 'legs' | 'core' | 'upper' | 'conditioning';
  videoUrl?: string | null;
  instructions?: string | null;
}

/**
 * Workout Exercise (in a generated workout)
 */
export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string; // e.g., "10-12" or "30s"
  rest: string; // e.g., "60s"
  notes?: string | null;
}

/**
 * Generated Workout
 */
export interface GeneratedWorkout {
  id: string;
  playerId: string;
  date: Timestamp;
  type: 'strength' | 'conditioning' | 'recovery' | 'soccer_specific';
  title: string;
  duration: number; // minutes
  exercises: WorkoutExercise[];
  warmup: string[];
  cooldown: string[];
  completed: boolean;
  completedAt?: Timestamp | null;
}

// ============================================================================
// WORKOUT LOGGING TYPES (Persistent workout history)
// ============================================================================

/**
 * Individual Set Log (actual performance data)
 */
export interface WorkoutSetLog {
  setNumber: number;
  reps: number;
  weight?: number | null; // in lbs or kg (based on user preference)
  completed: boolean;
  notes?: string | null;
}

/**
 * Exercise Log (within a workout)
 */
export interface WorkoutExerciseLog {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string; // e.g., "8-12" or "30s"
  sets: WorkoutSetLog[];
  notes?: string | null;
}

/**
 * Workout Type
 */
export type WorkoutLogType = 'strength' | 'conditioning' | 'core' | 'recovery' | 'custom' | 'soccer_specific';

/**
 * Workout Log Document
 * Subcollection: /users/{userId}/players/{playerId}/workoutLogs/{logId}
 *
 * Persisted workout completion with actual reps/sets/weight tracked.
 */
export interface WorkoutLogDocument {
  playerId: string;
  workoutId?: string | null; // Reference to GeneratedWorkout if from template
  date: Timestamp;
  type: WorkoutLogType;
  title: string;
  duration: number; // minutes
  exercises: WorkoutExerciseLog[];
  totalVolume?: number | null; // sum of (sets * reps * weight)
  completedAt: Timestamp;
  journalEntryId?: string | null; // Link to post-workout journal
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// JOURNAL TYPES (Pervasive journal system)
// ============================================================================

/**
 * Journal Entry Context (where the entry was created from)
 */
export type JournalContext =
  | 'workout_reflection'  // After completing a workout
  | 'mental_checkin'      // From mental game page
  | 'game_reflection'     // After logging a game
  | 'daily_journal'       // Daily journaling
  | 'quick_entry';        // Quick add from any page

/**
 * Journal Mood Tags
 */
export type JournalMoodTag = 'great' | 'good' | 'okay' | 'struggling' | 'rough';

/**
 * Journal Energy Tags
 */
export type JournalEnergyTag = 'energized' | 'normal' | 'tired' | 'exhausted';

/**
 * Journal Entry Document
 * Subcollection: /users/{userId}/players/{playerId}/journal/{entryId}
 *
 * Pervasive journal entries accessible from multiple touchpoints.
 */
export interface JournalEntryDocument {
  playerId: string;
  date: Timestamp;
  content: string;
  context: JournalContext;
  moodTag?: JournalMoodTag | null;
  energyTag?: JournalEnergyTag | null;
  linkedWorkoutId?: string | null; // Link to workout log
  linkedGameId?: string | null;    // Link to game
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// BIOMETRICS TYPES (Health & Recovery Tracking)
// ============================================================================

/**
 * Biometrics Data Source
 */
export type BiometricsSource = 'manual' | 'apple_health' | 'garmin' | 'fitbit' | 'google_fit';

/**
 * Biometrics Log Document
 * Subcollection: /users/{userId}/players/{playerId}/biometrics/{logId}
 *
 * Daily health metrics for recovery and readiness tracking.
 */
export interface BiometricsLogDocument {
  playerId: string;
  date: Timestamp;

  // Heart rate metrics
  restingHeartRate?: number | null;      // bpm (morning measurement)
  maxHeartRate?: number | null;          // bpm during workout
  avgHeartRate?: number | null;          // bpm during workout
  hrv?: number | null;                   // Heart Rate Variability in ms

  // Sleep metrics
  sleepScore?: number | null;            // 0-100 sleep quality score
  sleepHours?: number | null;            // Total sleep duration

  // Activity metrics
  steps?: number | null;                 // Daily step count
  activeMinutes?: number | null;         // Minutes of activity

  // Data source tracking
  source: BiometricsSource;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Heart Rate Zone (for workout intensity tracking)
 */
export interface HeartRateZone {
  zone: 1 | 2 | 3 | 4 | 5;  // Zone 1 = recovery, Zone 5 = max effort
  minutes: number;          // Time spent in zone
}

/**
 * Workout Heart Rate Data (embedded in WorkoutLogDocument)
 */
export interface WorkoutHeartRateData {
  avg: number;              // Average heart rate during workout
  max: number;              // Max heart rate during workout
  zones?: HeartRateZone[];  // Time in each zone
}

// ============================================================================
// FITNESS ASSESSMENT TYPES (Testing & Progress)
// ============================================================================

/**
 * Fitness Test Types
 * Standard youth soccer fitness assessments
 */
export type FitnessTestType =
  | 'beep_test'       // Yo-Yo / Beep Test - aerobic endurance (level 1-21)
  | '40_yard_dash'    // Sprint speed (seconds)
  | 'pro_agility'     // 5-10-5 agility test (seconds)
  | 'vertical_jump'   // Explosive power (inches)
  | 'plank_hold'      // Core endurance (seconds)
  | 'pushups_1min'    // Upper body endurance (count)
  | 'situps_1min'     // Core endurance (count)
  | 'mile_run';       // Cardio endurance (mm:ss)

/**
 * Fitness Test Unit
 */
export type FitnessTestUnit = 'level' | 'seconds' | 'inches' | 'count' | 'time';

/**
 * Fitness Assessment Document
 * Subcollection: /users/{userId}/players/{playerId}/assessments/{assessmentId}
 *
 * Individual fitness test results with progress tracking.
 */
export interface FitnessAssessmentDocument {
  playerId: string;
  date: Timestamp;
  testType: FitnessTestType;
  value: number;               // Raw value (interpretation depends on testType)
  unit: FitnessTestUnit;       // Unit of measurement
  percentile?: number | null;  // Percentile vs age/gender norms (0-100)
  notes?: string | null;       // Additional context
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Fitness Test Metadata
 * Static information about each test type
 */
export interface FitnessTestMetadata {
  testType: FitnessTestType;
  name: string;               // Display name
  description: string;        // What it measures
  unit: FitnessTestUnit;      // Unit of measurement
  direction: 'higher_better' | 'lower_better';  // For progress comparison
  minValue: number;           // Minimum valid value
  maxValue: number;           // Maximum valid value
}

// ============================================================================
// CLIENT-SIDE TYPES
// ============================================================================

/**
 * Client-side types (with Date instead of Timestamp)
 * Used in React components and API routes.
 */

export interface User extends Omit<UserDocument, 'createdAt' | 'updatedAt' | 'termsAgreedAt' | 'privacyAgreedAt'> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  termsAgreedAt: Date | null;
  privacyAgreedAt: Date | null;
}

export interface Player extends Omit<PlayerDocument, 'birthday' | 'createdAt' | 'updatedAt'> {
  id: string;
  birthday: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game extends Omit<GameDocument, 'date' | 'verifiedAt' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Waitlist extends Omit<WaitlistDocument, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace extends Omit<WorkspaceDocument, 'createdAt' | 'updatedAt' | 'deletedAt' | 'billing' | 'members'> {
  id: string;
  billing: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Date | null;
    // Phase 4.5 — additional Stripe fields hydrated from workspace table
    subscriptionStatus?: string | null;
    lastPaymentFailedAt?: Date | null;
    canceledAt?: Date | null;
  };
  members: Array<Omit<WorkspaceMember, 'addedAt'> & { addedAt: Date }>;  // Convert Timestamp to Date
  trialEndsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkspaceInvite extends Omit<WorkspaceInviteDocument, 'createdAt' | 'updatedAt' | 'expiresAt'> {
  id: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dream Gym client-side types
export interface DreamGymEventClient extends Omit<DreamGymEvent, 'date'> {
  date: Date;
}

export interface DreamGymMentalCheckInClient extends Omit<DreamGymMentalCheckIn, 'date'> {
  date: Date;
}

export interface DreamGym extends Omit<DreamGymDocument, 'createdAt' | 'updatedAt' | 'events' | 'mental'> {
  id: string;
  events: DreamGymEventClient[];
  mental: {
    checkIns: DreamGymMentalCheckInClient[];
    favoriteTips: string[];
    lastCheckIn?: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Workout extends Omit<GeneratedWorkout, 'date' | 'completedAt'> {
  date: Date;
  completedAt: Date | null;
}

// Workout Log client-side types
export interface WorkoutLog extends Omit<WorkoutLogDocument, 'date' | 'completedAt' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Journal Entry client-side types
export interface JournalEntry extends Omit<JournalEntryDocument, 'date' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Biometrics client-side types
export interface BiometricsLog extends Omit<BiometricsLogDocument, 'date' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Fitness Assessment client-side types
export interface FitnessAssessment extends Omit<FitnessAssessmentDocument, 'date' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CARDIO LOG TYPES (Running/Distance Tracking)
// ============================================================================

/**
 * Cardio Activity Types
 */
export type CardioActivityType =
  | 'run'         // General running
  | 'jog'         // Light jogging
  | 'sprint'      // Sprint training
  | 'interval'    // Interval training (HIIT)
  | 'recovery'    // Recovery run
  | 'long_run';   // Long distance run

/**
 * Cardio Log Document
 * Subcollection: /users/{userId}/players/{playerId}/cardioLogs/{logId}
 *
 * Track running and cardio activities with distance.
 */
export interface CardioLogDocument {
  playerId: string;
  date: Timestamp;
  activityType: CardioActivityType;

  // Distance & Duration
  distanceMiles: number;           // Distance in miles
  durationMinutes: number;         // Duration in minutes

  // Calculated/Optional metrics
  avgPacePerMile?: string | null;  // e.g., "8:30" (mm:ss per mile)
  calories?: number | null;        // Estimated calories burned

  // Heart rate (optional)
  avgHeartRate?: number | null;    // Average bpm during activity
  maxHeartRate?: number | null;    // Max bpm during activity

  // Context
  location?: string | null;        // Where the run happened (e.g., "Track", "Neighborhood")
  weather?: string | null;         // Weather conditions
  notes?: string | null;           // Additional notes

  // Effort level
  perceivedEffort?: 1 | 2 | 3 | 4 | 5 | null; // Rate of Perceived Exertion (1-5)

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Cardio Log client-side types
export interface CardioLog extends Omit<CardioLogDocument, 'date' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SEASON SCHEDULE TYPES
// ============================================================================

/**
 * Schedule Event Types
 */
export type ScheduleEventType =
  | 'game'         // Competitive match
  | 'practice'     // Team or individual practice
  | 'tournament'   // Multi-game tournament
  | 'tryout'       // Team tryout
  | 'camp'         // Soccer camp / clinic
  | 'training'     // Personal training / workout
  | 'other';       // Other event

/**
 * Schedule Event Document
 * Subcollection: /users/{userId}/scheduleEvents/{eventId}
 *
 * Stored at user level because a family's athletes share a team schedule.
 */
export interface ScheduleEventDocument {
  // Who this event involves
  playerIds: string[];           // Players attending (can be multiple)

  // Event details
  type: ScheduleEventType;
  title: string;                 // e.g. "Fall Classic Tournament"
  date: Timestamp;               // Start date/time
  endDate?: Timestamp | null;    // End date/time (for multi-day events)
  location?: string | null;      // Venue / address
  opponent?: string | null;      // Opponent team name (for games)
  notes?: string | null;         // Additional notes

  // For linking to a logged game after it's played
  linkedGameId?: string | null;       // Game doc ID
  linkedGamePlayerId?: string | null; // Player ID that owns the linked game

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Schedule Event client-side type
export interface ScheduleEvent extends Omit<ScheduleEventDocument, 'date' | 'endDate' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PRACTICE LOG TYPES (Training Session Tracking)
// ============================================================================

/**
 * Practice Focus Areas
 */
export type PracticeFocusArea =
  | 'passing'
  | 'shooting'
  | 'dribbling'
  | 'defending'
  | 'heading'
  | 'first_touch'
  | 'positioning'
  | 'set_pieces'
  | 'goalkeeping'
  | 'fitness'
  | 'scrimmage'
  | 'tactics'
  | 'other';

/**
 * Practice Type
 */
export type PracticeType =
  | 'team_practice'    // Full team practice
  | 'small_group'      // Small group training
  | 'individual'       // Solo practice/drills
  | 'private_lesson'   // 1-on-1 coaching session
  | 'camp'             // Soccer camp session
  | 'clinic';          // Skills clinic

/**
 * Practice Log Document
 * Subcollection: /users/{userId}/players/{playerId}/practiceLogs/{logId}
 *
 * Track practice sessions with duration and focus areas.
 */
export interface PracticeLogDocument {
  playerId: string;
  date: Timestamp;
  practiceType: PracticeType;

  // Duration
  durationMinutes: number;         // How long was the practice

  // Focus areas (multi-select)
  focusAreas: PracticeFocusArea[];

  // Details
  teamName?: string | null;        // Team or coach name
  location?: string | null;        // Practice location
  drillsCompleted?: string[] | null; // List of specific drills done

  // Self-assessment
  intensity?: 1 | 2 | 3 | 4 | 5 | null; // Practice intensity (1-5)
  enjoyment?: 1 | 2 | 3 | 4 | 5 | null; // How much they enjoyed it (1-5)
  improvement?: string | null;     // What did they improve on?

  // General notes
  notes?: string | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Practice Log client-side types
export interface PracticeLog extends Omit<PracticeLogDocument, 'date' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MEAL LOG TYPES
// ============================================================================

/**
 * Meal Types
 */
export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout';

/**
 * Meal Log Document
 * Subcollection: /users/{userId}/players/{playerId}/mealLogs/{logId}
 *
 * Track daily nutrition and meals per athlete.
 */
export interface MealLogDocument {
  playerId: string;
  date: Timestamp;
  mealType: MealType;
  description: string;           // What was eaten
  calories?: number | null;      // Total calories
  protein?: number | null;       // Grams of protein
  carbs?: number | null;         // Grams of carbohydrates
  fat?: number | null;           // Grams of fat
  notes?: string | null;         // Additional notes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Meal Log client-side types
export interface MealLog extends Omit<MealLogDocument, 'date' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
