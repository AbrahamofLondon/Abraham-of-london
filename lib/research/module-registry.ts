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
  {
    id: "chaos-range",
    name: "Chaos Range",
    status: "PLANNED",
    description: "Fault injection and resilience testing under simulated failure conditions.",
    route: "/admin/intelligence-foundry/chaos",
    runType: "SCENARIO",
    capabilities: [],
    limitationNote: "Not yet built. Planned for Phase 2.",
  },
  {
    id: "data-poisoning-lab",
    name: "Data Poisoning Lab",
    status: "PLANNED",
    description: "Tests system response to corrupted, adversarial, or malformed input data.",
    route: "/admin/intelligence-foundry/data-poisoning",
    runType: "RED_TEAM",
    capabilities: [],
    limitationNote: "Not yet built. Planned for Phase 2.",
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
