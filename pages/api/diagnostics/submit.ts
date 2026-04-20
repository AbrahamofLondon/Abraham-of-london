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

function validatePayload(body: unknown): body is DiagnosticSubmissionPayload {
  if (!isObject(body)) return false;

  if (!safeString(body.kind)) return false;
  if (!safeString(body.version)) return false;
  if (!safeString(body.source)) return false;
  if (!safeString(body.entry)) return false;
  if (!safeString(body.title)) return false;

  if (!Array.isArray(body.answers) || body.answers.length === 0) return false;
  if (!body.answers.every(isValidAnswer)) return false;

  if (!isObject(body.summary)) return false;

  const totalScore = Number(body.summary.totalScore);
  const maxScore = Number(body.summary.maxScore);
  const pct = Number(body.summary.pct);

  if (!Number.isFinite(totalScore) || totalScore < 0) return false;
  if (!Number.isFinite(maxScore) || maxScore <= 0) return false;
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return false;

  if (!isDiagnosticSeverity(body.summary.severity)) return false;
  if (!isDiagnosticBand(body.summary.band)) return false;

  if (
    !Array.isArray(body.summary.sectionScores) ||
    !body.summary.sectionScores.every(isValidSectionScore)
  ) {
    return false;
  }

  if (body.respondent !== undefined && body.respondent !== null && !isObject(body.respondent)) {
    return false;
  }

  if (body.metadata !== undefined && body.metadata !== null && !isObject(body.metadata)) {
    return false;
  }

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

  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();

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

  if (!validatePayload(req.body)) {
    return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
  }

  const payload = req.body;
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
      fullName: safeString(payload.respondent?.name) || actor.name,
      organisation: safeString(payload.respondent?.organisation),
      diagnosticType: payload.kind,
      score: payload.score,
      severity: payload.severity,
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
  } catch (error) {
    console.error("[diagnostics.submit] persistence failure", error);
    return res.status(500).json({
      ok: false,
      error: "PERSISTENCE_FAILED",
    });
  }

  return res.status(200).json({
    ok: true,
    diagnosticRef,
    submittedAt,
    dashboardHref,
    crmForwarded,
    reportReady: false,
    nextStepHref,
  });
}