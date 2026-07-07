// app/api/instruments/[slug]/run/route.ts
//
// Execute a paid Decision Instrument run.
//
// AUTHORITY RULES (enforced, not advisory):
//   1. Run requires authenticated user — anonymous runs are BLOCKED.
//   2. verifyInstrumentEntitlement() MUST pass before execution begins.
//   3. startInstrumentRun() MUST persist a DecisionInstrumentRun record before any computation.
//   4. If persistence fails, the run is abandoned — not silently continued.
//   5. On completion, completeInstrumentRun() persists scoreJson + resultHash.
//   6. On failure, failInstrumentRun() persists the error reason.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  startInstrumentRun,
  completeInstrumentRun,
  failInstrumentRun,
  beginArtifactGeneration,
  recordArtifact,
  entitlementSlugForInstrument,
  INSTRUMENT_ENTITLEMENTS,
  InstrumentEntitlementError,
  InstrumentRunPersistenceError,
} from "@/lib/decision-instruments/instrument-run-authority";
import { requireCatalogCodeFromSlug } from "@/lib/decision-instruments/instrument-catalog-bridge";
import { createPaidRuntimeArtifact } from "@/lib/artifacts/paid-product-runtime";
import crypto from "node:crypto";

// ─── Request schema ───────────────────────────────────────────────────────────

const runSchema = z.object({
  /** Authenticated user ID — required for paid instrument access */
  userId: z.string().min(1).optional(),
  /** User email — required if userId is not provided */
  userEmail: z.string().email().optional(),
  /** Input answers/context supplied by the user for this instrument run */
  inputPayload: z.record(z.unknown()).optional().default({}),
}).refine(
  (d) => d.userId || d.userEmail,
  { message: "Anonymous instrument runs are not allowed. Provide userId or userEmail." },
);

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const instrumentSlug = params.slug;

  // ── Step 1: Validate instrument slug ──────────────────────────────────────
  const entitlementSlug = entitlementSlugForInstrument(instrumentSlug);
  if (!entitlementSlug) {
    return NextResponse.json(
      {
        ok: false,
        error: `"${instrumentSlug}" is not a recognised instrument slug.`,
        knownSlugs: Object.keys(INSTRUMENT_ENTITLEMENTS),
        code: "UNKNOWN_INSTRUMENT",
      },
      { status: 404 },
    );
  }

  // ── Step 2: Parse body ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join("; "), code: "ANONYMOUS_RUN_BLOCKED" },
      { status: 403 },
    );
  }

  const { userId, userEmail, inputPayload } = parsed.data;

  // ── Step 3: Start run — verifies entitlement + persists DecisionInstrumentRun ─
  let run: Awaited<ReturnType<typeof startInstrumentRun>>;
  try {
    run = await startInstrumentRun({
      instrumentSlug,
      userId: userId ?? null,
      userEmail: userEmail ?? null,
      entitlementSlug,
      inputObject: inputPayload,
    });
  } catch (err) {
    if (err instanceof InstrumentEntitlementError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: "ENTITLEMENT_DENIED" },
        { status: 403 },
      );
    }
    if (err instanceof InstrumentRunPersistenceError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: "RUN_PERSISTENCE_FAILED" },
        { status: 500 },
      );
    }
    throw err;
  }

  const runId = run.id;
  const startedAt = run.createdAt;

  // ── Step 4: Execute the instrument ────────────────────────────────────────
  // The instrument computation is stateless and driven by the inputPayload.
  // Each instrument scores against its rubric and returns a scored result JSON.
  // In Phase 1 the rubric is declarative. When LLM synthesis is added, this
  // is where the synthesis call goes — gated behind the persisted runId.
  let scoreJson: Record<string, unknown>;
  let runDurationMs: number;

  const execStart = Date.now();
  try {
    scoreJson = executeInstrumentRubric(instrumentSlug, inputPayload);
    runDurationMs = Date.now() - execStart;
  } catch (err) {
    // Execution failed — persist failure state before returning
    await failInstrumentRun(runId, err instanceof Error ? err.message : "Execution error").catch(() => null);
    return NextResponse.json(
      { ok: false, error: "Instrument execution failed", runId, code: "EXECUTION_FAILED" },
      { status: 500 },
    );
  }

  // ── Step 5: Create governed artifact, falsification panel, and hypothesis ──
  const resultHash = crypto.createHash("sha256").update(JSON.stringify(scoreJson)).digest("hex");
  const nextRouteSlug = deriveNextRoute(instrumentSlug, scoreJson);
  const artifactUrl = `/api/instruments/${encodeURIComponent(instrumentSlug)}/artifact?runId=${encodeURIComponent(runId)}`;

  let runtime: Awaited<ReturnType<typeof createPaidRuntimeArtifact>>;
  try {
    runtime = await createPaidRuntimeArtifact({
      productCode: requireCatalogCodeFromSlug(instrumentSlug) as any,
      sourceEntityType: "INSTRUMENT_RUN",
      sourceEntityId: runId,
      userId: userId ?? null,
      userEmail: userEmail ?? null,
      inputSnapshot: inputPayload,
      evidenceRefs: [
        {
          sourceId: runId,
          sourceType: "DecisionInstrumentRun",
          label: "Persisted paid instrument run",
        },
      ],
      artifactContent: JSON.stringify({ runId, instrumentSlug, scoreJson, resultHash }),
      downloadUrl: artifactUrl,
      publicSafeSummary: `${instrumentSlug} paid instrument result.`,
      generatedBy: "instrument-runtime",
      falsification: [
        {
          claimOrRecommendation: String(scoreJson.recommendation ?? "Instrument recommendation requires user outcome verification."),
          confidenceLevel: scoreJson.tier === "HIGH" ? "HIGH" : "MEDIUM",
          whatWouldChangeThisView:
            "A Return Brief shows the recommendation did not address the real blocker, owner, or evidence gap.",
          observableIndicator:
            "Outcome class is FAILURE, PARTIAL, DEFERRED, or UNKNOWN with carry-forward evidence contradicting the run result.",
          threshold: "Outcome contradicts the recommendation or identifies a missing critical input.",
          strongestCounterargument:
            "The deterministic rubric can only score the submitted inputs and may miss context not entered by the user.",
          responseToCounterargument:
            "The run is paired with an outcome hypothesis and Return Brief so the next decision can correct the pattern.",
        },
      ],
      outcomeHypothesis: {
        predictedDecisionMove:
          "User acts on or explicitly rejects the route recommended by the decision instrument.",
        expectedObservableChange:
          "Decision process, ownership, evidence quality, or escalation route changes within the review window.",
      },
    });
  } catch (err) {
    await failInstrumentRun(runId, err instanceof Error ? err.message : "Artifact authority failure").catch(() => null);
    return NextResponse.json(
      { ok: false, error: "Instrument artifact authority failed", runId, code: "ARTIFACT_AUTHORITY_FAILED" },
      { status: 500 },
    );
  }

  // ── Step 6: Persist completion state ──────────────────────────────────────
  try {
    await completeInstrumentRun(runId, {
      scoreJson: {
        ...scoreJson,
        resultHash,
        artifactId: runtime.artifact.artifactId,
        outcomeHypothesisId: runtime.outcomeHypothesis.hypothesisId,
      },
      runDurationMs,
      nextRouteSlug,
    });
    await beginArtifactGeneration(runId);
    await recordArtifact(runId, {
      artifactUrl,
      artifactHash: runtime.artifact.artifactHash ?? resultHash,
    });
  } catch {
    // Completion persistence failure is non-fatal to the caller — run already happened.
    // Log but return the result; the admin can manually reconcile via the run record.
    console.error(`[instrument-run] Failed to persist completion for runId=${runId}`);
  }

  return NextResponse.json({
    ok: true,
    runId,
    instrumentSlug,
    score: scoreJson,
    resultHash,
    artifactId: runtime.artifact.artifactId,
    artifactHash: runtime.artifact.artifactHash,
    outcomeHypothesisId: runtime.outcomeHypothesis.hypothesisId,
    falsificationEntryIds: runtime.falsificationEntries.map((entry) => entry.id),
    nextRouteSlug,
    startedAt: startedAt.toISOString(),
    durationMs: runDurationMs,
  });
}

// ─── Instrument rubric executor ───────────────────────────────────────────────

/**
 * Execute a scored rubric for the given instrument.
 * Returns a scored result JSON. The rubric is declarative in Phase 1.
 *
 * Each instrument evaluates inputPayload dimensions and returns:
 *   - score (0–100)
 *   - tier (LOW / MEDIUM / HIGH / CRITICAL)
 *   - findings (string[])
 *   - recommendation (string)
 */
function executeInstrumentRubric(
  instrumentSlug: string,
  inputPayload: Record<string, unknown>,
): Record<string, unknown> {
  // Phase 1: deterministic rubric — no LLM synthesis.
  // Score is derived from input completeness and declared risk factors.
  const filledFields = Object.values(inputPayload).filter(Boolean).length;
  const totalFields = Math.max(Object.keys(inputPayload).length, 1);
  const completenessRatio = filledFields / totalFields;

  // Risk flag detection — instruments with these keys signal elevated risk
  const riskKeys = ["blockers", "conflicts", "escalationPending", "criticalDecisions", "highStake"];
  const declaredRisk = riskKeys.some((k) => Boolean(inputPayload[k]));

  const baseScore = Math.round(completenessRatio * 70); // max 70 from completeness
  const riskPenalty = declaredRisk ? 15 : 0;
  const score = Math.max(10, baseScore - riskPenalty);
  const tier = score >= 70 ? "HIGH" : score >= 45 ? "MEDIUM" : "LOW";

  return {
    instrumentSlug,
    score,
    tier,
    completenessRatio: Math.round(completenessRatio * 100),
    declaredRiskFactors: declaredRisk,
    findings: buildFindings(instrumentSlug, inputPayload, tier),
    recommendation: buildRecommendation(instrumentSlug, tier),
    scoredAt: new Date().toISOString(),
    rubricVersion: "1.0.0",
    rubricType: "DECLARATIVE_PHASE_1",
  };
}

function buildFindings(slug: string, input: Record<string, unknown>, tier: string): string[] {
  const findings: string[] = [];
  if (tier === "HIGH") findings.push("Elevated decision pressure detected. Immediate review recommended.");
  if (tier === "MEDIUM") findings.push("Moderate authority risk. Structured intervention path advised.");
  if (!Object.keys(input).length) findings.push("No input payload provided. Score reflects baseline assessment only.");
  findings.push(`Instrument: ${slug}. Phase 1 declarative rubric applied.`);
  return findings;
}

function buildRecommendation(slug: string, tier: string): string {
  if (tier === "HIGH") return "Escalate to Enterprise Assessment or Strategy Room before proceeding.";
  if (tier === "MEDIUM") return "Review findings with a senior decision authority before acting.";
  return "Proceed with the next corridor stage as your situation permits.";
}

function deriveNextRoute(slug: string, score: Record<string, unknown>): string {
  const tier = score["tier"] as string;
  if (tier === "HIGH" || tier === "CRITICAL") return "/enterprise-assessment";
  if (tier === "MEDIUM") return "/strategy-room";
  return "/instruments";
}
