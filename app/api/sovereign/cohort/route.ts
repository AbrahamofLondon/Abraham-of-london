export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { matchCohort, type CohortInput } from "@/lib/sovereign/cohort-intelligence";

function str<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

/**
 * POST /api/sovereign/cohort
 *
 * Assigns a client to their closest matching peer cohort and returns
 * cohort intelligence: what happened to organisations like them.
 *
 * Clients never see other organisations' data — they see what happened
 * to organisations that share their structural characteristics.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const input: CohortInput = {
      revenueBand: str(body.revenueBand, ["SEED", "SMB", "MID", "ENTERPRISE"], "SMB"),
      teamSizeBand: str(body.teamSizeBand, ["SOLO", "SMALL", "MID", "LARGE"], "SMALL"),
      founderLed: typeof body.founderLed === "boolean" ? body.founderLed : undefined,
      orgState: str(body.orgState, ["STABLE", "SCALING", "STRESS", "CRISIS"], "STABLE"),
      industry: typeof body.industry === "string" ? body.industry : undefined,
      sessionCount: typeof body.sessionCount === "number" ? body.sessionCount : undefined,
      posture: typeof body.posture === "string" ? body.posture : undefined,
      trajectory: typeof body.trajectory === "string" ? body.trajectory : undefined,
    };

    const result = matchCohort(input);

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to match cohort" },
      { status: 500 },
    );
  }
}
