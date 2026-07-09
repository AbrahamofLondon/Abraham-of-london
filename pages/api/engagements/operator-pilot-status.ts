import type { NextApiRequest, NextApiResponse } from "next";
import { getPilotIntakeByRef, toCustomerStatus } from "@/lib/engagements/pilot-intake-store.composed";
import { PILOT_STATUS_COOKIE, readCookie, verifyPilotStatusSessionValue, clearPilotStatusCookie } from "@/lib/engagements/pilot-status-security";
import { recordFunnelEvent } from "@/lib/demo/funnel-event-store.composed";
import type { PilotStatusSessionResponse } from "@/lib/engagements/operator-pilot-api-contract";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Method not allowed" }); }
  const cookie = readCookie(req.headers.cookie, PILOT_STATUS_COOKIE);
  const verified = cookie ? verifyPilotStatusSessionValue(cookie) : null;
  if (!verified) { res.setHeader("Set-Cookie", clearPilotStatusCookie()); return res.status(401).json({ error: "Status session required" }); }
  const record = await getPilotIntakeByRef(verified.reference);
  if (!record) { res.setHeader("Set-Cookie", clearPilotStatusCookie()); return res.status(404).json({ error: "Status unavailable" }); }
  try { await recordFunnelEvent({ eventType: "PILOT_STATUS_VIEWED", sessionId: `pilot_status_${record.reference}`, sourceRoute: "/engagements/operator-pilot-status" }); } catch {}
  const response: PilotStatusSessionResponse = { ok: true, status: toCustomerStatus(record) };
  return res.status(200).json(response);
}