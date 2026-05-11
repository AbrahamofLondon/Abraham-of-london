export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  generateForensicAccount,
  formatForensicNarrative,
  type DecisionContext,
} from "@/lib/sovereign/decision-forensics";
import { requireSovereignApiAccess } from "@/lib/sovereign/require-sovereign-api-access";

const DECISION_TYPES = [
  "ESCALATE", "DELAY", "RESTRUCTURE", "DELEGATE",
  "HOLD", "ACCELERATE", "EXTERNAL_HIRE", "DIVEST", "PIVOT",
] as const;

function str<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

/**
 * POST /api/sovereign/forensics
 *
 * Accepts a decision context and returns a forensic account — what happened
 * to organisations that faced this decision in comparable circumstances.
 * This is the replacement for template-string simulation.
 */
export async function POST(req: NextRequest) {
  const denied = await requireSovereignApiAccess(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({}));

    const ctx: DecisionContext = {
      type: DECISION_TYPES.includes(body.type) ? body.type : body.type ?? "HOLD",
      blockerType: body.blockerType ?? undefined,
      authorityClarity: str(body.authorityClarity, ["CLEAR", "CONTESTED", "ABSENT"] as const, "CONTESTED"),
      readinessScore: typeof body.readinessScore === "number" ? body.readinessScore : undefined,
      trajectoryDirection: str(body.trajectoryDirection, ["IMPROVING", "STABLE", "DETERIORATING"] as const, "STABLE"),
      priorAttempts: typeof body.priorAttempts === "number" ? body.priorAttempts : undefined,
      revenueBand: str(body.revenueBand, ["SEED", "SMB", "MID", "ENTERPRISE"] as const, "SMB"),
      orgState: str(body.orgState, ["STABLE", "SCALING", "STRESS", "CRISIS"] as const, "STABLE"),
      founderLed: typeof body.founderLed === "boolean" ? body.founderLed : undefined,
    };

    const account = generateForensicAccount(ctx);
    const narrative = formatForensicNarrative(account);

    return NextResponse.json({ ok: true, account, narrative });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to generate forensic account" },
      { status: 500 },
    );
  }
}
