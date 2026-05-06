/**
 * POST /api/diagnostics/capture
 *
 * Privacy-safe email capture at result screens.
 * Uses the identity service to:
 * - Encrypt email at rest
 * - Store decision data separately from identity
 * - Link through SessionLink (never direct)
 *
 * Rate limited: max 5 captures per IP per 15 minutes.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { captureEmailForSession } from "@/lib/server/privacy/identity-service.server";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { createHash } from "crypto";

const schema = z.object({
  email: z.string().trim().email().max(320),
  source: z.string().trim().max(80),
  resultRef: z.string().trim().max(160).nullable().optional(),
}).strict();

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "0.0.0.0";
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const contentType = String(req.headers["content-type"] || "");
  if (!/application\/json/i.test(contentType)) {
    return res.status(415).json({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request" });
  }

  try {
    const ip = getIp(req);
    const rateLimit = await consumePersistentRateLimit({
      key: [
        "diagnostics-capture",
        `ip:${ip}`,
        parsed.data.resultRef ? `sid:${sha256Hex(parsed.data.resultRef).slice(0, 24)}` : null,
        `email:${sha256Hex(parsed.data.email.trim().toLowerCase()).slice(0, 24)}`,
      ].filter(Boolean).join(":"),
      limit: MAX_PER_WINDOW,
      windowMs: WINDOW_MS,
      failClosed: true,
    });

    if (!rateLimit.allowed) {
      await writeSecurityAudit({
        action: "rate_limit_block",
        severity: "warn",
        status: "BLOCKED",
        ip,
        resourceId: "/api/diagnostics/capture",
      });
      return res.status(429).json({ ok: false, error: "Too many requests" });
    }

    const sessionId = parsed.data.resultRef ?? `${parsed.data.source}_${Date.now().toString(36)}`;

    await captureEmailForSession({
      email: parsed.data.email,
      sessionId,
      source: parsed.data.source,
    });

    await writeSecurityAudit({
      action: "email_capture",
      severity: "info",
      status: "SUCCESS",
      ip,
      resourceId: "/api/diagnostics/capture",
      metadata: {
        source: parsed.data.source,
        resultRefPresent: Boolean(parsed.data.resultRef),
      },
    });

    // Never confirm whether the email existed — privacy
    return res.status(200).json({ ok: true, saved: true });
  } catch (error) {
    console.error("[CAPTURE_ERROR]", error);
    return res.status(500).json({ ok: false, error: "Capture failed" });
  }
}
