/**
 * Contract Engine — creates, validates, and manages Pattern-Breaker Contracts.
 *
 * Rules:
 * 1. Reject vague commitments under 12 words
 * 2. Require owner
 * 3. Require deadline
 * 4. Require consequence unless source is toolkit
 * 5. Auto-generate checkpoints by duration
 * 6. Attach Canon signals from enforcement engine
 */

import type { ContractSource, ContractCheckpoint, PatternBreakerContract, ContractStatus, EscalationLevel } from "./types";

export type ContractDraft = {
  source: ContractSource;
  sourceId?: string;
  ownerName?: string;
  ownerEmail?: string;
  commitment: string;
  avoidedPattern?: string;
  consequenceOfInaction?: string;
  canonSignals?: string[];
  canonDefinitions?: string[];
  dueAt: string;
};

export type ContractValidation = {
  valid: boolean;
  errors: string[];
};

function generateId(): string {
  const { randomBytes } = require("crypto") as typeof import("crypto");
  return `pbc_${randomBytes(12).toString("hex")}`;
}

function generateCheckpointId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Validate a contract draft before creation.
 */
export function validateContract(draft: ContractDraft): ContractValidation {
  const errors: string[] = [];

  if (!draft.commitment || draft.commitment.trim().split(/\s+/).length < 12) {
    errors.push("Commitment must be at least 12 words. Vague commitments are not enforceable.");
  }
  if (!draft.ownerName && !draft.ownerEmail) {
    errors.push("Contract requires an owner (name or email).");
  }
  if (!draft.dueAt) {
    errors.push("Contract requires a deadline.");
  } else {
    const due = new Date(draft.dueAt);
    if (isNaN(due.getTime()) || due.getTime() <= Date.now()) {
      errors.push("Deadline must be in the future.");
    }
  }
  if (draft.source !== "toolkit" && !draft.consequenceOfInaction) {
    errors.push("Consequence of inaction is required (unless source is toolkit).");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate checkpoints based on commitment duration.
 */
function generateCheckpoints(dueAt: string): ContractCheckpoint[] {
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const daysUntilDue = Math.max(1, Math.round((due - now) / (1000 * 60 * 60 * 24)));
  const checkpoints: ContractCheckpoint[] = [];

  if (daysUntilDue <= 7) {
    // Short: 48h + deadline
    checkpoints.push({ id: generateCheckpointId(), dueAt: new Date(now + 48 * 60 * 60 * 1000).toISOString(), status: "pending" });
  } else if (daysUntilDue <= 30) {
    // Medium: 7d + 14d + deadline
    checkpoints.push({ id: generateCheckpointId(), dueAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" });
    checkpoints.push({ id: generateCheckpointId(), dueAt: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" });
  } else {
    // Long: 30d + 60d + 90d or deadline
    checkpoints.push({ id: generateCheckpointId(), dueAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" });
    checkpoints.push({ id: generateCheckpointId(), dueAt: new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" });
    if (daysUntilDue > 90) {
      checkpoints.push({ id: generateCheckpointId(), dueAt: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" });
    }
  }

  // Always add deadline checkpoint
  checkpoints.push({ id: generateCheckpointId(), dueAt: new Date(due).toISOString(), status: "pending" });

  return checkpoints;
}

/**
 * Create a Pattern-Breaker Contract from a validated draft.
 */
export function createContract(draft: ContractDraft): PatternBreakerContract {
  const validation = validateContract(draft);
  if (!validation.valid) {
    throw new Error(`Invalid contract: ${validation.errors.join("; ")}`);
  }

  const now = new Date().toISOString();

  return {
    id: generateId(),
    source: draft.source,
    sourceId: draft.sourceId,
    ownerName: draft.ownerName,
    ownerEmail: draft.ownerEmail,
    commitment: draft.commitment.trim(),
    avoidedPattern: draft.avoidedPattern,
    consequenceOfInaction: draft.consequenceOfInaction,
    canonSignals: draft.canonSignals ?? [],
    canonDefinitions: draft.canonDefinitions ?? [],
    dueAt: draft.dueAt,
    checkpoints: generateCheckpoints(draft.dueAt),
    status: "active",
    verificationStatus: "pending",
    breachCount: 0,
    escalationLevel: "none",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update contract status with enforcement rules.
 */
export function updateContractStatus(
  contract: PatternBreakerContract,
  newStatus: ContractStatus,
  reason?: string,
): PatternBreakerContract {
  return {
    ...contract,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
}
