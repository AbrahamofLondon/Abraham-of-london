// pages/api/admin/intelligence/gmi/record-event.ts
// POST endpoint to record GMI release governance events.
// Supports: QUALITY_GATE_RUN, CALL_REVIEW, CALL_CARRY_FORWARD, LIFECYCLE_TRANSITION_PROPOSED.
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

const CALL_OUTCOME_STATUSES = [
  "CONFIRMED_STRONGLY",
  "DIRECTIONALLY_CONFIRMED",
  "PARTIALLY_CONFIRMED",
  "TOO_EARLY_TO_ASSESS",
  "WEAKLY_SUPPORTED",
  "NOT_CONFIRMED",
  "DISCONFIRMED",
  "PENDING_REVIEW",
] as const;

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("QUALITY_GATE_RUN"),
    reportId: z.string().min(1).max(64),
  }),
  z.object({
    action: z.literal("CALL_REVIEW"),
    reportId: z.string().min(1).max(64),
    callId: z.string().min(1).max(64),
    outcomeStatus: z.enum(CALL_OUTCOME_STATUSES),
    score: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.null()]),
  }),
  z.object({
    action: z.literal("CALL_CARRY_FORWARD"),
    reportId: z.string().min(1).max(64),
    callId: z.string().min(1).max(64),
    nextReviewWindow: z.string().min(1).max(32),
  }),
  z.object({
    action: z.literal("LIFECYCLE_TRANSITION_PROPOSED"),
    reportId: z.string().min(1).max(64),
    fromState: z.string().min(1).max(64),
    toState: z.string().min(1).max(64),
  }),
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-intelligence-gmi-record-event",
  });
  if (!session) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_REQUEST", issues: parsed.error.issues });
  }

  const body = parsed.data;
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { action } = body;

    if (action === "QUALITY_GATE_RUN") {
      const { runGmiQualityGateAndRecord } = await import("@/lib/intelligence/gmi-publication-service");
      const result = await runGmiQualityGateAndRecord(body.reportId, "ADMIN", requestId);
      return res.status(200).json({
        ok: result.ok,
        releaseReady: result.releaseReady,
        blockers: result.blockers,
        overallScore: result.overallScore,
        ...(!result.ok && { warning: result.warning }),
      });
    }

    if (action === "CALL_REVIEW") {
      const { recordGmiCallReview } = await import("@/lib/intelligence/gmi-publication-service");
      const result = await recordGmiCallReview({
        reportId: body.reportId,
        callId: body.callId,
        outcomeStatus: body.outcomeStatus,
        score: body.score,
        actor: "ADMIN",
        requestId,
      });
      return res.status(result.ok ? 200 : 422).json({
        ok: result.ok,
        ...(!result.ok && { warning: result.warning }),
      });
    }

    if (action === "CALL_CARRY_FORWARD") {
      const { recordGmiCallCarryForward } = await import("@/lib/intelligence/gmi-publication-service");
      const result = await recordGmiCallCarryForward({
        reportId: body.reportId,
        callId: body.callId,
        nextReviewWindow: body.nextReviewWindow,
        actor: "ADMIN",
        requestId,
      });
      return res.status(result.ok ? 200 : 422).json({
        ok: result.ok,
        ...(!result.ok && { warning: result.warning }),
      });
    }

    if (action === "LIFECYCLE_TRANSITION_PROPOSED") {
      const { proposeGmiLifecycleTransition } = await import("@/lib/intelligence/gmi-publication-service");
      const result = await proposeGmiLifecycleTransition(
        body.reportId,
        body.fromState,
        body.toState,
        "ADMIN",
        requestId,
      );
      return res.status(result.ok ? 200 : 422).json({
        ok: result.ok,
        ...(!result.ok && { warning: result.warning }),
      });
    }

    return res.status(400).json({ error: "UNKNOWN_ACTION" });
  } catch {
    return res.status(500).json({ error: "Internal error recording GMI event." });
  }
}
