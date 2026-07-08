import crypto from "node:crypto";

export type SignalContinuationState =
  | "ANONYMOUS_RUN"
  | "CONTINUE_REQUESTED"
  | "IDENTITY_ESTABLISHED"
  | "CONSENT_CAPTURED"
  | "CASE_BOUND"
  | "INTERACTION_RECORDED"
  | "TWIN_UPDATED"
  | "EXPIRED"
  | "REJECTED";

export interface SignalContinuationRecord {
  token: string;
  recommendationId: string;
  sessionId: string;
  mode: "LIVE" | "EXAMPLE";
  state: SignalContinuationState;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  tenantId: string | null;
  subjectId: string | null;
  consentCapturedAt: string | null;
  caseId: string | null;
  interactionId: string | null;
  twinVersion: number | null;
  stateHash: string;
}

export const SIGNAL_CONTINUATION_TOKEN_RE = /^sigc_[a-f0-9]{48}$/;
export const SIGNAL_RECOMMENDATION_RE = /^rec_[A-Za-z0-9_-]{6,}$/;

export function hashSignalContinuation(parts: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

export function newSignalContinuationToken(): string {
  return `sigc_${crypto.randomBytes(24).toString("hex")}`;
}

export function newSignalInteractionId(): string {
  return `int_${crypto.randomBytes(10).toString("hex")}`;
}

export function isSignalContinuationExpired(record: SignalContinuationRecord, now: string): boolean {
  return Date.parse(record.expiresAt) <= Date.parse(now);
}
