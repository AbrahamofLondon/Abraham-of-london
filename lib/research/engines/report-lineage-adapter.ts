/**
 * lib/research/engines/report-lineage-adapter.ts
 *
 * Intelligence Foundry adapter for the Report Lineage Simulation engine.
 *
 * Wraps: simulateLineageChain() and simulateAllLineageChains()
 * from lib/research/lineage/report-lineage-simulation.ts
 *
 * Status: PRODUCTION_CALLABLE
 * - Calls real production logic against live Pass 1 registries
 * - No AI, no external calls, no data mutation
 * - Results are runtime proofs of governed product operating architecture
 *
 * Fixtures:
 *   - Run a specific chain by chainId (payload.chainId)
 *   - Run ALL chains when payload.all === true
 *   - Default: runs all 7 chains
 */

import "server-only";

import {
  simulateLineageChain,
  simulateAllLineageChains,
} from "@/lib/research/lineage/report-lineage-simulation";
import type { LineageSimulationChainId } from "@/lib/research/lineage/lineage-simulation-contract";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const LINEAGE_ENGINE_ID = "report-lineage";
export const LINEAGE_VERSION = "1.0.0";

const VALID_CHAIN_IDS: LineageSimulationChainId[] = [
  "executive-reporting",
  "executive-report-boardroom",
  "strategy-room",
  "outbound-publishing",
  "foundry-research-run",
  "content-editorial",
  "gmi-release",
];

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    const result = simulateLineageChain("foundry-research-run");
    if (!result || typeof result.status !== "string") {
      return { ok: false, message: "simulateLineageChain returned invalid output" };
    }
    return { ok: true, message: `Chain 'foundry-research-run' status: ${result.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return LINEAGE_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const payload = (input?.payload ?? {}) as Record<string, unknown>;
  const chainId = payload.chainId as string | undefined;
  const runAll = payload.all === true || !chainId;

  // ── Input validation ────────────────────────────────────────────────────────
  const findings: Finding[] = [];

  if (chainId && !VALID_CHAIN_IDS.includes(chainId as LineageSimulationChainId)) {
    const durationMs = Date.now() - startTime;
    return {
      findings: [
        {
          id: `lineage-invalid-chain-${Date.now()}`,
          title: "Invalid chain ID",
          description: `"${chainId}" is not a registered lineage chain. Valid chains: ${VALID_CHAIN_IDS.join(", ")}.`,
          severity: "HIGH",
          source: `${LINEAGE_ENGINE_ID}::run::input-validation`,
          evidence: `Provided chainId: "${chainId}"`,
          remediation: `Use one of: ${VALID_CHAIN_IDS.join(", ")}`,
        },
      ],
      summary: `Invalid chain ID: "${chainId}"`,
      severity: "HIGH",
      engineVersion: LINEAGE_VERSION,
      durationMs,
      limitations: [],
      rawOutput: { engineId: LINEAGE_ENGINE_ID, runAt: new Date().toISOString() },
    };
  }

  // ── Run simulation ──────────────────────────────────────────────────────────
  const results = runAll
    ? simulateAllLineageChains()
    : [simulateLineageChain(chainId as LineageSimulationChainId)];

  // ── Formula steps ───────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "chain-selection",
      label: "Chain selection",
      inputs: {
        mode: runAll ? "all" : "single",
        requestedChain: chainId ?? "all",
        availableChains: VALID_CHAIN_IDS.length,
      },
      output: runAll ? VALID_CHAIN_IDS.length : 1,
      sourceRule: "simulateLineageChain() / simulateAllLineageChains() — lib/research/lineage/report-lineage-simulation.ts",
      engineVersion: LINEAGE_VERSION,
    },
  ];

  const completeCount = results.filter((r) => r.status === "COMPLETE").length;
  const partialCount = results.filter((r) => r.status === "PARTIAL").length;
  const brokenCount = results.filter((r) => r.status === "BROKEN").length;

  formulaSteps.push({
    stepId: "chain-status-aggregation",
    label: "Chain status aggregation",
    inputs: {
      totalChains: results.length,
      completeCount,
      partialCount,
      brokenCount,
    },
    intermediate: {
      passingRate: results.length > 0 ? `${Math.round((completeCount / results.length) * 100)}%` : "0%",
    },
    output: `${completeCount}/${results.length} chains COMPLETE`,
    sourceRule: "simulateAllLineageChains() → aggregate — lib/research/lineage/report-lineage-simulation.ts",
    engineVersion: LINEAGE_VERSION,
  });

  // ── Map results to findings ─────────────────────────────────────────────────
  for (const result of results) {
    if (result.status === "COMPLETE" && result.gaps.length === 0) continue;

    for (const gap of result.gaps) {
      findings.push({
        id: `lineage-gap-${result.chainId}-${gap.gapType}-${Date.now()}`,
        title: `[${result.chainId}] ${gap.gapType}`,
        description: gap.explanation,
        severity: gap.severity === "CRITICAL" ? "CRITICAL"
          : gap.severity === "HIGH" ? "HIGH"
          : gap.severity === "MEDIUM" ? "MEDIUM"
          : "INFO",
        source: `${LINEAGE_ENGINE_ID}::${result.chainId}::${gap.sourceRule}`,
        evidence: `Event: ${gap.eventType}`,
        remediation: gap.recommendation,
      });
    }

    if (result.researchRunRecommended) {
      findings.push({
        id: `lineage-research-run-${result.chainId}-${Date.now()}`,
        title: `[${result.chainId}] Research run recommended`,
        description: `Chain "${result.title}" has gaps requiring investigation.`,
        severity: "MEDIUM",
        source: `${LINEAGE_ENGINE_ID}::${result.chainId}::research-run-flag`,
        evidence: `${result.gaps.length} gap(s) detected`,
        remediation: "Create a ResearchRun to document and track remediation.",
      });
    }
  }

  // ── Overall severity ────────────────────────────────────────────────────────
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHigh = findings.some((f) => f.severity === "HIGH");
  const overallSeverity = hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : brokenCount > 0 ? "MEDIUM" : partialCount > 0 ? "LOW" : "INFO";

  const summary =
    brokenCount === 0 && partialCount === 0
      ? `All ${results.length} lineage chain(s) COMPLETE — Pass 1 registry coverage verified.`
      : `${brokenCount} broken, ${partialCount} partial out of ${results.length} chain(s). ${findings.length} finding(s) raised.`;

  const durationMs = Date.now() - startTime;

  return {
    findings,
    summary,
    severity: overallSeverity,
    engineVersion: LINEAGE_VERSION,
    durationMs,
    limitations: [
      "Lineage simulation validates registry coverage only — not live database state.",
      "COMPLETE status means all registry links exist, not that events have been emitted in production.",
    ],
    rawOutput: {
      engineId: LINEAGE_ENGINE_ID,
      runAt: new Date().toISOString(),
      formulaSteps,
      chains: results.map((r) => ({
        chainId: r.chainId,
        title: r.title,
        status: r.status,
        eventCount: r.events.length,
        gapCount: r.gaps.length,
        findingCount: r.findings.length,
      })),
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const reportLineageAdapter = {
  id: LINEAGE_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
