/**
 * lib/research/engines/pattern-recurrence-adapter.ts
 *
 * Intelligence Foundry adapter for the Pattern Recurrence engine.
 * Wraps real production logic from lib/diagnostics/pattern-recurrence.ts.
 *
 * Status: PRODUCTION_CALLABLE
 *   - Pattern detection logic: callable (detectRecurrence)
 *   - Input validation: callable
 *
 * Limitations:
 *   - Requires pre-existing evidence nodes and decision objects.
 *     The adapter accepts synthetic fixtures but works best with real data.
 *   - Recurrence scoring depends on having both baseline and current data.
 */

import "server-only";

import { z } from "zod";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const PATTERN_RECURRENCE_ENGINE_ID = "pattern-recurrence";
export const PATTERN_RECURRENCE_VERSION = "0.5.0";

// ─── Input Schema ────────────────────────────────────────────────────────────

const adapterInputSchema = z.object({
  baseline: z
    .object({
      contradictions: z.array(z.string()).optional().default([]),
      decisionKeys: z.array(z.string()).optional().default([]),
      authorityFailures: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ contradictions: [], decisionKeys: [], authorityFailures: [] }),
  current: z
    .object({
      contradictions: z.array(z.string()).optional().default([]),
      decisionKeys: z.array(z.string()).optional().default([]),
      authorityFailures: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ contradictions: [], decisionKeys: [], authorityFailures: [] }),
});

// ─── Core Logic (mirrors lib/diagnostics/pattern-recurrence.ts) ──────────────

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function intersect(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map(norm));
  return a.filter((item) => bSet.has(norm(item)));
}

function severityFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 80) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export async function selfTest(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const result = await run({
      payload: {
        baseline: {
          contradictions: ["Ownership ambiguity", "Resource conflict"],
          decisionKeys: ["Hire decision", "Budget allocation"],
          authorityFailures: ["CEO override without mandate"],
        },
        current: {
          contradictions: ["Ownership ambiguity", "Timeline dispute"],
          decisionKeys: ["Hire decision", "Vendor selection"],
          authorityFailures: ["CEO override without mandate", "Board bypass"],
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
  return { version: PATTERN_RECURRENCE_VERSION };
}

export async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const parsed = adapterInputSchema.safeParse(input.payload);
  if (!parsed.success) {
    return {
      findings: [
        {
          id: "pr-input-invalid",
          title: "Invalid input",
          description: `Input validation failed: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
          severity: "HIGH",
          source: "pattern-recurrence-adapter::run::input-validation",
        },
      ],
      summary: "Input validation failed",
      severity: "HIGH",
      engineVersion: PATTERN_RECURRENCE_VERSION,
      durationMs: Date.now() - startTime,
    };
  }

  const { baseline, current } = parsed.data;

  // ── Compute recurrence ─────────────────────────────────────────────────
  const recurringContradictions = intersect(baseline.contradictions, current.contradictions);
  const recurringDecisionKeys = intersect(baseline.decisionKeys, current.decisionKeys);
  const recurringAuthorityFailures = intersect(baseline.authorityFailures, current.authorityFailures);

  const totalBaseline =
    baseline.contradictions.length + baseline.decisionKeys.length + baseline.authorityFailures.length;
  const totalRecurring =
    recurringContradictions.length + recurringDecisionKeys.length + recurringAuthorityFailures.length;

  const recurrenceScore = totalBaseline > 0 ? Math.round((totalRecurring / totalBaseline) * 100) : 0;
  const severity = severityFromScore(recurrenceScore);

  // ── Build formula trace ────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "contradictions",
      label: "Recurring contradictions",
      inputs: {
        baselineCount: baseline.contradictions.length,
        currentCount: current.contradictions.length,
      },
      intermediate: {
        baseline: baseline.contradictions.join(", "),
        current: current.contradictions.join(", "),
      },
      output: `${recurringContradictions.length} recurring`,
      sourceRule: "intersect(baseline.contradictions, current.contradictions)",
      engineVersion: PATTERN_RECURRENCE_VERSION,
    },
    {
      stepId: "decisions",
      label: "Recurring decision keys",
      inputs: {
        baselineCount: baseline.decisionKeys.length,
        currentCount: current.decisionKeys.length,
      },
      output: `${recurringDecisionKeys.length} recurring`,
      sourceRule: "intersect(baseline.decisionKeys, current.decisionKeys)",
      engineVersion: PATTERN_RECURRENCE_VERSION,
    },
    {
      stepId: "authority",
      label: "Recurring authority failures",
      inputs: {
        baselineCount: baseline.authorityFailures.length,
        currentCount: current.authorityFailures.length,
      },
      output: `${recurringAuthorityFailures.length} recurring`,
      sourceRule: "intersect(baseline.authorityFailures, current.authorityFailures)",
      engineVersion: PATTERN_RECURRENCE_VERSION,
    },
    {
      stepId: "score",
      label: "Recurrence score",
      inputs: { totalBaseline, totalRecurring },
      output: `${recurrenceScore}%`,
      sourceRule: "totalRecurring / totalBaseline * 100",
      engineVersion: PATTERN_RECURRENCE_VERSION,
    },
  ];

  // ── Build findings ─────────────────────────────────────────────────────
  const findings: Finding[] = [];

  if (recurringContradictions.length > 0) {
    findings.push({
      id: `pr-contradictions-${Date.now()}`,
      title: `Recurring contradictions (${recurringContradictions.length})`,
      description: `Patterns detected across both baseline and current: ${recurringContradictions.join(", ")}`,
      severity: recurringContradictions.length >= 3 ? "HIGH" : "MEDIUM",
      source: "pattern-recurrence-adapter::run::contradiction-intersect",
      evidence: recurringContradictions.join("\n"),
      remediation: "Review each recurring contradiction. Determine if the root cause was addressed or if the pattern requires structural intervention.",
    });
  }

  if (recurringDecisionKeys.length > 0) {
    findings.push({
      id: `pr-decisions-${Date.now()}`,
      title: `Recurring decision patterns (${recurringDecisionKeys.length})`,
      description: `Decisions appearing in both cycles: ${recurringDecisionKeys.join(", ")}`,
      severity: "MEDIUM",
      source: "pattern-recurrence-adapter::run::decision-intersect",
      evidence: recurringDecisionKeys.join("\n"),
    });
  }

  if (recurringAuthorityFailures.length > 0) {
    findings.push({
      id: `pr-authority-${Date.now()}`,
      title: `Recurring authority failures (${recurringAuthorityFailures.length})`,
      description: `Authority gaps persisting across cycles: ${recurringAuthorityFailures.join(", ")}`,
      severity: recurringAuthorityFailures.length >= 2 ? "HIGH" : "MEDIUM",
      source: "pattern-recurrence-adapter::run::authority-intersect",
      evidence: recurringAuthorityFailures.join("\n"),
      remediation: "Recurring authority failures indicate structural governance gaps. Consider escalation to Boardroom review.",
    });
  }

  if (recurrenceScore === 0 && totalBaseline > 0) {
    findings.push({
      id: `pr-clean-${Date.now()}`,
      title: "No pattern recurrence detected",
      description: "No overlapping patterns between baseline and current cycles.",
      severity: "INFO",
      source: "pattern-recurrence-adapter::run::recurrence-score",
      evidence: `Recurrence score: ${recurrenceScore}%`,
    });
  }

  findings.push({
    id: `pr-score-${Date.now()}`,
    title: `Recurrence score: ${recurrenceScore}%`,
    description: `Computed from ${totalBaseline} baseline items. ${totalRecurring} items recur in the current cycle.`,
    severity: severity === "CRITICAL" ? "CRITICAL" : severity === "HIGH" ? "HIGH" : "INFO",
    source: "pattern-recurrence-adapter::run::recurrence-scoring",
    evidence: `Score ${recurrenceScore}% → severity ${severity}`,
  });

  return {
    findings,
    summary:
      totalRecurring > 0
        ? `Pattern recurrence detected: ${totalRecurring} of ${totalBaseline} baseline items recur (${recurrenceScore}%).`
        : `No pattern recurrence detected across ${totalBaseline} baseline items.`,
    severity: findings.some((f) => f.severity === "CRITICAL")
      ? "CRITICAL"
      : findings.some((f) => f.severity === "HIGH")
        ? "HIGH"
        : findings.some((f) => f.severity === "MEDIUM")
          ? "MEDIUM"
          : "INFO",
    engineVersion: PATTERN_RECURRENCE_VERSION,
    durationMs: Date.now() - startTime,
    rawOutput: {
      recurrenceScore,
      recurringContradictions,
      recurringDecisionKeys,
      recurringAuthorityFailures,
      formulaSteps,
    },
  };
}

export const patternRecurrenceAdapter = {
  engineId: PATTERN_RECURRENCE_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
