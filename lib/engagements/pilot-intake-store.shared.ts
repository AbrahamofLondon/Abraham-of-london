/**
 * lib/engagements/pilot-intake-store.shared.ts
 *
 * Pure Operator Pilot domain logic shared by BOTH persistence adapters (SQLite local/test,
 * Prisma production). Contains NO database import — so the production Prisma path never
 * transitively pulls in better-sqlite3 (§16 serverless bundling safety).
 */

import crypto from "node:crypto";
import { hashPilotStatusSecret, newPilotStatusSecret } from "./pilot-status-security";
import type { PilotIntake, QualificationResult } from "./operator-pilot-qualification";

export type PilotLifecycleState =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "RESUBMITTED"
  | "HUMAN_REVIEW"
  | "POTENTIALLY_SUITABLE"
  | "ACCEPTED"
  | "DECLINED"
  | "SCOPING"
  | "COMMERCIAL_CONTINUATION";

export type ReviewStatus = PilotLifecycleState;

export interface PilotIntakeRecord {
  reference: string;
  createdAt: string;
  updatedAt: string;
  intake: PilotIntake;
  qualification: QualificationResult;
  reviewStatus: PilotLifecycleState;
  owner: string | null;
  operatorNote: string | null;
  requestedInformation: string | null;
  finalDecision: string | null;
  fingerprint: string;
  statusSecretHash: string | null;
  statusSecretExpiresAt: string | null;
  statusSecretRevokedAt: string | null;
  statusSecret?: string;
  duplicateClassification?: PilotDuplicateClassification;
}

export type PilotDuplicateClassification = "EXACT_RETRY" | "POSSIBLE_DUPLICATE" | "MATERIAL_RESUBMISSION" | "NEW_INTAKE";

export interface SavePilotIntakeOptions {
  idempotencyKey?: string | null;
}

export interface PilotCustomerStatus {
  reference: string;
  currentState: PilotLifecycleState;
  lastUpdate: string;
  requestedInformation: string | null;
  nextExpectedStep: string;
  finalDecision: string | null;
}

export interface PilotQueueItem extends PilotIntakeRecord {
  ageHours: number;
  nextOperation: string;
  evidencePosture: string;
  qualificationStatus: string;
}

export function newPilotReference(): string {
  return `pilot_${crypto.randomBytes(16).toString("hex")}`;
}


export interface PilotStatusSecretIssue {
  secret: string;
  hash: string;
  expiresAt: string;
}

export function issuePilotStatusSecret(now = new Date()): PilotStatusSecretIssue {
  const secret = newPilotStatusSecret();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return { secret, hash: hashPilotStatusSecret(secret), expiresAt };
}
export const PILOT_REFERENCE_RE = /^pilot_[a-f0-9]{32}$/;

function canonicalText(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function canonicalDate(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : raw;
}

export function fingerprintPilotIntake(intake: PilotIntake): string {
  return crypto.createHash("sha256").update(JSON.stringify({
    version: "pilot-intake-fingerprint-v2",
    organisation: canonicalText(intake.organisation),
    role: canonicalText(intake.role),
    authorityToEngage: Boolean(intake.authorityToEngage),
    decisionDomain: canonicalText(intake.decisionDomain),
    materiality: intake.materiality,
    decisionStage: intake.decisionStage,
    affectedStakeholders: canonicalText(intake.affectedStakeholders),
    decisionDeadline: canonicalDate(intake.decisionDeadline),
    existingEvidence: canonicalText(intake.existingEvidence),
    knownContradictions: canonicalText(intake.knownContradictions),
    governanceSensitivity: intake.governanceSensitivity,
    confidentialityRequired: Boolean(intake.confidentialityRequired),
    desiredOutcome: canonicalText(intake.desiredOutcome),
    willingToParticipateInCheckpoints: Boolean(intake.willingToParticipateInCheckpoints),
    contactEmail: canonicalText(intake.contactEmail),
  })).digest("hex");
}

export function hashPilotIdempotencyKey(key: string): string {
  const normalized = String(key ?? "").normalize("NFKC").trim();
  if (normalized.length < 12 || normalized.length > 160) throw new Error("INVALID_PILOT_IDEMPOTENCY_KEY");
  return crypto.createHash("sha256").update(`operator-pilot-idempotency-v1:${normalized}`).digest("hex");
}

export function initialState(qualification: QualificationResult): PilotLifecycleState {
  if (qualification.status === "MORE_INFO_REQUIRED" || qualification.status === "INCOMPLETE") return "MORE_INFORMATION_REQUIRED";
  if (qualification.status === "HUMAN_REVIEW_REQUIRED") return "HUMAN_REVIEW";
  if (qualification.status === "POTENTIALLY_SUITABLE") return "POTENTIALLY_SUITABLE";
  if (qualification.status === "UNSUITABLE") return "DECLINED";
  return "SUBMITTED";
}

export const ALLOWED: Record<PilotLifecycleState, PilotLifecycleState[]> = {
  SUBMITTED: ["UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "HUMAN_REVIEW", "DECLINED"],
  UNDER_REVIEW: ["MORE_INFORMATION_REQUIRED", "HUMAN_REVIEW", "POTENTIALLY_SUITABLE", "DECLINED"],
  MORE_INFORMATION_REQUIRED: ["RESUBMITTED", "DECLINED"],
  RESUBMITTED: ["UNDER_REVIEW", "HUMAN_REVIEW", "DECLINED"],
  HUMAN_REVIEW: ["POTENTIALLY_SUITABLE", "ACCEPTED", "DECLINED"],
  POTENTIALLY_SUITABLE: ["ACCEPTED", "DECLINED", "MORE_INFORMATION_REQUIRED"],
  ACCEPTED: ["SCOPING"],
  DECLINED: [],
  SCOPING: ["COMMERCIAL_CONTINUATION"],
  COMMERCIAL_CONTINUATION: [],
};

export function nextOperation(record: PilotIntakeRecord): string {
  if (record.reviewStatus === "SUBMITTED" || record.reviewStatus === "RESUBMITTED") return "Triage and assign reviewer";
  if (record.reviewStatus === "UNDER_REVIEW") return "Decide whether more information or human review is required";
  if (record.reviewStatus === "MORE_INFORMATION_REQUIRED") return "Wait for applicant resubmission";
  if (record.reviewStatus === "HUMAN_REVIEW" || record.reviewStatus === "POTENTIALLY_SUITABLE") return "Human authority decision required";
  if (record.reviewStatus === "ACCEPTED") return "Move to scope definition";
  if (record.reviewStatus === "SCOPING") return "Prepare commercial continuation";
  return "No operator action";
}

export function toCustomerStatus(record: PilotIntakeRecord): PilotCustomerStatus {
  const next: Record<PilotLifecycleState, string> = {
    SUBMITTED: "Your intake has been received and is waiting for operator triage.",
    UNDER_REVIEW: "An operator is checking evidence, authority and suitability.",
    MORE_INFORMATION_REQUIRED: "Additional information is required before review can continue.",
    RESUBMITTED: "Your updated information has been received and is queued for review.",
    HUMAN_REVIEW: "A human reviewer is required before any suitability decision.",
    POTENTIALLY_SUITABLE: "The intake may be suitable; a human reviewer must still decide.",
    ACCEPTED: "The pilot has been accepted and will move into scoping.",
    DECLINED: "The pilot is not suitable on the current evidence.",
    SCOPING: "Scope and commercial continuation are being prepared.",
    COMMERCIAL_CONTINUATION: "Commercial continuation is ready through the controlled route.",
  };
  return { reference: record.reference, currentState: record.reviewStatus, lastUpdate: record.updatedAt, requestedInformation: record.requestedInformation, nextExpectedStep: next[record.reviewStatus], finalDecision: record.finalDecision };
}
