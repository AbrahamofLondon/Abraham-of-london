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
import { computeCostOfInaction } from "@/lib/server/decision/cost-of-inaction.server";
import { assessExecutionFailure } from "@/lib/server/decision/execution-failure.server";
import { computeAuthorityIndex } from "@/lib/server/decision/authority-index.server";
import { applyPublicTone, buildPublicPatternEvidence } from "@/lib/server/decision/public-pattern-proof.server";
import { createDecisionMemory, listDecisionMemoryByUser, summariseDecisionMemoryTrend } from "@/lib/server/decision-memory/memory-service.server";
import { quickHash } from "@/lib/server/security/ip-abuse-watchdog.server";
import { runShield, degradeResult } from "@/lib/server/security/adaptive-response.server";

const requestSchema = z.object({
  answers: z.record(z.string()),
  committed: z.boolean(),
  elapsedMs: z.number().positive().max(30 * 60 * 1000).optional(),
}).strict();

function getIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "0.0.0.0";
}

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

  const { answers, committed, elapsedMs } = parsed.data;

  if (!answers.decision || answers.decision.trim().length < 10) {
    return res.status(400).json({ ok: false, error: "Decision text too short" });
  }

  // ── ANTI-RECONNAISSANCE SHIELD ──────────────────────────────────────────
  let shieldVerdict;
  try {
    shieldVerdict = await runShield({
      ipAddress: getIp(req),
      sessionId: req.headers["x-session-id"] as string | undefined,
      route: "/api/diagnostics/score",
      method: "POST",
      referer: req.headers.referer ?? undefined,
      userAgent: req.headers["user-agent"] ?? undefined,
      body: req.body as Record<string, unknown>,
      query: (req.query ?? {}) as Record<string, unknown>,
      inputHash: quickHash(answers.decision ?? ""),
      answerSetHash: quickHash(Object.values(answers).join("|")),
      elapsedMs,
    });
  } catch {
    shieldVerdict = { allowed: true, action: "allow" as const, delayMs: 0, degradeResponse: false, internalSummary: "Shield unavailable" };
  }

  if (!shieldVerdict.allowed) {
    return res.status(429).json({ ok: false, error: shieldVerdict.publicMessage ?? "Please try again later." });
  }

  if (shieldVerdict.delayMs > 0) {
    await new Promise((r) => setTimeout(r, shieldVerdict.delayMs));
  }

  try {
    // 1. Build case object
    const priorAttempt = answers.urgency ? `Urgency: ${answers.urgency}` : undefined;
    const costOfDelay = answers.consequence
      ? `${answers.consequence}${answers.urgency ? ` (Urgency: ${answers.urgency})` : ""}`
      : undefined;
    const forcedAction = committed
      ? "Prepared to act on the identified root constraint within 48 hours."
      : undefined;
    const caseObj = createCaseObject({
      id: `fast_${Date.now()}`,
      decision: answers.decision ?? "",
      priorAttempt,
      costOfDelay,
      claimedOwner: answers.claimedOwner,
      blocker: answers.blocker,
      forcedAction,
    });

    // 2. Check for contradiction (pre-synthesis)
    const contradiction = (answers.blocker && forcedAction)
      ? inferContradiction(createCaseObject({
          id: "pre_check",
          decision: answers.decision ?? "",
          blocker: answers.blocker,
          forcedAction,
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

    // 9. ELEVATION LAYER — public-safe consequence outputs
    const stateMap: Record<string, "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED"> = {
      authority: "MISALIGNED",
      definition: "DRIFTING",
      execution: "DRIFTING",
      instability: "DISORDERED",
    };
    const publicState = stateMap[condition] ?? "DRIFTING";
    const publicConditions = synth ? [condition, synth.verdict.slice(0, 50)] : [condition];

    result.costOfInaction = computeCostOfInaction({
      state: publicState,
      estimatedExposureGBP: caseObj.costOfDelay ? parseFloat(caseObj.costOfDelay.replace(/[^0-9.]/g, "")) || null : null,
      decisionWindow: caseObj.costOfDelay ?? null,
    });

    result.executionFailure = assessExecutionFailure({
      state: publicState,
      publicConditions,
      directive: synth?.concreteMove ?? "No directive produced",
    });

    result.patternEvidence = buildPublicPatternEvidence(
      condition,
      result.costOfInaction?.exposureBand,
    );

    // Authority index + memory trend (best-effort, don't block response)
    try {
      const priorRecords = spine.email
        ? await listDecisionMemoryByUser(spine.email)
        : [];
      const trend = priorRecords.length > 0
        ? summariseDecisionMemoryTrend(priorRecords)
        : undefined;

      result.authorityIndex = computeAuthorityIndex({
        state: publicState,
        escalationRequired: publicState === "DISORDERED" || publicState === "MISALIGNED",
        repeatedConditions: trend?.repeatedConditions,
        escalationTrend: trend?.escalationTrend,
      });

      if (trend) result.memoryTrend = trend;

      // Persist this decision to memory
      await createDecisionMemory({
        userId: spine.email ?? spine.userId ?? undefined,
        sessionId: spine.id,
        source: "fast_diagnostic",
        state: publicState,
        headline: synth?.verdict?.slice(0, 120) ?? `${condition} condition detected`,
        summary: synth?.primaryContradiction?.slice(0, 250) ?? "Insufficient input for contradiction analysis",
        directive: synth?.concreteMove?.slice(0, 250) ?? "Complete the diagnostic for a specific directive",
        recommendations: synth ? [synth.concreteMove] : [],
        escalationLabel: result.costOfInaction?.exposureBand === "critical" ? "Immediate intervention" : undefined,
        escalationLevel: result.costOfInaction?.exposureBand ?? undefined,
      });
    } catch {
      // Non-fatal: elevation enrichment failed, core result is still valid
    }

    // Apply degradation if shield flagged this request
    const confidentButMisread =
      typeof answers.claimedOwner === "string" &&
      /clearly defined owner|final|i own|i decide|i am responsible/i.test(answers.claimedOwner) &&
      (condition === "authority" || condition === "definition");

    const tonedResult = applyPublicTone(result, {
      hesitationMs: elapsedMs,
      confidentButMisread,
    });

    const finalResult = shieldVerdict.degradeResponse
      ? degradeResult(tonedResult) as FastDiagnosticResult
      : tonedResult;

    return res.status(200).json(finalResult);
  } catch (error) {
    console.error("[FAST_DIAGNOSTIC_SCORE_ERROR]", error);
    return res.status(500).json({ ok: false, error: "Scoring failed" });
  }
}
