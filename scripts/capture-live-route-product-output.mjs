#!/usr/bin/env node
/**
 * Live Route Output Capture.
 *
 * Captures machine-readable evidence for customer-facing Wave 1 routes.
 * Run with: pnpm exec tsx scripts/capture-live-route-product-output.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPORT_DIR = resolve(ROOT, "reports");
const CAPTURE_JSON = resolve(REPORT_DIR, "live-route-output-capture.json");
const CAPTURE_MD = resolve(REPORT_DIR, "live-route-output-capture.md");
const LEDGER_JSON = resolve(REPORT_DIR, "product-value-evidence-ledger.json");
const LEDGER_MD = resolve(REPORT_DIR, "product-value-evidence-ledger.md");

const {
  WAVE_ONE_ROUTE_DISCOVERY,
  captureRequiredWaveOneLiveRouteOutputs,
} = await import("../lib/product/live-route-output-capture.ts");

const generatedAt = new Date().toISOString();
const captures = captureRequiredWaveOneLiveRouteOutputs(generatedAt);
const testedProducts = new Set(captures.map((capture) => capture.productCode));

const capturesWithRenderedOutput = captures.filter((capture) => capture.renderedOutputText.trim().length > 0);
const capturesWithRequiredFields = captures.filter((capture) =>
  capture.judgementFieldsDetected.diagnosis &&
  capture.judgementFieldsDetected.consequence &&
  capture.judgementFieldsDetected.nextMove &&
  capture.judgementFieldsDetected.falsification &&
  capture.judgementFieldsDetected.escalation &&
  capture.judgementFieldsDetected.executionSequence
);
const judgementEngineCaptures = captures.filter((capture) => capture.usesJudgementEngine);

const routeReport = {
  generatedAt,
  gate: capturesWithRenderedOutput.length > 0 && capturesWithRequiredFields.length > 0 ? "PASSED" : "FAILED",
  doctrine: "Live route output must be captured before any product can be externally proven gold.",
  routesDiscovered: WAVE_ONE_ROUTE_DISCOVERY,
  captures,
  counts: {
    routesDiscovered: WAVE_ONE_ROUTE_DISCOVERY.length,
    productsTested: testedProducts.size,
    renderedOutputCaptured: capturesWithRenderedOutput.length,
    capturesWithAllJudgementFields: capturesWithRequiredFields.length,
    judgementEngineCaptures: judgementEngineCaptures.length,
  },
  gaps: WAVE_ONE_ROUTE_DISCOVERY
    .filter((route) => !route.routeExists)
    .map((route) => `${route.productCode}: route not found for ${route.requiredRoute}`),
};

const externallyProvenLedger = {
  generatedAt,
  doctrine: "No evidence ledger entry, no gold.",
  entries: [],
  blockedProductsWithRouteEvidence: captures.map((capture) => ({
    productCode: capture.productCode,
    liveRoute: capture.route,
    scenarioUsed: capture.scenarioId,
    renderedOutputExcerpt: capture.renderedOutputText.slice(0, 600),
    judgementEngineEvidence: capture.usesJudgementEngine
      ? "Captured output is produced from the case-derived judgement engine."
      : "Captured output is structured route evidence, but not judgement-engine output.",
    antiToyScore: null,
    redTeamResult: null,
    marketComparisonResult: null,
    finalGoldDecision: "blocked_pending_external_benchmark",
  })),
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(CAPTURE_JSON, `${JSON.stringify(routeReport, null, 2)}\n`);
writeFileSync(CAPTURE_MD, renderCaptureMarkdown(routeReport));
writeFileSync(LEDGER_JSON, `${JSON.stringify(externallyProvenLedger, null, 2)}\n`);
writeFileSync(LEDGER_MD, renderLedgerMarkdown(externallyProvenLedger));

console.log("LIVE ROUTE OUTPUT CAPTURE");
console.log(`Routes discovered: ${routeReport.counts.routesDiscovered}`);
console.log(`Products tested: ${routeReport.counts.productsTested}`);
console.log(`Rendered output captured: ${routeReport.counts.renderedOutputCaptured}`);
console.log(`Judgement-engine captures: ${routeReport.counts.judgementEngineCaptures}`);
console.log(`Gate: ${routeReport.gate}`);

process.exitCode = routeReport.gate === "PASSED" ? 0 : 1;

function renderCaptureMarkdown(data) {
  return `# Live Route Output Capture

## Gate Result

${data.gate}

## Doctrine

${data.doctrine}

## Routes Discovered

| Product | Required Route | Discovered Route | Exists | Notes |
|---|---|---|---|---|
${data.routesDiscovered.map((route) => `| ${route.productCode} | ${route.requiredRoute} | ${route.discoveredRoute} | ${route.routeExists ? "yes" : "no"} | ${route.routeNotes.join(" ")} |`).join("\n")}

## Captures

| Product | Route | Scenario | Method | Uses Judgement Engine | Fields Present |
|---|---|---|---|---|---|
${data.captures.map((capture) => `| ${capture.productCode} | ${capture.route} | ${capture.scenarioId} | ${capture.captureMethod} | ${capture.usesJudgementEngine ? "yes" : "no"} | ${Object.entries(capture.judgementFieldsDetected).filter(([, present]) => present).map(([field]) => field).join(", ")} |`).join("\n")}

## Counts

- Routes discovered: ${data.counts.routesDiscovered}
- Products tested: ${data.counts.productsTested}
- Rendered output captured: ${data.counts.renderedOutputCaptured}
- Captures with all judgement fields: ${data.counts.capturesWithAllJudgementFields}
- Judgement-engine captures: ${data.counts.judgementEngineCaptures}

## Gaps

${data.gaps.length ? data.gaps.map((gap) => `- ${gap}`).join("\n") : "None at route-discovery level. Product gold remains governed by the external product value benchmark."}
`;
}

function renderLedgerMarkdown(data) {
  return `# Product Value Evidence Ledger

## Doctrine

${data.doctrine}

## Externally Proven Products

${data.entries.length === 0 ? "None." : data.entries.map((entry) => `- ${entry.productCode}: ${entry.finalGoldDecision}`).join("\n")}

## Blocked Products With Route Evidence

${data.blockedProductsWithRouteEvidence.map((entry) => `### ${entry.productCode}

- Live route: ${entry.liveRoute}
- Scenario used: ${entry.scenarioUsed}
- Judgement engine evidence: ${entry.judgementEngineEvidence}
- Anti-toy score: ${entry.antiToyScore ?? "not yet benchmarked in ledger"}
- Red-team result: ${entry.redTeamResult ?? "not yet benchmarked in ledger"}
- Market comparison result: ${entry.marketComparisonResult ?? "not yet benchmarked in ledger"}
- Final gold decision: ${entry.finalGoldDecision}
- Rendered output excerpt: ${entry.renderedOutputExcerpt.replace(/\n/g, " ").slice(0, 300)}
`).join("\n")}
`;
}
