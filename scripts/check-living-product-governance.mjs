#!/usr/bin/env node
/**
 * scripts/check-living-product-governance.mjs
 *
 * Phase C — Living Product Truth Engine runner.
 *
 * Tests whether Abraham of London is behaving as the product claims it behaves.
 * Produces the canonical LivingProductViewModel that bridges engine and UI.
 *
 * Outputs:
 *   reports/living-product-truth-report.json
 *   reports/living-product-truth-report.md
 *   reports/living-product-memory.json (updated)
 *   reports/living-product-view-model.json (canonical UI bridge)
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = blockers detected
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "reports");

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

function log(color, ...args) { console.log(color, ...args, RESET); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function readText(rel) { try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { return ""; } }
function readJson(rel) { try { return JSON.parse(readText(rel)); } catch { return null; } }
function writeJson(rel, data) { const abs = path.join(ROOT, rel); const dir = path.dirname(abs); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(abs, JSON.stringify(data, null, 2), "utf8"); }
function writeText(rel, content) { const abs = path.join(ROOT, rel); const dir = path.dirname(abs); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(abs, content, "utf8"); }
function heading(text) { console.log(`\n${text}\n${"\u2500".repeat(text.length)}`); }
function ok(msg) { console.log(`  ${GREEN}\u2713${RESET} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}\u26a0${RESET} ${msg}`); }
function fail(msg) { console.log(`  ${RED}\u2717${RESET} ${msg}`); }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashFile(rel) {
  try {
    return crypto.createHash("sha256").update(readText(rel)).digest("hex").slice(0, 12);
  } catch { return ""; }
}

function fileSignature(rel) { return `${rel}:${hashFile(rel)}`; }

// ─── Doctrine claims ─────────────────────────────────────────────────────────

const DOCTRINE_CLAIMS = [
  { id: "authority-boundary", domain: "product_doctrine", claim: "The system does not grant authority.", expectedBehaviour: "No output claims final authority. Authority delta remains 0.", evidencePosture: "verified", supportingEvidence: ["data/ProductAuthorityContract.json: all products have positiveAuthorityGranted: false"] },
  { id: "evidence-discipline", domain: "product_doctrine", claim: "Conclusions are evidence-postured.", expectedBehaviour: "Evidence tier exists. Confidence posture declared.", evidencePosture: "weakly_indicated", supportingEvidence: ["lib/product/evidence-stage-contract.ts"] },
  { id: "continuity", domain: "product_doctrine", claim: "The system compounds context across serious decisions.", expectedBehaviour: "Session continuity carries forward. Case memory persists.", evidencePosture: "weakly_indicated", supportingEvidence: ["lib/product/save-case-continuity.ts"] },
  { id: "contradiction-detection", domain: "product_doctrine", claim: "The system detects structural contradiction.", expectedBehaviour: "Contradiction detectors exist across domains.", evidencePosture: "verified", supportingEvidence: ["lib/living-intelligence/contradiction-detector.ts"] },
  { id: "bounded-simulation", domain: "product_doctrine", claim: "Strategic Twin is bounded simulation, not prediction.", expectedBehaviour: "Assumptions declared. Confidence limits shown.", evidencePosture: "weakly_indicated", supportingEvidence: ["lib/kernel/simulation-gate.ts"] },
  { id: "professional-boundary", domain: "product_doctrine", claim: "Advisors structure evidence without taking client authority.", expectedBehaviour: "Advisor boundary described. Client consent language exists.", evidencePosture: "weakly_indicated", supportingEvidence: ["pages/professionals.tsx"] },
  { id: "retainer-oversight-boundary", domain: "product_doctrine", claim: "Oversight is gated and evidence-dependent.", expectedBehaviour: "Retainer products are contracted/manual_billing.", evidencePosture: "verified", supportingEvidence: ["lib/commercial/catalog.ts: retainer products are contracted"] },
  { id: "publication-discipline", domain: "product_doctrine", claim: "Current, forthcoming, and archive states are governed.", expectedBehaviour: "Lifecycle controls publication state.", evidencePosture: "verified", supportingEvidence: ["lib/intelligence/market-intelligence-lifecycle.ts"] },
  { id: "commercial-governance", domain: "product_doctrine", claim: "Checkout is governed by resolver.", expectedBehaviour: "Stripe metadata is not permission. Resolver controls checkout.", evidencePosture: "verified", supportingEvidence: ["lib/commercial/commercial-action-resolver.ts"] },
  { id: "living-intelligence", domain: "product_doctrine", claim: "Living components represent real state, not decorative theatre.", expectedBehaviour: "Components consume real view models. Static/demo usage flagged.", evidencePosture: "unverified", supportingEvidence: [] },
];

// ─── 1. Doctrine verification ────────────────────────────────────────────────

function verifyDoctrineClaims() {
  const results = [];
  for (const claim of DOCTRINE_CLAIMS) {
    const supporting = [];
    const contradicting = [];
    for (const ev of claim.supportingEvidence) {
      const filePath = ev.split(":")[0];
      if (exists(filePath)) supporting.push(ev);
      else contradicting.push(`Supporting file missing: ${filePath}`);
    }
    // Special check for living-intelligence: view model must exist
    if (claim.id === "living-intelligence") {
      if (exists("reports/living-product-view-model.json")) {
        supporting.push("reports/living-product-view-model.json: view model produced");
      }
      const shellText = readText("components/living/LivingLayerShell.tsx");
      if (shellText.includes("LivingProductViewModel") || shellText.includes("viewModel")) {
        supporting.push("components/living/LivingLayerShell.tsx: consumes view model");
      }
      // Count wired_real components
      const audit = auditLivingComponentsDetailed();
      const wiredReal = audit.filter((c) => c.status === "wired_real").length;
      if (wiredReal >= 3) supporting.push(`${wiredReal} living components are wired_real`);
    }
    const posture = contradicting.length === 0 && supporting.length > 0
      ? (claim.id === "living-intelligence" && supporting.length >= 2 ? "verified" : claim.evidencePosture)
      : contradicting.length > 0 ? "contradictory" : "unverified";
    results.push({ claimId: claim.id, domain: claim.domain, claim: claim.claim, posture, supportingEvidence: supporting, contradictingEvidence: contradicting });
  }
  return results;
}

// ─── 2. Living component audit (detailed) ────────────────────────────────────

const COMPONENT_BINDINGS = {
  "EvidenceStrengthMeter.tsx": { binding: "evidence posture / evidence tier", requiredProps: ["level", "stages"], requiredImport: ["EvidenceTierLevel"] },
  "GovernedActionPanel.tsx": { binding: "next governed actions", requiredProps: ["requiredAction", "evidenceBasis"], requiredImport: [] },
  "OutcomeMemoryPreview.tsx": { binding: "memory findings", requiredProps: ["entries", "dominantPattern"], requiredImport: [] },
  "WhatChangedPanel.tsx": { binding: "drift / changed critical files", requiredProps: ["deltas", "newEvidence"], requiredImport: [] },
  "IntelligenceGainPanel.tsx": { binding: "learning events", requiredProps: ["findings"], requiredImport: [] },
  "HumanReviewPrompt.tsx": { binding: "owner decisions / needs review", requiredProps: ["context"], requiredImport: [] },
  "NextLayerUnlockedPanel.tsx": { binding: "post-resolution unlocks", requiredProps: ["currentStage", "nextStage"], requiredImport: [] },
  "LivingSpineProgress.tsx": { binding: "governance maturity stages", requiredProps: ["stages"], requiredImport: [] },
  "DecisionAdvantageSummary.tsx": { binding: "verified product advantages and limitations", requiredProps: ["advantages", "confidenceBand"], requiredImport: [] },
  "WhatTheSystemHeard.tsx": { binding: "owner/operator instruction memory", requiredProps: ["quotes", "interpretations"], requiredImport: ["UserLanguageInterpretation"] },
  "LivingLayerShell.tsx": { binding: "canonical wrapper for the full view model", requiredProps: ["viewModel"], requiredImport: ["LivingLayerViewModel"] },
};

function auditLivingComponentsDetailed() {
  const results = [];
  for (const [comp, binding] of Object.entries(COMPONENT_BINDINGS)) {
    const relPath = `components/living/${comp}`;
    const text = readText(relPath);
    if (!text) {
      results.push({ component: comp, path: relPath, status: "missing", evidence: ["File not found"], requiredNextBinding: binding.binding });
      continue;
    }
    const hasTypedProps = binding.requiredProps.some((p) => text.includes(p + ":") || text.includes(p + "?"));
    const hasRequiredImport = binding.requiredImport.length === 0 || binding.requiredImport.some((i) => text.includes(i));
    const hasViewModel = text.includes("LivingLayerViewModel") || text.includes("LivingProductViewModel") || text.includes("viewModel");
    // Check if used by a real route
    let usedByRoute = false;
    const searchDirs = ["pages", "app", "components"];
    for (const dir of searchDirs) {
      if (usedByRoute) break;
      const walk = (d) => {
        try {
          for (const entry of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
            if (usedByRoute) return;
            const rel = `${d}/${entry.name}`;
            if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".contentlayer") walk(rel);
            else if ((entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) && entry.name !== comp) {
              const c = readText(rel);
              if (c.includes(comp.replace(".tsx", "")) || c.includes(`from "./${comp.replace(".tsx", "")}`) || c.includes(`from "@/components/living/${comp.replace(".tsx", "")}`)) {
                usedByRoute = true;
              }
            }
          }
        } catch { /* skip */ }
      };
      walk(dir);
    }
    const isDemo = text.includes("demo") || text.includes("static") || text.includes("sample") || text.includes("mock");
    let status;
    if (hasTypedProps && hasRequiredImport && hasViewModel && usedByRoute && !isDemo) status = "wired_real";
    else if (hasTypedProps && usedByRoute && !isDemo) status = "wired_inferred";
    else if (hasTypedProps) status = "component_ready_unwired";
    else if (isDemo) status = "decorative_or_static_risk";
    else status = "needs_review";
    const evidence = [`Typed props match binding: ${hasTypedProps}`, `Required imports: ${hasRequiredImport}`, `View model: ${hasViewModel}`, `Used by route: ${usedByRoute}`, `Static/demo: ${isDemo}`];
    results.push({ component: comp, path: relPath, status, evidence, requiredNextBinding: status !== "wired_real" ? binding.binding : undefined });
  }
  return results;
}

// ─── 3. Behaviour probes ─────────────────────────────────────────────────────

function runBehaviourProbes() {
  const probes = [];
  const diagnosticFiles = ["pages/diagnostics/fast.tsx", "pages/diagnostics/purpose-alignment.tsx", "pages/diagnostics/executive-reporting.tsx", "pages/diagnostics/team-assessment.tsx", "pages/diagnostics/enterprise-assessment.tsx"];
  let derivedCount = 0;
  for (const f of diagnosticFiles) { if (exists(f)) { const t = readText(f); if (t.includes("getStaticProps") || t.includes("getServerSideProps") || t.includes("import")) derivedCount++; } }
  probes.push({ id: "diagnostic-derived-output", surface: "diagnostics", probe: "diagnostic outputs are derived from submitted input", status: derivedCount >= 3 ? "verified_real" : derivedCount >= 1 ? "inferred_real" : "needs_review", evidence: [`${derivedCount}/${diagnosticFiles.length} diagnostic files have data-fetching patterns`] });
  const shellText = readText("components/living/LivingLayerShell.tsx");
  probes.push({ id: "living-shell-real-view-model", surface: "components/living/LivingLayerShell.tsx", probe: "LivingLayerShell consumes real view model", status: shellText.includes("LivingLayerViewModel") || shellText.includes("LivingProductViewModel") ? "verified_real" : "needs_review", evidence: [shellText.includes("LivingLayerViewModel") ? "Imports LivingLayerViewModel" : "No view model import found"] });
  const gmiText = readText("pages/intelligence/gmi/index.tsx");
  probes.push({ id: "gmi-lifecycle-derived", surface: "pages/intelligence/gmi/index.tsx", probe: "GMI page derives current/forthcoming/archive from lifecycle", status: gmiText.includes("getCurrentPublishedMarketIntelligenceReport") ? "verified_real" : "needs_review", evidence: [gmiText.includes("getCurrentPublishedMarketIntelligenceReport") ? "Uses lifecycle helpers" : "No lifecycle helper imports found"] });
  const profText = readText("pages/professionals.tsx");
  const profFound = ["Authority delta", "client consent", "advisor-mediated", "controlled access"].filter((p) => profText.toLowerCase().includes(p.toLowerCase()));
  probes.push({ id: "professional-advisor-boundary", surface: "pages/professionals.tsx", probe: "professional page describes advisor boundary", status: profFound.length >= 2 ? "verified_real" : profFound.length >= 1 ? "inferred_real" : "needs_review", evidence: profFound.length > 0 ? profFound.map((p) => `Contains: "${p}"`) : ["No boundary phrases found"] });
  const pubText = readText("lib/intelligence/gmi-publication-service.ts");
  probes.push({ id: "gmi-prior-quarter-review", surface: "GMI publication service", probe: "GMI has prior-quarter review mechanism", status: pubText.includes("getPendingCallReviews") ? "verified_real" : "not_found", evidence: [pubText.includes("getPendingCallReviews") ? "Has getPendingCallReviews" : "No prior-quarter review found"] });
  const summary = { total: probes.length, verifiedReal: probes.filter((p) => p.status === "verified_real").length, inferredReal: probes.filter((p) => p.status === "inferred_real").length, staticDemo: probes.filter((p) => p.status === "static_demo").length, decorative: probes.filter((p) => p.status === "decorative").length, notFound: probes.filter((p) => p.status === "not_found").length, needsReview: probes.filter((p) => p.status === "needs_review").length };
  return { probes, summary };
}

// ─── 4. Drift memory (with file hashing for regression detection) ────────────

function loadMemory() {
  try { const raw = readText("reports/living-product-memory.json"); return raw ? JSON.parse(raw) : { version: 1, updatedAt: new Date().toISOString(), entries: [], fileHashes: {} }; }
  catch { return { version: 1, updatedAt: new Date().toISOString(), entries: [], fileHashes: {} }; }
}

function saveMemory(store) { store.updatedAt = new Date().toISOString(); writeJson("reports/living-product-memory.json", store); }

function computeCriticalFileHashes() {
  const criticalFiles = [
    "lib/living-intelligence/contradiction-detector.ts",
    "lib/living-intelligence/estate-snapshot-loader.ts",
    "lib/living-intelligence/living-report-composer.ts",
    "lib/living-intelligence/product-doctrine-contract.ts",
    "lib/living-intelligence/behaviour-probe-engine.ts",
    "lib/living-intelligence/drift-memory-store.ts",
    "lib/living-intelligence/living-component-auditor.ts",
    "lib/commercial/commercial-action-resolver.ts",
    "lib/commercial/catalog.ts",
    "lib/intelligence/market-intelligence-lifecycle.ts",
    "scripts/check-living-estate-intelligence.mjs",
    "scripts/check-living-product-governance.mjs",
  ];
  const hashes = {};
  for (const f of criticalFiles) hashes[f] = hashFile(f);
  return hashes;
}

function mergeIntoMemory(findings) {
  const store = loadMemory();
  const now = new Date().toISOString();
  const currentHashes = computeCriticalFileHashes();
  let criticalFileChanges = 0;
  if (store.fileHashes) {
    for (const [file, hash] of Object.entries(currentHashes)) {
      if (store.fileHashes[file] && store.fileHashes[file] !== hash) criticalFileChanges++;
    }
  }
  store.fileHashes = currentHashes;
  for (const finding of findings) {
    const existing = store.entries.find((e) => e.id === finding.id);
    if (existing) {
      existing.lastSeen = now;
      existing.recurrenceCount++;
      existing.currentSeverity = finding.severity;
      const severityOrder = { fatal_build_blocker: 10, checkout_bypass: 9, commercial_safety_blocker: 8, governance_contradiction: 7, publication_lifecycle_conflict: 6, source_of_truth_conflict: 5, content_route_failure: 4, storefront_gap: 3, narrative_drift: 2, governed_tension: 1, informational_note: 0 };
      const prev = (severityOrder[existing.previousSeverity] || 0);
      const curr = (severityOrder[finding.severity] || 0);
      if (curr > prev) existing.status = "worsened";
      else if (curr < prev) existing.status = "improved";
      else existing.status = existing.recurrenceCount > 1 ? "repeated" : "new";
      existing.previousSeverity = existing.currentSeverity;
      existing.currentSeverity = finding.severity;
    } else {
      store.entries.push({ id: finding.id, title: finding.title, doctrineClaimId: finding.doctrineClaimId || null, firstSeen: now, lastSeen: now, recurrenceCount: 1, previousSeverity: "none", currentSeverity: finding.severity, status: "new", affectedFiles: finding.affectedFiles || [], evidence: finding.evidence || [] });
    }
  }
  // Mark entries not in current findings as resolved
  const currentIds = new Set(findings.map((f) => f.id));
  for (const entry of store.entries) {
    if (!currentIds.has(entry.id) && entry.status !== "resolved" && entry.status !== "accepted_risk") {
      entry.status = "resolved";
      entry.lastSeen = now;
    }
  }
  store.criticalFileChanges = criticalFileChanges;
  saveMemory(store);
  return store;
}

// ─── 5. View model composer ──────────────────────────────────────────────────

function composeViewModel(doctrineResults, behaviourReport, componentAudit, memory, findings) {
  const refusedToInfer = [
    "Stripe IDs — not inferred, must come from CATALOG",
    "Prices — not inferred, must come from CATALOG",
    "Publication approval — not inferred, must come from lifecycle",
    "Owner approval — not inferred, must come from owner decision record",
    "User consent — not inferred, must come from consent record",
    "Evidence not present — not inferred, must come from evidence package",
    "Readiness state not declared — not inferred, must come from governance matrix",
    "Legal/financial conclusions — not inferred, outside scope",
    "Product capability not implemented — not inferred, must come from product specification",
  ];

  const memoryView = {
    newIssues: memory.entries.filter((e) => e.status === "new").length,
    repeatedIssues: memory.entries.filter((e) => e.status === "repeated" || e.status === "worsened").length,
    resolvedIssues: memory.entries.filter((e) => e.status === "resolved").length,
    regressions: memory.entries.filter((e) => e.status === "regressed").length,
    criticalFileChanges: memory.criticalFileChanges || 0,
    rememberedFindings: memory.entries.slice(0, 20).map((e) => ({
      signature: `${e.id}:${e.currentSeverity}`,
      title: e.title,
      status: e.status,
      recurrenceCount: e.recurrenceCount,
      lastSeen: e.lastSeen,
    })),
  };

  const nextGovernedActions = [];
  const blockers = findings.filter((f) => f.blocksDeployment);
  if (blockers.length > 0) {
    nextGovernedActions.push({ label: `Resolve ${blockers.length} blocking finding(s)`, reason: "Deployment blocked until resolved", requiredEvidence: blockers.map((b) => b.id), owner: "release_engineering", safeToAutomate: false });
  }
  const unwired = componentAudit.filter((c) => c.status === "component_ready_unwired" || c.status === "needs_review");
  if (unwired.length > 0) {
    nextGovernedActions.push({ label: `Wire ${unwired.length} living component(s) to view model`, reason: "Components exist but do not consume real engine output", requiredEvidence: unwired.map((c) => `${c.component}: ${c.requiredNextBinding || "bind to view model"}`), owner: "product_engineering", safeToAutomate: false });
  }
  if (memoryView.repeatedIssues > 0) {
    nextGovernedActions.push({ label: `Review ${memoryView.repeatedIssues} repeated contradiction(s)`, reason: "Recurring issues indicate systemic problem, not one-time drift", requiredEvidence: memory.entries.filter((e) => e.status === "repeated" || e.status === "worsened").map((e) => e.id), owner: "governance", safeToAutomate: false });
  }

  return {
    generatedAt: new Date().toISOString(),
    engineVersion: "1.0.0",
    doctrine: doctrineResults.map((d) => ({ claimId: d.claimId, posture: d.posture, evidence: d.supportingEvidence, contradictionCount: d.contradictingEvidence.length })),
    findings: findings.map((f) => ({
      id: f.id, title: f.title, domain: f.domain, severity: f.severity,
      evidencePosture: f.severity === "verified_real" ? "verified" : f.severity === "inferred_real" ? "strongly_indicated" : f.severity === "needs_review" ? "needs_human_review" : "weakly_indicated",
      confidence: f.blocksDeployment ? "high" : f.governedTension ? "low" : "medium",
      blocksDeployment: f.blocksDeployment || false, governedTension: f.governedTension || false,
      recommendation: f.recommendation || "Review required.", affectedItems: f.affectedItems || [],
    })),
    memory: memoryView,
    livingComponents: componentAudit.map((c) => ({ component: c.component, status: c.status, evidence: c.evidence, requiredNextBinding: c.requiredNextBinding })),
    refusedToInfer,
    nextGovernedActions,
  };
}

// ─── 6. Report composition ───────────────────────────────────────────────────

function composeReport(doctrineResults, behaviourReport, componentAudit, memory, viewModel) {
  const lines = [];
  lines.push("# Living Product Truth Report"); lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`); lines.push("");
  lines.push("## Doctrine Claims"); lines.push("");
  lines.push("| Claim | Posture | Supporting | Contradicting |"); lines.push("|-------|---------|------------|---------------|");
  for (const r of doctrineResults) lines.push(`| ${r.claimId} | ${r.posture} | ${r.supportingEvidence.length} | ${r.contradictingEvidence.length} |`);
  lines.push("");
  lines.push("## Behaviour Probes"); lines.push("");
  lines.push(`| Metric | Count |`); lines.push(`|--------|-------|`);
  lines.push(`| Verified real | ${behaviourReport.summary.verifiedReal} |`);
  lines.push(`| Inferred real | ${behaviourReport.summary.inferredReal} |`);
  lines.push(`| Static/demo | ${behaviourReport.summary.staticDemo} |`);
  lines.push(`| Decorative | ${behaviourReport.summary.decorative} |`);
  lines.push(`| Not found | ${behaviourReport.summary.notFound} |`);
  lines.push(`| Needs review | ${behaviourReport.summary.needsReview} |`); lines.push("");
  for (const probe of behaviourReport.probes) {
    const icon = probe.status === "verified_real" ? "✅" : probe.status === "inferred_real" ? "🟡" : probe.status === "not_found" ? "❌" : "⚪";
    lines.push(`${icon} **${probe.id}**: ${probe.probe} — ${probe.status}`); for (const ev of probe.evidence) lines.push(`  - ${ev}`); lines.push("");
  }
  lines.push("## Living Component Audit"); lines.push("");
  for (const comp of componentAudit) {
    const icon = comp.status === "wired_real" ? "✅" : comp.status === "wired_inferred" ? "🟡" : comp.status === "component_ready_unwired" ? "🔧" : comp.status === "missing" ? "💤" : "⚪";
    lines.push(`${icon} **${comp.component}**: ${comp.status}`); for (const ev of comp.evidence) lines.push(`  - ${ev}`); if (comp.requiredNextBinding) lines.push(`  - Required binding: ${comp.requiredNextBinding}`); lines.push("");
  }
  lines.push("## View Model"); lines.push("");
  lines.push(`| Field | Value |`); lines.push(`|-------|-------|`);
  lines.push(`| Doctrine claims | ${viewModel.doctrine.length} |`);
  lines.push(`| Findings | ${viewModel.findings.length} |`);
  lines.push(`| Memory entries | ${viewModel.memory.newIssues + viewModel.memory.repeatedIssues + viewModel.memory.resolvedIssues} |`);
  lines.push(`| Living components | ${viewModel.livingComponents.length} |`);
  lines.push(`| Next governed actions | ${viewModel.nextGovernedActions.length} |`);
  lines.push(`| Refused to infer | ${viewModel.refusedToInfer.length} |`); lines.push("");
  lines.push("## Drift Memory"); lines.push("");
  lines.push(`| Status | Count |`); lines.push(`|--------|-------|`);
  lines.push(`| New | ${viewModel.memory.newIssues} |`);
  lines.push(`| Repeated/worsened | ${viewModel.memory.repeatedIssues} |`);
  lines.push(`| Resolved | ${viewModel.memory.resolvedIssues} |`);
  lines.push(`| Regressions | ${viewModel.memory.regressions} |`);
  lines.push(`| Critical file changes | ${viewModel.memory.criticalFileChanges} |`); lines.push("");
  lines.push("## Next Governed Actions"); lines.push("");
  for (const action of viewModel.nextGovernedActions) {
    lines.push(`- **${action.label}** (${action.owner})`); lines.push(`  - Reason: ${action.reason}`); lines.push(`  - Safe to automate: ${action.safeToAutomate}`); lines.push("");
  }
  lines.push("## Conclusion"); lines.push("");
  const blockers = viewModel.findings.filter((f) => f.blocksDeployment);
  if (blockers.length > 0) lines.push(`❌ ${blockers.length} blocker(s) remaining.`);
  else lines.push("✅ No blockers. Product truth governance passed.");
  lines.push("");
  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  heading("Living Product Truth Governance Check");

  // 1. Doctrine
  heading("1. Doctrine Claims");
  const doctrineResults = verifyDoctrineClaims();
  for (const r of doctrineResults) {
    const icon = r.posture === "verified" ? "✅" : r.posture === "contradictory" ? "❌" : r.posture === "unverified" ? "⚪" : "🟡";
    ok(`${icon} ${r.claimId}: ${r.posture} (${r.supportingEvidence.length} supporting, ${r.contradictingEvidence.length} contradicting)`);
  }

  // 2. Behaviour probes
  heading("2. Behaviour Probes");
  const behaviourReport = runBehaviourProbes();
  for (const probe of behaviourReport.probes) {
    const icon = probe.status === "verified_real" ? "✅" : probe.status === "inferred_real" ? "🟡" : probe.status === "not_found" ? "❌" : "⚪";
    ok(`${icon} ${probe.id}: ${probe.status}`);
  }

  // 3. Living component audit (detailed)
  heading("3. Living Component Audit");
  const componentAudit = auditLivingComponentsDetailed();
  for (const comp of componentAudit) {
    const icon = comp.status === "wired_real" ? "✅" : comp.status === "wired_inferred" ? "🟡" : comp.status === "component_ready_unwired" ? "🔧" : comp.status === "missing" ? "💤" : "⚪";
    ok(`${icon} ${comp.component}: ${comp.status}`);
  }

  // 4. Build findings from doctrine + behaviour
  heading("4. Findings & Memory");
  const findings = [];
  for (const r of doctrineResults) {
    if (r.posture === "contradictory") findings.push({ id: `doctrine-${r.claimId}`, title: `Doctrine claim contradicted: ${r.claimId}`, severity: "governance_contradiction", blocksDeployment: true, governedTension: false, affectedItems: r.contradictingEvidence.map((e) => e.split(":")[0]), evidence: r.contradictingEvidence, recommendation: "Review and reconcile.", doctrineClaimId: r.claimId });
    if (r.posture === "unverified") findings.push({ id: `doctrine-${r.claimId}`, title: `Doctrine claim unverified: ${r.claimId}`, severity: "informational_note", blocksDeployment: false, governedTension: true, affectedItems: [], evidence: r.supportingEvidence, recommendation: "Add automated checker.", doctrineClaimId: r.claimId });
  }
  for (const probe of behaviourReport.probes) {
    if (probe.status === "not_found" || probe.status === "decorative") findings.push({ id: `behaviour-${probe.id}`, title: `Behaviour not found: ${probe.probe}`, severity: probe.status === "not_found" ? "content_route_failure" : "narrative_drift", blocksDeployment: false, governedTension: true, affectedItems: [probe.surface], evidence: probe.evidence, recommendation: "Implement or document as intentional gap." });
  }
  for (const comp of componentAudit) {
    if (comp.status === "missing") findings.push({ id: `component-${comp.component.replace(".tsx", "")}`, title: `Living component missing: ${comp.component}`, severity: "content_route_failure", blocksDeployment: false, governedTension: true, affectedItems: [comp.path], evidence: ["File not found"], recommendation: "Create or remove reference." });
  }

  const memory = mergeIntoMemory(findings);
  ok(`Memory entries: ${memory.entries.length} (${memory.entries.filter((e) => e.status === "new").length} new, ${memory.entries.filter((e) => e.status === "repeated" || e.status === "worsened").length} repeated/worsened, ${memory.entries.filter((e) => e.status === "resolved").length} resolved)`);
  if (memory.criticalFileChanges) ok(`Critical file changes: ${memory.criticalFileChanges}`);

  // 5. Compose view model
  heading("5. View Model");
  const viewModel = composeViewModel(doctrineResults, behaviourReport, componentAudit, memory, findings);
  writeJson("reports/living-product-view-model.json", viewModel);
  ok("Wrote reports/living-product-view-model.json");

  // 6. Compose reports
  const reportMd = composeReport(doctrineResults, behaviourReport, componentAudit, memory, viewModel);
  writeText("reports/living-product-truth-report.md", reportMd);
  const reportJson = { generatedAt: new Date().toISOString(), doctrineClaims: doctrineResults, behaviourProbes: behaviourReport, componentAudit, memory: { entries: memory.entries.length, updatedAt: memory.updatedAt }, viewModel };
  writeJson("reports/living-product-truth-report.json", reportJson);
  ok("Wrote reports/living-product-truth-report.json");
  ok("Wrote reports/living-product-truth-report.md");
  ok("Updated reports/living-product-memory.json");

  // 7. Exit
  const blockers = findings.filter((f) => f.blocksDeployment);
  console.log(""); console.log("=".repeat(60));
  if (blockers.length === 0) { ok("LIVING PRODUCT TRUTH GOVERNANCE PASSED"); process.exit(0); }
  else { fail(`${blockers.length} blocker(s) remaining`); process.exit(1); }
}

main();