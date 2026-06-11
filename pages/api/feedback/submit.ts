/**
 * pages/api/feedback/submit.ts
 *
 * POST /api/feedback/submit
 *
 * Accepts lightweight feedback (thumbs up/down + optional comment) from
 * major result and case surfaces. No auth required.
 *
 * Stored as FeedbackEvent and mirrored to SystemAuditLog with category=feedback
 * for operator review.
 * Free-text comment is stored only if provided; never required.
 * Privacy warning: Do not include confidential, legal, personal, or
 * client-identifying information in feedback comments.
 * Feedback comments never feed public benchmarks or aggregates.
 * No user email, session ID, or case ID is stored without explicit inclusion.
 *
 * Rate-limited: 10 submissions per hour per IP.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { applyRateLimit, getClientIp } from "@/lib/server/apply-rate-limit";
import { submitFeedback } from "@/lib/feedback/feedback-service";
import type { FeedbackPublicResponse } from "@/lib/feedback/feedback-types";

type ErrorResponse = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackPublicResponse | ErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const ip = getClientIp(req);

  const ok = await applyRateLimit(req, res, {
    scope: "OUTCOME_CONTRIBUTION",
    identifier: ip,
    limit: 10,
    windowSeconds: 3600,
  });
  if (!ok) return;

  try {
    const response = await submitFeedback(req.body, req);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(response);
  } catch (err) {
    console.error("[feedback/submit]", err);
    const message = err instanceof Error && err.name === "ZodError"
      ? "Invalid request"
      : "Feedback could not be recorded";
    return res.status(message === "Invalid request" ? 400 : 500).json({
      ok: false,
      error: message,
    });
  }
}

export const config = {
  api: { bodyParser: true },
};
