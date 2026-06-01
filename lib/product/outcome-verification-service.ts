/**
 * lib/product/outcome-verification-service.ts
 *
 * SERVER_ONLY — imports prisma directly. Never import from client components.
 */

import type { DiagnosticDecisionObject, DiagnosticJourney } from "@prisma/client";

import { prisma } from "@/lib/prisma.server";
import {
  comparePredictionToOutcome,
  CURRENT_MODEL_VERSION,
  proposeCalibrationAdjustment,
} from "@/lib/calibration/calibration-engine";
import { recordLedgerEntry } from "@/lib/decision-ledger/ledger-service";
import { createSignedActionToken, verifySignedActionToken } from "@/lib/security/signed-action-token-core";
import { recordCheckpointResponse, resolveCheckpointForResponse } from "@/lib/product/checkpoint-service";
import type {
  OutcomeVerificationContext,
  OutcomeVerificationRecord,
  OutcomeVerificationRequest,
  OutcomeVerificationResult,
} from "@/lib/product/outcome-verification-contract";
import { classifyOutcomeVerification } from "@/lib/product/outcome-verification-contract";
import { attachOutcomeReport, getRecommendationLedger } from "@/lib/product/recommendation-outcome-ledger";
import { appendDiagnosticJourneyEvent } from "@/lib/product/diagnostic-journey-store";
import type { DiagnosticJourneySurface } from "@/lib/product/diagnostic-journey-record";

const OUTCOME_TOKEN_PURPOSE = "outcome_verification";
const KERNEL_MODEL_KEY = "decision_kernel";

type ParsedTokenSubject = {
  email: string;
  checkpointId?: string | null;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
};

type DecisionContext = {
  journey: Pick<DiagnosticJourney, "id" | "journeyKey" | "email" | "userId" | "organisationKey"> | null;
  decision: Pick<DiagnosticDecisionObject, "id" | "sessionId" | "sourceStage" | "decisionText" | "normalized" | "createdAt"> | null;
};

function normalizeEmail(value?: string | null): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : null;
}

function normalizeText(value?: string | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sanitizeText(value?: string | null, max = 2400): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return cleaned || null;
}

function serializeTokenSubject(subject: ParsedTokenSubject): string {
  return JSON.stringify(subject);
}

function parseTokenSubject(subject: string): ParsedTokenSubject | null {
  try {
    const parsed = JSON.parse(subject) as ParsedTokenSubject;
    if (!normalizeEmail(parsed.email)) return null;
    return {
      email: normalizeEmail(parsed.email)!,
      checkpointId: normalizeText(parsed.checkpointId),
      caseId: normalizeText(parsed.caseId),
      journeyId: normalizeText(parsed.journeyId),
      strategyRoomSessionId: normalizeText(parsed.strategyRoomSessionId),
      executiveRunId: normalizeText(parsed.executiveRunId),
    };
  } catch {
    return null;
  }
}

function checkpointContextFromResolved(
  resolved: Awaited<ReturnType<typeof resolveCheckpointForResponse>>,
): OutcomeVerificationContext | null {
  if (!resolved) return null;
  return {
    checkpointId: resolved.record.id,
    caseId: resolved.payload.caseId ?? null,
    journeyId: resolved.payload.journeyId ?? null,
    strategyRoomSessionId: resolved.payload.strategyRoomSessionId ?? null,
    executiveRunId: resolved.payload.executiveRunId ?? null,
    checkpointTitle: resolved.payload.commandTitle ?? resolved.record.verdict ?? null,
    sourceSurface: resolved.payload.sourceSurface ?? null,
    sourceLabel: resolved.payload.sourceLabel ?? null,
    evidencePosture: resolved.payload.evidencePosture ?? null,
    dueAt: resolved.payload.dueAt ?? null,
  };
}

function extractPredictionSnapshot(normalized: unknown): Record<string, unknown> | null {
  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) return null;
  const record = normalized as Record<string, unknown>;
  const directPrediction = record.prediction;
  const verificationPrediction = (record.verification as Record<string, unknown> | undefined)?.prediction;
  const candidate = (verificationPrediction ?? directPrediction) as Record<string, unknown> | undefined;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  return candidate;
}

function mapVerificationClassificationForCalibration(
  input: Pick<OutcomeVerificationRequest, "changedState"> & { outcomeClassification: string },
): "RESOLVED" | "IMPROVED" | "UNCHANGED" | "DETERIORATED" {
  if (input.changedState === "WORSENED") return "DETERIORATED";
  if (input.outcomeClassification === "ACTION_CONFIRMED" || input.outcomeClassification === "OUTCOME_IMPROVED") {
    return "IMPROVED";
  }
  return "UNCHANGED";
}

async function resolveContext(input: {
  email: string;
  userId?: string | null;
  request: OutcomeVerificationRequest;
}): Promise<{
  context: OutcomeVerificationContext;
  decisionContext: DecisionContext;
}> {
  const resolvedCheckpoint = await resolveCheckpointForResponse({
    checkpointId: input.request.checkpointId,
    caseId: input.request.caseId,
    journeyId: input.request.journeyId,
    strategyRoomSessionId: input.request.strategyRoomSessionId,
    executiveRunId: input.request.executiveRunId,
    email: input.email,
    userId: input.userId ?? undefined,
  });

  const checkpointContext = checkpointContextFromResolved(resolvedCheckpoint) ?? {
    checkpointId: normalizeText(input.request.checkpointId),
    caseId: normalizeText(input.request.caseId),
    journeyId: normalizeText(input.request.journeyId),
    strategyRoomSessionId: normalizeText(input.request.strategyRoomSessionId),
    executiveRunId: normalizeText(input.request.executiveRunId),
    checkpointTitle: null,
    sourceSurface: null,
    sourceLabel: null,
    evidencePosture: null,
    dueAt: null,
  };

  const journey = checkpointContext.journeyId
    ? await prisma.diagnosticJourney.findFirst({
        where: { OR: [{ id: checkpointContext.journeyId }, { journeyKey: checkpointContext.journeyId }] },
        select: {
          id: true,
          journeyKey: true,
          email: true,
          userId: true,
          organisationKey: true,
        },
      })
    : await prisma.diagnosticJourney.findFirst({
        where: {
          OR: [
            { journeyKey: checkpointContext.caseId ?? undefined },
            { email: input.email },
          ],
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          journeyKey: true,
          email: true,
          userId: true,
          organisationKey: true,
        },
      });

  const decision = await prisma.diagnosticDecisionObject.findFirst({
    where: {
      OR: [
        ...(journey?.id ? [{ journeyId: journey.id }] : []),
        ...(checkpointContext.strategyRoomSessionId ? [{ sessionId: checkpointContext.strategyRoomSessionId }] : []),
        { email: input.email },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sessionId: true,
      sourceStage: true,
      decisionText: true,
      normalized: true,
      createdAt: true,
    },
  });

  return {
    context: checkpointContext,
    decisionContext: {
      journey,
      decision,
    },
  };
}

async function updateCalibration(input: {
  sessionKey: string;
  predictionSnapshot: Record<string, unknown>;
  outcomeSnapshot: Record<string, unknown>;
}): Promise<OutcomeVerificationResult["calibration"]> {
  const comparison = comparePredictionToOutcome({
    prediction: {
      classification: typeof input.predictionSnapshot.classification === "string"
        ? input.predictionSnapshot.classification
        : undefined,
      severity: typeof input.predictionSnapshot.severity === "number"
        ? input.predictionSnapshot.severity
        : undefined,
      effectiveness: typeof input.predictionSnapshot.effectiveness === "number"
        ? input.predictionSnapshot.effectiveness
        : undefined,
    },
    outcome: {
      classification: String(input.outcomeSnapshot.classification || "UNCHANGED"),
      evidence: Array.isArray(input.outcomeSnapshot.evidence)
        ? input.outcomeSnapshot.evidence as string[]
        : [],
      observedAt: String(input.outcomeSnapshot.observedAt || new Date().toISOString()),
    },
  });

  await prisma.calibrationEvent.create({
    data: {
      sessionKey: input.sessionKey,
      modelKey: KERNEL_MODEL_KEY,
      modelVersion: CURRENT_MODEL_VERSION,
      predictionSnapshot: input.predictionSnapshot as never,
      outcomeSnapshot: input.outcomeSnapshot as never,
      predictionError: comparison.predictionError,
      applied: false,
    },
  });

  const existingState = await prisma.calibrationState.upsert({
    where: {
      modelKey_modelVersion: {
        modelKey: KERNEL_MODEL_KEY,
        modelVersion: CURRENT_MODEL_VERSION,
      },
    },
    update: {},
    create: {
      modelKey: KERNEL_MODEL_KEY,
      modelVersion: CURRENT_MODEL_VERSION,
      calibrationData: {},
    },
  });

  const events = await prisma.calibrationEvent.findMany({
    where: {
      modelKey: KERNEL_MODEL_KEY,
      modelVersion: CURRENT_MODEL_VERSION,
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const proposal = proposeCalibrationAdjustment({
    events: events.map((event) => ({
      predictionError: event.predictionError,
      predictionSnapshot: event.predictionSnapshot as Record<string, unknown>,
      outcomeSnapshot: event.outcomeSnapshot as Record<string, unknown>,
      createdAt: event.createdAt,
    })),
    currentState: {
      outcomeCount: existingState.outcomeCount,
      accuracyScore: existingState.accuracyScore,
      biasScore: existingState.biasScore,
      calibrationData: (existingState.calibrationData as Record<string, unknown>) ?? {},
    },
  });

  const avgError = proposal.adjustment.avgError;
  const accuracyScore = Number.isFinite(avgError) ? Math.max(0, 1 - avgError) : existingState.accuracyScore;
  const biasScore = proposal.adjustment.severityBiasCorrection;

  await prisma.calibrationState.update({
    where: {
      modelKey_modelVersion: {
        modelKey: KERNEL_MODEL_KEY,
        modelVersion: CURRENT_MODEL_VERSION,
      },
    },
    data: {
      outcomeCount: events.length,
      accuracyScore,
      biasScore,
      lastCalibratedAt: new Date(),
      calibrationData: {
        latestReason: proposal.reason,
        latestAdjustment: proposal.adjustment,
      } as never,
    },
  });

  const latestEvent = events.at(-1);
  if (latestEvent) {
    await prisma.calibrationEvent.update({
      where: { id: latestEvent.id },
      data: {
        adjustmentProposal: {
          reason: proposal.reason,
          adjustment: proposal.adjustment,
        } as never,
      },
    });
  }

  return {
    modelKey: KERNEL_MODEL_KEY,
    modelVersion: CURRENT_MODEL_VERSION,
    predictionError: comparison.predictionError,
    accuracyScore,
    biasScore,
    outcomeCount: events.length,
  };
}

export function createOutcomeVerificationToken(input: ParsedTokenSubject): string | null {
  const email = normalizeEmail(input.email);
  if (!email) return null;
  try {
    return createSignedActionToken({
      purpose: OUTCOME_TOKEN_PURPOSE,
      subject: serializeTokenSubject({
        email,
        checkpointId: normalizeText(input.checkpointId),
        caseId: normalizeText(input.caseId),
        journeyId: normalizeText(input.journeyId),
        strategyRoomSessionId: normalizeText(input.strategyRoomSessionId),
        executiveRunId: normalizeText(input.executiveRunId),
      }),
      ttlSeconds: 60 * 60 * 24 * 14,
    });
  } catch {
    return null;
  }
}

export function verifyOutcomeVerificationToken(token: string): ParsedTokenSubject | null {
  const verified = verifySignedActionToken(token, OUTCOME_TOKEN_PURPOSE);
  if (!verified.ok) return null;
  return parseTokenSubject(verified.payload.subject);
}

export async function loadOutcomeVerificationContext(input: {
  email: string;
  userId?: string | null;
  token?: string | null;
  checkpointId?: string | null;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
}): Promise<OutcomeVerificationContext | null> {
  const email = normalizeEmail(input.email);
  if (!email) return null;

  const tokenContext = input.token ? verifyOutcomeVerificationToken(input.token) : null;
  if (tokenContext && tokenContext.email !== email) return null;

  const request: OutcomeVerificationRequest = {
    token: input.token,
    checkpointId: tokenContext?.checkpointId ?? input.checkpointId,
    caseId: tokenContext?.caseId ?? input.caseId,
    journeyId: tokenContext?.journeyId ?? input.journeyId,
    strategyRoomSessionId: tokenContext?.strategyRoomSessionId ?? input.strategyRoomSessionId,
    executiveRunId: tokenContext?.executiveRunId ?? input.executiveRunId,
    didAct: "NO",
    changedState: "UNKNOWN",
    whatChanged: "",
    systemDiagnosisAccuracy: "PARTIAL",
    requiredMoveUsefulness: "PARTIAL",
  };

  const { context } = await resolveContext({
    email,
    userId: input.userId,
    request,
  });
  return context;
}

export async function submitOutcomeVerification(input: {
  email: string;
  userId?: string | null;
  request: OutcomeVerificationRequest;
}): Promise<OutcomeVerificationResult> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("Authenticated email is required.");
  }

  const tokenContext = input.request.token ? verifyOutcomeVerificationToken(input.request.token) : null;
  if (tokenContext && tokenContext.email !== email) {
    throw new Error("Outcome verification token does not match the authenticated user.");
  }

  const mergedRequest: OutcomeVerificationRequest = {
    ...input.request,
    checkpointId: tokenContext?.checkpointId ?? input.request.checkpointId,
    caseId: tokenContext?.caseId ?? input.request.caseId,
    journeyId: tokenContext?.journeyId ?? input.request.journeyId,
    strategyRoomSessionId: tokenContext?.strategyRoomSessionId ?? input.request.strategyRoomSessionId,
    executiveRunId: tokenContext?.executiveRunId ?? input.request.executiveRunId,
    whatChanged: sanitizeText(input.request.whatChanged, 2400) ?? "",
    evidenceSummary: sanitizeText(input.request.evidenceSummary, 2400),
    rememberNote: sanitizeText(input.request.rememberNote, 1800),
  };

  const { context, decisionContext } = await resolveContext({
    email,
    userId: input.userId,
    request: mergedRequest,
  });

  const derived = classifyOutcomeVerification(mergedRequest);
  const createdAt = new Date().toISOString();
  const verificationId = `ov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  let checkpointId = context.checkpointId ?? null;
  if (checkpointId || context.caseId || context.strategyRoomSessionId || context.executiveRunId || context.journeyId) {
    const checkpointOutcome = await recordCheckpointResponse({
      checkpointId: checkpointId ?? undefined,
      caseId: context.caseId ?? undefined,
      journeyId: context.journeyId ?? undefined,
      strategyRoomSessionId: context.strategyRoomSessionId ?? undefined,
      executiveRunId: context.executiveRunId ?? undefined,
      responseStatus: derived.checkpointResponseStatus,
      evidenceNote: mergedRequest.evidenceSummary ?? undefined,
      blockerDescription: mergedRequest.didAct === "BLOCKED" ? mergedRequest.whatChanged : undefined,
      whatChanged: mergedRequest.whatChanged || undefined,
      whatShouldSystemRemember: mergedRequest.rememberNote ?? undefined,
      email,
      userId: input.userId ?? undefined,
    });
    checkpointId = checkpointOutcome?.checkpointId ?? checkpointId;
  }

  const payload = {
    verificationId,
    checkpointId,
    caseId: context.caseId ?? null,
    journeyId: decisionContext.journey?.id ?? context.journeyId ?? null,
    strategyRoomSessionId: context.strategyRoomSessionId ?? null,
    executiveRunId: context.executiveRunId ?? null,
    sourceSurface: context.sourceSurface ?? null,
    sourceLabel: context.sourceLabel ?? null,
    checkpointTitle: context.checkpointTitle ?? null,
    dueAt: context.dueAt ?? null,
    didAct: mergedRequest.didAct,
    changedState: mergedRequest.changedState,
    whatChanged: mergedRequest.whatChanged,
    evidenceSummary: mergedRequest.evidenceSummary ?? null,
    systemDiagnosisAccuracy: mergedRequest.systemDiagnosisAccuracy,
    requiredMoveUsefulness: mergedRequest.requiredMoveUsefulness,
    rememberNote: mergedRequest.rememberNote ?? null,
    status: derived.status,
    outcomeClassification: derived.outcomeClassification,
    evidencePosture: derived.evidencePosture,
    checkpointResponseStatus: derived.checkpointResponseStatus,
    createdAt,
  };

  await prisma.diagnosticRecord.create({
    data: {
      diagnosticType: "outcome_verification",
      userEmail: email,
      userId: input.userId ?? null,
      status: "completed",
      score: 0,
      severity: derived.status === "BLOCKED" || derived.status === "DISPUTED" ? "high" : "moderate",
      verdict: context.checkpointTitle ?? "Outcome verification",
      responsesJson: JSON.stringify(payload),
    },
  });

  if (decisionContext.journey || decisionContext.decision) {
    await prisma.outcomeVerificationRecord.create({
      data: {
        baselineJourneyId: decisionContext.journey?.id ?? null,
        followUpJourneyId: decisionContext.journey?.id ?? null,
        decisionObjectId: decisionContext.decision?.id ?? null,
        sessionId: context.strategyRoomSessionId ?? decisionContext.decision?.sessionId ?? null,
        organisationKey: decisionContext.journey?.organisationKey ?? null,
        outcomeClassification: derived.outcomeClassification,
        magnitudeOfChange: mergedRequest.changedState === "IMPROVED" ? 1
          : mergedRequest.changedState === "WORSENED" ? 0.25
          : 0.5,
        effectivenessScore: mergedRequest.requiredMoveUsefulness === "USEFUL" ? 0.8
          : mergedRequest.requiredMoveUsefulness === "PARTIAL" ? 0.55
          : 0.2,
        decisionVelocityDelta: mergedRequest.didAct === "YES" ? 1 : mergedRequest.didAct === "PARTIAL" ? 0.4 : 0,
        unresolvedContradictions: {
          changedState: mergedRequest.changedState,
          whatChanged: mergedRequest.whatChanged,
        } as never,
        payload: payload as never,
        evidenceNodes: [
          {
            label: "Outcome verification",
            posture: derived.evidencePosture,
            summary: mergedRequest.whatChanged,
          },
        ] as never,
      },
    });
  }

  await recordLedgerEntry({
    source: "outcome",
    sourceId: verificationId,
    decision: `Outcome verification: ${derived.outcomeClassification}`,
    email,
    journeyId: decisionContext.journey?.id ?? undefined,
    signals: {
      sourceSurface: context.sourceSurface,
      status: derived.status,
      changedState: mergedRequest.changedState,
      systemDiagnosisAccuracy: mergedRequest.systemDiagnosisAccuracy,
    },
    commitment: checkpointId
      ? {
          checkpointId,
          checkpointTitle: context.checkpointTitle,
        }
      : null,
    outcome: {
      classification: derived.outcomeClassification,
      evidencePosture: derived.evidencePosture,
      didAct: mergedRequest.didAct,
    },
    scoreImpact: derived.outcomeClassification === "ACTION_CONFIRMED"
      ? 4
      : derived.outcomeClassification === "OUTCOME_IMPROVED"
        ? 2
        : derived.outcomeClassification === "ACTION_BLOCKED"
          ? -2
          : derived.outcomeClassification === "SYSTEM_FINDING_DISPUTED"
            ? -1
            : 0,
  });

  let calibration: OutcomeVerificationResult["calibration"] = null;
  const predictionSnapshot = extractPredictionSnapshot(decisionContext.decision?.normalized);
  if (predictionSnapshot) {
    calibration = await updateCalibration({
      sessionKey: context.strategyRoomSessionId
        ?? decisionContext.decision?.sessionId
        ?? decisionContext.journey?.journeyKey
        ?? checkpointId
        ?? verificationId,
      predictionSnapshot,
      outcomeSnapshot: {
        classification: mapVerificationClassificationForCalibration({
          changedState: mergedRequest.changedState,
          outcomeClassification: derived.outcomeClassification,
        }),
        evidence: mergedRequest.evidenceSummary ? [mergedRequest.evidenceSummary] : [],
        observedAt: createdAt,
      },
    });
  }

  // ── RECOMMENDATION LEDGER BINDING ────────────────────────────────────────
  // If recommendationId is provided, update the recommendation ledger and
  // append an OUTCOME_REPORTED journey event.
  const recommendationId = normalizeText(mergedRequest.recommendationId);
  if (recommendationId) {
    const caseIdForLedger = context.caseId ?? decisionContext.journey?.journeyKey ?? undefined;
    if (caseIdForLedger) {
      // Determine verified status carefully:
      //   - verified=true only if evidencePosture is VERIFIED (independently confirmed)
      //   - otherwise verified=false (user-reported is not verified)
      const isVerified = derived.evidencePosture === 'VERIFIED';

      // Build a safe outcome summary from the verification data
      const outcomeSummary = mergedRequest.whatChanged
        ? `${derived.outcomeClassification}: ${mergedRequest.whatChanged.slice(0, 500)}`
        : `${derived.outcomeClassification}: ${derived.status}`;

      // Update the recommendation ledger
      attachOutcomeReport({
        caseId: caseIdForLedger,
        recommendationId,
        outcomeSummary,
        verified: isVerified,
      });

      // Append OUTCOME_REPORTED journey event
      const journeySurface = (context.sourceSurface ?? 'fast_diagnostic') as DiagnosticJourneySurface;
      try {
        await appendDiagnosticJourneyEvent({
          caseId: caseIdForLedger,
          surface: journeySurface,
          type: 'OUTCOME_REPORTED',
          engineId: 'outcome-verification-service',
          summary: outcomeSummary.slice(0, 200),
          payload: {
            recommendationId,
            outcomeSummary,
            verificationStatus: derived.status,
            verified: isVerified,
            outcomeClassification: derived.outcomeClassification,
            evidencePosture: derived.evidencePosture,
          },
          audienceSafe: true,
        });
      } catch {
        // Journey event failure does not affect the verification result
      }
    }
  }

  const record: OutcomeVerificationRecord = {
    verificationId,
    userEmail: email,
    userId: input.userId ?? null,
    checkpointId,
    caseId: context.caseId ?? null,
    journeyId: decisionContext.journey?.journeyKey ?? context.journeyId ?? null,
    strategyRoomSessionId: context.strategyRoomSessionId ?? null,
    executiveRunId: context.executiveRunId ?? null,
    checkpointTitle: context.checkpointTitle ?? null,
    sourceSurface: context.sourceSurface ?? null,
    sourceLabel: context.sourceLabel ?? null,
    dueAt: context.dueAt ?? null,
    status: derived.status,
    outcomeClassification: derived.outcomeClassification,
    evidencePosture: derived.evidencePosture,
    didAct: mergedRequest.didAct,
    changedState: mergedRequest.changedState,
    systemDiagnosisAccuracy: mergedRequest.systemDiagnosisAccuracy,
    requiredMoveUsefulness: mergedRequest.requiredMoveUsefulness,
    whatChanged: mergedRequest.whatChanged,
    evidenceSummary: mergedRequest.evidenceSummary ?? null,
    rememberNote: mergedRequest.rememberNote ?? null,
    createdAt,
    checkpointResponseStatus: derived.checkpointResponseStatus,
    proofLabels: [derived.evidencePosture],
  };

  return {
    ok: true,
    record,
    checkpointId,
    checkpointResponseStatus: derived.checkpointResponseStatus,
    calibration,
  };
}
