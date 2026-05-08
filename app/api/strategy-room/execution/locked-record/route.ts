import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { noStoreJson, requireMethod, requireJsonContent, parseJsonBody } from "@/lib/server/security/app-route-guards";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { persistStrategyExecutionRecord } from "@/lib/strategy-room/execution-record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recordSchema = z.object({
  record: z.object({
    sessionId: z.string().trim().max(128).optional().nullable(),
    email: z.string().trim().email().max(320).optional().nullable(),
    decision: z.string().min(1),
    authority: z.string().min(1),
    conflictResolution: z.string().optional().default(""),
    consequence: z.string().optional().default(""),
    firstAction: z.string().min(1),
    completedAt: z.string().optional(),
  }),
});

/**
 * POST /api/strategy-room/execution/locked-record
 *
 * Persists the locked decision record from ExecutionFlow.
 * This is the output of the psychological forcing engine —
 * the user's committed decision, authority, consequence, and first action.
 */
export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const parsed = await parseJsonBody(req, recordSchema);
  if (!parsed.ok) return parsed.response;

  const { record } = parsed.data;

  try {
    const sessionCookie = req.cookies.get("aol_strategy_session")?.value;
    const email = req.cookies.get("aol_exec_checkout_email")?.value ??
      req.headers.get("x-user-email") ?? null;
    const sessionId = record.sessionId ?? sessionCookie ?? `qual_${Date.now()}`;
    await persistStrategyExecutionRecord({
      sessionId,
      decision: record.decision,
      authority: record.authority,
      conflictResolved: record.conflictResolution,
      firstAction: record.firstAction,
      timeline: record.consequence || null,
      owner: record.authority || null,
      createdAt: record.completedAt || new Date().toISOString(),
      evidenceSource: "execution_flow_legacy",
      email: (record.email ?? email)?.toLowerCase() ?? null,
    });

    await writeSecurityAudit({
      action: "locked_decision_record_created",
      status: "SUCCESS",
      category: "strategy_room",
      resourceId: "execution_flow",
      actorEmail: email,
      metadata: {
        decisionLength: record.decision.length,
        hasAuthority: Boolean(record.authority),
        hasFirstAction: Boolean(record.firstAction),
      },
    });

    return noStoreJson({ ok: true });
  } catch (err) {
    console.error("[locked-record]", err);
    return noStoreJson({ ok: false, error: "Failed to persist record" }, { status: 500 });
  }
}
