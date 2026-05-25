/**
 * lib/research/real-logic-classifier.ts
 *
 * Validates whether a module qualifies for WIRED status.
 * WIRED cannot be self-declared — it must pass this classifier.
 */

import type { ModuleStatus } from "./foundry-contract";

export type ClassifierResult =
  | { qualified: true; status: "WIRED" }
  | { qualified: false; status: Exclude<ModuleStatus, "WIRED">; reason: string };

export type ClassifierInput = {
  /** The engine ID this module wraps */
  engineId?: string;
  /** Whether the engine is PRODUCTION_CALLABLE */
  engineIsCallable: boolean;
  /** Whether the module has at least one implemented capability */
  hasImplementedCapabilities: boolean;
  /** Whether findings include the required source field */
  findingsHaveSource: boolean;
  /** Whether the module writes through ResearchRunRepository (not raw Prisma) */
  writesViaRepository: boolean;
  /** Whether the module displays DemoDisclaimer when isDemo */
  displaysDemoDisclaimer: boolean;
};

export function classifyModule(input: ClassifierInput): ClassifierResult {
  if (!input.engineIsCallable) {
    return {
      qualified: false,
      status: "ADAPTER_NEEDED",
      reason: `Engine is not PRODUCTION_CALLABLE. Module cannot be WIRED until the engine is callable.`,
    };
  }

  if (!input.hasImplementedCapabilities) {
    return {
      qualified: false,
      status: "DEMO",
      reason: "Module has no implemented capabilities. At least one capability must be production logic.",
    };
  }

  if (!input.findingsHaveSource) {
    return {
      qualified: false,
      status: "PARTIAL",
      reason: "Module produces findings without source fields. Every finding must expose the rule or formula that produced it (Law 3).",
    };
  }

  if (!input.writesViaRepository) {
    return {
      qualified: false,
      status: "PARTIAL",
      reason: "Module writes ResearchRun data directly through Prisma. All writes must go through ResearchRunRepository.",
    };
  }

  if (!input.displaysDemoDisclaimer) {
    return {
      qualified: false,
      status: "PARTIAL",
      reason: "Module does not render DemoDisclaimer when isDemo is true. This is required by Law 2.",
    };
  }

  return { qualified: true, status: "WIRED" };
}

/**
 * Runtime check used by HonestyEnforcer.validateWiredStatus.
 * The list of modules that have passed the classifier is authoritative.
 */
const WIRED_QUALIFIED_MODULES = new Set([
  "scenario-workbench",
  "research-run-vault",
  "content-red-team",
  "outbound-narrative-range",
  "market-response-lab",
  "engine-testing-range",
  "foundry-health",
  "trash-day",
  "fast-diagnostic-sim",
]);

export function hasRealLogicQualification(moduleId: string): boolean {
  return WIRED_QUALIFIED_MODULES.has(moduleId);
}
