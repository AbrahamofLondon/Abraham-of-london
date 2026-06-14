#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

const contract = JSON.parse(readFileSync("data/ProductAuthorityContract.json", "utf-8"));

// Update Workstream 1 products with evidence generation paths
const updates = {
  gmi_quarterly: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: [
      "Requires Q2 workflow completion",
      "Requires approved public phrasing",
      "Requires evidence boundary definition",
      "Requires prior-quarter verification methodology",
    ],
    nextEvidenceAction:
      "Complete GMI Q2 workflow, approved phrasing, evidence boundary, then advance to evidence-limited commercial",
    allowedClaims: [
      "evidence-limited quarterly intelligence",
      "market research summary",
      "structural pattern review",
      "prior-call verification report",
    ],
    forbiddenClaims: [
      "AI predicts markets",
      "guaranteed forecast",
      "investment advice",
      "externally verified",
      "certified market intelligence",
    ],
  },

  market_intelligence_q1: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: ["Requires Q1 intelligence scope definition"],
    nextEvidenceAction: "Define Q1 intelligence scope, evidence boundary, then advance",
    allowedClaims: ["evidence-limited quarterly intelligence", "market research summary"],
    forbiddenClaims: ["AI predicts", "guaranteed forecast", "certified intelligence"],
  },

  market_intelligence_q2: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: ["Requires Q2 intelligence scope definition"],
    nextEvidenceAction: "Define Q2 intelligence scope, evidence boundary, then advance",
    allowedClaims: ["evidence-limited quarterly intelligence", "market research summary"],
    forbiddenClaims: ["AI predicts", "guaranteed forecast", "certified intelligence"],
  },

  market_intelligence_q3: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: ["Requires Q3 intelligence scope definition"],
    nextEvidenceAction: "Define Q3 intelligence scope, evidence boundary, then advance",
    allowedClaims: ["evidence-limited quarterly intelligence", "market research summary"],
    forbiddenClaims: ["AI predicts", "guaranteed forecast", "certified intelligence"],
  },

  reporting_monthly: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: [
      "Requires scope definition (recurring structured output)",
      "Requires input-source declaration methodology",
      "Requires report-as-evidence prohibition enforcement",
    ],
    nextEvidenceAction:
      "Define reporting scope, input-source declaration, evidence boundary template, human-review process, then advance",
    allowedClaims: ["structured analysis", "decision-support synthesis", "organized evidence summary"],
    forbiddenClaims: [
      "validates decision",
      "proves fact",
      "report-as-evidence",
      "certified reporting",
    ],
  },

  reporting_custom: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: [
      "Requires scope definition (bespoke analysis)",
      "Requires input-source declaration methodology",
      "Requires report-as-evidence prohibition enforcement",
    ],
    nextEvidenceAction:
      "Define custom reporting scope, input-source declaration, evidence boundary template, human-review process, then advance",
    allowedClaims: ["structured analysis", "decision-support synthesis", "organized evidence summary"],
    forbiddenClaims: [
      "validates decision",
      "proves fact",
      "report-as-evidence",
      "certified reporting",
    ],
  },

  diagnostic_extended: {
    targetReleaseLane: "prepare_for_authority_restoration_review",
    blockingReasons: [
      "Requires Evidence Ledger v2 scenarios",
      "Requires rendered output artifacts",
      "Requires anti-toy, red-team, market validation tests",
      "Requires authority boundary definition",
      "Requires fraud scenario testing",
    ],
    nextEvidenceAction:
      "Generate Evidence Ledger v2, render sample outputs, run quality tests, define authority boundary, then schedule authority restoration review",
    allowedClaims: ["extended-scope decision-support", "premium diagnostic tier"],
    forbiddenClaims: ["validated authority", "external proof", "guaranteed outcome"],
  },

  assessment_standard: {
    targetReleaseLane: "prepare_for_authority_restoration_review",
    blockingReasons: [
      "Requires Evidence Ledger v2 scenarios",
      "Requires rendered output artifacts",
      "Requires team/enterprise distinction validation",
      "Requires authority boundary definition",
      "Requires manual review process documentation",
    ],
    nextEvidenceAction:
      "Generate Evidence Ledger v2, render sample outputs, run quality tests, define team/enterprise distinction, then schedule authority restoration review",
    allowedClaims: ["standard-scope organizational assessment", "mid-market assessment tier"],
    forbiddenClaims: ["validated authority", "certified audit", "external proof"],
  },

  competitor_tracker: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: [
      "Requires methodology boundary (observed moves, not predictions)",
      "Requires source-type declaration (public sources only)",
      "Requires confidence language policy",
    ],
    nextEvidenceAction:
      "Define methodology boundary, source-type declaration, confidence language policy, human-review process, then advance as evidence-limited tracking",
    allowedClaims: [
      "competitive intelligence support",
      "reported move tracking",
      "observed pattern alerts",
    ],
    forbiddenClaims: ["market prediction", "certified intelligence", "investment signals"],
  },

  trend_monitor: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: [
      "Requires methodology boundary (pattern observation, not prediction)",
      "Requires source-type declaration (public sources only)",
      "Requires confidence language policy",
    ],
    nextEvidenceAction:
      "Define methodology boundary, source-type declaration, confidence language policy, human-review process, then advance as evidence-limited monitoring",
    allowedClaims: ["trend pattern observation", "market signal alerts", "pattern-based insights"],
    forbiddenClaims: ["trend prediction", "certified signals", "investment advice"],
  },

  signal_watch: {
    targetReleaseLane: "evidence_limited_commercial_product",
    blockingReasons: [
      "Requires methodology boundary (alert system, not prediction)",
      "Requires source-type declaration (public sources only)",
      "Requires confidence language policy",
    ],
    nextEvidenceAction:
      "Define methodology boundary, source-type declaration, confidence language policy, human-review process, then advance as evidence-limited alert system",
    allowedClaims: ["market signal alerts", "pattern-based notifications", "monitoring service"],
    forbiddenClaims: ["signal prediction", "investment signals", "guaranteed alerts"],
  },
};

// Apply updates
Object.entries(updates).forEach(([code, updates_obj]) => {
  if (contract[code]) {
    Object.assign(contract[code], updates_obj);
  }
});

writeFileSync("data/ProductAuthorityContract.json", JSON.stringify(contract, null, 2));

console.log("✓ Updated ProductAuthorityContract with evidence generation paths");
console.log("✓ 8 Workstream 1 products updated with:");
console.log("  - targetReleaseLane");
console.log("  - blockingReasons (what evidence is needed)");
console.log("  - nextEvidenceAction (explicit pathway)");
console.log("  - allowedClaims");
console.log("  - forbiddenClaims");
console.log("");
console.log("Products updated:");
Object.keys(updates).forEach((code) => console.log(`  - ${code}`));
