import type { RunStatus } from "./foundry-contract";

// Exhaustive allowed transitions. ARCHIVED is terminal — no outbound edges.
//
// Maturity-aware statuses (Phase 3):
//   SIMULATION_RECORDED — terminal for simulation runs (may promote to PILOT_RECORDED via promotion workflow)
//   PILOT_RECORDED      — terminal for pilot runs (may promote to IMPLEMENTED via promotion workflow)
//   PARTIAL             — incomplete output; can retry (→ IN_PROGRESS) or be abandoned (→ FAILED/ARCHIVED)
//   SKIPPED             — intentional skip; can be retried or archived
const TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  PENDING:                  ["PROCESSING", "IN_PROGRESS", "SKIPPED", "FAILED"],
  PROCESSING:               ["IN_PROGRESS", "PARTIAL", "FAILED"],
  IN_PROGRESS:              ["COMPLETE", "RECORDED", "SIMULATION_RECORDED", "PILOT_RECORDED", "PARTIAL", "ACTION_REQUIRED", "FAILED"],
  COMPLETE:                 ["ACTION_REQUIRED", "IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  RECORDED:                 ["ACTION_REQUIRED", "IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  // Simulation runs: evidence is stored but no live action. Can escalate to ACTION_REQUIRED
  // if the simulation reveals a blocking finding that requires real remediation.
  SIMULATION_RECORDED:      ["ACTION_REQUIRED", "DEFERRED", "PILOT_RECORDED", "ARCHIVED"],
  // Pilot runs: controlled real execution. Can escalate to IMPLEMENTED (full live deployment)
  // or ACTION_REQUIRED if pilot reveals a gap.
  PILOT_RECORDED:           ["ACTION_REQUIRED", "IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  // Partial: retry or abandon
  PARTIAL:                  ["IN_PROGRESS", "FAILED", "ACTION_REQUIRED", "ARCHIVED"],
  // Skipped: retry or archive
  SKIPPED:                  ["PENDING", "ARCHIVED"],
  ACTION_REQUIRED:          ["OWNER_DECISION_REQUIRED", "IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  OWNER_DECISION_REQUIRED:  ["IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  REVIEWED:                 ["IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  IMPLEMENTED:              ["ARCHIVED"],
  DEFERRED:                 ["ACTION_REQUIRED", "OWNER_DECISION_REQUIRED", "IMPLEMENTED", "ARCHIVED"],
  FAILED:                   ["PENDING", "ARCHIVED"],
  ARCHIVED:                 [], // terminal
};

export class StatusTransitionError extends Error {
  constructor(from: RunStatus, to: RunStatus) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = "StatusTransitionError";
  }
}

export function assertTransitionAllowed(from: RunStatus, to: RunStatus): void {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new StatusTransitionError(from, to);
  }
}

export function isTerminal(status: RunStatus): boolean {
  return status === "ARCHIVED";
}

export function allowedTransitions(from: RunStatus): RunStatus[] {
  return TRANSITIONS[from] ?? [];
}
