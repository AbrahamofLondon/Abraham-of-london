/**
 * lib/research/module-registry.ts
 *
 * Canonical registry of all Intelligence Foundry modules.
 * Status is derived from what the code actually does — not aspirational.
 */

import type { ModuleStatus } from "./foundry-contract";

export type ModuleRegistryEntry = {
  id: string;
  name: string;
  status: ModuleStatus;
  description: string;
  route: string;
  runType: string;
  engineId?: string;
  capabilities: string[];
  /** Reason status is not WIRED, if applicable */
  limitationNote?: string;
};

export const MODULE_REGISTRY: ModuleRegistryEntry[] = [
  {
    id: "scenario-workbench",
    name: "Scenario Workbench",
    status: "WIRED",
    description: "Select and run callable engines with baseline comparison, formula inspection, and ResearchRun capture.",
    route: "/admin/intelligence-foundry/scenario",
    runType: "SCENARIO",
    engineId: "fast-diagnostic",
    capabilities: ["engine-selection", "baseline-comparison", "formula-inspection", "run-capture", "replay"],
  },
  {
    id: "research-run-vault",
    name: "Research Run Vault",
    status: "WIRED",
    description: "Complete ledger of all ResearchRuns. View, filter, export action briefs, and manage run lifecycle.",
    route: "/admin/intelligence-foundry/runs",
    runType: "MANUAL",
    capabilities: ["list-runs", "filter-runs", "export-brief", "archive", "resurrect"],
  },
  {
    id: "content-red-team",
    name: "Content Red Team",
    status: "WIRED",
    description: "Automated content integrity checks: overclaim detection, guarantee language, IP leakage, authority claims, and evidence posture.",
    route: "/admin/intelligence-foundry/red-team/content",
    runType: "RED_TEAM",
    engineId: "editorial-style-checker",
    capabilities: [
      "overclaim-detection",
      "guarantee-language",
      "hidden-compliance-assertions",
      "ai-prediction-claims",
      "uk-us-spelling-drift",
      "ip-scoring-logic-leakage",
      "unsupported-authority-claims",
      "evidence-posture-weakness",
      "category-claim-defensibility",
    ],
  },
  {
    id: "security-red-team",
    name: "Security Red Team",
    status: "PARTIAL",
    description: "Automated route/auth/rate-limit security checks plus manual security checklist. IDOR, bypass, and cross-tenant testing deferred to v1.1.",
    route: "/admin/intelligence-foundry/red-team/security",
    runType: "SECURITY",
    capabilities: [
      "public-route-exposure-scan",
      "admin-auth-check",
      "rate-limit-presence",
      "dangerous-env-exposure",
      "token-leakage-scan",
      "session-role-enforcement",
      "route-parameter-validation",
      "manual-checklist",
    ],
    limitationNote: "SQL injection attempts, automated IDOR tests, real auth bypass attempts, and cross-tenant attack testing are deferred to v1.1.",
  },
  {
    id: "outbound-narrative-range",
    name: "Outbound Narrative Range",
    status: "WIRED",
    description: "Full outbound content validation for Facebook, X, and LinkedIn: length, claims, house style, sync risk, duplicate risk, platform tone, and approval readiness.",
    route: "/admin/intelligence-foundry/outbound",
    runType: "OUTBOUND",
    engineId: "outbound-policy-gate",
    capabilities: [
      "platform-length",
      "unsafe-claims",
      "uk-house-style",
      "sync-circular-risk",
      "duplicate-risk",
      "platform-tone-mismatch",
      "link-image-allowlist",
      "final-approval-readiness",
    ],
  },
  {
    id: "content-category-lab",
    name: "Content & Category Lab",
    status: "PARTIAL",
    description: "Editorial house style, outbound validation, Contentlayer health, route/content reference checks, and category vocabulary consistency.",
    route: "/admin/intelligence-foundry/content",
    runType: "CONTENT",
    engineId: "editorial-style-checker",
    capabilities: [
      "editorial-house-style",
      "outbound-content-validation",
      "contentlayer-health",
      "route-content-reference",
      "category-vocabulary-consistency",
      "public-copy-overclaim-scan",
    ],
    limitationNote: "Contentlayer health and route reference checks are automated. Category vocabulary consistency requires manual review.",
  },
  {
    id: "market-response-lab",
    name: "Market Response Lab",
    status: "WIRED",
    description: "Deterministic copy analysis: CTA verb check, headline noun check, generic SaaS language detection, forbidden phrases, audience clarity, platform length, and claim validation. No invented scores.",
    route: "/admin/intelligence-foundry/market",
    runType: "MARKET",
    capabilities: [
      "cta-verb-check",
      "headline-concrete-noun",
      "generic-saas-language",
      "forbidden-phrase-detection",
      "audience-clarity",
      "platform-length",
      "unsupported-claim-detection",
    ],
  },
  {
    id: "engine-testing-range",
    name: "Engine Testing Range",
    status: "WIRED",
    description: "Test callable engines, capture engine versions, view output, and save ResearchRuns. Honest classification of non-callable engines with adapter request flow.",
    route: "/admin/intelligence-foundry/engines",
    runType: "SCENARIO",
    capabilities: ["engine-test", "version-capture", "output-view", "run-save", "adapter-request"],
  },
  {
    id: "performance-range",
    name: "Performance Range",
    status: "PARTIAL",
    description: "Safe performance benchmarking for callable Foundry engines. Captures min/avg/p95/max execution times. Max 25 iterations, 10-second timeout.",
    route: "/admin/intelligence-foundry/performance",
    runType: "SCENARIO",
    capabilities: ["engine-selection", "iteration-control", "timing-capture", "timeout-detection", "run-save"],
    limitationNote: "v1 supports fast-diagnostic and pattern-recurrence adapters. Additional engines require adapter registration in the performance runner. Load testing against production infrastructure is deferred.",
  },
  // ─── Simulation modules ───────────────────────────────────────────────────
  {
    id: "fast-diagnostic-sim",
    name: "Fast Diagnostic Simulator",
    status: "WIRED",
    description: "Runs the Fast Diagnostic engine with synthetic inputs. Real scoring, formula traces, ResearchRun capture.",
    route: "/admin/intelligence-foundry/simulation/fast-diagnostic",
    runType: "SCENARIO",
    engineId: "fast-diagnostic",
    capabilities: ["formula-trace", "run-capture", "synthetic-inputs"],
  },
  {
    id: "strategy-room-sim",
    name: "Strategy Room Simulator",
    status: "WIRED",
    description: "Dry-run Strategy Room intake scoring: 8-component gate, authority check, decision directive.",
    route: "/admin/intelligence-foundry/simulation/strategy-room",
    runType: "SCENARIO",
    engineId: "strategy-room",
    capabilities: ["8-component-gate", "authority-check", "decision-directive", "dry-run"],
    limitationNote: "No intake is archived on dry-run.",
  },
  {
    id: "boardroom-mode-sim",
    name: "Boardroom Mode Simulator",
    status: "WIRED",
    description: "Dry-run boardroom qualification gate and dossier generation. Calls qualifiesForBoardroom() + generateBoardroomDossier(). No PDF rendered.",
    route: "/admin/intelligence-foundry/simulation/boardroom-mode",
    runType: "SCENARIO",
    engineId: "boardroom-mode",
    capabilities: ["qualification-gate", "dossier-generation", "objection-handling", "dry-run"],
    limitationNote: "No PDF rendered. No dossier persisted.",
  },
  {
    id: "executive-reporting-sim",
    name: "Executive Reporting Simulator",
    status: "WIRED",
    description: "Dry-run executive intelligence brief generation: resonance, HCD delta, OGR manifest, state classification, financial exposure.",
    route: "/admin/intelligence-foundry/simulation/executive-reporting",
    runType: "SCENARIO",
    engineId: "executive-reporting",
    capabilities: ["state-classification", "resonance", "hcd-delta", "ogr-manifest", "financial-exposure", "dry-run"],
    limitationNote: "No data persisted.",
  },
  {
    id: "er-boardroom-bridge-sim",
    name: "ER → Boardroom Bridge Simulator",
    status: "WIRED",
    description: "Proves the governed escalation path: Executive Reporting → IntelligenceSpine → Boardroom qualification. Dry-run bridge.",
    route: "/admin/intelligence-foundry/simulation/executive-report-boardroom-bridge",
    runType: "SCENARIO",
    engineId: "executive-report-boardroom-bridge",
    capabilities: ["escalation-path", "spine-generation", "boardroom-qualification", "dry-run"],
    limitationNote: "No PDF rendered.",
  },
  {
    id: "report-lineage-sim",
    name: "Report Lineage Simulation",
    status: "WIRED",
    description: "Runtime proof of governed product operating architecture. Simulates 7 governance event chains validated against Pass 1 registries.",
    route: "/admin/intelligence-foundry/simulation/report-lineage",
    runType: "SCENARIO",
    engineId: "report-lineage",
    capabilities: ["chain-validation", "event-registry-check", "lineage-proof"],
  },
  // ─── Adversarial / resilience labs ───────────────────────────────────────
  {
    id: "chaos-range",
    name: "Chaos Range",
    status: "WIRED",
    description: "Fault injection and resilience testing under simulated failure conditions. Tests null input, missing fields, type violations, and engine timeout scenarios.",
    route: "/admin/intelligence-foundry/chaos",
    runType: "RED_TEAM",
    capabilities: ["null-input", "missing-field", "type-violation", "timeout-simulation", "boundary-condition"],
  },
  {
    id: "data-poisoning-lab",
    name: "Data Poisoning Lab",
    status: "WIRED",
    description: "Tests system response to corrupted, adversarial, or malformed input. SQL injection patterns, XSS payloads, extreme values, and encoding attacks.",
    route: "/admin/intelligence-foundry/data-poisoning",
    runType: "RED_TEAM",
    capabilities: ["sql-injection", "xss-payload", "extreme-values", "encoding-attack", "adversarial-string"],
  },
  {
    id: "foundry-health",
    name: "Foundry Health",
    status: "WIRED",
    description: "Real ResearchRun data: run velocity, action conversion rate, dormant modules, and effectiveness review thresholds.",
    route: "/admin/intelligence-foundry/health",
    runType: "MANUAL",
    capabilities: ["run-velocity", "action-conversion", "dormant-module-detection", "effectiveness-review"],
  },
  {
    id: "trash-day",
    name: "Trash Day",
    status: "WIRED",
    description: "Surfaces stale unresolved findings: ACTION_REQUIRED >30 days, weak deferrals, OWNER_DECISION_REQUIRED >14 days, and HIGH/CRITICAL >60 days unactioned.",
    route: "/admin/intelligence-foundry/trash-day",
    runType: "MANUAL",
    capabilities: ["stale-action-required", "weak-deferrals", "owner-decisions", "critical-age-tracking"],
  },
  {
    id: "reference-models",
    name: "Reference Models",
    status: "DEMO",
    description: "DEMO — Illustrative only. Not production logic. Reference model comparisons and OGR engine illustrations.",
    route: "/admin/intelligence-foundry/reference",
    runType: "SCENARIO",
    capabilities: [],
    limitationNote: "DEMO only. Reference models are not production decision engines.",
  },
  // ─── Delivery and governance dashboards ───────────────────────────────────
  {
    id: "boardroom-delivery",
    name: "Boardroom Delivery Console",
    status: "WIRED",
    description: "Generate, approve, deliver, and manage client-facing Boardroom Dossiers. Real delivery pipeline with secure token access. Source provenance enforced.",
    route: "/admin/boardroom-delivery",
    runType: "MANUAL",
    capabilities: [
      "dossier-generation",
      "approval-workflow",
      "secure-token-delivery",
      "token-revocation",
      "source-provenance",
      "delivery-audit",
    ],
  },
  {
    id: "product-health",
    name: "Product Health Dashboard",
    status: "WIRED",
    description: "Live integration status for the product ladder, admin ownership, canonical records, lineage, governance events, Foundry coverage, and release blockers.",
    route: "/admin/intelligence-foundry/product-health",
    runType: "MANUAL",
    capabilities: [
      "product-ladder-coverage",
      "canonical-record-check",
      "admin-owner-check",
      "foundry-coverage",
      "lineage-simulation",
      "governance-event-check",
      "entitlement-check",
      "outbound-check",
      "boardroom-delivery-truth",
    ],
  },
];

export function getModule(id: string): ModuleRegistryEntry | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getWiredModules(): ModuleRegistryEntry[] {
  return MODULE_REGISTRY.filter((m) => m.status === "WIRED");
}

export function getDemoModules(): ModuleRegistryEntry[] {
  return MODULE_REGISTRY.filter((m) => m.status === "DEMO");
}

export function getModuleByRoute(route: string): ModuleRegistryEntry | undefined {
  return MODULE_REGISTRY.find((m) => m.route === route);
}
