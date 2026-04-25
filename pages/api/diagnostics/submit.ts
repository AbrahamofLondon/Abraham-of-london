/* ============================================================================
   FILE: pages/api/diagnostics/submit.ts
   DIAGNOSTIC SUBMISSION API
   Purpose:
   - validate and persist diagnostic submissions
   - attach authenticated actor context where available
   - forward diagnostic payload to CRM
   - return stable dashboard and next-step routing
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";

import { rateLimitCheck, getClientIp, createRateLimitHeaders } from "@/lib/server/rate-limit-unified";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import {
  getSessionContext,
  tierAtLeast,
} from "@/lib/server/auth/tokenStore.postgres";
import { pushToCRM } from "@/lib/server/crm/pushToCRM";
import { hubspotSync } from "@/lib/hubspot/sync";
import { saveDiagnosticRecord } from "@/lib/server/diagnostics/store";
import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import {
  diagnosticSubmissionSchema,
  formatZodError,
  stableInputHash,
} from "@/lib/diagnostics/runtime-validation";
import {
  createSubmissionKey,
  getCachedSubmissionResult,
  setCachedSubmissionResult,
} from "@/lib/diagnostics/submission-control";

import type {
  DiagnosticAnswer,
  DiagnosticScoreBand,
  DiagnosticSectionScore,
  DiagnosticSeverity,
  DiagnosticSubmissionPayload,
  DiagnosticSubmitResponse,
} from "@/lib/diagnostics/types";

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isDiagnosticSeverity(v: unknown): v is DiagnosticSeverity {
  return v === "low" || v === "moderate" || v === "high" || v === "critical";
}

function isDiagnosticBand(v: unknown): v is DiagnosticScoreBand {
  return v === "stable" || v === "watch" || v === "fragile" || v === "escalate";
}

function isValidAnswer(answer: unknown): answer is DiagnosticAnswer {
  if (!isObject(answer)) return false;

  const sectionId = safeString(answer.sectionId);
  const questionId = safeString(answer.questionId);
  const prompt = safeString(answer.prompt);
  const value = Number(answer.value);

  if (!sectionId || !questionId || !prompt) return false;
  if (!Number.isInteger(value)) return false;
  if (value < 1 || value > 5) return false;

  return true;
}

function isValidSectionScore(score: unknown): score is DiagnosticSectionScore {
  if (!isObject(score)) return false;

  const sectionId = safeString(score.sectionId);
  const title = safeString(score.title);
  const rawScore = Number(score.score);
  const maxScore = Number(score.maxScore);
  const pct = Number(score.pct);

  if (!sectionId || !title) return false;
  if (!Number.isFinite(rawScore) || rawScore < 0) return false;
  if (!Number.isFinite(maxScore) || maxScore < 0) return false;
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return false;

  return true;
}

function generateDiagnosticRef(kind: string): string {
  const prefix = kind
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

  const date = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  const { randomBytes } = require("crypto") as typeof import("crypto");
  const rand = randomBytes(6).toString("hex").slice(0, 8).toUpperCase();

  return `DGN-${prefix || "GENERAL"}-${date}-${rand}`;
}

function getNextStepHref(kind: string): string | null {
  const safeKind = safeString(kind).toLowerCase();

  // Funnel progression: constitutional → team → enterprise → strategy room
  if (safeKind === "initial-assessment" || safeKind === "directional-integrity") {
    return "/diagnostics/team-assessment";
  }

  if (safeKind === "team-alignment" || safeKind === "team-assessment") {
    return "/diagnostics/enterprise-assessment";
  }

  if (safeKind === "enterprise" || safeKind === "enterprise-assessment") {
    return "/strategy-room";
  }

  if (safeKind === "executive-reporting") {
    return "/strategy-room";
  }

  return "/diagnostics";
}

function getDashboardHrefForTier(tier: string): string {
  if (tierAtLeast(tier, "inner-circle")) {
    return "/inner-circle/dashboard?tab=diagnostics";
  }
  return "/dashboard?tab=diagnostics";
}

function stageFromKind(kind: string): Parameters<typeof persistDiagnosticStage>[0]["stage"] | null {
  const safeKind = safeString(kind).toLowerCase();
  if (safeKind === "team-alignment" || safeKind === "team-assessment") return "team";
  if (safeKind === "enterprise" || safeKind === "enterprise-assessment") return "enterprise";
  if (safeKind === "executive-reporting") return "executive_reporting";
  if (safeKind === "purpose-alignment") return "purpose_alignment";
  if (safeKind === "constitutional" || safeKind === "constitutional-diagnostic") return "constitutional";
  return null;
}

function readAuthorityPacket(stage: Parameters<typeof persistDiagnosticStage>[0]["stage"] | null, metadata: unknown): {
  nodes: any[];
  decisionObject: any | null;
} {
  if (!isObject(metadata)) return { nodes: [], decisionObject: null };
  const authorityInput = isObject(metadata.authorityInput) ? metadata.authorityInput : null;
  if (!stage || !authorityInput) return { nodes: [], decisionObject: null };

  const generated = buildGenericAuthorityPacket({
    stage,
    condition: safeString(authorityInput.condition, "Diagnostic condition"),
    contradiction: safeString(authorityInput.contradiction, "Contradiction evidence recorded."),
    decisionText: safeString(authorityInput.decisionText) || null,
    constraintText: safeString(authorityInput.constraintText) || null,
    priorAttemptText: safeString(authorityInput.priorAttemptText) || null,
    costOfDelayText: safeString(authorityInput.costOfDelayText) || null,
    stakeholderText: safeString(authorityInput.stakeholderText) || null,
    affectedDomain: safeString(authorityInput.affectedDomain) || null,
    firstMove: safeString(authorityInput.firstMove, "Name the first corrective move and owner."),
    skippedConsequence: safeString(authorityInput.skippedConsequence, "The condition remains unpriced and unmanaged."),
    escalationCondition: safeString(authorityInput.escalationCondition, "Escalate if the contradiction repeats in the next stage."),
    riskScore: typeof authorityInput.riskScore === "number" ? authorityInput.riskScore : 50,
    formula: safeString(authorityInput.formula, "stage risk score"),
    reasoning: Array.isArray(authorityInput.reasoning)
      ? authorityInput.reasoning.map(String).filter(Boolean)
      : [],
    confidence: typeof authorityInput.confidence === "number" ? authorityInput.confidence : 0.65,
    payload: isObject(authorityInput.payload) ? authorityInput.payload : undefined,
  });
  const nodes = generated.nodes;
  const decisionObject = generated.decisionObject;
  return { nodes, decisionObject };
}

type ActorContext = {
  authenticated: boolean;
  tier: string;
  userId: string | null;
  name: string | null;
  email: string | null;
};

async function resolveActorContext(req: NextApiRequest): Promise<ActorContext> {
  try {
    const sessionId = readAccessCookie(req);

    if (!sessionId) {
      return {
        authenticated: false,
        tier: "public",
        userId: null,
        name: null,
        email: null,
      };
    }

    const ctx = await getSessionContext(sessionId);

    if (!ctx?.ok || !ctx?.valid) {
      return {
        authenticated: false,
        tier: "public",
        userId: null,
        name: null,
        email: null,
      };
    }

    return {
      authenticated: true,
      tier: safeString(ctx.tier, "public"),
      userId: ctx.memberId || null,
      name: ctx.name || null,
      email:
        typeof (ctx as { email?: unknown }).email === "string"
          ? ((ctx as { email?: string }).email || null)
          : null,
    };
  } catch {
    return {
      authenticated: false,
      tier: "public",
      userId: null,
      name: null,
      email: null,
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosticSubmitResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  // Rate limit: 30 submissions per 10 minutes per IP
  const ip = getClientIp(req);
  const rl = rateLimitCheck({ key: "INNER_CIRCLE_UNLOCK", id: `diag:${ip}` });
  const rlHeaders = createRateLimitHeaders(rl);
  for (const [k, v] of Object.entries(rlHeaders)) res.setHeader(k, v);

  if (!rl.allowed) {
    return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
  }

  const parsed = diagnosticSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
  }

  const payload = parsed.data as DiagnosticSubmissionPayload;
  const duplicateKey = createSubmissionKey({
    scope:
      safeString(payload.respondent?.email) ||
      safeString(payload.respondent?.organisation) ||
      ip,
    journeyId:
      isObject(payload.metadata) && safeString(payload.metadata.campaignId)
        ? safeString(payload.metadata.campaignId)
        : null,
    stage: payload.kind,
    payload,
  });
  const cached = getCachedSubmissionResult<DiagnosticSubmitResponse & { diagnosticRef?: string }>(duplicateKey);
  if (cached) {
    return res.status(200).json(cached);
  }
  const submittedAt = new Date().toISOString();
  const diagnosticRef = generateDiagnosticRef(payload.kind);

  const actor = await resolveActorContext(req);
  const dashboardHref = getDashboardHrefForTier(actor.tier);
  const nextStepHref = getNextStepHref(payload.kind);

  let crmForwarded = false;

  try {
    crmForwarded = await pushToCRM({
      diagnosticRef,
      submittedAt,
      payload,
      actor: {
        userId: actor.userId,
        tier: actor.tier,
        authenticated: actor.authenticated,
      },
    });
  } catch {
    crmForwarded = false;
  }

  // HubSpot sync — fire and forget
  hubspotSync({
    event: "diagnostic_submitted",
    email: safeString(payload.respondent?.email) || actor.email || "",
    data: {
      fullName: safeString(payload.respondent?.name) || actor.name || "",
      organisation: safeString(payload.respondent?.organisation),
      diagnosticType: payload.kind,
      score: payload.summary.totalScore,
      severity: payload.summary.severity,
    },
  }).catch(() => {});

  try {
    await saveDiagnosticRecord({
      diagnosticRef,
      submittedAt,
      updatedAt: submittedAt,
      kind: payload.kind,
      title: payload.title,
      source: payload.source,
      entry: payload.entry,
      intent: payload.intent,
      status: "submitted",
      reportStatus: "none",
      crmForwarded,
      actor: {
        userId: actor.userId,
        tier: actor.tier,
        authenticated: actor.authenticated,
        name: actor.name,
        email: actor.email,
      },
      respondent: {
        name: payload.respondent?.name || null,
        email: payload.respondent?.email || null,
        organisation: payload.respondent?.organisation || null,
        role: payload.respondent?.role || null,
      },
      summary: payload.summary,
      notes: payload.notes || null,
      answers: payload.answers,
      metadata: {
        ...(payload.metadata || {}),
        nextStepHref,
      },
      report: null,
    });

    const stage = stageFromKind(payload.kind);
    const authority = readAuthorityPacket(stage, payload.metadata);
    if (stage && (authority.nodes.length || authority.decisionObject)) {
      await persistDiagnosticStage({
        email: safeString(payload.respondent?.email) || actor.email || null,
        organisation: safeString(payload.respondent?.organisation) || null,
        stage,
        payload: {
          diagnosticRef,
          payload,
          authorityPacket: isObject(payload.metadata?.authorityPacket)
            ? payload.metadata?.authorityPacket
            : null,
        },
        tensions: authority.nodes
          .filter((node) => isObject(node) && safeString(node.kind) === "contradiction")
          .map((node) => safeString((node as Record<string, unknown>).label))
          .filter(Boolean),
        routeDecision: payload.metadata?.nextRoute
          ? { nextRoute: payload.metadata.nextRoute, diagnosticRef }
          : { diagnosticRef },
        evidenceNodes: authority.nodes,
        decisionObject: authority.decisionObject,
      });
    }
  } catch (error) {
    console.error("[diagnostics.submit] persistence failure", error);
    return res.status(500).json({
      ok: false,
      error: "PERSISTENCE_FAILED",
    });
  }

  return res.status(200).json({
    ...setCachedSubmissionResult(duplicateKey, {
      ok: true,
      diagnosticRef,
      submittedAt,
      dashboardHref,
      crmForwarded,
      reportReady: false,
      nextStepHref,
    }),
    ok: true,
  });
}
