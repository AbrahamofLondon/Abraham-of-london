/**
 * Intervention Path Selector — routing enforcement engine.
 *
 * Routes to: STABILISE / RESTRUCTURE / ESCALATE / MONITOR / REJECT
 * Rejected paths are explained. Fallback triggers stored.
 * Integrates with constitutional routing logic.
 * Deterministic. Same input → same output.
 */

export type InterventionPath = "STABILISE" | "RESTRUCTURE" | "ESCALATE" | "MONITOR" | "REJECT";

export type InterventionInput = {
  severity: number;        // 0-10
  urgency: number;         // 0-10
  authorityClarity: number; // 0-10
  failureHistory: number;  // 0-10 (higher = more prior failures)
  costExposure: number;    // 0-10
  stakeholderAlignment: number; // 0-10
};

export type InterventionResult = {
  recommendedPath: InterventionPath;
  rejectedPaths: Array<{ path: InterventionPath; reason: string }>;
  rationale: string[];
  fallbackTriggers: string[];
  escalationWindow: number; // days
  executionBlocked: boolean;
  blockReason: string | null;
  composite: number;
  deterministic: true;
  version: "1.0";
};

export function selectInterventionPath(input: InterventionInput): InterventionResult {
  const { severity, urgency, authorityClarity, failureHistory, costExposure, stakeholderAlignment } = input;

  // Composite weighted score
  const composite = Math.round(
    severity * 0.25 +
    urgency * 0.20 +
    (10 - authorityClarity) * 0.20 + // invert: low clarity = high score
    failureHistory * 0.15 +
    costExposure * 0.15 +
    (10 - stakeholderAlignment) * 0.05 // invert: low alignment = high score
  );

  const rationale: string[] = [];
  const rejectedPaths: Array<{ path: InterventionPath; reason: string }> = [];
  const fallbackTriggers: string[] = [];
  let recommended: InterventionPath;
  let executionBlocked = false;
  let blockReason: string | null = null;

  // REJECT: authority too unclear + severity too low to justify intervention
  if (authorityClarity <= 2 && severity <= 3) {
    recommended = "REJECT";
    rationale.push("Authority is fundamentally unclear and severity does not justify intervention.");
    rationale.push("The decision cannot be executed under current conditions.");
    executionBlocked = true;
    blockReason = "This decision is not valid under current conditions. Execution is blocked until authority is established.";
    rejectedPaths.push(
      { path: "STABILISE", reason: "Cannot stabilise without clear authority" },
      { path: "RESTRUCTURE", reason: "Restructuring requires baseline authority to restructure from" },
      { path: "ESCALATE", reason: "Severity too low to justify escalation cost" },
    );
  }
  // ESCALATE: high severity + high urgency + high cost
  else if (severity >= 7 && urgency >= 7 && costExposure >= 6) {
    recommended = "ESCALATE";
    rationale.push("Severity and urgency both exceed threshold. Cost exposure is material.");
    rationale.push("Immediate escalation to Strategy Room is the only valid path.");
    fallbackTriggers.push("If escalation is blocked internally, external intervention required within 14 days.");
    rejectedPaths.push(
      { path: "STABILISE", reason: "Severity too high for stabilisation — the condition has passed the point of containment" },
      { path: "MONITOR", reason: "Urgency precludes monitoring — the cost is accruing too fast" },
      { path: "RESTRUCTURE", reason: "Restructuring takes too long given current urgency" },
    );
  }
  // RESTRUCTURE: high failure history + moderate severity
  else if (failureHistory >= 6 && severity >= 5) {
    recommended = "RESTRUCTURE";
    rationale.push("Prior correction attempts have failed repeatedly. The structure itself must change.");
    rationale.push("Incremental fixes will be absorbed by the existing pattern.");
    fallbackTriggers.push("If restructure stalls after 30 days, escalate to Strategy Room.");
    rejectedPaths.push(
      { path: "STABILISE", reason: "Prior failures prove stabilisation alone does not hold" },
      { path: "MONITOR", reason: "Monitoring a known structural failure is delay, not strategy" },
    );
  }
  // STABILISE: moderate severity, authority exists
  else if (severity >= 4 && authorityClarity >= 5) {
    recommended = "STABILISE";
    rationale.push("The condition is active but containable. Authority exists to act.");
    rationale.push("Stabilise the immediate condition before attempting structural correction.");
    fallbackTriggers.push("If stabilisation does not hold within 14 days, escalate.");
    rejectedPaths.push(
      { path: "RESTRUCTURE", reason: "Authority is sufficient — restructure is premature" },
      { path: "ESCALATE", reason: "Severity does not yet warrant full escalation" },
    );
  }
  // MONITOR: low severity, unclear picture
  else {
    recommended = "MONITOR";
    rationale.push("The condition does not yet warrant active intervention.");
    rationale.push("Monitor for escalation triggers. The system will flag if conditions change.");
    fallbackTriggers.push("If severity exceeds 6 OR urgency exceeds 7 within 30 days, re-evaluate.");
    rejectedPaths.push(
      { path: "ESCALATE", reason: "Insufficient severity or urgency" },
      { path: "RESTRUCTURE", reason: "No evidence of structural failure" },
    );
  }

  // Escalation window
  const window = recommended === "ESCALATE" ? 7
    : recommended === "RESTRUCTURE" ? 30
    : recommended === "STABILISE" ? 14
    : recommended === "MONITOR" ? 60
    : 0;

  return {
    recommendedPath: recommended,
    rejectedPaths,
    rationale,
    fallbackTriggers,
    escalationWindow: window,
    executionBlocked,
    blockReason,
    composite,
    deterministic: true,
    version: "1.0",
  };
}
