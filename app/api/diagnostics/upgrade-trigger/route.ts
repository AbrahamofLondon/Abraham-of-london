// app/api/diagnostics/upgrade-trigger/route.ts
//
// POST — record an ER upgrade trigger from a high-signal Fast Diagnostic result.
//
// Called client-side when the Fast Diagnostic result page renders with
// signalStrength "high" or "moderate" and the user provides their email
// (e.g. via the ERUpgradePanel checkout flow).
//
// Governance rules:
//  - Does NOT mutate any case record
//  - Does NOT create customer-facing artefacts
//  - Only sends the trigger email if the email address is valid and the
//    signalStrength qualifies (moderate or high)
//  - Rate-limited: one trigger per email per 6 hours (in-process bucket)
//  - No AI calls

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendUpgradeTriggerEmail } from "@/lib/diagnostics/upgrade-trigger-email";

// ─── Rate limiting ────────────────────────────────────────────────────────────

const WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours per email
const triggerBuckets = new Map<string, number>(); // email → lastTriggeredAt

function canTrigger(email: string): boolean {
  const now = Date.now();
  const last = triggerBuckets.get(email.toLowerCase());
  if (last && now - last < WINDOW_MS) return false;
  triggerBuckets.set(email.toLowerCase(), now);
  // Probabilistic eviction of expired buckets (1% chance per request)
  if (Math.random() < 0.01) {
    for (const [key, ts] of triggerBuckets) {
      if (now - ts > WINDOW_MS) triggerBuckets.delete(key);
    }
  }
  return true;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const triggerSchema = z.object({
  email: z.string().trim().email().max(320),
  condition: z.string().trim().min(1).max(120),
  conditionLabel: z.string().trim().min(1).max(160),
  signalStrength: z.enum(["moderate", "high"]),
  nextGovernanceMove: z.string().trim().max(300).nullable().optional(),
  exposureBand: z.string().trim().max(80).nullable().optional(),
  caseRef: z.string().trim().max(80).nullable().optional(),
});

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = triggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { email, condition, conditionLabel, signalStrength, nextGovernanceMove, exposureBand, caseRef } = parsed.data;

  // Rate gate — do not re-trigger within the same window
  if (!canTrigger(email)) {
    return NextResponse.json(
      { ok: true, triggered: false, reason: "already_triggered_in_window" },
      { status: 200 },
    );
  }

  const emailResult = await sendUpgradeTriggerEmail({
    to: email,
    condition,
    conditionLabel,
    signalStrength,
    nextGovernanceMove: nextGovernanceMove ?? null,
    exposureBand: exposureBand ?? null,
    caseRef: caseRef ?? null,
  });

  return NextResponse.json({
    ok: true,
    triggered: true,
    email: {
      sent: emailResult.ok,
      emailId: emailResult.emailId ?? null,
      error: emailResult.error ?? null,
    },
  });
}
