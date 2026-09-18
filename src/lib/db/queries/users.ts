/**
 * Users Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/users.ts. Reads/writes against
 * `user` table (already authored under schema/auth.ts).
 *
 * The legacy `User` type carries firstName/lastName/photoUrl/etc., plus
 * `ownedWorkspaces: string[]` and `emailVerified: boolean`. We derive
 * `ownedWorkspaces` from the workspaces table (workspaces WHERE ownerUserId)
 * and treat `emailVerified` as "any non-null verification timestamp on the
 * user row, OR the user is the credentials-issued sign-in path" — the
 * Phase 3 auth gate already enforces this at sign-in time.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { workspaces } from "@/lib/db/schema/workspaces";
import type { User, UserDocument } from "@/types/domain";

async function getOwnedWorkspaceIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, userId));
  return rows.map((r) => r.id);
}

type UserRow = typeof users.$inferSelect;

async function toUser(row: UserRow): Promise<User> {
  const owned = await getOwnedWorkspaceIds(row.id);
  return {
    id: row.id,
    defaultWorkspaceId: row.defaultWorkspaceId ?? null,
    ownedWorkspaces: owned,
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    email: row.email ?? "",
    phone: row.phone ?? null,
    photoUrl: row.photoUrl ?? null,
    emailVerified: Boolean(row.emailVerified),
    agreedToTerms: row.agreedToTerms ?? false,
    agreedToPrivacy: row.agreedToPrivacy ?? false,
    isParentGuardian: row.isParentGuardian ?? false,
    verificationPinHash: row.verificationPinHash ?? null,
    termsAgreedAt: row.termsAgreedAt ?? null,
    privacyAgreedAt: row.privacyAgreedAt ?? null,
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? new Date(),
  };
}

export async function getUserProfileAdmin(uid: string): Promise<User | null> {
  const row = await db.query.users.findFirst({ where: eq(users.id, uid) });
  if (!row) return null;
  return toUser(row);
}

/**
 * Look up the user whose `defaultWorkspaceId` equals the given id. Used by
 * the daily trial-reminders timer to find the owner email for a workspace
 * with an expiring trial — matches the legacy Cloud Function's lookup
 * (Firestore: where("defaultWorkspaceId", "==", workspaceId).limit(1)).
 */
export async function getUserByDefaultWorkspaceIdAdmin(
  workspaceId: string
): Promise<User | null> {
  const row = await db.query.users.findFirst({
    where: eq(users.defaultWorkspaceId, workspaceId),
  });
  if (!row) return null;
  return toUser(row);
}

export async function updateUserProfileAdmin(
  uid: string,
  data: Partial<Omit<UserDocument, "createdAt" | "emailVerified">>
): Promise<User> {
  const patch: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.firstName !== undefined) patch.firstName = data.firstName;
  if (data.lastName !== undefined) patch.lastName = data.lastName;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.photoUrl !== undefined) patch.photoUrl = data.photoUrl;
  if (data.defaultWorkspaceId !== undefined) patch.defaultWorkspaceId = data.defaultWorkspaceId;
  if (data.agreedToTerms !== undefined) patch.agreedToTerms = data.agreedToTerms;
  if (data.agreedToPrivacy !== undefined) patch.agreedToPrivacy = data.agreedToPrivacy;
  if (data.isParentGuardian !== undefined) patch.isParentGuardian = data.isParentGuardian;
  if (data.termsAgreedAt !== undefined) {
    patch.termsAgreedAt =
      data.termsAgreedAt instanceof Date ? data.termsAgreedAt : null;
  }
  if (data.privacyAgreedAt !== undefined) {
    patch.privacyAgreedAt =
      data.privacyAgreedAt instanceof Date ? data.privacyAgreedAt : null;
  }
  if (data.verificationPinHash !== undefined) patch.verificationPinHash = data.verificationPinHash;
  if ((data as { name?: string }).name !== undefined) {
    patch.name = (data as { name?: string }).name;
  }
  if (data.email !== undefined) patch.email = data.email;

  // ownedWorkspaces is derived, not stored — silently ignore if caller passes it.

  await db.update(users).set(patch).where(eq(users.id, uid));

  const updated = await db.query.users.findFirst({ where: eq(users.id, uid) });
  if (!updated) throw new Error(`User ${uid} disappeared during update`);
  return toUser(updated);
}
