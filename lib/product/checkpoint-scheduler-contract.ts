/**
 * lib/product/checkpoint-scheduler-contract.ts
 *
 * Durable checkpoint records. Every efficacy command creates a checkpoint.
 * The checkpoint is the spine of behavioural governance.
 *
 * Without checkpoints, the product is a calculator.
 * With checkpoints, the product is an institution.
 */

import type {
  EfficacySurface,
  EfficacyActionType,
  CheckpointType,
  CheckpointResponseType,
  CheckpointResponseStatus,
} from "@/lib/product/efficacy-contract";

export type CheckpointStatus =
  | "SCHEDULED"
  | "DUE"
  | "OVERDUE"
  | "RESPONDED"
  | "EXPIRED"
  | "CANCELLED";

export type CheckpointRecord = {
  id: string;
  userId?: string;
  email?: string;
  caseId?: string;
  sessionId?: string;
  surface: EfficacySurface;
  actionType: EfficacyActionType;
  checkpointType: CheckpointType;
  commandTitle: string;
  verificationQuestion: string;
  requiredResponseType: CheckpointResponseType;
  dueAt: string;
  status: CheckpointStatus;
  responseStatus?: CheckpointResponseStatus;
  respondedAt?: string;
  evidenceNote?: string;
  blockerDescription?: string;
  whatChanged?: string;
  whatShouldSystemRemember?: string;
  escalationTriggered?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCheckpointInput = {
  userId?: string;
  email?: string;
  caseId?: string;
  sessionId?: string;
  surface: EfficacySurface;
  actionType: EfficacyActionType;
  checkpointType: CheckpointType;
  commandTitle: string;
  verificationQuestion: string;
  requiredResponseType: CheckpointResponseType;
  dueAt: string;
};

export type RespondToCheckpointInput = {
  checkpointId: string;
  responseStatus: CheckpointResponseStatus;
  evidenceNote?: string;
  blockerDescription?: string;
  whatChanged?: string;
  whatShouldSystemRemember?: string;
};

export function classifyCheckpointOutcome(response: CheckpointResponseStatus): string {
  switch (response) {
    case "COMPLETED": return "ACTION_CONFIRMED";
    case "PARTIALLY_COMPLETED": return "OUTCOME_IMPROVED";
    case "BLOCKED": return "ACTION_BLOCKED";
    case "ABANDONED": return "ACTION_ABANDONED";
    case "NO_LONGER_RELEVANT": return "OUTCOME_UNCHANGED";
    case "DISPUTED_FINDING": return "SYSTEM_FINDING_DISPUTED";
    case "NOT_RESPONDED": return "INSUFFICIENT_EVIDENCE";
    default: return "INSUFFICIENT_EVIDENCE";
  }
}

export function isCheckpointOverdue(checkpoint: { dueAt: string; status: CheckpointStatus }): boolean {
  if (checkpoint.status === "RESPONDED" || checkpoint.status === "CANCELLED" || checkpoint.status === "EXPIRED") {
    return false;
  }
  return new Date(checkpoint.dueAt).getTime() < Date.now();
}

export function getCheckpointUrgency(checkpoint: { dueAt: string; status: CheckpointStatus }): "NOT_DUE" | "DUE_SOON" | "DUE_NOW" | "OVERDUE" {
  if (checkpoint.status === "RESPONDED" || checkpoint.status === "CANCELLED") return "NOT_DUE";
  const diff = new Date(checkpoint.dueAt).getTime() - Date.now();
  if (diff < 0) return "OVERDUE";
  if (diff < 24 * 60 * 60 * 1000) return "DUE_NOW";
  if (diff < 3 * 24 * 60 * 60 * 1000) return "DUE_SOON";
  return "NOT_DUE";
}
