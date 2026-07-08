import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { listPilotQueue, transitionPilotState, type PilotLifecycleState } from "@/lib/engagements/pilot-intake-store";
import { recordFunnelEvent } from "@/lib/demo/funnel-event-store";

const STATES: PilotLifecycleState[] = ["SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "RESUBMITTED", "HUMAN_REVIEW", "POTENTIALLY_SUITABLE", "ACCEPTED", "DECLINED", "SCOPING", "COMMERCIAL_CONTINUATION"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    const status = typeof req.query.status === "string" && STATES.includes(req.query.status as PilotLifecycleState) ? req.query.status as PilotLifecycleState : undefined;
    return res.status(200).json({ items: listPilotQueue({ status }) });
  }

  if (req.method === "PATCH") {
    const reference = typeof req.body?.reference === "string" ? req.body.reference : "";
    const nextState = req.body?.nextState as PilotLifecycleState;
    if (!reference || !STATES.includes(nextState)) return res.status(400).json({ error: "valid reference and nextState required" });
    try {
      const record = transitionPilotState(reference, nextState, { email: admin.email, humanAuthority: true }, {
        requestedInformation: typeof req.body?.requestedInformation === "string" ? req.body.requestedInformation : null,
        finalDecision: typeof req.body?.finalDecision === "string" ? req.body.finalDecision : null,
        operatorNote: typeof req.body?.operatorNote === "string" ? req.body.operatorNote : null,
      });
      if (!record) return res.status(404).json({ error: "not found" });
      if (nextState === "ACCEPTED" || nextState === "DECLINED") {
        try { recordFunnelEvent({ eventType: nextState === "ACCEPTED" ? "PILOT_ACCEPTED" : "PILOT_DECLINED", sessionId: `operator_${reference}`, sourceRoute: "/admin/operator-pilot", productCode: "operator_pilot" }); } catch {}
      }
      if (nextState === "COMMERCIAL_CONTINUATION") {
        try { recordFunnelEvent({ eventType: "COMMERCIAL_CONTINUATION_COMPLETED", sessionId: `operator_${reference}`, sourceRoute: "/admin/operator-pilot", productCode: "operator_pilot" }); } catch {}
      }
      return res.status(200).json({ item: record });
    } catch (err) {
      return res.status(409).json({ error: err instanceof Error ? err.message : "transition rejected" });
    }
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Method not allowed" });
}
