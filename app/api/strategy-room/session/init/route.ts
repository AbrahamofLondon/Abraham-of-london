export const dynamic = "force-dynamic";
// app/api/strategy-room/session/init/route.ts
import { NextResponse } from "next/server";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";
import { buildCanonicalReportContract } from "@/lib/admin/reporting/canonical-report-contract";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";
import { createStrategyRoomSession } from "@/lib/strategy-room/persistence";
import { randomUUID } from "crypto";
import { enforceStrategyRoomAccess } from "@/lib/diagnostics/authority-enforcement";
import { createDecisionOutcomeLink } from "@/lib/outcomes/outcome-model";

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

export async function POST(request: Request) {
  let stage = "parse_request";

  try {
    const body = await request.json();
    const intake = body?.intake;
    const tensionThread = body?.tensionThread ?? null; // Cross-stage tension memory (optional)

    if (!intake || typeof intake !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid intake payload." },
        { status: 400 }
      );
    }

    // ── DECISION AUTHORITY ENFORCEMENT ──
    // Server-side hard gate: restrict/block directives prevent session creation.
    // Uses durable DB-backed thread (email lookup) as sovereign authority,
    // with client-supplied thread as supplemental context.
    stage = "enforce_authority";
    const intakeEmail = typeof intake.email === "string" ? intake.email.trim().toLowerCase() : null;
    const enforcement = await enforceStrategyRoomAccess(intakeEmail, tensionThread);
    if (!enforcement.allowed) {
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
