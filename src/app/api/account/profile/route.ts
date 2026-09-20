/**
 * GET/PATCH /api/account/profile — the signed-in parent's own profile.
 *
 * Before this, /dashboard/settings displayed hardcoded demo data and its Save
 * button only logged to the console, so nobody could change their name or phone
 * anywhere in the app (bead hustle-4dc.10).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserProfileAdmin, updateUserProfileAdmin } from "@/lib/db/queries/users";
import { profileUpdateSchema } from "@/lib/validations/profile-schema";
import { createLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const logger = createLogger("api/account/profile");

export async function GET(request: NextRequest) {
  const session = await auth(request);
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await getUserProfileAdmin(session.user.id);
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    profile: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth(request);
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Check the form fields." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateUserProfileAdmin(session.user.id, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone ?? "",
    });
    return NextResponse.json({
      profile: {
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        phone: updated.phone ?? "",
        email: updated.email,
        emailVerified: Boolean(updated.emailVerified),
      },
    });
  } catch (error) {
    logger.error("Profile update failed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "UPDATE_FAILED", message: "Could not save your profile." }, { status: 500 });
  }
}
