/**
 * pages/api/admin/outcome-verification.ts
 *
 * GET  — list verification records pending operator review
 * POST — record an operator review decision
 *
 * Admin-only. Requires private tier minimum.
 */

import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import {
  getPendingOperatorReviews,
  recordOperatorReview,
} from "@/lib/product/operator-outcome-review";
import type { OperatorReviewRequest } from "@/lib/product/operator-outcome-review";

type SuccessGet = {
  ok: true;
  items: Awaited<ReturnType<typeof getPendingOperatorReviews>>;
  total: number;
};

type SuccessPost = {
  ok: true;
  reviewId: string;
  outcome: string;
  memoryApproved: boolean;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessGet | SuccessPost | ErrorResponse>,
) {
  // Auth gate
  const sessionId = readAccessCookie(req);
  if (!sessionId) return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });

  const ctx = await getSessionContext(sessionId);
  if (!ctx?.ok || !ctx?.valid) {
    return res.status(401).json({ ok: false, error: "SESSION_INVALID" });
  }

  if (!tierAtLeast(String(ctx.tier || "public"), "private")) {
    return res.status(403).json({ ok: false, error: "INSUFFICIENT_CLEARANCE" });
  }

  const operatorEmail = String(ctx.email ?? "");
  if (!operatorEmail) return res.status(403).json({ ok: false, error: "OPERATOR_EMAIL_REQUIRED" });

  // ── GET: list pending reviews ────────────────────────────────────────────
  if (req.method === "GET") {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));

    const items = await getPendingOperatorReviews({ limit, offset });
    return res.status(200).json({ ok: true, items, total: items.length });
  }

  // ── POST: record operator review ─────────────────────────────────────────
  if (req.method === "POST") {
    const body = req.body as Partial<OperatorReviewRequest>;

    if (!body.diagnosticRecordId || !body.verificationId) {
      return res.status(400).json({ ok: false, error: "RECORD_ID_REQUIRED" });
    }
    if (!body.outcome) {
      return res.status(400).json({ ok: false, error: "OUTCOME_REQUIRED" });
    }
    if (!body.operatorNote || String(body.operatorNote).trim().length < 10) {
      return res.status(400).json({ ok: false, error: "OPERATOR_NOTE_REQUIRED" });
    }

    const result = await recordOperatorReview({
      diagnosticRecordId: String(body.diagnosticRecordId),
      verificationId: String(body.verificationId),
      operatorEmail,
      outcome: body.outcome,
      operatorNote: String(body.operatorNote).trim().slice(0, 2400),
      memoryApproved: Boolean(body.memoryApproved),
    });

    return res.status(200).json({
      ok: true,
      reviewId: result.reviewId,
      outcome: result.outcome,
      memoryApproved: result.memoryApproved,
    });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
