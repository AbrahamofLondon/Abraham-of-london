import type { NextApiRequest, NextApiResponse } from "next";
import { getPilotIntakeByStatusSecret, toCustomerStatus } from "@/lib/engagements/pilot-intake-store.composed";
import { createPilotStatusSessionValue, serializePilotStatusCookie } from "@/lib/engagements/pilot-status-security";
import { consumeRateLimit, buildRateLimitKey, hashIpForRateLimit } from "@/lib/server/security/rate-limit-provider";
import { parsePilotStatusSessionRequest, type PilotStatusSessionResponse } from "@/lib/engagements/operator-pilot-api-contract";

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  const ct = req.headers["content-type"] ?? "";
  if (!ct.includes("application/json")) return res.status(415).json({ error: "content-type must be application/json" });
  const parsed = parsePilotStatusSessionRequest(req.body);
  const secret = parsed?.secret ?? "";
  const ip = clientIp(req);
  const rate = await consumeRateLimit({ key: buildRateLimitKey("pilot-status-session", hashIpForRateLimit(ip)), limit: 12, windowMs: 15 * 60_000, failClosed: true });
  res.setHeader("X-RateLimit-Limit", String(rate.limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, rate.remaining)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(rate.resetAt / 1000)));
  if (!rate.allowed) { res.setHeader("Retry-After", Math.ceil(rate.retryAfterMs / 1000).toString()); return res.status(429).json({ error: "Unable to validate status access." }); }
  const record = await getPilotIntakeByStatusSecret(secret, { ip });
  if (!record) return res.status(404).json({ error: "Unable to validate status access." });
  res.setHeader("Set-Cookie", serializePilotStatusCookie(createPilotStatusSessionValue(record.reference)));
  const response: PilotStatusSessionResponse = { ok: true, status: toCustomerStatus(record) };
  return res.status(200).json(response);
}