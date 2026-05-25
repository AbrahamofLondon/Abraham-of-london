/**
 * lib/research/engines/constitutional-diagnostic-adapter.ts
 *
 * Intelligence Foundry adapter for the Constitutional Diagnostic engine.
 * Wraps real production logic: domain scoring, constitutional routing,
 * readiness tier, and deterministic route decision.
 *
 * Status: PRODUCTION_CALLABLE
 *   - Domain scoring: callable (deriveConstitutionalDiagnosticBundle)
 *   - Constitutional routing: callable (evaluateConstitutionalRoute via derivation layer)
 *   - Readiness tier + posture: callable
 *
 * Limitations:
 *   - Does not run AI narrative generation or executive synthesis.
 *   - Does not produce the strategy room session or boardroom dossier.
 *   - Does not persist session state or create journey records.
 *   - Operator override mutations are in-memory only (no live operator config in Foundry context).
 */

import { z } from "zod";
import {
  deriveConstitutionalDiagnosticBundle,
  DEFAULT_DIAGNOSTIC_QUESTIONS,
  type DiagnosticAnswers,
} from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const CONSTITUTIONAL_DIAGNOSTIC_ENGINE_ID = "constitutional-diagnostic";
export const CONSTITUTIONAL_DIAGNOSTIC_VERSION = "1.0.0";

// ─── Input Schema ────────────────────────────────────────────────────────────

const answerValueSchema = z.object({
  resonance: z.number().int().min(0).max(10),
  certainty: z.number().int().min(0).max(10),
});

const adapterInputSchema = z.object({
  /** Answers keyed by question ID (e.g. "q1" through "q10") */
  answers: z.record(answerValueSchema).optional(),
  /** Use DEFAULT_DIAGNOSTIC_QUESTIONS with uniform mid-range answers (for selfTest) */
  useDefaults: z.boolean().optional().default(false),
  /** Operator key for override-aware evaluation */
  operatorKey: z.string().optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function routeToSeverity(
  route: string,
  confidence: number,
): "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (route === "REJECT") return "CRITICAL";
  if (route === "DIAGNOSTIC" && confidence >= 0.8) return "HIGH";
  if (route === "DIAGNOSTIC") return "MEDIUM";
  if (route === "STRATEGY") return confidence >= 0.8 ? "MEDIUM" : "LOW";
  return "INFO";
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export async function selfTest(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const result = await run({
      payload: { useDefaults: true },
    });
    if (result.findings.length === 0) {
      return { ok: false, detail: "No findings produced" };
    }
    return {
      ok: true,
      detail: `${result.findings.length} findings, severity: ${result.severity}, engineVersion: ${result.engineVersion}`,
    };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function getVersion(): Promise<{ version: string }> {
  return { version: CONSTITUTIONAL_DIAGNOSTIC_VERSION };
}

export async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const parsed = adapterInputSchema.safeParse(input.payload);
  if (!parsed.success) {
    return {
      findings: [
        {
          id: "cd-input-invalid",
          title: "Invalid input",
          description: `Input validation failed: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
          severity: "HIGH",
          source: "constitutional-diagnostic-adapter::run::input-validation",
        },
      ],
      summary: "Input validation failed",
      severity: "HIGH",
      engineVersion: CONSTITUTIONAL_DIAGNOSTIC_VERSION,
      durationMs: Date.now() - startTime,
      limitations: [
        "Input must provide 'answers' (record of resonance/certainty per question) or 'useDefaults: true'.",
      ],
      promotionRequirements: [],
    };
  }

  const { answers: rawAnswers, useDefaults, operatorKey } = parsed.data;

  // ── Build answers ──────────────────────────────────────────────────────────
  let answers: DiagnosticAnswers;

  if (useDefaults || !rawAnswers || Object.keys(rawAnswers).length === 0) {
    // Balanced mid-range answers for testing/selfTest
    answers = Object.fromEntries(
      DEFAULT_DIAGNOSTIC_QUESTIONS.map((q) => [q.id, { resonance: 5, certainty: 5 }]),
    ) as DiagnosticAnswers;
  } else {
    answers = rawAnswers as DiagnosticAnswers;
  }

  // ── Run production derivation ──────────────────────────────────────────────
  const bundle = deriveConstitutionalDiagnosticBundle(answers, {
    operatorKey,
  });

  const { report, decision, routeSummary } = bundle;
  const severity = routeToSeverity(decision.route, decision.confidence);

  // ── Build formula trace ────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "domain-scores",
      label: "Domain score derivation",
      inputs: {
        answeredCount: report.answeredCount,
        totalQuestions: report.totalQuestions,
        completionPercent: `${report.completionPercent.toFixed(0)}%`,
      },
      intermediate: {
        authorityScore: report.authorityScore,
        coherenceScore: report.coherenceScore,
        frictionScore: report.frictionScore,
        trustScore: report.trustScore,
        seriousnessScore: report.seriousnessScore,
      },
      output: report.summary.slice(0, 80),
      sourceRule: "deriveConstitutionalDiagnosticBundle() → buildDomainMap() — lib/diagnostics/constitutional-diagnostic-derivation.ts",
      engineVersion: CONSTITUTIONAL_DIAGNOSTIC_VERSION,
    },
    {
      stepId: "constitutional-routing",
      label: "Constitutional route decision",
      inputs: {
        authorityType: report.authorityType,
        posture: report.posture,
        readinessTier: report.readinessTier,
        failureModeCount: report.failureModeCount,
      },
      intermediate: {
        confidence: decision.confidence.toFixed(3),
        postureWeight: decision.postureWeight,
        readinessWeight: decision.readinessWeight,
        disqualifiers: decision.disqualifiersTriggered.join(", ") || "none",
      },
      output: decision.route,
      sourceRule: "evaluateConstitutionalRoute() — lib/constitution/rules.ts",
      engineVersion: CONSTITUTIONAL_DIAGNOSTIC_VERSION,
    },
  ];

  // ── Build findings ─────────────────────────────────────────────────────────
  const findings: Finding[] = [];

  // 1. Route decision finding
  findings.push({
    id: `cd-route-${Date.now()}`,
    title: `Constitutional Route: ${decision.route}`,
    description: `${routeSummary.title} — ${routeSummary.description}`,
    severity,
    source: `evaluateConstitutionalRoute() confidence=${decision.confidence.toFixed(2)} — lib/constitution/rules.ts`,
    evidence: decision.rationale.slice(0, 3).join(" · "),
    remediation: decision.recommendedInterventions.slice(0, 2).join(". ") || undefined,
  });

  // 2. Key domain findings based on report
  if (report.authorityScore < 40) {
    findings.push({
      id: `cd-authority-${Date.now()}`,
      title: "Authority weakness detected",
      description: `Authority score ${report.authorityScore}/100. Decision authority is unclear or chronically diffused.`,
      severity: report.authorityScore < 25 ? "HIGH" : "MEDIUM",
      source: `buildDomainMap() → authorityScore=${report.authorityScore} — lib/diagnostics/constitutional-diagnostic-derivation.ts`,
      remediation: "Clarify decision authority before proceeding to strategy.",
    });
  }

  if (report.coherenceScore < 40) {
    findings.push({
      id: `cd-coherence-${Date.now()}`,
      title: "Narrative coherence gap",
      description: `Coherence score ${report.coherenceScore}/100. Strategy and resource allocation are not meaningfully aligned.`,
      severity: report.coherenceScore < 25 ? "HIGH" : "MEDIUM",
      source: `buildDomainMap() → coherenceScore=${report.coherenceScore} — lib/diagnostics/constitutional-diagnostic-derivation.ts`,
    });
  }

  if (report.failureModeCount >= 3) {
    findings.push({
      id: `cd-failure-${Date.now()}`,
      title: `Failure mode accumulation (${report.failureModeCount})`,
      description: `${report.failureModeCount} failure modes detected. High failure mode count indicates structural dysfunction.`,
      severity: report.failureModeCount >= 5 ? "CRITICAL" : "HIGH",
      source: `buildDomainMap() → failureModeCount=${report.failureModeCount} — lib/diagnostics/constitutional-diagnostic-derivation.ts`,
    });
  }

  if (decision.disqualifiersTriggered.length > 0) {
    findings.push({
      id: `cd-disqualifiers-${Date.now()}`,
      title: `Disqualifiers triggered (${decision.disqualifiersTriggered.length})`,
      description: decision.disqualifiersTriggered.join("; "),
      severity: "HIGH",
      source: `evaluateConstitutionalRoute() → disqualifiersTriggered — lib/constitution/rules.ts`,
    });
  }

  // 3. Key findings from micro-report
  for (const finding of report.keyFindings.slice(0, 3)) {
    findings.push({
      id: `cd-keyfinding-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: "Constitutional key finding",
      description: finding,
      severity: "INFO",
      source: "deriveConstitutionalMicroReport() → keyFindings — lib/diagnostics/constitutional-diagnostic-derivation.ts",
    });
  }

  return {
    findings,
    summary: `Constitutional Route: ${decision.route} (confidence ${(decision.confidence * 100).toFixed(0)}%) — ${report.posture} posture, ${report.readinessTier} readiness`,
    severity,
    engineVersion: CONSTITUTIONAL_DIAGNOSTIC_VERSION,
    durationMs: Date.now() - startTime,
    limitations: [
      "Wraps deterministic scoring and routing only.",
      "Does not execute AI narrative generation or executive synthesis.",
      "Does not produce strategy room session, boardroom dossier, or executive report.",
      "Does not persist session state or create journey records.",
      "Operator override mutations reflect in-memory state only (no live operator config).",
    ],
    promotionRequirements: [
      "Add narrative generation dry-run (narrative-engine.ts) with no customer-facing output.",
      "Capture strategy room admission check result as structured findings.",
      "Return boardroom dossier preview as FoundryFinding records.",
      "Prove no customer session or journey records are created in Foundry path.",
    ],
    rawOutput: {
      route: decision.route,
      confidence: decision.confidence,
      posture: report.posture,
      readinessTier: report.readinessTier,
      authorityType: report.authorityType,
      authorityScore: report.authorityScore,
      coherenceScore: report.coherenceScore,
      frictionScore: report.frictionScore,
      trustScore: report.trustScore,
      seriousnessScore: report.seriousnessScore,
      failureModeCount: report.failureModeCount,
      completionPercent: report.completionPercent,
      disqualifiersTriggered: decision.disqualifiersTriggered,
      recommendedInterventions: decision.recommendedInterventions,
      formulaSteps,
    },
  };
}

export const constitutionalDiagnosticAdapter = {
  engineId: CONSTITUTIONAL_DIAGNOSTIC_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
