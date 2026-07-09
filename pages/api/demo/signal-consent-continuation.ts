import type { NextApiRequest, NextApiResponse } from "next";
import {
  bindSignalCase,
  captureSignalConsent,
  establishSignalIdentity,
  getSignalContinuation,
  recordSignalInteraction,
  requestSignalContinuation,
  updateSignalTwin,
} from "@/lib/demo/signal-consent-transition-store.composed";

type Response = { ok: true; record: unknown } | { ok: false; error: string };
const s = (v: unknown) => typeof v === "string" ? v : "";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  const action = s(req.body?.action);
  try {
    if (action === "request") {
      const record = await requestSignalContinuation({ recommendationId: s(req.body?.recommendationId), sessionId: s(req.body?.sessionId), mode: req.body?.mode === "EXAMPLE" ? "EXAMPLE" : "LIVE" });
      return res.status(201).json({ ok: true, record: { token: record.token, state: record.state, expiresAt: record.expiresAt } });
    }
    if (action === "identity") return res.status(200).json({ ok: true, record: await establishSignalIdentity({ token: s(req.body?.token), tenantId: s(req.body?.tenantId), subjectId: s(req.body?.subjectId) }) });
    if (action === "consent") return res.status(200).json({ ok: true, record: await captureSignalConsent({ token: s(req.body?.token), tenantId: s(req.body?.tenantId), subjectId: s(req.body?.subjectId), consent: req.body?.consent === true }) });
    if (action === "bind_case") return res.status(200).json({ ok: true, record: await bindSignalCase({ token: s(req.body?.token), tenantId: s(req.body?.tenantId), subjectId: s(req.body?.subjectId), caseId: s(req.body?.caseId) }) });
    if (action === "record_interaction") return res.status(200).json({ ok: true, record: await recordSignalInteraction({ token: s(req.body?.token), tenantId: s(req.body?.tenantId), subjectId: s(req.body?.subjectId) }) });
    if (action === "update_twin") return res.status(200).json({ ok: true, record: await updateSignalTwin({ token: s(req.body?.token), tenantId: s(req.body?.tenantId), subjectId: s(req.body?.subjectId) }) });
    if (action === "get") {
      const record = await getSignalContinuation(s(req.body?.token));
      if (!record) return res.status(404).json({ ok: false, error: "not found" });
      return res.status(200).json({ ok: true, record });
    }
    return res.status(400).json({ ok: false, error: "unknown action" });
  } catch (err) {
    return res.status(409).json({ ok: false, error: err instanceof Error ? err.message : "transition rejected" });
  }
}
