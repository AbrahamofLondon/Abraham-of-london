#!/usr/bin/env node
/**
 * External Product Value Benchmark gate — anti-toy validation.
 *
 * No product is gold-standard because a registry, score, composer, gate,
 * or serious-sounding language says so. A product is gold-standard only if
 * the actual rendered output is useful, beats ordinary alternatives,
 * survives adversarial review, and repays the customer's time.
 *
 * This gate re-executes the evidence runner (which runs the real composers
 * against two materially different inputs), then revokes any gold claim
 * that lacks external proof. Statuses: externally_proven_gold,
 * blocked_pending_external_proof, blocked_for_low_value, internal_only.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "reports");
const EVIDENCE = join(REPORT_DIR, "external-product-value-evidence.json");
const GOLD_98_REPORT = join(REPORT_DIR, "universal-product-gold-standard-98.json");
const JSON_REPORT = join(REPORT_DIR, "external-product-value-benchmark.json");
const MD_REPORT = join(REPORT_DIR, "external-product-value-benchmark.md");
const ANTI_TOY_REPORT = join(REPORT_DIR, "product-anti-toy-review.md");
const RED_TEAM_REPORT = join(REPORT_DIR, "product-red-team-review.md");
const MARKET_JSON = join(REPORT_DIR, "product-market-comparison-matrix.json");
const MARKET_MD = join(REPORT_DIR, "product-market-comparison-matrix.md");
const VALUE_LEDGER_JSON = join(REPORT_DIR, "product-value-evidence-ledger.json");
const VALUE_LEDGER_MD = join(REPORT_DIR, "product-value-evidence-ledger.md");

const ANTI_TOY_GOLD_MAXIMUM = 5;
const ANTI_TOY_RELEASE_MAXIMUM = 20;

const failures = [];

// ── 1. Regenerate evidence by executing the real composers ──
try {
  execSync("pnpm exec tsx scripts/run-external-product-value-benchmark.ts", {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  failures.push(`Evidence runner failed: ${error.message}`);
}

const evidence = readJson(EVIDENCE, "external value evidence");
const gold98 = readJson(GOLD_98_REPORT, "9.8 internal report");

const internal = new Map();
for (const product of [
  ...(gold98.goldStandardProducts ?? []),
  ...(gold98.blockedProducts ?? []),
  ...(gold98.internalOnlyProducts ?? []),
]) {
  internal.set(product.productCode, product);
}

const descriptors = evidence.descriptors ?? [];
const benchmarks = new Map((evidence.benchmarks ?? []).map((entry) => [entry.productCode, entry]));
const reviews = new Map((evidence.renderedOutputReviews ?? []).map((entry) => [entry.productCode, entry]));
const goldClaims = evidence.goldClaims ?? [];

if (descriptors.length !== 43) failures.push(`Expected 43 products, evidence covers ${descriptors.length}.`);

// ── 2. Final status per product ──
const results = descriptors.map((descriptor) => {
  const review = reviews.get(descriptor.productCode);
  const benchmark = benchmarks.get(descriptor.productCode);
  const internalProduct = internal.get(descriptor.productCode);
  const isGoldClaim = goldClaims.includes(descriptor.productCode);
  const reasons = [];
  let finalStatus;

  if (internalProduct?.currentStatus === "legacy_blocked") {
    finalStatus = "internal_only";
    reasons.push("Structurally blocked or inactive product; not a customer-facing release candidate.");
    } else if (isGoldClaim && review?.renderedOutputAvailable) {
      const toyRisk = review.antiToy?.toyRiskScore ?? 100;
      const redTeamSurvives = review.redTeam?.survives ?? false;
    if (toyRisk > ANTI_TOY_RELEASE_MAXIMUM || !redTeamSurvives) {
      finalStatus = "blocked_for_low_value";
      reasons.push(`Internal gold claim REVOKED by actual-output testing: toy risk ${toyRisk}/100${redTeamSurvives ? "" : `; rejected by ${review.redTeam.criticalRejections.join(", ")}`}.`);
      reasons.push(...(review.antiToy?.reasons ?? []).slice(0, 2));
    } else if (toyRisk > ANTI_TOY_GOLD_MAXIMUM || !review.liveRouteVerified || review.renderedOutputCaptured !== true || review.judgementIsCaseDerived !== true) {
      finalStatus = "blocked_pending_external_proof";
      reasons.push(`Internal gold claim REVOKED: output quality is close but unproven (toy risk ${toyRisk}, live route verified: ${review.liveRouteVerified}, rendered output captured: ${review.renderedOutputCaptured}).`);
    } else if (!review.usefulnessProof?.hasProof || !review.timeValueSurplusPassed) {
      finalStatus = "blocked_pending_external_proof";
      reasons.push("Internal gold claim REVOKED: customer usefulness proof or time-value surplus not established on actual output.");
    } else if (review.renderedOutputCaptured !== true || review.liveRouteVerified !== true) {
      finalStatus = "blocked_pending_external_proof";
      reasons.push("Internal gold claim REVOKED: rendered output was not captured from a verified live customer-facing route.");
    } else {
      finalStatus = "externally_proven_gold";
      reasons.push("Actual rendered output passed anti-toy, red-team, usefulness, time-value, and market-outperformance tests.");
    }
  } else if (isGoldClaim) {
    finalStatus = "blocked_pending_external_proof";
    reasons.push(`Internal gold claim REVOKED: ${review?.unavailableReason ?? "no rendered output was available for external testing."}`);
  } else {
    finalStatus = "blocked_pending_external_proof";
    reasons.push("Never internally certified; blocked until externally proven.");
  }

  return {
    productCode: descriptor.productCode,
    productFamily: descriptor.productFamily,
    internalScoreOutOf10: internalProduct?.scoreOutOf10 ?? null,
    wasInternalGoldClaim: isGoldClaim,
    hasExternalBenchmark: Boolean(benchmark),
    renderedOutputReviewed: Boolean(review?.renderedOutputAvailable),
    testedOutputSource: review?.testedOutputSource ?? "none",
    liveRouteVerified: review?.liveRouteVerified ?? false,
    renderedOutputCaptured: review?.renderedOutputCaptured ?? false,
    antiToyScore: review?.antiToy?.toyRiskScore ?? null,
    failsAntiToy: review?.antiToy?.failsAntiToyTest ?? null,
    redTeamSurvives: review?.redTeam?.survives ?? null,
    redTeamRejections: review?.redTeam?.criticalRejections ?? [],
    outperformsGenericAi: review ? review.judgementIsCaseDerived === true : null,
    usefulnessProofs: review?.usefulnessProof?.proofsEstablished ?? [],
    finalStatus,
    reasons,
  };
});

const byStatus = (status) => results.filter((result) => result.finalStatus === status);
const confirmedGold = byStatus("externally_proven_gold");
const revoked = results.filter((result) => result.wasInternalGoldClaim && result.finalStatus !== "externally_proven_gold");

// ── 3. Gate rules: no product may remain gold without external proof ──
for (const result of confirmedGold) {
  if (!result.hasExternalBenchmark) failures.push(`${result.productCode}: gold without external benchmark.`);
  if (!result.renderedOutputReviewed) failures.push(`${result.productCode}: gold without actual rendered-output review.`);
  if (!result.renderedOutputCaptured) failures.push(`${result.productCode}: gold without machine-readable rendered-output capture.`);
  if (result.antiToyScore === null) failures.push(`${result.productCode}: gold without anti-toy test.`);
  if ((result.antiToyScore ?? 100) > ANTI_TOY_GOLD_MAXIMUM) failures.push(`${result.productCode}: gold with toyRiskScore ${result.antiToyScore} > ${ANTI_TOY_GOLD_MAXIMUM}.`);
  if (result.outperformsGenericAi !== true) failures.push(`${result.productCode}: gold without proven generic-AI outperformance.`);
  if (result.redTeamSurvives !== true) failures.push(`${result.productCode}: gold without red-team survival.`);
  if (!result.liveRouteVerified) failures.push(`${result.productCode}: gold certified without live-route output verification (static/composer-only inspection is insufficient).`);
  if (result.usefulnessProofs.length === 0) failures.push(`${result.productCode}: gold without customer usefulness proof.`);
}

// The internal 9.8 report may not claim gold beyond external proof once regenerated.
const provenSet = new Set(confirmedGold.map((result) => result.productCode));
const evidenceCounts = {
  antiToyFailures: results.filter((result) => result.failsAntiToy === true && (result.antiToyScore ?? 0) > ANTI_TOY_RELEASE_MAXIMUM).length,
  genericAiOutperformFailures: results.filter((result) => result.renderedOutputReviewed && result.outperformsGenericAi === false).length,
  redTeamFailures: results.filter((result) => result.redTeamSurvives === false).length,
  benchmarksMissingForGold: confirmedGold.filter((result) => !result.hasExternalBenchmark).length,
  renderedReviewsMissingForGold: confirmedGold.filter((result) => !result.renderedOutputReviewed).length,
  liveRouteProofMissingForGold: confirmedGold.filter((result) => !result.liveRouteVerified || !result.renderedOutputCaptured).length,
};

const gate = failures.length === 0 ? "PASSED" : "FAILED";

const report = {
  generatedAt: new Date().toISOString(),
  gate,
  doctrine: "Externally proven gold or blocked. No self-certification.",
  thresholds: { antiToyGoldMaximum: ANTI_TOY_GOLD_MAXIMUM, antiToyReleaseMaximum: ANTI_TOY_RELEASE_MAXIMUM },
  productsReviewed: results.length,
  goldClaimsReviewed: goldClaims.length,
  goldClaimsConfirmed: confirmedGold.map((result) => result.productCode),
  goldClaimsRevoked: revoked.map(({ productCode, finalStatus, reasons }) => ({ productCode, finalStatus, reasons })),
  classification: {
    internallyCertified: goldClaims,
    externallyProven: confirmedGold.map((result) => result.productCode),
    revoked: revoked.map((result) => result.productCode),
    blocked: results.filter((result) => result.finalStatus.startsWith("blocked")).map((result) => result.productCode),
    internalOnly: byStatus("internal_only").map((result) => result.productCode),
  },
  counts: {
    externallyProvenGold: confirmedGold.length,
    blockedPendingExternalProof: byStatus("blocked_pending_external_proof").length,
    blockedForLowValue: byStatus("blocked_for_low_value").length,
    internalOnly: byStatus("internal_only").length,
    ...evidenceCounts,
  },
  results,
  renderedOutputReviews: evidence.renderedOutputReviews,
  failures,
  finalRecommendation: gate === "PASSED" ? "GREEN" : "RED",
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(MD_REPORT, renderMainMarkdown(report));
writeFileSync(ANTI_TOY_REPORT, renderAntiToyMarkdown(report, evidence));
writeFileSync(RED_TEAM_REPORT, renderRedTeamMarkdown(report, evidence));
writeFileSync(MARKET_JSON, `${JSON.stringify({ generatedAt: report.generatedAt, rows: evidence.marketComparison }, null, 2)}\n`);
writeFileSync(MARKET_MD, renderMarketMarkdown(evidence));
writeFileSync(VALUE_LEDGER_JSON, `${JSON.stringify(buildValueEvidenceLedger(report, evidence), null, 2)}\n`);
writeFileSync(VALUE_LEDGER_MD, renderValueEvidenceLedgerMarkdown(buildValueEvidenceLedger(report, evidence)));

console.log("EXTERNAL PRODUCT VALUE BENCHMARK CHECK");
console.log(`Products reviewed: ${report.productsReviewed}`);
console.log(`Gold-standard claims reviewed: ${report.goldClaimsReviewed}`);
console.log(`External benchmarks missing: ${evidenceCounts.benchmarksMissingForGold}`);
console.log(`Rendered-output reviews missing: ${evidenceCounts.renderedReviewsMissingForGold}`);
console.log(`Live-route proof missing for gold: ${evidenceCounts.liveRouteProofMissingForGold}`);
console.log(`Anti-toy failures: ${evidenceCounts.antiToyFailures}`);
console.log(`Generic-AI outperform failures: ${evidenceCounts.genericAiOutperformFailures}`);
console.log(`Red-team failures: ${evidenceCounts.redTeamFailures}`);
console.log(`Gold claims revoked: ${revoked.length}`);
console.log(`Gate: ${gate}`);

if (failures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const failure of failures) console.log(`- ${failure}`);
}

process.exitCode = gate === "PASSED" ? 0 : 1;

// ─────────────────────────────────────────────────────────────────────────

function renderMainMarkdown(data) {
  const matrix = data.results.map((result) =>
    `| ${result.productCode} | ${result.internalScoreOutOf10 ?? "—"} | ${result.hasExternalBenchmark ? "defined" : "MISSING"} | ${result.antiToyScore ?? "not_tested"} | ${redTeamCell(result)} | ${marketCell(result)} | ${result.finalStatus} |`
  ).join("\n");

  return `# External Product Value Benchmark

## Doctrine

${data.doctrine}

A product is gold-standard only if the actual output is useful, the customer gets a clear win, the product beats ordinary alternatives, the result is specific, actionable, and reusable, the customer's time is repaid, and a serious reviewer would not call it a toy.

## Gate Result

${data.gate}

## Classification

- **Internally certified (Wave 1):** ${list(data.classification.internallyCertified)}
- **Externally proven:** ${list(data.classification.externallyProven)}
- **Revoked:** ${list(data.classification.revoked)}
- **Blocked:** ${data.classification.blocked.length} products
- **Internal only:** ${list(data.classification.internalOnly)}

## Gold Claims Reviewed

${data.goldClaimsReviewed} internal gold claims were re-tested against actual rendered output, anti-toy measurement, market comparison, red-team review, and time-value proof.

## Gold Claims Revoked

${data.goldClaimsRevoked.map((entry) => `- **${entry.productCode}** → ${entry.finalStatus}\n  ${entry.reasons.join(" ")}`).join("\n") || "- None"}

## Product-by-Product Matrix

| Product | Internal Score | External Benchmark | Anti-Toy Score | Red-Team Result | Market Comparison | Final Status |
|---|---:|---|---:|---|---|---|
${matrix}

## Counts

- Externally proven gold: ${data.counts.externallyProvenGold}
- Blocked pending external proof: ${data.counts.blockedPendingExternalProof}
- Blocked for low value: ${data.counts.blockedForLowValue}
- Internal only: ${data.counts.internalOnly}

## Final Recommendation

${data.finalRecommendation}
`;
}

function renderAntiToyMarkdown(data, rawEvidence) {
  const tested = (rawEvidence.renderedOutputReviews ?? []).filter((review) => review.antiToy);
  const untested = (rawEvidence.renderedOutputReviews ?? []).filter((review) => !review.antiToy);
  return `# Product Anti-Toy Review

Hard rules: toyRiskScore > ${ANTI_TOY_GOLD_MAXIMUM} cannot be gold_standard; toyRiskScore > ${ANTI_TOY_RELEASE_MAXIMUM} is blocked_from_release.
The decisive instrument is cross-input comparison: the same product run against two materially different situations must produce materially different judgement.

## Tested Outputs (actual composer execution)

${tested.map((review) => `### ${review.productCode}

- **Tested output source:** ${review.testedOutputSource}
- **Toy risk score:** ${review.antiToy.toyRiskScore}/100 — ${review.antiToy.failsAntiToyTest ? "FAILS anti-toy test" : "passes"}
- **Reasons:**
${review.antiToy.reasons.map((reason) => `  - ${reason}`).join("\n")}
- **Required corrections:**
${review.antiToy.requiredCorrections.map((correction) => `  - ${correction}`).join("\n")}
`).join("\n")}

## Untestable Outputs

${untested.map((review) => `- **${review.productCode}**: ${review.unavailableReason}`).join("\n") || "- None"}

## Estate Position

All ${data.productsReviewed} products are held to this standard. Products never internally certified remain blocked pending external proof; no anti-toy pass can be assumed from structure, language, or internal scores.
`;
}

function renderRedTeamMarkdown(data, rawEvidence) {
  const panels = (rawEvidence.renderedOutputReviews ?? []).filter((review) => review.redTeam);
  return `# Product Red-Team Review

Five adversarial reviewers score usefulness, specificity, credibility, actionability, distinctiveness, and reuse value from measured features of the actual output. Any critical rejection blocks gold.

${panels.map((review) => `## ${review.productCode}

Survives: **${review.redTeam.survives ? "yes" : "NO"}** — rejections: ${review.redTeam.criticalRejections.join(", ") || "none"}

| Reviewer | Question | Verdict | Reason |
|---|---|---|---|
${review.redTeam.reviews.map((entry) => `| ${entry.reviewerId} | ${entry.reviewerQuestion} | ${entry.verdict} | ${entry.reasons.join(" ")} |`).join("\n")}

Scores: usefulness ${review.redTeam.scores.usefulness}, specificity ${review.redTeam.scores.specificity}, credibility ${review.redTeam.scores.credibility}, actionability ${review.redTeam.scores.actionability}, distinctiveness ${review.redTeam.scores.distinctiveness}, reuse ${review.redTeam.scores.reuse_value}
`).join("\n")}

## Products Not Yet Panel-Tested

${data.results.filter((result) => result.redTeamSurvives === null).length} products have no rendered output under review and therefore cannot survive red-team review; all remain blocked.
`;
}

function renderMarketMarkdown(rawEvidence) {
  const rows = rawEvidence.marketComparison ?? [];
  return `# Product Market Comparison Matrix

Every product compared against generic AI output, a basic template/diagnostic, and a human consultant/workshop equivalent. A weak answer to "would the customer pay attention again?" blocks the product.

| Product | Alternative | We Do Better | Alternative Does Better | We Are Weaker | Clearly Superior When | Return After One Use |
|---|---|---|---|---|---|---|
${rows.map((row) => `| ${row.productCode} | ${row.alternative} | ${cell(row.whatWeDoBetter)} | ${cell(row.whatTheAlternativeDoesBetter)} | ${cell(row.whereWeAreWeaker)} | ${cell(row.whatWouldMakeUsClearlySuperior)} | ${row.wouldCustomerReturnAfterOneUse} |`).join("\n")}
`;
}

function buildValueEvidenceLedger(data, rawEvidence) {
  const reviewByCode = new Map((rawEvidence.renderedOutputReviews ?? []).map((review) => [review.productCode, review]));
  const marketByCode = new Map((rawEvidence.marketComparison ?? []).map((row) => [row.productCode, row]));

  const entries = data.goldClaimsConfirmed.map((productCode) => {
    const result = data.results.find((entry) => entry.productCode === productCode);
    const review = reviewByCode.get(productCode);
    const sample = review?.samples?.[0];
    return {
      productCode,
      liveRoute: liveRouteFromSource(review?.testedOutputSource ?? result?.testedOutputSource ?? "unknown"),
      scenarioUsed: sample?.label ?? "not_recorded",
      renderedOutputExcerpt: sample?.outputText?.slice(0, 900) ?? "",
      judgementEngineEvidence: review?.judgementIsCaseDerived === true
        ? "Live route capture uses the case-derived judgement engine and passed anti-toy diversity checks."
        : "No judgement-engine evidence recorded.",
      antiToyScore: review?.antiToy?.toyRiskScore ?? null,
      redTeamResult: review?.redTeam?.survives === true ? "survives" : "blocked",
      marketComparisonResult: result?.outperformsGenericAi === true ? "outperforms_generic_ai" : "not_proven",
      finalGoldDecision: result?.finalStatus ?? "unknown",
    };
  });

  const blockedProductsWithRouteEvidence = data.results
    .filter((result) => result.finalStatus !== "externally_proven_gold" && result.renderedOutputCaptured)
    .map((result) => {
      const review = reviewByCode.get(result.productCode);
      const sample = review?.samples?.[0];
      return {
        productCode: result.productCode,
        liveRoute: liveRouteFromSource(result.testedOutputSource),
        scenarioUsed: sample?.label ?? "not_recorded",
        renderedOutputExcerpt: sample?.outputText?.slice(0, 600) ?? "",
        judgementEngineEvidence: review?.judgementIsCaseDerived === true
          ? "Route evidence is judgement-engine derived."
          : "Route evidence captured, but market outperformance or judgement-engine proof is not sufficient for gold.",
        antiToyScore: result.antiToyScore,
        redTeamResult: result.redTeamSurvives === true ? "survives" : result.redTeamSurvives === false ? "blocked" : "not_run",
        marketComparisonResult: result.outperformsGenericAi === true ? "outperforms_generic_ai" : "not_proven",
        finalGoldDecision: result.finalStatus,
      };
    });

  return {
    generatedAt: data.generatedAt,
    doctrine: "No evidence ledger entry, no gold.",
    entries,
    blockedProductsWithRouteEvidence,
    marketRows: [...marketByCode.values()],
  };
}

function renderValueEvidenceLedgerMarkdown(data) {
  return `# Product Value Evidence Ledger

## Doctrine

${data.doctrine}

## Externally Proven Products

${data.entries.length === 0 ? "None." : data.entries.map((entry) => `### ${entry.productCode}

- Product code: ${entry.productCode}
- Live route: ${entry.liveRoute}
- Scenario used: ${entry.scenarioUsed}
- Rendered output excerpt: ${cell(entry.renderedOutputExcerpt)}
- Judgement engine evidence: ${entry.judgementEngineEvidence}
- Anti-toy score: ${entry.antiToyScore}
- Red-team result: ${entry.redTeamResult}
- Market comparison result: ${entry.marketComparisonResult}
- Final gold decision: ${entry.finalGoldDecision}
`).join("\n")}

## Blocked Products With Route Evidence

${data.blockedProductsWithRouteEvidence.length === 0 ? "None." : data.blockedProductsWithRouteEvidence.map((entry) => `### ${entry.productCode}

- Live route: ${entry.liveRoute}
- Scenario used: ${entry.scenarioUsed}
- Anti-toy score: ${entry.antiToyScore ?? "not_run"}
- Red-team result: ${entry.redTeamResult}
- Market comparison result: ${entry.marketComparisonResult}
- Final decision: ${entry.finalGoldDecision}
- Reason: ${entry.judgementEngineEvidence}
`).join("\n")}
`;
}

function liveRouteFromSource(source) {
  const text = String(source);
  const match = text.match(/live_route_capture:\s*([^()]+)/);
  return match ? match[1].trim() : text;
}

function redTeamCell(result) {
  if (result.redTeamSurvives === null) return "not_run";
  return result.redTeamSurvives ? "survives" : `rejected_by: ${result.redTeamRejections.join(", ")}`;
}

function marketCell(result) {
  if (result.outperformsGenericAi === true) return "outperforms_generic_ai";
  if (result.outperformsGenericAi === false) return "fails_generic_ai_outperform";
  return "outperform_unproven";
}

function list(items) {
  return items.length ? items.join(", ") : "none";
}

function cell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function readJson(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing ${label}: ${path}`);
    return {};
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}
