import { and, eq } from "drizzle-orm";
import { db, type DB } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema/auth";
import { workspaces, workspaceMembers } from "@/lib/db/schema/workspaces";

type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export class RegistrationConflictError extends Error {
  constructor() {
    super("ACCOUNT_ALREADY_EXISTS");
  }
}

/** Resolve only an unambiguous tenant; never reset an existing subscription. */
function provision(tx: Transaction, userId: string, now: Date) {
  const user = tx.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("WORKSPACE_PROVISION_USER_MISSING");

  if (user.defaultWorkspaceId) {
    const workspace = tx.select().from(workspaces)
      .where(eq(workspaces.id, user.defaultWorkspaceId)).get();
    const member = tx.select().from(workspaceMembers).where(and(
      eq(workspaceMembers.workspaceId, user.defaultWorkspaceId),
      eq(workspaceMembers.userId, userId),
    )).get();
    if (!workspace || (workspace.ownerUserId !== userId && !member)) {
      throw new Error("WORKSPACE_PROVISION_INVALID_DEFAULT");
    }
    if (workspace.ownerUserId === userId && !member) {
      tx.insert(workspaceMembers).values({
        workspaceId: workspace.id, userId, email: user.email,
        role: "owner", addedBy: userId, addedAt: now,
      }).onConflictDoNothing().run();
    }
    return { workspaceId: workspace.id, outcome: "existing" as const };
  }

  // Include disabled/deleted workspaces: losing a pointer must not create a
  // new free trial or bypass the old workspace's billing/access restrictions.
  const owned = tx.select({ id: workspaces.id }).from(workspaces)
    .where(eq(workspaces.ownerUserId, userId)).limit(2).all();
  const memberships = tx.select({ id: workspaceMembers.workspaceId }).from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId)).limit(2).all();
  const candidates = new Set([...owned, ...memberships].map((row) => row.id));
  if (candidates.size > 1) throw new Error("WORKSPACE_PROVISION_AMBIGUOUS");

  if (candidates.size === 1) {
    const workspaceId = [...candidates][0];
    const workspace = tx.select().from(workspaces).where(eq(workspaces.id, workspaceId)).get();
    if (!workspace) throw new Error("WORKSPACE_PROVISION_INVALID_MEMBERSHIP");
    if (workspace.ownerUserId === userId) {
      tx.insert(workspaceMembers).values({
        workspaceId, userId, email: user.email, role: "owner", addedBy: userId, addedAt: now,
      }).onConflictDoNothing().run();
    }
    tx.update(users).set({ defaultWorkspaceId: workspaceId, updatedAt: now })
      .where(eq(users.id, userId)).run();
    return { workspaceId, outcome: "linked" as const };
  }

  // The documented free trial lasts 14 days from signup. Repairing an old
  // orphan account preserves that deadline instead of granting another trial.
  const createdAt = user.createdAt?.getTime();
  if (createdAt === undefined || !Number.isFinite(createdAt) || createdAt > now.getTime()) {
    throw new Error("WORKSPACE_PROVISION_REGISTRATION_DATE_INVALID");
  }
  const trialEndsAt = new Date(createdAt + TRIAL_DURATION_MS);
  const workspace = tx.insert(workspaces).values({
    ownerUserId: userId,
    name: user.name ? `${user.name}'s Workspace` : "My Workspace",
    plan: "free",
    status: "trial",
    trialEndsAt,
    billingCurrentPeriodEnd: trialEndsAt,
    createdAt: now,
    updatedAt: now,
  }).returning().get();
  tx.insert(workspaceMembers).values({
    workspaceId: workspace.id, userId, email: user.email,
    role: "owner", addedBy: userId, addedAt: now,
  }).run();
  tx.update(users).set({ defaultWorkspaceId: workspace.id, updatedAt: now })
    .where(eq(users.id, userId)).run();
  return { workspaceId: workspace.id, outcome: "created" as const };
}

export function ensureDefaultWorkspaceForUser(userId: string, now = new Date()) {
  return db.transaction((tx) => provision(tx, userId, now), { behavior: "immediate" });
}

/** User, verification token, owner membership and tenant pointer commit together. */
export function registerUserWithWorkspace(input: {
  email: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  passwordHash: string;
  token: string;
  tokenExpiresAt: Date;
}, now = new Date()) {
  return db.transaction((tx) => {
    if (tx.select({ id: users.id }).from(users).where(eq(users.email, input.email)).get()) {
      throw new RegistrationConflictError();
    }
    const user = tx.insert(users).values({
      email: input.email, name: input.name, passwordHash: input.passwordHash,
      firstName: input.firstName ?? null, lastName: input.lastName ?? null,
      createdAt: now, updatedAt: now,
    }).returning().get();
    const result = provision(tx, user.id, now);
    tx.insert(verificationTokens).values({
      identifier: input.email, token: input.token, expires: input.tokenExpiresAt,
    }).run();
    return { userId: user.id, workspaceId: result.workspaceId };
  }, { behavior: "immediate" });
}
