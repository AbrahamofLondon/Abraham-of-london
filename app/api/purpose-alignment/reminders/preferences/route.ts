import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreatePurposeAlignmentSessionKey } from "@/lib/alignment/session";
import { upsertReminderPreference } from "@/lib/alignment/reminders";

const schema = z.object({
  isEnabled: z.boolean(),
  email: z.string().email().optional().or(z.literal("")),
  cadenceDays: z.number().int().min(7).max(90).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = schema.parse(json);
    const sessionKey = await getOrCreatePurposeAlignmentSessionKey();

    const pref = await upsertReminderPreference({
      sessionKey,
      isEnabled: parsed.isEnabled,
      email: parsed.email || null,
      cadenceDays: parsed.cadenceDays,
    });

    return NextResponse.json({ ok: true, preference: pref });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}