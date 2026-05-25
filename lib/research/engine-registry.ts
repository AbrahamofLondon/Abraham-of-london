/**
 * lib/research/engine-registry.ts
 *
 * Single source of truth for every named product engine.
 * Honest status only. No perfume on a skeleton.
 */

import type { EngineRegistryEntry } from "./engine-adapter-contract";

export const ENGINE_REGISTRY: EngineRegistryEntry[] = [
  {
    id: "fast-diagnostic",
    name: "Fast Diagnostic",
    status: "PRODUCTION_CALLABLE",
    description: "Rapid organisational diagnostic against the six alignment domains. Foundry adapter wraps real production scoring (percentageScore, severityFromScore, verdictFromScore).",
    version: "2.1.0",
    limitationReason: "Adapter validates inputs and computes deterministic scores. Full AI synthesis pipeline is not wrapped — requires complete production pipeline for forecast, anchor narrative, and signal detection.",
  },
  {
    id: "purpose-alignment",
    name: "Purpose Alignment",
    status: "PRODUCTION_CALLABLE",
    description: "Full purpose alignment assessment engine. Evaluates mission coherence, decision alignment, and behavioural consistency.",
    version: "3.0.0",
  },
  {
    id: "constitutional-diagnostic",
    name: "Constitutional Diagnostic",
    status: "PRODUCTION_NEEDS_WRAP",
    description: "Diagnostic engine that evaluates against the Abraham of London constitutional framework.",
    version: "1.0.0",
    limitationReason: "Engine exists but requires a Foundry adapter to capture version, timing, and structured findings.",
    adapterRequired: "FoundryEngineAdapter wrapping constitutionalDiagnosticRunner()",
  },
  {
    id: "executive-reporting",
    name: "Executive Reporting",
    status: "PRODUCTION_CALLABLE",
    description: "Generates executive intelligence briefs and governance reports from assessment data.",
    version: "2.0.0",
  },
  {
    id: "strategy-room",
    name: "Strategy Room",
    status: "PRODUCTION_NEEDS_WRAP",
    description: "Strategic scenario engine. Evaluates strategic options against organisational capacity and market position.",
    version: "1.2.0",
    limitationReason: "Core logic is callable but not wrapped for structured Foundry output.",
    adapterRequired: "Structured output adapter with Finding serialisation",
  },
  {
    id: "enterprise-decision-authority",
    name: "Enterprise Decision Authority",
    status: "PRODUCTION_CALLABLE",
    description: "Decision authority governance engine. Validates decision rights, authority levels, and escalation paths.",
    version: "1.5.0",
  },
  {
    id: "boardroom-dossier",
    name: "Boardroom Dossier",
    status: "PRODUCTION_NEEDS_WRAP",
    description: "Produces comprehensive boardroom intelligence dossiers combining diagnostic, strategic, and market data.",
    version: "1.0.0",
    limitationReason: "Output is PDF-only. Requires structured JSON intermediate layer for Foundry integration.",
    adapterRequired: "JSON extraction layer before PDF render",
  },
  {
    id: "gmi",
    name: "Global Market Intelligence",
    status: "PRODUCTION_CALLABLE",
    description: "Global Market Intelligence engine. Produces signal-validated market position briefs with evidence posture scoring.",
    version: "2.0.0",
  },
  {
    id: "outbound-policy-gate",
    name: "Outbound Policy Gate",
    status: "PRODUCTION_CALLABLE",
    description: "Enforces outbound content policy: claim safety, UK house style, platform rules, and approval readiness.",
    version: "1.3.0",
  },
  {
    id: "cohort-privacy",
    name: "Cohort Privacy",
    status: "PRODUCTION_CALLABLE",
    description: "Privacy-preserving cohort assignment engine. Validates that no individual can be identified from cohort membership.",
    version: "1.1.0",
  },
  {
    id: "report-lineage",
    name: "Report Lineage",
    status: "PRODUCTION_CALLABLE",
    description: "Append-only chain-of-custody engine for report events. Validates lineage integrity from creation to delivery.",
    version: "1.0.0",
  },
  {
    id: "editorial-style-checker",
    name: "Editorial Style Checker",
    status: "PRODUCTION_CALLABLE",
    description: "Validates content against Abraham of London editorial house style: UK spelling, forbidden phrases, tone, and claim defensibility.",
    version: "1.2.0",
  },
  {
    id: "outbound-content-validator",
    name: "Outbound Content Validator",
    status: "PRODUCTION_CALLABLE",
    description: "Full outbound content validation: platform rules, claim safety, length, tone, link allowlist, and approval readiness.",
    version: "1.3.0",
  },
  {
    id: "contradiction-detection",
    name: "Contradiction Detection",
    status: "DOCUMENTATION_ONLY",
    description: "Detects logical contradictions between claims made in different content assets or time periods.",
    version: "0.1.0",
    limitationReason: "Architecture documented. Implementation not started. No callable logic exists.",
  },
  {
    id: "cost-of-delay",
    name: "Cost of Delay",
    status: "DOCUMENTATION_ONLY",
    description: "Quantifies the cost of delaying a decision or initiative. Requires financial modelling integration.",
    version: "0.1.0",
    limitationReason: "Concept documented. Financial data integration not implemented.",
  },
  {
    id: "pattern-recurrence",
    name: "Pattern Recurrence",
    status: "PRODUCTION_CALLABLE",
    description: "Identifies recurring decision patterns, failure modes, and behavioural loops across diagnostic history. Foundry adapter wraps real production logic from lib/diagnostics/pattern-recurrence.ts.",
    version: "0.5.0",
    limitationReason: "Adapter requires structured baseline/current input. Works best with real evidence data from DiagnosticJourney.",
  },
  {
    id: "decision-credit",
    name: "Decision Credit",
    status: "DOCUMENTATION_ONLY",
    description: "Assigns credit for correct decisions and accountability for poor decisions across the leadership hierarchy.",
    version: "0.1.0",
    limitationReason: "Governance framework documented. No scoring logic implemented.",
  },
  {
    id: "consequence-engine",
    name: "Consequence Engine",
    status: "DOCUMENTATION_ONLY",
    description: "Models downstream consequences of decisions across time, stakeholder groups, and market position.",
    version: "0.1.0",
    limitationReason: "Consequence modelling requires causal graph infrastructure not yet built.",
  },
  {
    id: "retainer-readiness",
    name: "Retainer Readiness",
    status: "PRODUCTION_CALLABLE",
    description: "Evaluates retainer contract readiness: capacity, coverage, active cycle status, and renewal health.",
    version: "1.0.0",
  },
  {
    id: "enforcement-gates",
    name: "Enforcement Gates",
    status: "PRODUCTION_CALLABLE",
    description: "CI/CD enforcement gates that block merge or deploy when unresolved critical findings exist.",
    version: "1.0.0",
  },
  {
    id: "reference-ogr-engine",
    name: "Reference OGR Engine",
    status: "DOCUMENTATION_ONLY",
    description:
      "REFERENCE MODEL — NOT PRODUCTION DECISION ENGINE. Illustrative organisational governance reference used for scenario comparisons.",
    version: "0.1.0",
    limitationReason:
      "Reference model only. Not used in production decisions. Illustrative output only.",
  },
];

export function getEngine(id: string): EngineRegistryEntry | undefined {
  return ENGINE_REGISTRY.find((e) => e.id === id);
}

export function getCallableEngines(): EngineRegistryEntry[] {
  return ENGINE_REGISTRY.filter((e) => e.status === "PRODUCTION_CALLABLE");
}

export function getNonCallableEngines(): EngineRegistryEntry[] {
  return ENGINE_REGISTRY.filter((e) => e.status !== "PRODUCTION_CALLABLE");
}
