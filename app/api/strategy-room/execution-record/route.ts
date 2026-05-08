import { NextRequest } from "next/server";
import { z } from "zod";
import {
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
} from "@/lib/server/security/app-route-guards";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { persistStrategyExecutionRecord } from "@/lib/strategy-room/execution-record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const executionRecordSchema = z.object({
  sessionId: z.string().trim().min(1).max(128),
  decision: z.string().trim().min(1).max(4000),
  authority: z.string().trim().min(1).max(1200),
  conflictResolved: z.string().trim().max(4000).optional().nullable(),
  firstAction: z.string().trim().min(1).max(4000),
  timeline: z.string().trim().max(1200).optional().nullable(),
  owner: z.string().trim().max(320).optional().nullable(),
  createdAt: z.string().trim().max(80).optional().nullable(),
  evidenceSource: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(320).optional().nullable(),
}).strict();

export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const parsed = await parseJsonBody(req, executionRecordSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const record = await persistStrategyExecutionRecord({
      ...parsed.data,
      email: parsed.data.email?.toLowerCase() ?? null,
    });

    await writeSecurityAudit({
      action: "strategy_execution_record_created",
      status: "SUCCESS",
      category: "strategy_room",
      resourceId: record.sessionId,
      actorEmail: record.email,
      metadata: {
        evidenceSource: record.evidenceSource,
        hasAuthority: Boolean(record.authority),
        hasFirstAction: Boolean(record.firstAction),
      },
    });

    return noStoreJson({ ok: true, record });
  } catch (error) {
    console.error("[strategy-room/execution-record]", error);
    return noStoreJson({ ok: false, error: "Failed to persist execution record" }, { status: 500 });
  }
}
