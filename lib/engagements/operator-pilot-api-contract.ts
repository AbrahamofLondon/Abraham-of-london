import type { PilotIntake } from "./operator-pilot-qualification";
import type { PilotCustomerStatus, PilotLifecycleState } from "./pilot-intake-store.shared";

export const PILOT_DECISION_STAGES = ["EXPLORING", "FRAMING", "DECIDING", "COMMITTED"] as const;
export const PILOT_MATERIALITIES = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export const PILOT_GOVERNANCE_SENSITIVITIES = ["NONE", "SOME", "HIGH", "REGULATED"] as const;

export type PilotDecisionStage = (typeof PILOT_DECISION_STAGES)[number];
export type PilotMateriality = (typeof PILOT_MATERIALITIES)[number];
export type PilotGovernanceSensitivity = (typeof PILOT_GOVERNANCE_SENSITIVITIES)[number];

export interface PilotIntakeRequest extends PilotIntake {
  sessionId?: string;
  idempotencyKey?: string;
}

export interface PilotStatusAccess {
  statusUrl: "/engagements/operator-pilot-status";
  secret: string;
  expiresAt: string | null;
}

export interface PilotIntakeSuccessResponse {
  reference: string;
  qualificationStatus: string;
  reviewStatus: PilotLifecycleState;
  currentState: PilotLifecycleState;
  nextStep: string;
  statusAccess: PilotStatusAccess | null;
  reasons: string[];
  duplicateClassification: "EXACT_RETRY" | "POSSIBLE_DUPLICATE" | "MATERIAL_RESUBMISSION" | "NEW_INTAKE";
}

export interface PilotIntakeValidationErrorResponse {
  error: "Intake incomplete";
  qualification: {
    missingFields: string[];
    reasons: string[];
    status: "INCOMPLETE";
  };
}

export interface PilotApiErrorResponse {
  error: string;
  code?: string;
}

export interface PilotStatusSessionRequest {
  secret: string;
}

export interface PilotStatusSessionResponse {
  ok: true;
  status: PilotCustomerStatus;
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function optionalText(value: unknown): string | undefined {
  const v = text(value);
  return v ? v : undefined;
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return allowed.includes(value as string) ? (value as T[number]) : fallback;
}

export function parsePilotIntakeRequest(body: unknown): PilotIntakeRequest {
  const input = (body && typeof body === "object") ? (body as Record<string, unknown>) : {};
  return {
    organisation: text(input.organisation),
    role: text(input.role),
    authorityToEngage: Boolean(input.authorityToEngage),
    decisionDomain: text(input.decisionDomain),
    materiality: enumValue(input.materiality, PILOT_MATERIALITIES, "MODERATE"),
    decisionStage: enumValue(input.decisionStage, PILOT_DECISION_STAGES, "FRAMING"),
    affectedStakeholders: text(input.affectedStakeholders),
    decisionDeadline: input.decisionDeadline ? text(input.decisionDeadline) : null,
    existingEvidence: text(input.existingEvidence),
    knownContradictions: text(input.knownContradictions),
    governanceSensitivity: enumValue(input.governanceSensitivity, PILOT_GOVERNANCE_SENSITIVITIES, "SOME"),
    confidentialityRequired: Boolean(input.confidentialityRequired),
    desiredOutcome: text(input.desiredOutcome),
    willingToParticipateInCheckpoints: Boolean(input.willingToParticipateInCheckpoints),
    contactEmail: text(input.contactEmail),
    sessionId: optionalText(input.sessionId)?.slice(0, 64),
    idempotencyKey: optionalText(input.idempotencyKey)?.slice(0, 160),
  };
}

export function parsePilotStatusSessionRequest(body: unknown): PilotStatusSessionRequest | null {
  const input = (body && typeof body === "object") ? (body as Record<string, unknown>) : {};
  const secret = text(input.secret);
  return secret ? { secret } : null;
}

export function isPilotIntakeSuccessResponse(value: unknown): value is PilotIntakeSuccessResponse {
  const v = value as Partial<PilotIntakeSuccessResponse> | null;
  return Boolean(v && typeof v.reference === "string" && typeof v.qualificationStatus === "string" && typeof v.nextStep === "string" && Array.isArray(v.reasons));
}

export function isPilotIntakeValidationErrorResponse(value: unknown): value is PilotIntakeValidationErrorResponse {
  const v = value as Partial<PilotIntakeValidationErrorResponse> | null;
  return Boolean(v && v.error === "Intake incomplete" && v.qualification && Array.isArray(v.qualification.missingFields));
}

export function isPilotApiErrorResponse(value: unknown): value is PilotApiErrorResponse {
  return Boolean(value && typeof value === "object" && typeof (value as { error?: unknown }).error === "string");
}
