/**
 * POST /api/account/delete — parent deletes their account and all data.
 *
 * Body: { password: string, confirmation: "DELETE" }
 * Re-authenticates with the password (a stolen session alone cannot delete),
 * is rate-limited per user, and sends a receipt email after deletion.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { deleteAccount, ActiveSubscriptionError } from "@/lib/account/delete-account";
import { consumeRateLimit, rateLimitResponseInit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { createLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const logger = createLogger("api/account/delete");

export async function POST(request: NextRequest) {
  const session = await auth(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const limit = consumeRateLimit(RATE_LIMITS.accountDeleteByUser, userId);
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }

  let body: { password?: unknown; confirmation?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  if (body.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: "CONFIRMATION_REQUIRED", message: 'Type DELETE to confirm.' },
      { status: 400 },
    );
  }
  const password = typeof body.password === "string" ? body.password : "";

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.passwordHash || !password || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "INVALID_PASSWORD", message: "That password is not correct." },
      { status: 403 },
    );
  }

  try {
    const result = await deleteAccount(userId);
    logger.info("Account deleted", { emailHash: result.emailHash, athletes: result.athletesDeleted });

    // Receipt goes to the address the account used; failure must not undo the deletion.
    await sendEmail({
      to: user.email,
      subject: "Your Hustle account has been deleted",
      html:
        "<p>Your Hustle account and all athlete data (games, training logs, journal entries, photos) " +
        "have been permanently deleted.</p><p>Encrypted backups age out automatically within 30 days.</p>" +
        "<p>If you did not request this, reply to this email.</p>",
      text:
        "Your Hustle account and all athlete data have been permanently deleted. " +
        "Encrypted backups age out automatically within 30 days. If you did not request this, reply to this email.",
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof ActiveSubscriptionError) {
      return NextResponse.json(
        { error: error.code, message: "Cancel your subscription in Billing before deleting your account." },
        { status: 409 },
      );
    }
    logger.error("Account deletion failed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "DELETE_FAILED", message: "Deletion failed. Nothing was removed." }, { status: 500 });
  }
}
