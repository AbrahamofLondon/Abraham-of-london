/**
 * lib/research/engines/enforcement-gates-adapter.ts
 *
 * Intelligence Foundry adapter for the Enforcement Gates engine.
 *
 * Wraps: runAllRules() and aggregateStatus() from
 * lib/research/product-health/product-health-rules.ts
 *
 * Status: PRODUCTION_CALLABLE
 * - Evaluates all 10 product health rules for one or more surfaces
 * - Returns blockers that would prevent a merge or deploy
 * - Surfaces RED-status rules as HIGH findings (enforcement blockers)
 * - Surfaces AMBER-status rules as MEDIUM findings (warnings)
 * - No AI, no external calls, no data mutation
 *
 * Payload fields:
 *   - surfaceIds: string[] — surface IDs from product-ladder-registry to check
 *   - useCriticalSurfaces: boolean — use the critical governance surfaces (default)
 */

import "server-only";

import {
  runAllRules,
  aggregateStatus,
  type RuleResult,
} from "@/lib/research/product-health/product-health-rules";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const ENFORCEMENT_GATES_ENGINE_ID = "enforcement-gates";
export const ENFORCEMENT_GATES_VERSION = "1.0.0";

// ─── Default surfaces to check ───────────────────────────────────────────────

// The most critical governance surfaces — failures here block delivery.
const CRITICAL_SURFACES = [
  "executive-reporting",
  "boardroom-mode",
  "strategy-room",
  "fast-diagnostic",
  "outbound-linkedin",
  "outbound-facebook",
  "outbound-x",
];

const RULE_LABELS = [
  "Product surface registered",
  "Canonical record registered",
  "Admin owner declared",
  "Foundry module wired",
  "Lineage chain COMPLETE",
  "Governance event vocabulary",
  "Entitlement declared",
  "Outbound eligibility",
  "Simulation-only events",
  "Boardroom delivery truth",
];

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    const results = runAllRules("executive-reporting");
    if (!Array.isArray(results) || results.length === 0) {
      return { ok: false, message: "runAllRules returned empty or invalid output" };
    }
    const agg = aggregateStatus(results);
    if (!["GREEN", "AMBER", "RED", "GREY"].includes(agg.status)) {
      return { ok: false, message: `Unexpected aggregate status: ${agg.status}` };
    }
    return { ok: true, message: `executive-reporting: ${agg.status} (${results.length} rules)` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return ENFORCEMENT_GATES_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const payload = (input?.payload ?? {}) as Record<string, unknown>;
  const findings: Finding[] = [];

  // ── Determine surfaces to check ────────────────────────────────────────────
  let surfaceIds: string[];
  if (Array.isArray(payload.surfaceIds) && payload.surfaceIds.length > 0) {
    surfaceIds = payload.surfaceIds.filter((s): s is string => typeof s === "string");
  } else {
    surfaceIds = CRITICAL_SURFACES;
  }

  // ── Run rules for each surface ──────────────────────────────────────────────
  const surfaceResults: Array<{
    surfaceId: string;
    rules: RuleResult[];
    aggregate: { status: string; explanation: string };
    redCount: number;
    amberCount: number;
  }> = [];

  const formulaSteps: FormulaStep[] = [
    {
      stepId: "surface-selection",
      label: "Surface selection",
      inputs: {
        surfaceCount: surfaceIds.length,
        surfaces: surfaceIds.join(", "),
        ruleCount: RULE_LABELS.length,
      },
      output: `${surfaceIds.length} surface(s) × ${RULE_LABELS.length} rules`,
      sourceRule: "runAllRules() — lib/research/engines/enforcement-gates-adapter.ts",
      engineVersion: ENFORCEMENT_GATES_VERSION,
    },
  ];

  for (const surfaceId of surfaceIds) {
    const rules = runAllRules(surfaceId);
    const aggregate = aggregateStatus(rules);
    const redCount = rules.filter((r) => r.status === "RED").length;
    const amberCount = rules.filter((r) => r.status === "AMBER").length;

    surfaceResults.push({ surfaceId, rules, aggregate, redCount, amberCount });
  }

  formulaSteps.push({
    stepId: "gate-aggregation",
    label: "Gate aggregation across surfaces",
    inputs: {
      greenSurfaces: surfaceResults.filter((r) => r.aggregate.status === "GREEN").length,
      amberSurfaces: surfaceResults.filter((r) => r.aggregate.status === "AMBER").length,
      redSurfaces: surfaceResults.filter((r) => r.aggregate.status === "RED").length,
    },
    intermediate: {
      totalRedRules: surfaceResults.reduce((acc, r) => acc + r.redCount, 0),
      totalAmberRules: surfaceResults.reduce((acc, r) => acc + r.amberCount, 0),
    },
    output: surfaceResults.every((r) => r.aggregate.status === "GREEN")
      ? "ALL GATES PASS"
      : `${surfaceResults.filter((r) => r.aggregate.status === "RED").length} surface(s) blocked`,
    sourceRule: "aggregateStatus() — lib/research/engines/enforcement-gates-adapter.ts",
    engineVersion: ENFORCEMENT_GATES_VERSION,
  });

  // ── Map to findings ─────────────────────────────────────────────────────────
  for (const sr of surfaceResults) {
    for (let ruleIdx = 0; ruleIdx < sr.rules.length; ruleIdx++) {
      const rule = sr.rules[ruleIdx];
      if (!rule) continue;
      const ruleLabel = RULE_LABELS[ruleIdx] ?? `Rule ${ruleIdx + 1}`;

      if (rule.status === "RED") {
        findings.push({
          id: `enforcement-gate-red-${sr.surfaceId}-rule${ruleIdx}-${Date.now()}`,
          title: `[${sr.surfaceId}] GATE BLOCKED — ${ruleLabel}`,
          description: rule.explanation,
          severity: "HIGH",
          source: `${ENFORCEMENT_GATES_ENGINE_ID}::${sr.surfaceId}::rule-${ruleIdx}`,
          evidence: `Surface: ${sr.surfaceId}, Rule: ${ruleLabel}`,
          remediation: "Resolve the RED rule before this surface can proceed to production delivery.",
        });
      } else if (rule.status === "AMBER") {
        findings.push({
          id: `enforcement-gate-amber-${sr.surfaceId}-rule${ruleIdx}-${Date.now()}`,
          title: `[${sr.surfaceId}] GATE WARNING — ${ruleLabel}`,
          description: rule.explanation,
          severity: "MEDIUM",
          source: `${ENFORCEMENT_GATES_ENGINE_ID}::${sr.surfaceId}::rule-${ruleIdx}`,
          evidence: `Surface: ${sr.surfaceId}, Rule: ${ruleLabel}`,
          remediation: "Review and resolve this amber rule to achieve full governance compliance.",
        });
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const redSurfaces = surfaceResults.filter((r) => r.aggregate.status === "RED");
  const amberSurfaces = surfaceResults.filter((r) => r.aggregate.status === "AMBER");
  const allPass = redSurfaces.length === 0 && amberSurfaces.length === 0;

  const severity = redSurfaces.length > 0 ? "HIGH" : amberSurfaces.length > 0 ? "MEDIUM" : "INFO";

  const summary = allPass
    ? `All ${surfaceIds.length} surface(s) pass all enforcement gates.`
    : `${redSurfaces.length} surface(s) BLOCKED, ${amberSurfaces.length} surface(s) at AMBER. ${findings.length} finding(s) raised.`;

  const durationMs = Date.now() - startTime;

  return {
    findings,
    summary,
    severity,
    engineVersion: ENFORCEMENT_GATES_VERSION,
    durationMs,
    limitations: [
      "Enforcement gates evaluate registry coverage and rule compliance only — not live runtime state.",
      "RED findings indicate a governance gap, not necessarily a code defect.",
      "All rules must pass GREEN before a surface is considered fully governance-compliant.",
    ],
    rawOutput: {
      engineId: ENFORCEMENT_GATES_ENGINE_ID,
      runAt: new Date().toISOString(),
      formulaSteps,
      surfaceResults: surfaceResults.map((sr) => ({
        surfaceId: sr.surfaceId,
        aggregate: sr.aggregate,
        redCount: sr.redCount,
        amberCount: sr.amberCount,
        rules: sr.rules.map((r, i) => ({
          label: RULE_LABELS[i] ?? `Rule ${i + 1}`,
          status: r.status,
          explanation: r.explanation,
        })),
      })),
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const enforcementGatesAdapter = {
  id: ENFORCEMENT_GATES_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
