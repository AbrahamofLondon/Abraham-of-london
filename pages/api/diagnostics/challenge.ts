/**
 * Challenge API Route — real-time decision quality interrogation.
 *
 * Input: { assessmentType, stage, answers }
 * Output: ChallengeResult
 *
 * Rules:
 * - No scores, thresholds, internal rules, signal names, or engine modes exposed
 * - Calls shield before generating challenge
 * - Degrades challenge specificity when shield flags abuse
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import {
  evaluateChallenge,
  type ChallengeResult,
} from "@/lib/server/decision/challenge-engine.server";
import {
  assessReplicationRisk,
  type ReplicationTelemetry,
} from "@/lib/security/replication-detection";

type ApiSuccess = {
  ok: true;
} & ChallengeResult;

type ApiFailure = {
  ok: false;
  error: string;
};

const requestSchema = z.object({
  assessmentType: z.enum(["fast", "purpose", "team", "enterprise", "executive"]),
  stage: z.string().trim().min(1).max(80),
  answers: z.record(z.unknown()),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess | ApiFailure>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid request body",
    });
  }

  const { assessmentType, stage, answers } = parsed.data;

  // ─── Shield check ──────────────────────────────────────────────────────────

  const telemetry: ReplicationTelemetry = {
    ip: (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    sessionKey: typeof answers["sessionKey"] === "string" ? answers["sessionKey"] : null,
  };

  const shield = assessReplicationRisk(telemetry);
  const shieldStatus = shield.responseDetail === "reduced" ? "degraded" as const : "full" as const;

  // ─── Evaluate challenge ────────────────────────────────────────────────────

  const result = evaluateChallenge(
    { assessmentType, stage, answers },
    shieldStatus,
  );

  return res.status(200).json({
    ok: true,
    ...result,
  });
}
