/**
 * GET /api/account/export — download everything the account holds, as JSON.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAccountExport } from "@/lib/account/export-account";
import { consumeRateLimit, rateLimitResponseInit, RATE_LIMITS } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const logger = createLogger("api/account/export");

export async function GET(request: NextRequest) {
  const session = await auth(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const limit = consumeRateLimit(RATE_LIMITS.accountExportByUser, userId);
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }

  try {
    const data = await buildAccountExport(userId);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="hustle-export-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("Account export failed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "EXPORT_FAILED" }, { status: 500 });
  }
}
