import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unsubscribeUser } from "@/lib/server/privacy/identity-service.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(320),
});

/**
 * POST /api/user/unsubscribe
 *
 * Unsubscribes user from all system communications.
 * The Decision State Orchestrator checks this before sending.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await unsubscribeUser(parsed.data.email);
    return NextResponse.json({
      ok: true,
      unsubscribed: result,
      message: result ? "You have been unsubscribed." : "No record found for this email.",
    });
  } catch (error) {
    console.error("[UNSUBSCRIBE_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Unsubscribe failed" }, { status: 500 });
  }
}
