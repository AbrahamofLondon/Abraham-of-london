import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserData } from "@/lib/server/privacy/identity-service.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(320),
});

/**
 * POST /api/user/delete
 *
 * Right to be forgotten. Deletes:
 * - UserIdentity (soft-deleted, hash retained for unsubscribe enforcement)
 * - All SessionLinks for this user
 * - All associated DecisionSessions
 *
 * No authentication required — email is the identity proof.
 * Rate limited by existing infrastructure.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await deleteUserData(parsed.data.email);

    if (!result.deleted) {
      return NextResponse.json({
        ok: true,
        message: "No data found for this email.",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "All data has been deleted.",
      sessionsRemoved: result.sessionsRemoved,
    });
  } catch (error) {
    console.error("[USER_DELETE_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Deletion failed" }, { status: 500 });
  }
}
