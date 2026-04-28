/**
 * POST /api/diagnostics/score
 *
 * Server-side scoring for fast diagnostic.
 * Accepts raw answers, runs ALL scoring logic server-side,
 * returns sanitized public DTO only.
 *
 * No thresholds, weights, classification rules, or internal
 * scoring data ever reaches the client.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createCaseObject, classifyCondition, inferContradiction } from "@/lib/decision/case-object";
import { scoreC3 } from "@/lib/decision/c3-fidelity-scorer";
import { synthesise, buildDeterministicOutput } from "@/lib/decision/synthesis-engine";
import { forecastDefaultPath, controlShiftSummary } from "@/lib/decision/default-path-forecast";
import { createSpine } from "@/lib/decision/intelligence-spine";
import { persistSpineToJourney } from "@/lib/decision/spine-persistence";
import { prisma } from "@/lib/prisma";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";

const requestSchema = z.object({
  answers: z.record(z.string()),
  committed: z.boolean(),
}).strict();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FastDiagnosticResult | { ok: false; error: string }>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
  }

  const { answers, committed } = parsed.data;

  if (!answers.decision || answers.decision.trim().length < 10) {
    return res.status(400).json({ ok: false, error: "Decision text too short" });
  }

  try {
    // 1. Build case object
    const caseObj = createCaseObject({
      id: `fast_${Date.now()}`,
      decision: answers.decision ?? "",
      priorAttempt: answers.priorAttempt,
      costOfDelay: answers.costOfDelay,
      claimedOwner: answers.claimedOwner,
      blocker: answers.blocker,
      forcedAction: answers.forcedAction,
    });

    // 2. Check for contradiction (pre-synthesis)
    const contradiction = (answers.blocker && answers.forcedAction)
      ? inferContradiction(createCaseObject({
          id: "pre_check",
          decision: answers.decision ?? "",
          blocker: answers.blocker,
          forcedAction: answers.forcedAction,
        }))
      : null;

    // 3. Score
    const c3 = scoreC3(caseObj);
    const deterministic = buildDeterministicOutput(caseObj);
    const forecast = forecastDefaultPath(caseObj);
    const condition = classifyCondition(caseObj);

    // 4. Synthesise (server-side LLM + arbiter)
    let synthesisResult;
    try {
      // Try interpret API first for LLM synthesis
      synthesisResult = await synthesise(caseObj);
    } catch {
      synthesisResult = await synthesise(caseObj);
    }

    // 5. Build spine (server-side only — never sent to client)
    const spine = createSpine({
      caseObj,
      c3: { ...c3, tier: c3.tier, confidenceBand: c3.confidenceBand },
      deterministic,
      synthesis: synthesisResult.synthesis,
      forecast,
    });
    spine.preCommitment = { willing48h: committed, capturedAt: new Date().toISOString() };

    // 6. Persist spine to DB
    try {
      await persistSpineToJourney(spine, prisma as unknown as Parameters<typeof persistSpineToJourney>[1]);
    } catch {
      // Best-effort DB persistence
    }

    // 7. Condition labels (public-safe)
    const conditionLabels: Record<string, string> = {
      authority: "an authority problem — who decides is unclear",
      definition: "a definition problem — what is being decided is unclear",
      execution: "an execution problem — the decision is known but avoided",
      instability: "an instability condition — untested under real pressure",
    };

    // 8. Build sanitized public DTO
    const synth = synthesisResult.synthesis;
    const isRecovery = synthesisResult.source === "recovery";

    const result: FastDiagnosticResult = {
      caseRef: spine.id,
      condition,
      conditionLabel: conditionLabels[condition] ?? "a decision condition",
      signalStrength: c3.specificityScore >= 0.7 ? "high" : c3.specificityScore >= 0.5 ? "moderate" : "low",
      fullAnalysis: !isRecovery,
      recoveryQuestion: isRecovery ? (synthesisResult.recoveryQuestion ?? null) : null,
      synthesis: synth ? {
        verdict: synth.verdict,
        primaryContradiction: synth.primaryContradiction,
        avoidedDecision: synth.avoidedDecision,
        whyPriorAttemptsFailed: synth.whyPriorAttemptsFailed,
        concreteMove: committed ? synth.concreteMove : "Commit to act within 48 hours to unlock the system's prescribed move.",
        defaultPathForecast: synth.defaultPathForecast,
        certaintyBoundary: synth.certaintyBoundary,
        quotedUserLanguage: synth.quotedUserLanguage,
      } : null,
      forecast: forecast ? {
        alreadyIncurred: forecast.alreadyIncurred,
        sevenDays: forecast.sevenDays,
        thirtyDays: forecast.thirtyDays,
        ninetyDays: forecast.ninetyDays,
        optionCompression: forecast.optionCompression,
        consequenceShift: forecast.consequenceShift,
        controlShiftSummary: controlShiftSummary(forecast),
      } : null,
      contradictionText: contradiction,
      arbiterMessage: synthesisResult.arbiterMismatchMessage ?? null,
      stateToken: spine.id,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("[FAST_DIAGNOSTIC_SCORE_ERROR]", error);
    return res.status(500).json({ ok: false, error: "Scoring failed" });
  }
}
