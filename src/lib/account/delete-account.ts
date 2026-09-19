/**
 * Complete account deletion (parent-initiated).
 *
 * Deletion is immediate and hard: one SQLite transaction removes the user and,
 * via ON DELETE CASCADE, every athlete and all athlete data (games, logs,
 * journal, Dream Gym, assessments), sessions, OAuth accounts, reset tokens,
 * schedule events, owned workspaces (members, invites, billing ledger).
 * Rows the cascade cannot reach are removed explicitly first:
 *   - email-keyed verification tokens and the waitlist entry
 *   - workspaceMember.addedBy is NOT NULL / ON DELETE NO ACTION, so rows in
 *     OTHER families' workspaces that this user added are re-attributed to
 *     that workspace's owner (otherwise the FK blocks the delete)
 * Uploaded files ({userId}/...) are removed after the transaction commits.
 *
 * Backups are not rewritten; nightly borg archives and the 30-day immutable
 * B2 copy age out on their own schedule (disclose in the privacy policy,
 * bead hustle-4dc.11).
 */

import crypto from "node:crypto";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema/auth";
import { workspaces, workspaceMembers } from "@/lib/db/schema/workspaces";
import { players } from "@/lib/db/schema/players";
import { waitlist } from "@/lib/db/schema/waitlist";
import { deleteUserUploadsLocal } from "@/lib/storage/local";

export class ActiveSubscriptionError extends Error {
  readonly code = "ACTIVE_SUBSCRIPTION";
  constructor() {
    super("Cancel the active subscription before deleting the account");
    this.name = "ActiveSubscriptionError";
  }
}

export interface AccountDeletionResult {
  /** sha256 of the lowercased email, first 16 hex chars; safe to log. */
  emailHash: string;
  athletesDeleted: number;
  workspacesDeleted: number;
}

export function hashEmailForLog(email: string): string {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16);
}

/**
 * Delete a user and everything they own. Throws ActiveSubscriptionError if an
 * owned workspace still has a Stripe subscription (cancel first, so we never
 * delete the record of a subscription that keeps charging).
 */
export async function deleteAccount(userId: string): Promise<AccountDeletionResult> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found");

  const owned = await db
    .select({ id: workspaces.id, sub: workspaces.billingStripeSubscriptionId, status: workspaces.status })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, userId))
    .all();

  const liveSub = owned.find((w) => w.sub && w.status !== "canceled" && w.status !== "deleted");
  if (liveSub) throw new ActiveSubscriptionError();

  const athleteCount = (
    await db.select({ id: players.id }).from(players).where(eq(players.userId, userId)).all()
  ).length;

  db.transaction((tx) => {
    // Re-attribute membership rows this user added inside OTHER families' workspaces.
    const foreign = tx
      .select({ workspaceId: workspaceMembers.workspaceId, ownerUserId: workspaces.ownerUserId })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(and(eq(workspaceMembers.addedBy, userId), ne(workspaces.ownerUserId, userId)))
      .all();
    for (const row of foreign) {
      tx.update(workspaceMembers)
        .set({ addedBy: row.ownerUserId })
        .where(and(eq(workspaceMembers.workspaceId, row.workspaceId), eq(workspaceMembers.addedBy, userId)))
        .run();
    }

    tx.delete(verificationTokens).where(eq(verificationTokens.identifier, user.email)).run();
    tx.delete(waitlist).where(eq(waitlist.email, user.email)).run();

    const ownedIds = owned.map((w) => w.id);
    if (ownedIds.length > 0) {
      // Point the user away from workspaces we are about to delete, then delete them.
      tx.update(users).set({ defaultWorkspaceId: null }).where(eq(users.id, userId)).run();
      tx.delete(workspaces).where(inArray(workspaces.id, ownedIds)).run();
    }

    // Cascades: players -> all athlete data; sessions; accounts; reset tokens; schedule events.
    tx.delete(users).where(eq(users.id, userId)).run();
  });

  await deleteUserUploadsLocal(userId);

  return {
    emailHash: hashEmailForLog(user.email),
    athletesDeleted: athleteCount,
    workspacesDeleted: owned.length,
  };
}
