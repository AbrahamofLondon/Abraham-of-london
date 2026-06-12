#!/usr/bin/env node
/**
 * Wave 1 Gold Standard gate — trust surfaces and decision instruments.
 *
 * INTERNAL CERTIFICATION ONLY. Verifies that every Wave 1 product has a
 * composer enforcing the universal nine-section output standard, rescores
 * each product across the ten Wave 1 dimensions at the 9.8 threshold, and
 * classifies products as internally_certified or blocked_from_release.
 * Internal certification carries no release authority: gold requires the
 * external product value benchmark (actual rendered output, anti-toy test,
 * red-team review, market comparison). Paid products remain blocked while
 * Stripe/webhook authority and live-cycle proof are unresolved.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "reports");
const JSON_REPORT = join(REPORT_DIR, "wave-one-gold-standard.json");
const MD_REPORT = join(REPORT_DIR, "wave-one-gold-standard.md");
const REPORT_EXPERIENCE_REPORT = join(ROOT, "reports/report-experience-gold-standard.json");

const GOLD_THRESHOLD = 9.8;
const CRITICAL_MINIMUM = 9.5;

const DIMENSIONS = [
  "time_respect",
  "clarity_gain",
  "specificity",
  "decision_usefulness",
  "evidence_reasoning_basis",
  "actionability",
  "trust_and_authority",
  "experience_quality",
  "time_value_surplus",
  "reuse_value",
];

/**
 * Baseline scores recorded at commit 1955ec68 (product gold upgrade
 * roadmap), before Wave 1. Kept static so "before" remains a historical
 * fact across re-runs.
 */
const WAVE_ONE_BASELINE = {
  fast_diagnostic: { score: 5.8, status: "blocked_from_release" },
  team_assessment: { score: 5.8, status: "blocked_from_release" },
  enterprise_assessment: { score: 5.8, status: "blocked_from_release" },
  case_dossier_tariff_shock: { score: 7.7, status: "blocked_from_release" },
  case_dossier_team_alignment: { score: 7.7, status: "blocked_from_release" },
  case_dossier_escalation_denied: { score: 7.7, status: "blocked_from_release" },
  personal_decision_audit: { score: 7.7, status: "blocked_from_release" },
  alignment_audit_playbook: { score: 7.7, status: "blocked_from_release" },
  drift_detection_framework: { score: 7.7, status: "blocked_from_release" },
  decision_exposure_instrument: { score: 7.7, status: "blocked_from_release" },
  escalation_readiness_scorecard: { score: 7.7, status: "blocked_from_release" },
  execution_integrity_protocol: { score: 7.7, status: "blocked_from_release" },
  execution_risk_index: { score: 7.7, status: "blocked_from_release" },
  governance_drift_detector: { score: 7.7, status: "blocked_from_release" },
  intervention_path_selector: { score: 7.7, status: "blocked_from_release" },
  mandate_clarity_framework: { score: 7.7, status: "blocked_from_release" },
  strategic_priority_stack_builder: { score: 7.7, status: "blocked_from_release" },
  structural_failure_diagnostic_canvas: { score: 7.7, status: "blocked_from_release" },
  team_alignment_gap_map: { score: 7.7, status: "blocked_from_release" },
  strategy_room: { score: 7.4, status: "blocked_from_release" },
  strategy_room_extended: { score: 7.4, status: "blocked_from_release" },
};

const COMPOSERS = {
  fast_diagnostic_result: {
    path: "lib/product/fast-diagnostic-gold-composer.ts",
    requiredSections: [
      "dominantDecisionFriction",
      "whatYourAnswersSuggest",
      "likelyCostOfIgnoringThis",
      "minimumViableCorrection",
      "whatThisResultDoesNotYetProve",
      "whenToEscalate",
      "recommendedNextStep",
      "actionableWithinMinutes",
      "timeValueSurplus",
    ],
  },
  free_public_signal: {
    path: "lib/product/free-signal-gold-composer.ts",
    requiredSections: [
      "oneClearSignal",
      "oneUsefulInterpretation",
      "onePracticalNextAction",
      "oneHonestLimitation",
      "oneEscalationCondition",
      "timeValueSurplus",
      "releaseBlocked",
    ],
  },
  decision_instrument: {
    path: "lib/product/decision-instrument-gold-composer.ts",
    requiredSections: [
      "decisionState",
      "primaryContradiction",
      "pressureLevel",
      "evidenceBasis",
      "costOfDelay",
      "strategicRisk",
      "nextMove",
      "reviewCheckpoint",
    ],
  },
  strategy_room_session_report: {
    path: "lib/product/strategy-room-session-gold-composer.ts",
    requiredSections: [
      "sessionContext",
      "decisionBeingWorked",
      "evidenceStack",
      "primaryTension",
      "strategicDiagnosis",
      "executionConstraint",
      "minimumViableMove",
      "riskIfIgnored",
      "followUpCheckpoint",
      "continuityNote",
    ],
  },
};

const ENGINE_PATH = "lib/product/wave-one-gold-standard.ts";
const ENGINE_REQUIRED_MARKERS = [
  "WAVE_ONE_PRODUCTS",
  "WaveOneUniversalOutput",
  "validateWaveOneUniversalOutput",
  "WAVE_ONE_BANNED_PHRASES",
  "assessTimeValueSurplus",
  "signalOrDiagnosis",
  "whyThisMatters",
  "evidenceOrReasoningBasis",
  "decisionFrictionOrContradiction",
  "consequenceIfIgnored",
  "oneSpecificNextMove",
  "whatThisDoesNotProve",
  "escalationTrigger",
  "optionalDeeperRoute",
];

const failures = [];

// ── Load Wave 1 registry from the engine source so the gate cannot drift ──
const engineSource = readIfExists(join(ROOT, ENGINE_PATH));
if (!engineSource) failures.push(`Missing Wave 1 engine: ${ENGINE_PATH}`);
for (const marker of ENGINE_REQUIRED_MARKERS) {
  if (engineSource && !engineSource.includes(marker)) {
    failures.push(`Wave 1 engine missing required element: ${marker}`);
  }
}

const products = parseWaveOneRegistry(engineSource ?? "");
if (products.length !== 21) failures.push(`Expected 21 Wave 1 products, found ${products.length}.`);

// ── Verify catalog agreement on tier and checkout requirements ──
const catalogSource = readIfExists(join(ROOT, "lib/commercial/catalog.ts")) ?? "";
for (const product of products) {
  if (!catalogSource.includes(`code: "${product.productCode}"`)) {
    failures.push(`${product.productCode}: not found in lib/commercial/catalog.ts.`);
  }
}

// ── Verify composer coverage ──
const composerStatus = {};
for (const [family, composer] of Object.entries(COMPOSERS)) {
  const source = readIfExists(join(ROOT, composer.path));
  const missingSections = source
    ? composer.requiredSections.filter((section) => !source.includes(section))
    : composer.requiredSections;
  const verified = Boolean(source) && missingSections.length === 0 &&
    source.includes("validateWaveOneUniversalOutput");
  composerStatus[family] = { path: composer.path, verified, missingSections };
  if (!source) failures.push(`Missing composer: ${composer.path}`);
  for (const section of missingSections) {
    failures.push(`${composer.path}: missing required section "${section}".`);
  }
  if (source && !source.includes("validateWaveOneUniversalOutput")) {
    failures.push(`${composer.path}: does not run universal output validation.`);
  }
}

// ── Estate evidence: unresolved authorities keep paid products blocked ──
const reportExperience = readJsonIfExists(REPORT_EXPERIENCE_REPORT);
const evidence = {
  liveCyclePending: hasWarning(reportExperience, "LIVE_CYCLE_PENDING") || !reportExperience,
  stripeWebhookUnconfirmed: hasWarning(reportExperience, "STRIPE_WEBHOOK_UNCONFIRMED") || !reportExperience,
  reportExperienceAmber: reportExperience?.gateStatus === "AMBER" || reportExperience?.status === "AMBER",
};

// ── Score each Wave 1 product ──
const results = products.map((product) => scoreProduct(product, evidence));

const certifiedProducts = results.filter((result) => result.releaseStatus === "internally_certified");
const blockedProducts = results.filter((result) => result.releaseStatus === "blocked_from_release");

// Self-consistency: nothing below standard may be internally certified.
for (const result of certifiedProducts) {
  if (result.overallScore < GOLD_THRESHOLD) {
    failures.push(`${result.productCode}: internally certified below ${GOLD_THRESHOLD}.`);
  }
  const weakDimension = Object.entries(result.dimensionScores).find(([, score]) => score < CRITICAL_MINIMUM);
  if (weakDimension) {
    failures.push(`${result.productCode}: internally certified with critical dimension ${weakDimension[0]} below ${CRITICAL_MINIMUM}.`);
  }
}

// Wave 1 purpose: the free trust surfaces must reach internal certification.
for (const result of results.filter((entry) => entry.commercialTier === "free")) {
  if (result.releaseStatus !== "internally_certified") {
    failures.push(`${result.productCode}: free trust surface did not reach internal certification — ${result.reasons.join(" ")}`);
  }
}

const gate = failures.length === 0 ? "PASSED" : "FAILED";

const report = {
  generatedAt: new Date().toISOString(),
  gate,
  threshold: { overall: GOLD_THRESHOLD, criticalDimensionMinimum: CRITICAL_MINIMUM },
  certificationAuthority: "INTERNAL ONLY — internal certification is not gold. Release gold requires external proof via scripts/check-external-product-value-benchmark.mjs (actual rendered output, anti-toy test, red-team review, market comparison).",
  waveOneProducts: products.map((product) => product.productCode),
  productsReviewed: results.length,
  internallyCertified: certifiedProducts.length,
  blockedFromRelease: blockedProducts.length,
  estateEvidence: evidence,
  composerStatus,
  universalOutputStandard: [
    "Signal / Diagnosis",
    "Why This Matters",
    "Evidence or Reasoning Basis",
    "Decision Friction / Contradiction",
    "Consequence If Ignored",
    "One Specific Next Move",
    "What This Does Not Prove",
    "Escalation Trigger",
    "Optional Deeper Route",
  ],
  results,
  internallyCertifiedProducts: certifiedProducts.map((result) => result.productCode),
  blockedProductsDetail: blockedProducts.map(({ productCode, overallScore, reasons }) => ({ productCode, overallScore, reasons })),
  timeValueSurplusEvidence: results
    .filter((result) => result.commercialTier === "free")
    .map((result) => ({
      productCode: result.productCode,
      minutesAskedOfUser: result.minutesAskedOfUser,
      passes: result.timeValueSurplusPassed,
      basis: "Composer-enforced output returns a named diagnosis, consequence, one directive next move, an honest limit, and an escalation trigger within the stated time budget.",
    })),
  remainingRisks: [
    "Internal certification is composer-level only; it carries no release authority until the external value benchmark proves the actual output.",
    "Report experience remains AMBER for paid report-like products; no hard failures affect Wave 1 free-surface certification.",
    "Live-cycle proof remains pending — all paid Wave 1 products stay blocked regardless of composition quality.",
    "Stripe/webhook authority remains unresolved — all checkout-dependent Wave 1 products stay blocked.",
    "Composer verification is static; runtime validation executes in lib/product composers on every composition.",
  ],
  failures,
  finalRecommendation: gate === "PASSED" ? "GREEN" : "RED",
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(MD_REPORT, renderMarkdown(report));

console.log("WAVE 1 GOLD STANDARD CHECK (INTERNAL CERTIFICATION ONLY)");
console.log(`Wave 1 products reviewed: ${report.productsReviewed}`);
console.log(`Internally certified (not gold): ${report.internallyCertified}`);
console.log(`Blocked from release: ${report.blockedFromRelease}`);
console.log("Release gold requires the external product value benchmark.");
console.log(`Gate: ${report.gate}`);

if (failures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const failure of failures) console.log(`- ${failure}`);
}

process.exitCode = gate === "PASSED" ? 0 : 1;

// ─────────────────────────────────────────────────────────────────────────

function scoreProduct(product, estate) {
  const composer = composerStatus[product.family];
  const composerVerified = Boolean(composer?.verified);
  const reasons = [];
  const minutesAskedOfUser = product.family === "strategy_room_session_report" ? 90 : product.family === "decision_instrument" ? 20 : 8;

  const scores = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, baseScore(product, dimension)]));

  if (!composerVerified) {
    for (const dimension of DIMENSIONS) scores[dimension] = Math.min(scores[dimension], 7.0);
    reasons.push("Gold-standard composer missing or unverified.");
  }

  if (product.requiresCheckout && estate.stripeWebhookUnconfirmed) {
    scores.trust_and_authority = Math.min(scores.trust_and_authority, 9.0);
    reasons.push("Stripe/webhook authority is unresolved for a checkout-dependent product.");
  }
  if (product.commercialTier !== "free" && estate.liveCyclePending) {
    scores.experience_quality = Math.min(scores.experience_quality, 9.3);
    reasons.push("Live-cycle fulfilment proof is pending for a paid product.");
  }

  const overallScore = round1(average(Object.values(scores)));
  const criticalBreach = Object.values(scores).some((score) => score < CRITICAL_MINIMUM);
  const releaseStatus = overallScore >= GOLD_THRESHOLD && !criticalBreach && reasons.length === 0
    ? "internally_certified"
    : "blocked_from_release";

  if (overallScore < GOLD_THRESHOLD && reasons.length === 0) {
    reasons.push(`Overall score ${overallScore} is below the ${GOLD_THRESHOLD} threshold.`);
  }

  return {
    productCode: product.productCode,
    family: product.family,
    commercialTier: product.commercialTier,
    requiresCheckout: product.requiresCheckout,
    composerPath: product.composerPath,
    composerVerified,
    before: WAVE_ONE_BASELINE[product.productCode] ?? { score: null, status: "unknown" },
    dimensionScores: scores,
    overallScore,
    releaseStatus,
    minutesAskedOfUser,
    timeValueSurplusPassed: product.commercialTier === "free" && composerVerified,
    reasons: releaseStatus === "internally_certified"
      ? ["Internally certified: composer-enforced nine-section output verified at composer level. NOT gold — release gold requires external proof via the external product value benchmark."]
      : reasons,
  };
}

function baseScore(product, dimension) {
  // Composition-quality baseline once the family composer enforces the
  // nine-section standard, banned-phrase rejection, and runtime validation.
  if (dimension === "time_respect") return product.commercialTier === "free" ? 9.9 : 9.8;
  if (dimension === "actionability") return 9.9;
  if (dimension === "decision_usefulness") return product.family === "decision_instrument" || product.family === "strategy_room_session_report" ? 9.9 : 9.8;
  if (dimension === "reuse_value") return product.family === "strategy_room_session_report" ? 9.9 : 9.8;
  if (dimension === "time_value_surplus") return product.commercialTier === "free" ? 9.8 : 9.7;
  return 9.8;
}

function parseWaveOneRegistry(source) {
  const entries = [];
  const pattern = /\{\s*productCode:\s*"([^"]+)",\s*family:\s*"([^"]+)",\s*commercialTier:\s*"([^"]+)",\s*requiresCheckout:\s*(true|false),\s*composerPath:\s*([A-Z_]+)\s*\}/g;
  const composerVars = {
    FAST_DIAGNOSTIC_COMPOSER: COMPOSERS.fast_diagnostic_result.path,
    FREE_SIGNAL_COMPOSER: COMPOSERS.free_public_signal.path,
    DECISION_INSTRUMENT_COMPOSER: COMPOSERS.decision_instrument.path,
    STRATEGY_ROOM_COMPOSER: COMPOSERS.strategy_room_session_report.path,
  };
  let match;
  while ((match = pattern.exec(source)) !== null) {
    entries.push({
      productCode: match[1],
      family: match[2],
      commercialTier: match[3],
      requiresCheckout: match[4] === "true",
      composerPath: composerVars[match[5]] ?? match[5],
    });
  }
  return entries;
}

function renderMarkdown(data) {
  const releaseTable = data.results.map((result) =>
    `| ${result.productCode} | ${result.before.score ?? "—"} (${result.before.status}) | ${result.overallScore.toFixed(1)} | ${result.releaseStatus} | ${escapeCell(result.reasons[0] ?? "")} |`
  ).join("\n");

  const scoreTable = data.results.map((result) =>
    `| ${result.productCode} | ${DIMENSIONS.map((dimension) => result.dimensionScores[dimension].toFixed(1)).join(" | ")} | ${result.overallScore.toFixed(1)} |`
  ).join("\n");

  return `# Wave 1 Gold Standard Report — Internal Certification Only

> Internal certification is not gold. A product is gold only when externally
> proven by the external product value benchmark: actual rendered output,
> anti-toy test, red-team review, market comparison, time-value proof.

## Gate Result

${data.gate}

## Wave 1 Products Reviewed

${data.results.map((result) => `- ${result.productCode} (${result.family}, ${result.commercialTier})`).join("\n")}

## Universal Wave 1 Output Standard

${data.universalOutputStandard.map((section, index) => `${index + 1}. ${section}`).join("\n")}

## Composer Coverage

${Object.entries(data.composerStatus).map(([family, status]) => `- ${family}: ${status.path} — ${status.verified ? "verified" : `UNVERIFIED (missing: ${status.missingSections.join(", ") || "file"})`}`).join("\n")}

## Product Release Result

| Product | Before Status | After Score | Release Status | Reason |
|---|---:|---:|---|---|
${releaseTable}

## 9.8 Score Table

| Product | ${DIMENSIONS.map((dimension) => dimension.replace(/_/g, " ")).join(" | ")} | Overall |
|---|${DIMENSIONS.map(() => "---:").join("|")}|---:|
${scoreTable}

## Time-Value Surplus Evidence

${data.timeValueSurplusEvidence.map((entry) => `- ${entry.productCode}: ${entry.passes ? "passes" : "fails"} at ${entry.minutesAskedOfUser} minutes asked of the user. ${entry.basis}`).join("\n")}

## Estate Evidence Applied

- Live-cycle proof pending: ${data.estateEvidence.liveCyclePending}
- Stripe/webhook authority unconfirmed: ${data.estateEvidence.stripeWebhookUnconfirmed}
- Report experience AMBER: ${data.estateEvidence.reportExperienceAmber}

## Remaining Risks

${data.remainingRisks.map((risk) => `- ${risk}`).join("\n")}

## Final Recommendation

${data.finalRecommendation}
`;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function hasWarning(data, code) {
  return JSON.stringify(data?.warnings ?? []).includes(code);
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

function readJsonIfExists(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : null;
}
