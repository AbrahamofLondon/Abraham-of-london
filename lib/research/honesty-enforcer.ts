/**
 * lib/research/honesty-enforcer.ts
 *
 * Enforces the five laws of the Honesty Constitution at runtime.
 * All archive, status, and finding operations must pass through the relevant
 * validator before the repository accepts the write.
 */

import type { ResearchRun, RunStatus, Finding, ModuleStatus } from "./foundry-contract";

export type HonestyViolation = {
  law: 1 | 2 | 3 | 4 | 5;
  message: string;
};

export type HonestyResult =
  | { ok: true }
  | { ok: false; violations: HonestyViolation[] };

// ─── Law 1: No False Labels ───────────────────────────────────────────────────

/**
 * WIRED cannot be self-declared. It must pass real-logic classification.
 * Call real-logic-classifier before allowing WIRED status.
 */
export function validateWiredStatus(
  moduleStatus: ModuleStatus,
  hasRealLogicQualification: boolean,
): HonestyResult {
  if (moduleStatus === "WIRED" && !hasRealLogicQualification) {
    return {
      ok: false,
      violations: [
        {
          law: 1,
          message:
            "WIRED status requires real-logic qualification. Module has not passed the classifier.",
        },
      ],
    };
  }
  return { ok: true };
}

// ─── Law 2: No Hidden DEMO ────────────────────────────────────────────────────

/**
 * A DEMO run must have isDemo: true. This is enforced at repository create/update.
 */
export function validateDemoFlag(run: {
  isDemo: boolean;
  moduleStatus: ModuleStatus;
}): HonestyResult {
  if (run.moduleStatus === "DEMO" && !run.isDemo) {
    return {
      ok: false,
      violations: [
        {
          law: 2,
          message:
            "Runs from DEMO modules must have isDemo: true. Hidden DEMO status violates the Honesty Constitution.",
        },
      ],
    };
  }
  return { ok: true };
}

// ─── Law 3: No Score Without Source ──────────────────────────────────────────

/**
 * Every finding must include a non-empty source field.
 */
export function validateFindings(findings: Finding[]): HonestyResult {
  const violations: HonestyViolation[] = [];

  for (const finding of findings) {
    if (!finding.source || finding.source.trim() === "") {
      violations.push({
        law: 3,
        message: `Finding "${finding.title}" has no source. Every score and severity must expose the rule or formula that produced it.`,
      });
    }
  }

  return violations.length > 0 ? { ok: false, violations } : { ok: true };
}

// ─── Law 4: No Serious Finding Without a Path ─────────────────────────────────

/**
 * HIGH or CRITICAL runs cannot be archived without a decision path:
 * - implementedAt (actioned)
 * - deferredReason (conscious deferral with stated reason)
 * - decisionOutcome (owner escalation resolved)
 */
export function validateArchive(run: Pick<ResearchRun, "severity" | "implementedAt" | "deferredReason" | "decisionOutcome">): HonestyResult {
  const seriousSeverities = ["HIGH", "CRITICAL"];

  if (!seriousSeverities.includes(run.severity)) {
    return { ok: true };
  }

  const hasPath =
    run.implementedAt != null ||
    (run.deferredReason != null && run.deferredReason.trim().length > 0) ||
    (run.decisionOutcome != null && run.decisionOutcome.trim().length > 0);

  if (!hasPath) {
    return {
      ok: false,
      violations: [
        {
          law: 4,
          message: `${run.severity} severity run cannot be archived without a decision path. Set implementedAt, deferredReason, or decisionOutcome first.`,
        },
      ],
    };
  }

  return { ok: true };
}

// ─── Law 5: No Module Claims More Than It Delivers ────────────────────────────

/**
 * Module name, status, and description must be internally consistent.
 * This is enforced at module registration time by the real-logic classifier.
 */
export function validateModuleDeclaration(module: {
  name: string;
  status: ModuleStatus;
  description: string;
  capabilities: string[];
}): HonestyResult {
  const violations: HonestyViolation[] = [];

  if (module.status === "WIRED" && module.capabilities.length === 0) {
    violations.push({
      law: 5,
      message: `Module "${module.name}" declares WIRED status but lists no capabilities. Capabilities must match what the code actually does.`,
    });
  }

  if (module.description.trim() === "") {
    violations.push({
      law: 5,
      message: `Module "${module.name}" has an empty description. The description must accurately state what the module does.`,
    });
  }

  return violations.length > 0 ? { ok: false, violations } : { ok: true };
}

// ─── Compound Validator ───────────────────────────────────────────────────────

/**
 * Run all relevant checks before a ResearchRun write.
 * Collect all violations rather than short-circuiting.
 */
export function enforceHonestyOnCreate(params: {
  run: Omit<ResearchRun, "id" | "createdAt" | "updatedAt">;
  moduleStatus: ModuleStatus;
  findings: Finding[];
}): HonestyResult {
  const allViolations: HonestyViolation[] = [];

  const demoCheck = validateDemoFlag({
    isDemo: params.run.isDemo,
    moduleStatus: params.moduleStatus,
  });
  if (!demoCheck.ok) allViolations.push(...demoCheck.violations);

  const findingCheck = validateFindings(params.findings);
  if (!findingCheck.ok) allViolations.push(...findingCheck.violations);

  return allViolations.length > 0
    ? { ok: false, violations: allViolations }
    : { ok: true };
}

export function enforceHonestyOnArchive(
  run: Pick<ResearchRun, "severity" | "implementedAt" | "deferredReason" | "decisionOutcome">
): HonestyResult {
  return validateArchive(run);
}

export function enforceHonestyOnDefer(params: { deferredReason: string }): HonestyResult {
  if (!params.deferredReason || params.deferredReason.trim().length < 20) {
    return {
      ok: false,
      violations: [
        {
          law: 4,
          message:
            "Deferral requires a substantive reason (minimum 20 characters). State why and what the conditions for revisiting are.",
        },
      ],
    };
  }
  return { ok: true };
}

export function enforceHonestyOnFindingCreate(finding: Finding): HonestyResult {
  return validateFindings([finding]);
}
