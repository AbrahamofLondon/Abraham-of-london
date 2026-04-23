import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  createRetainedDecision,
  type RetainedDecisionPriority,
} from "@/lib/retainers/retainer-service";

const VALID_PRIORITIES = new Set<RetainedDecisionPriority>(["HIGH", "MEDIUM", "LOW"]);

export async function POST(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const contractId = typeof body?.contractId === "string" ? body.contractId.trim() : "";
    const decisionObjectId = typeof body?.decisionObjectId === "string" ? body.decisionObjectId.trim() : "";
    const priorityLevel = typeof body?.priorityLevel === "string" && VALID_PRIORITIES.has(body.priorityLevel)
      ? body.priorityLevel as RetainedDecisionPriority
      : "MEDIUM";

    if (!contractId || !decisionObjectId) {
      return NextResponse.json(
        { ok: false, error: "contractId and decisionObjectId are required" },
        { status: 400 },
      );
    }

    const retainedDecision = await createRetainedDecision({
      contractId,
      decisionObjectId,
      priorityLevel,
    });

    return NextResponse.json({ ok: true, retainedDecision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retain decision";
    const status = message === "Decision capacity exceeded" ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
