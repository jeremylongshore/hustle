/**
 * Admin allow-list.
 *
 * Admins are listed by user ID in the ADMIN_USER_IDS env var (comma-separated).
 * This FAILS CLOSED: when the variable is unset or empty, nobody is an admin.
 * (The previous per-route arrays treated an empty list as "allow every signed-in
 * user", which exposed billing ledgers and Stripe event replay to all accounts.)
 */
export function adminUserIds(env: NodeJS.ProcessEnv = process.env): Set<string> {
  return new Set(
    (env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export function isAdmin(userId: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!userId) return false;
  return adminUserIds(env).has(userId);
}
