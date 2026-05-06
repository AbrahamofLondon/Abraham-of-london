export const dynamic = "force-dynamic";
// app/api/strategy-room/session/init/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";
import { buildCanonicalReportContract } from "@/lib/admin/reporting/canonical-report-contract";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";
import { createStrategyRoomSession } from "@/lib/strategy-room/persistence";
import { randomUUID } from "crypto";
import { enforceStrategyRoomAccess } from "@/lib/diagnostics/authority-enforcement";
import { createDecisionOutcomeLink } from "@/lib/outcomes/outcome-model";
import {
  enforceAppRouteRateLimit,
  failClosedForFlag,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
  requireSameOrigin,
} from "@/lib/server/security/app-route-guards";
import { authorizeStrategyRoomEntry } from "@/lib/server/strategy-room/access.server";
import { writeSecurityAudit } from "@/lib/security/audit-log";

const intakeSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320).optional().nullable(),
  organisation: z.string().trim().max(240).optional().nullable(),
  sector: z.string().trim().max(160).optional().nullable(),
  revenueBand: z.string().trim().max(80).optional().nullable(),
  authorityRole: z.string().trim().max(160).optional().nullable(),
  authorityScope: z.string().trim().max(160).optional().nullable(),
  urgencyWindow: z.string().trim().max(80).optional().nullable(),
  problemStatement: z.string().trim().max(4000).optional().nullable(),
  symptoms: z.string().trim().max(4000).optional().nullable(),
  desiredOutcome: z.string().trim().max(4000).optional().nullable(),
  currentConstraint: z.string().trim().max(4000).optional().nullable(),
  marketExposure: z.string().trim().max(80).optional().nullable(),
  boardInvolved: z.string().trim().max(80).optional().nullable(),
}).strict();

const requestSchema = z.object({
  intake: intakeSchema,
  tensionThread: z.unknown().optional().nullable(),
  accessToken: z.string().trim().max(2048).optional().nullable(),
  handoffToken: z.string().trim().max(4096).optional().nullable(),
  handoffReportId: z.string().trim().max(160).optional().nullable(),
}).strict();

function makeSessionKey(): string {
  return `sr_${randomUUID().replace(/-/g, "")}`;
}

function toJsonString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}

function getSafePrismaDiagnostic(error: unknown):
  | {
      name?: string;
      message?: string;
      code?: string;
      clientVersion?: string;
      meta?: unknown;
    }
  | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    clientVersion?: unknown;
    meta?: unknown;
  };

  const message =
    typeof candidate.message === "string"
      ? candidate.message
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
          .slice(0, 1200)
      : undefined;

  const diagnostic = {
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    message,
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    clientVersion:
      typeof candidate.clientVersion === "string"
        ? candidate.clientVersion
        : undefined,
    meta: candidate.meta,
  };

  return diagnostic.name ||
    diagnostic.message ||
    diagnostic.code ||
    diagnostic.clientVersion ||
    diagnostic.meta
    ? diagnostic
    : undefined;
}

function logStrategyRoomInitError(stage: string, error: unknown): void {
  const prismaDiagnostic = getSafePrismaDiagnostic(error);
  const details =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
          prisma: prismaDiagnostic,
        }
      : { message: String(error || "Unknown Strategy Room session error") };

  console.error("[STRATEGY_ROOM_SESSION_INIT_ERROR]", {
    stage,
    error: details,
  });
}

export async function POST(request: NextRequest) {
  const methodCheck = requireMethod(request, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(request);
  if (!contentCheck.ok) return contentCheck.response;

  const sameOrigin = requireSameOrigin(request, "/api/strategy-room/session/init");
  if (!sameOrigin.ok) return sameOrigin.response;

  let stage = "parse_request";

  try {
    const lockdown = failClosedForFlag({
      flag: "DISABLE_STRATEGY_ROOM_ENTRY",
      action: "strategy_room_access_denied",
      route: "/api/strategy-room/session/init",
      publicMessage: "STRATEGY_ROOM_TEMPORARILY_DISABLED",
    });
    if (!lockdown.ok) return lockdown.response;

    const parsed = await parseJsonBody(request, requestSchema);
    if (!parsed.ok) return parsed.response;
    const {
      intake,
      tensionThread = null,
      accessToken = null,
      handoffToken = null,
      handoffReportId = null,
    } = parsed.data;

    const authz = await authorizeStrategyRoomEntry({
      request,
      intakeEmail: intake.email ?? null,
      entryToken: accessToken,
      handoffToken,
      handoffReportId,
    });
    if (!authz.ok) {
      await writeSecurityAudit({
        action: "strategy_room_access_denied",
        severity: "warn",
        status: "BLOCKED",
        resourceId: "/api/strategy-room/session/init",
        metadata: { reason: authz.error },
      });
      return noStoreJson({ success: false, error: authz.error }, { status: authz.status });
    }

    const rateLimit = await enforceAppRouteRateLimit({
      request,
      routeKey: "strategy-room-init",
      limit: 10,
      windowMs: 15 * 60_000,
      email: authz.identityEmail,
      sessionId: authz.handoff?.reportId ?? authz.subjectId,
      failClosed: true,
    });
    if (!rateLimit.ok) return rateLimit.response;

    // ── DECISION AUTHORITY ENFORCEMENT ──
    // Server-side hard gate: restrict/block directives prevent session creation.
    // Uses durable DB-backed thread (email lookup) as sovereign authority,
    // with client-supplied thread as supplemental context.
    stage = "enforce_authority";
    const intakeEmail = typeof intake.email === "string" ? intake.email.trim().toLowerCase() : null;
    const enforcement = await enforceStrategyRoomAccess(intakeEmail, tensionThread);
    if (!enforcement.allowed) {
      await writeSecurityAudit({
        action: "strategy_room_access_denied",
        severity: "warn",
        status: "BLOCKED",
        actorId: authz.subjectId,
        actorEmail: authz.identityEmail,
        resourceId: "/api/strategy-room/session/init",
        metadata: {
          reason: enforcement.reason,
          directive: enforcement.directive?.level ?? null,
          handoffReportId: authz.handoff?.reportId ?? null,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: "Strategy Room access restricted by diagnostic authority.",
          directive: enforcement.directive,
          reason: enforcement.reason,
          recommendedPath: enforcement.recommendedPath,
          threadSource: enforcement.threadSource,
        },
        { status: 403 }
      );
    }

    const sessionKey = makeSessionKey();

    stage = "assemble_guidance";
    const assembled = await assembleConstitutionalGuidance({
      intake,
      assetLimit: 6,
      minAssetScore: 18,
      source: "strategy-room-session-init",
    });

    stage = "build_canonical_contract";
    const canonical = buildCanonicalReportContract({
      report: {
        state: assembled.constitution.orgState,
        narrative: {
          headline: "Constitutional signal captured.",
          summary:
            assembled.constitution.narrativeSummary ||
            assembled.guidance.summary,
          mandate:
            assembled.guidance.nextAction ||
            "Proceed through governed decision path.",
        },
        resonance: {
          telemetry: {
            averageDissonance: assembled.constitution.severityScore ?? 0,
            domains: (assembled.constitution.dominantDomains || []).map(
              (label: string) => ({
                label,
                intent: 80,
                reality: 60,
                dissonance: 20,
              })
            ),
          },
        },
        hcdAggregate: {
          overallBurnoutIndex: assembled.constitution.severityScore ?? 0,
        },
        financialExposure: {
          replacementCost: 0,
          executionLoss: 0,
          totalExposure: 0,
        },
        failureModes: assembled.constitution.failureModes || [],
        priorityStack: assembled.constitution.requiredInterventions || [],
        ogr: {
          sovereignCertainty: assembled.constitution.clarityScore ?? 0,
          isAuthorizedToExecute:
            assembled.constitution.route === "STRATEGY",
        },
      },
      constitution: assembled.constitution,
      guidance: assembled.guidance,
      campaign: {
        id: sessionKey,
        title: "Strategy Room Session",
        organisationName: intake?.organisation || "Prospective Organisation",
        generatedAt: new Date().toISOString(),
      },
      registry: {
        model: "OGR-IV",
        node: "Canary Wharf",
        protocol: "Sovereign Protocol v2.2",
      },
    });

    const decisionOutcomeLink = createDecisionOutcomeLink({
      decisionId: sessionKey,
      interventionStack: assembled.constitution.requiredInterventions,
    });
    const canonicalWithDecisionLink = {
      ...canonical,
      decisionOutcomeLink,
    };

    stage = "normalize_canonical_snapshot";
    const canonicalSnapshot = normalizeCanonicalSectionsSnapshot({
      envelope: canonicalWithDecisionLink,
      source: "session-init",
      sessionKey,
    });

    stage = "persist_strategy_room_session";
    await createStrategyRoomSession({
      sessionKey,
      status: "active",
      source: "strategy-room",
      intake: toJsonString(intake),
      canonicalSnapshot: toJsonString(canonicalSnapshot),
      route: assembled.constitution.route,
      readinessTier: assembled.constitution.readinessTier,
      authorityType: assembled.constitution.authorityType,
      ...(tensionThread ? { tensionThread: toJsonString(tensionThread) } : {}),
    });

    await writeSecurityAudit({
      action: "strategy_room_session_created",
      severity: "info",
      status: "SUCCESS",
      actorId: authz.subjectId,
      actorEmail: authz.identityEmail,
      resourceId: sessionKey,
      metadata: {
        route: assembled.constitution.route,
        readinessTier: assembled.constitution.readinessTier,
        authorityType: assembled.constitution.authorityType,
        handoffReportId: authz.handoff?.reportId ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      sessionKey,
      constitution: {
        route: assembled.constitution.route,
        priority: assembled.constitution.priority,
        temperature: assembled.constitution.temperature,
        orgState: assembled.constitution.orgState,
        readinessTier: assembled.constitution.readinessTier,
        authorityType: assembled.constitution.authorityType,
        revenueBand: assembled.constitution.revenueBand,
        marketRiskBand: assembled.constitution.marketRiskBand,
      },
      canonical: canonicalWithDecisionLink,
      decisionOutcomeLink,
    });
  } catch (error) {
    logStrategyRoomInitError(stage, error);
    await writeSecurityAudit({
      action: "strategy_room_session_init_failed",
      severity: "error",
      status: "FAILURE",
      resourceId: "/api/strategy-room/session/init",
      metadata: {
        stage,
        error: error instanceof Error ? error.message.slice(0, 300) : "unknown",
      },
    });
    const diagnostic =
      stage === "persist_strategy_room_session"
        ? getSafePrismaDiagnostic(error)
        : undefined;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize governed session.",
        reason: "STRATEGY_ROOM_SESSION_INIT_FAILED",
        stage,
        diagnostic: diagnostic ?? null,
      },
      { status: 500 }
    );
  }
}
