/**
 * Pattern-Breaker Contract Types — shared across all product lines.
 *
 * A decision is not complete until it produces a contract
 * or a recorded reason why no contract is required.
 */

export type ContractSource =
  | "purpose_alignment"
  | "strategy_room"
  | "executive_reporting"
  | "decision_instrument"
  | "toolkit";

export type ContractStatus =
  | "draft"
  | "active"
  | "completed"
  | "breached"
  | "extended"
  | "cancelled";

export type VerificationStatus =
  | "pending"
  | "self_reported"
  | "behavior_verified"
  | "disputed"
  | "failed";

export type EscalationLevel = "none" | "warning" | "restricted" | "locked";

export type ContractCheckpoint = {
  id: string;
  dueAt: string;
  status: "pending" | "met" | "missed" | "disputed";
  evidence?: string;
  verifiedAt?: string;
  reminderSent?: boolean;
};

export type PatternBreakerContract = {
  id: string;
  source: ContractSource;
  sourceId?: string;
  ownerName?: string;
  ownerEmail?: string;
  commitment: string;
  avoidedPattern?: string;
  consequenceOfInaction?: string;
  canonSignals: string[];
  canonDefinitions: string[];
  dueAt: string;
  checkpoints: ContractCheckpoint[];
  status: ContractStatus;
  verificationStatus: VerificationStatus;
  breachCount: number;
  escalationLevel: EscalationLevel;
  createdAt: string;
  updatedAt: string;
};
