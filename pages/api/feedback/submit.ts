/**
 * pages/api/feedback/submit.ts
 *
 * POST /api/feedback/submit
 *
 * Accepts lightweight feedback (thumbs up/down + optional comment) from
 * major result and case surfaces. No auth required.
 *
 * Stored in SystemAuditLog with category=feedback for operator review.
 * Free-text comment is stored only if provided; never required.
 * No user email, session ID, or case ID is stored without explicit inclusion.
 *
 * Rate-limited: 10 submissions per hour per IP.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, getClientIp } from "@/lib/server/apply-rate-limit";

const schema = z.object({
  surface: z.string().trim().min(1).max(80),
  subjectId: z.string().trim().max(200).optional().nullable(),
  rating: z.enum(["positive", "negative"]),
  comment: z.string().trim().max(500).optional().nullable(),
}).strict();

type OkResponse = { ok: true };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | ErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIp(req);

  const ok = await applyRateLimit(req, res, {
    scope: "OUTCOME_CONTRIBUTION",
    identifier: ip,
    limit: 10,
    windowSeconds: 3600,
  });
  if (!ok) return;

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { surface, subjectId, rating, comment } = parsed.data;

  try {
    await prisma.systemAuditLog.create({
      data: {
        action: "FEEDBACK_SUBMITTED",
        category: "user",
        severity: "info",
        status: "success",
        resourceType: "FEEDBACK",
        resourceId: surface,
        metadata: JSON.stringify({
          surface,
          subjectId: subjectId ?? null,
          rating,
          comment: comment ?? null,
        }),
      },
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[feedback/submit]", err);
    return res.status(500).json({ error: "Feedback could not be recorded" });
  }
}

export const config = {
  api: { bodyParser: true },
};
