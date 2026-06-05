/* pages/api/inner-circle/email-trigger.ts — Phase 2: Email Follow-Up Engine */
/* Production-safe: gated behind INNER_CIRCLE_EMAILS_ENABLED feature flag. */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { sendTriggerEmail, type EmailTriggerEvent } from "@/lib/inner-circle/email-triggers";
import { areEmailsEnabled } from "@/lib/inner-circle/feature-flags";
import { consumeRateLimit, buildRateLimitKey } from "@/lib/server/security/rate-limit-provider";

type Response = { ok: true } | { ok: false; error: string };

const VALID_EVENTS: EmailTriggerEvent[] = [
  "pressure_green",
  "pressure_amber",
  "pressure_red",
  "rise_decay_low_medium",
  "rise_decay_high",
  "rise_decay_critical",
  "seven_day_no_scorecard",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  // Production safety: emails are disabled unless explicitly enabled
  if (!areEmailsEnabled()) {
    return res.status(503).json({ ok: false, error: "EMAILS_NOT_ENABLED" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;

  // Rate limit: 5 email triggers per user per hour (strict)
  if (userId) {
    const rateLimitKey = buildRateLimitKey("email-trigger", userId);
    const verdict = await consumeRateLimit({
      key: rateLimitKey,
      limit: 5,
      windowMs: 3600_000,
      failClosed: false,
    });
    if (!verdict.allowed) {
      res.setHeader("Retry-After", Math.ceil(verdict.retryAfterMs / 1000));
      return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
    }
  }

  if (!userId) {
    return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });
  }

  const { event } = req.body || {};
  if (!event || !VALID_EVENTS.includes(event)) {
    return res.status(400).json({ ok: false, error: "INVALID_EVENT" });
  }

  try {
    const profile = await prisma.$queryRaw<Array<{ email: string | null; name: string | null }>>`
      SELECT email, name FROM inner_circle_profiles WHERE user_id = ${userId} LIMIT 1
    `;

    const userProfile = profile[0];
    if (!userProfile?.email) {
      return res.status(400).json({ ok: false, error: "USER_EMAIL_MISSING" });
    }

    const result = await sendTriggerEmail({
      userId,
      email: userProfile.email,
      name: userProfile.name,
      event,
    });

    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.error || "EMAIL_SEND_FAILED" });
    }

    await prisma.$executeRaw`
      INSERT INTO inner_circle_email_event_logs (id, user_id, email, trigger_event, status, sent_at, created_at)
      VALUES (gen_random_uuid()::text, ${userId}, ${userProfile.email}, ${event}, 'sent', NOW(), NOW())
    `;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[email-trigger]", error);
    return res.status(500).json({ ok: false, error: "TRIGGER_FAILED" });
  }
}