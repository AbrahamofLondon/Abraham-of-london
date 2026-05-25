/**
 * lib/research/engines/fast-diagnostic-adapter.ts
 *
 * Intelligence Foundry adapter for the Fast Diagnostic engine.
 * Wraps real production logic: input validation, scoring, and result generation.
 *
 * Status: PRODUCTION_CALLABLE
 *   - Input validation: callable (Zod schema)
 *   - Scoring: callable (percentageScore, severityFromScore, verdictFromScore)
 *   - Full diagnostic result: PRODUCTION_NEEDS_WRAP (requires AI synthesis pipeline)
 *
 * Limitations:
 *   - Full FastDiagnosticResult with AI synthesis is not wrapped.
 *     The adapter validates inputs and computes deterministic scores only.
 *   - AI-generated fields (synthesis, forecast, anchorNarrative, signals) are
 *     returned as null with a note that they require the full pipeline.
 */

import "server-only";

import { z } from "zod";
import {
  percentageScore,
  severityFromScore,
  verdictFromScore,
} from "@/lib/diagnostics/scoring";
import { diagnosticSubmissionSchema } from "@/lib/diagnostics/runtime-validation";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const FAST_DIAGNOSTIC_ENGINE_ID = "fast-diagnostic";
export const FAST_DIAGNOSTIC_VERSION = "2.1.0";

// ─── Input Schema ────────────────────────────────────────────────────────────

/**
 * The adapter accepts either:
 * 1. A full diagnostic submission (matching the production Zod schema)
 * 2. A simplified fixture with answers array and metadata
 */
const adapterInputSchema = z.object({
  /** Production-format diagnostic submission */
  submission: diagnosticSubmissionSchema.optional(),
  /** Simplified fixture for quick testing */
  fixture: z
    .object({
      answers: z
        .array(
          z.object({
            sectionId: z.string().min(1),
            questionId: z.string().min(1),
            prompt: z.string().min(1),
            value: z.number().int().min(1).max(5),
          })
        )
        .min(1),
      kind: z.string().default("fast_diagnostic"),
      version: z.string().default("2.1.0"),
      source: z.string().default("intelligence-foundry"),
      entry: z.string().default("adapter-test"),
      intent: z.string().default("research"),
      title: z.string().default("Fast Diagnostic — Adapter Test"),
    })
    .optional(),
});

// ─── Adapter ─────────────────────────────────────────────────────────────────

export async function selfTest(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const result = await run({
      payload: {
        fixture: {
          answers: [
            { sectionId: "authority", questionId: "q1", prompt: "Decision clarity?", value: 4 },
            { sectionId: "authority", questionId: "q2", prompt: "Ownership clear?", value: 3 },
            { sectionId: "execution", questionId: "q3", prompt: "Prior attempt?", value: 2 },
          ],
        },
      },
    });

    if (result.findings.length === 0) {
      return { ok: false, detail: "No findings produced" };
    }

    return { ok: true, detail: `${result.findings.length} findings, severity: ${result.severity}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function getVersion(): Promise<{ version: string; fileHash?: string }> {
  return { version: FAST_DIAGNOSTIC_VERSION };
}

export async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  // ── Parse input ────────────────────────────────────────────────────────
  const parsed = adapterInputSchema.safeParse(input.payload);
  if (!parsed.success) {
    return {
      findings: [
        {
          id: "fd-input-invalid",
          title: "Invalid input",
          description: `Input validation failed: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
          severity: "HIGH",
          source: "fast-diagnostic-adapter::run::input-validation",
        },
      ],
      summary: "Input validation failed",
      severity: "HIGH",
      engineVersion: FAST_DIAGNOSTIC_VERSION,
      durationMs: Date.now() - startTime,
    };
  }

  const { submission, fixture } = parsed.data;

  // ── Extract answers ────────────────────────────────────────────────────
  let answers: Array<{ sectionId: string; questionId: string; prompt: string; value: number }>;
  let kind: string;
  let version: string;
  let source: string;
  let entry: string;
  let intent: string;
  let title: string;

  if (submission) {
    answers = submission.answers;
    kind = submission.kind;
    version = submission.version;
    source = submission.source;
    entry = submission.entry;
    intent = submission.intent;
    title = submission.title;
  } else if (fixture) {
    answers = fixture.answers;
    kind = fixture.kind;
    version = fixture.version;
    source = fixture.source;
    entry = fixture.entry;
    intent = fixture.intent;
    title = fixture.title;
  } else {
    return {
      findings: [{
        id: "fd-no-input",
        title: "No input provided",
        description: "Provide either a submission or a fixture.",
        severity: "HIGH",
        source: "fast-diagnostic-adapter::run::input-check",
      }],
      summary: "No input provided",
      severity: "HIGH",
      engineVersion: FAST_DIAGNOSTIC_VERSION,
      durationMs: Date.now() - startTime,
    };
  }

  // ── Compute scores ─────────────────────────────────────────────────────
  const numericValues = answers.map((a) => a.value / 5); // Normalize 1-5 to 0-1
  const score = percentageScore(numericValues);
  const severity = severityFromScore(score);
  const verdict = verdictFromScore(score);

  // ── Build formula trace ────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "normalize",
      label: "Normalize answers (1-5 → 0-1)",
      inputs: { answerCount: answers.length, rawValues: answers.map((a) => a.value).join(",") },
      intermediate: { normalized: numericValues.map((v) => v.toFixed(2)).join(",") },
      output: `${numericValues.length} values normalized`,
      sourceRule: "value / 5 for each answer",
      engineVersion: FAST_DIAGNOSTIC_VERSION,
    },
    {
      stepId: "score",
      label: "Compute percentage score",
      inputs: { normalizedCount: numericValues.length },
      intermediate: { sum: numericValues.reduce((a, b) => a + b, 0).toFixed(2) },
      output: `${score}%`,
      sourceRule: "percentageScore(): sum(normalized) / count * 100",
      engineVersion: FAST_DIAGNOSTIC_VERSION,
    },
    {
      stepId: "severity",
      label: "Classify severity from score",
      inputs: { score: `${score}%` },
      output: severity,
      sourceRule: "severityFromScore(): thresholds at 90/75/55/35/15",
      engineVersion: FAST_DIAGNOSTIC_VERSION,
    },
  ];

  // ── Build findings ─────────────────────────────────────────────────────
  const findings: Finding[] = [
    {
      id: `fd-score-${Date.now()}`,
      title: `Fast Diagnostic Score: ${score}%`,
      description: `Computed from ${answers.length} answers across ${new Set(answers.map((a) => a.sectionId)).size} sections.`,
      severity: severity === "critical" || severity === "systemic" ? "CRITICAL" : severity === "high" ? "HIGH" : severity === "moderate" ? "MEDIUM" : "INFO",
      source: "fast-diagnostic-adapter::run::scoring",
      evidence: `Answers: ${answers.map((a) => `${a.sectionId}/${a.questionId}=${a.value}`).join(", ")}`,
      remediation: score < 55 ? "Review diagnostic inputs. Low scores indicate governance gaps." : undefined,
    },
    {
      id: `fd-verdict-${Date.now()}`,
      title: "Diagnostic Verdict",
      description: verdict,
      severity: "INFO",
      source: "fast-diagnostic-adapter::run::verdictFromScore",
      evidence: `Score ${score}% maps to verdict: "${verdict}"`,
    },
  ];

  // ── Note limitations ───────────────────────────────────────────────────
  findings.push({
    id: `fd-limitation-${Date.now()}`,
    title: "Limited to deterministic scoring",
    description:
      "Full Fast Diagnostic result with AI synthesis, forecast, anchor narrative, and signal detection requires the complete production pipeline. This adapter validates inputs and computes deterministic scores only.",
    severity: "INFO",
    source: "fast-diagnostic-adapter::run::limitation-note",
    evidence: "AI synthesis pipeline not wrapped. See PRODUCTION_NEEDS_WRAP status for full diagnostic.",
  });

  return {
    findings,
    summary: `Fast Diagnostic: ${score}% — ${verdict}`,
    severity: findings.find((f) => f.severity === "CRITICAL") ? "CRITICAL" : findings.find((f) => f.severity === "HIGH") ? "HIGH" : "INFO",
    engineVersion: FAST_DIAGNOSTIC_VERSION,
    durationMs: Date.now() - startTime,
    rawOutput: {
      score,
      severity,
      verdict,
      answerCount: answers.length,
      sectionCount: new Set(answers.map((a) => a.sectionId)).size,
      formulaSteps,
    },
  };
}

export const fastDiagnosticAdapter = {
  engineId: FAST_DIAGNOSTIC_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
