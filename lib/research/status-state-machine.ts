import type { RunStatus } from "./foundry-contract";

// Exhaustive allowed transitions. ARCHIVED is terminal — no outbound edges.
const TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  PENDING: ["PROCESSING", "IN_PROGRESS", "FAILED"],
  PROCESSING: ["IN_PROGRESS", "FAILED"],
  IN_PROGRESS: ["COMPLETE", "RECORDED", "ACTION_REQUIRED", "FAILED"],
  COMPLETE: ["ACTION_REQUIRED", "IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  RECORDED: ["ACTION_REQUIRED", "IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  ACTION_REQUIRED: ["OWNER_DECISION_REQUIRED", "IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  OWNER_DECISION_REQUIRED: ["IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  REVIEWED: ["IMPLEMENTED", "DEFERRED", "ARCHIVED"],
  IMPLEMENTED: ["ARCHIVED"],
  DEFERRED: ["ACTION_REQUIRED", "OWNER_DECISION_REQUIRED", "IMPLEMENTED", "ARCHIVED"],
  FAILED: ["PENDING", "ARCHIVED"],
  ARCHIVED: [], // terminal
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
