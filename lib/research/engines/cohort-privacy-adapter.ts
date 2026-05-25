/**
 * lib/research/engines/cohort-privacy-adapter.ts
 *
 * Intelligence Foundry adapter for the Cohort Privacy engine.
 *
 * Wraps:
 *   - cohortMeetsPublicationThreshold() from lib/proof/cohort-proof-contract.ts
 *   - determineLanguageLevel() from lib/proof/cohort-proof-contract.ts
 *
 * Status: PRODUCTION_CALLABLE
 * - Tests a range of sample sizes against publication thresholds
 * - Returns deterministic pass/fail for each cohort size
 * - Enforces the governing rule: no public aggregate claim below N=15
 * - No AI, no external calls, no data mutation
 *
 * Payload fields:
 *   - sampleSizes: number[] — cohort sizes to test (default: [1, 5, 14, 15, 29, 30, 49, 50, 100])
 *   - scenario: "single" | "matrix" — test single value or full matrix
 *   - sampleSize: number — for single scenario
 */

import "server-only";

import {
  cohortMeetsPublicationThreshold,
  determineLanguageLevel,
  COHORT_PROOF_THRESHOLDS,
} from "@/lib/proof/cohort-proof-contract";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const COHORT_PRIVACY_ENGINE_ID = "cohort-privacy";
export const COHORT_PRIVACY_VERSION = "1.0.0";

// ─── Default test matrix ─────────────────────────────────────────────────────

const DEFAULT_SAMPLE_SIZES = [1, 4, 5, 14, 15, 29, 30, 49, 50, 100];

// ─── Types ───────────────────────────────────────────────────────────────────

type CohortCheckRow = {
  sampleSize: number;
  meetsPublicationThreshold: boolean;
  languageLevel: string;
  internalEligible: boolean;
  causalEligible: boolean;
  confidenceIntervalEligible: boolean;
};

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    const below = cohortMeetsPublicationThreshold(14);
    const above = cohortMeetsPublicationThreshold(15);
    const levelInsufficient = determineLanguageLevel(3);
    const levelCausal = determineLanguageLevel(50);

    if (below !== false) return { ok: false, message: `Expected false for N=14, got ${below}` };
    if (above !== true) return { ok: false, message: `Expected true for N=15, got ${above}` };
    if (levelInsufficient !== "insufficient") return { ok: false, message: `Expected 'insufficient' for N=3, got ${levelInsufficient}` };
    if (levelCausal !== "causal") return { ok: false, message: `Expected 'causal' for N=50, got ${levelCausal}` };

    return { ok: true, message: "Threshold and language level functions verified." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return COHORT_PRIVACY_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const payload = (input?.payload ?? {}) as Record<string, unknown>;
  const findings: Finding[] = [];

  // ── Determine sample sizes to test ─────────────────────────────────────────
  let sampleSizes: number[];

  if (payload.scenario === "single" && typeof payload.sampleSize === "number") {
    sampleSizes = [payload.sampleSize];
  } else if (Array.isArray(payload.sampleSizes) && payload.sampleSizes.length > 0) {
    sampleSizes = payload.sampleSizes.filter((s): s is number => typeof s === "number" && isFinite(s));
    if (sampleSizes.length === 0) {
      sampleSizes = DEFAULT_SAMPLE_SIZES;
    }
  } else {
    sampleSizes = DEFAULT_SAMPLE_SIZES;
  }

  // ── Build check matrix ─────────────────────────────────────────────────────
  const checkMatrix: CohortCheckRow[] = sampleSizes.map((n) => ({
    sampleSize: n,
    meetsPublicationThreshold: cohortMeetsPublicationThreshold(n),
    languageLevel: determineLanguageLevel(n),
    internalEligible: n >= COHORT_PROOF_THRESHOLDS.MIN_INTERNAL_SAMPLE,
    causalEligible: n >= COHORT_PROOF_THRESHOLDS.MIN_CAUSAL_SAMPLE,
    confidenceIntervalEligible: n >= COHORT_PROOF_THRESHOLDS.MIN_CONFIDENCE_INTERVAL_SAMPLE,
  }));

  // ── Formula steps ───────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "threshold-constants",
      label: "Publication threshold constants",
      inputs: {
        MIN_PUBLISHABLE_SAMPLE: COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE,
        MIN_INTERNAL_SAMPLE: COHORT_PROOF_THRESHOLDS.MIN_INTERNAL_SAMPLE,
        MIN_CAUSAL_SAMPLE: COHORT_PROOF_THRESHOLDS.MIN_CAUSAL_SAMPLE,
        MIN_CONFIDENCE_INTERVAL_SAMPLE: COHORT_PROOF_THRESHOLDS.MIN_CONFIDENCE_INTERVAL_SAMPLE,
      },
      output: `min-publishable: ${COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE}`,
    },
    {
      stepId: "threshold-evaluation",
      label: "Publication threshold evaluation",
      inputs: {
        samplesTestedCount: sampleSizes.length,
        belowThreshold: checkMatrix.filter((r) => !r.meetsPublicationThreshold).length,
        aboveThreshold: checkMatrix.filter((r) => r.meetsPublicationThreshold).length,
      },
      output: `${checkMatrix.filter((r) => r.meetsPublicationThreshold).length}/${sampleSizes.length} publishable`,
    },
    {
      stepId: "language-level-distribution",
      label: "Language level distribution",
      inputs: {
        insufficientCount: checkMatrix.filter((r) => r.languageLevel === "insufficient").length,
        observationalCount: checkMatrix.filter((r) => r.languageLevel === "observational").length,
        associativeCount: checkMatrix.filter((r) => r.languageLevel === "associative").length,
        causalCount: checkMatrix.filter((r) => r.languageLevel === "causal").length,
      },
      output: "language levels computed",
    },
  ];

  // ── Findings for below-threshold samples ───────────────────────────────────
  const belowThreshold = checkMatrix.filter((r) => !r.meetsPublicationThreshold);

  if (belowThreshold.length > 0) {
    findings.push({
      id: `cohort-below-threshold-${Date.now()}`,
      title: `${belowThreshold.length} sample size(s) below publication threshold`,
      description: `Cohort sizes below N=${COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE} must not be used in public aggregate claims. Affected sizes: ${belowThreshold.map((r) => r.sampleSize).join(", ")}.`,
      severity: "HIGH",
      source: `${COHORT_PRIVACY_ENGINE_ID}::cohortMeetsPublicationThreshold`,
      evidence: `MIN_PUBLISHABLE_SAMPLE = ${COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE}`,
      remediation: `Ensure all public cohort proof statements use N≥${COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE}. Below this threshold only internal display is permitted (N≥${COHORT_PROOF_THRESHOLDS.MIN_INTERNAL_SAMPLE}).`,
    });
  }

  // ── Findings for language level warnings ───────────────────────────────────
  const abovePublishable = checkMatrix.filter((r) => r.meetsPublicationThreshold && !r.causalEligible);
  if (abovePublishable.length > 0) {
    findings.push({
      id: `cohort-language-level-${Date.now()}`,
      title: `${abovePublishable.length} publishable cohort(s) restricted to associative language`,
      description: `Cohort sizes between N=${COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE} and N=${COHORT_PROOF_THRESHOLDS.MIN_CAUSAL_SAMPLE - 1} must use associative language only ("associated with", "observed in"). Causal language is prohibited.`,
      severity: "MEDIUM",
      source: `${COHORT_PRIVACY_ENGINE_ID}::determineLanguageLevel`,
      evidence: `Affected sizes: ${abovePublishable.map((r) => r.sampleSize).join(", ")}`,
      remediation: `Use causal language only when N≥${COHORT_PROOF_THRESHOLDS.MIN_CAUSAL_SAMPLE}.`,
    });
  }

  // ── Passing signal ──────────────────────────────────────────────────────────
  const allPublishable = checkMatrix.filter((r) => r.meetsPublicationThreshold);
  if (allPublishable.length > 0) {
    findings.push({
      id: `cohort-publishable-${Date.now()}`,
      title: `${allPublishable.length} cohort size(s) meet publication threshold`,
      description: `These sample sizes are eligible for public aggregate claim publication: ${allPublishable.map((r) => r.sampleSize).join(", ")}.`,
      severity: "INFO",
      source: `${COHORT_PRIVACY_ENGINE_ID}::cohortMeetsPublicationThreshold`,
      evidence: `MIN_PUBLISHABLE_SAMPLE = ${COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE}`,
    });
  }

  // ── Overall severity ────────────────────────────────────────────────────────
  const severity = belowThreshold.length > 0 ? "HIGH" : abovePublishable.length > 0 ? "MEDIUM" : "INFO";

  const summary = belowThreshold.length === 0
    ? `All ${sampleSizes.length} cohort size(s) meet publication threshold. Language level governance verified.`
    : `${belowThreshold.length}/${sampleSizes.length} cohort size(s) below publication threshold (N<${COHORT_PROOF_THRESHOLDS.MIN_PUBLISHABLE_SAMPLE}).`;

  const durationMs = Date.now() - startTime;

  return {
    findings,
    summary,
    severity,
    engineVersion: COHORT_PRIVACY_VERSION,
    durationMs,
    limitations: [
      "Tests threshold constants only — does not validate actual cohort data in the database.",
      "Language level governance is deterministic: actual copy review requires a human or Content Red Team pass.",
    ],
    rawOutput: {
      engineId: COHORT_PRIVACY_ENGINE_ID,
      runAt: new Date().toISOString(),
      formulaSteps,
      thresholds: COHORT_PROOF_THRESHOLDS,
      checkMatrix,
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const cohortPrivacyAdapter = {
  id: COHORT_PRIVACY_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
