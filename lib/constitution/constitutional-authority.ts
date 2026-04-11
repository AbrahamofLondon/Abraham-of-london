import crypto from "crypto";
import type { ConstitutionalDecision } from "./rules";

export type AuthorityLevel =
  | "OBSERVER"
  | "PARTICIPANT"
  | "DELEGATE"
  | "AUTHORITY"
  | "SOVEREIGN";

export type EscalationPath =
  | "NONE"
  | "REVIEW"
  | "APPEAL"
  | "OVERRIDE"
  | "CONSTITUTIONAL_COURT";

export interface ConstitutionalAuthority {
  userId: string;
  campaignId: string;
  authorityLevel: AuthorityLevel;
  grantedAt: string;
  expiresAt?: string;
  grantedBy: string;
  signature: string;
  scope: string[];
  restrictions?: string[];
}

export interface ConstitutionalAction {
  id: string;
  type: "SUBMIT" | "APPROVE" | "REJECT" | "OVERRIDE" | "APPEAL";
  domain?: string;
  payload: unknown;
  authoritySignature: string;
  timestamp: string;
  constitutionalDecision: ConstitutionalDecision;
  auditHash: string;
}

export interface AuditEntry {
  id: string;
  actionId: string;
  campaignId: string;
  userId: string;
  action: ConstitutionalAction;
  previousHash: string;
  hash: string;
  timestamp: string;
}

export interface ConstitutionalAppeal {
  id: string;
  actionId: string;
  appellantId: string;
  reason: string;
  evidence?: string[];
  status: "PENDING" | "REVIEWING" | "UPHELD" | "OVERTURNED" | "ESCALATED";
  filedAt: string;
  resolvedAt?: string;
  resolution?: string;
  escalationPath: EscalationPath;
  reviewBoard: string[];
}

type ValidationResult = {
  valid: boolean;
  reason?: string;
  escalation?: EscalationPath;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter(Boolean);
}

function safeDateMs(value?: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function getLevelOrder(level: AuthorityLevel): number {
  const levelOrder: Record<AuthorityLevel, number> = {
    OBSERVER: 0,
    PARTICIPANT: 1,
    DELEGATE: 2,
    AUTHORITY: 3,
    SOVEREIGN: 4,
  };

  return levelOrder[level];
}

function getPayloadCampaignId(payload: unknown): string {
  if (!isRecord(payload)) return "unknown";

  return (
    safeString(payload.campaignId) ||
    safeString(payload.caseKey) ||
    safeString(payload.sessionKey) ||
    "unknown"
  );
}

function hasRestriction(
  authority: ConstitutionalAuthority,
  action: ConstitutionalAction,
): string | null {
  const restrictions = safeStringArray(authority.restrictions);

  if (restrictions.length === 0) return null;

  if (restrictions.includes("NO_OVERRIDE") && action.type === "OVERRIDE") {
    return "Authority restrictions prohibit OVERRIDE actions";
  }

  if (restrictions.includes("NO_APPEAL") && action.type === "APPEAL") {
    return "Authority restrictions prohibit APPEAL actions";
  }

  if (
    restrictions.includes("SUBMIT_ONLY") &&
    action.type !== "SUBMIT"
  ) {
    return "Authority is restricted to SUBMIT actions only";
  }

  return null;
}

/**
 * Constitutional Authority Enforcement - Law 1
 * No action shall be taken without proper authority level.
 */
export function validateAuthority(
  action: ConstitutionalAction,
  authority: ConstitutionalAuthority | null | undefined,
  requiredLevel: AuthorityLevel,
): ValidationResult {
  if (!authority) {
    return {
      valid: false,
      reason: "No constitutional authority found",
      escalation: "APPEAL",
    };
  }

  if (!safeString(authority.userId)) {
    return {
      valid: false,
      reason: "Authority record missing user identity",
      escalation: "REVIEW",
    };
  }

  if (!safeString(authority.signature)) {
    return {
      valid: false,
      reason: "Authority signature missing",
      escalation: "REVIEW",
    };
  }

  const expiresAtMs = safeDateMs(authority.expiresAt);
  if (expiresAtMs !== null && expiresAtMs < Date.now()) {
    return {
      valid: false,
      reason: "Constitutional authority expired",
      escalation: "REVIEW",
    };
  }

  const requiredOrder = getLevelOrder(requiredLevel);
  const actualOrder = getLevelOrder(authority.authorityLevel);

  if (actualOrder < requiredOrder) {
    return {
      valid: false,
      reason: `Insufficient authority: ${authority.authorityLevel} < ${requiredLevel}`,
      escalation: actualOrder === 0 ? "NONE" : "APPEAL",
    };
  }

  if (
    action.domain &&
    authority.scope.length > 0 &&
    !authority.scope.includes(action.domain)
  ) {
    return {
      valid: false,
      reason: `Authority scope does not cover domain: ${action.domain}`,
      escalation: "REVIEW",
    };
  }

  const restrictionFailure = hasRestriction(authority, action);
  if (restrictionFailure) {
    return {
      valid: false,
      reason: restrictionFailure,
      escalation: "REVIEW",
    };
  }

  return { valid: true };
}

/**
 * Audit Trail Integrity - Law 2
 * Every constitutional action must be recorded and chainable.
 */
export function createAuditEntry(
  action: ConstitutionalAction,
  previousHash: string,
): AuditEntry {
  const timestamp = nowIso();
  const campaignId = getPayloadCampaignId(action.payload);
  const userId =
    safeString(action.authoritySignature.split(":")[0]) || "system";

  const entryBase = {
    actionId: action.id,
    campaignId,
    userId,
    previousHash: safeString(previousHash),
    timestamp,
    action,
  };

  const hash = sha256Hex(stableStringify(entryBase));

  return {
    id: crypto.randomUUID(),
    actionId: action.id,
    campaignId,
    userId,
    action,
    previousHash: safeString(previousHash),
    hash,
    timestamp,
  };
}

/**
 * Threshold Guard - Law 3
 * Minimum participants required for constitutional validity.
 */
export function validateThreshold(
  participantCount: number,
  threshold = 5,
  quorumPercent?: number,
): ValidationResult {
  const safeParticipantCount = Number.isFinite(participantCount)
    ? Math.max(0, Math.floor(participantCount))
    : 0;

  const safeThreshold = Number.isFinite(threshold)
    ? Math.max(1, Math.floor(threshold))
    : 5;

  if (safeParticipantCount < safeThreshold) {
    return {
      valid: false,
      reason: `Anonymity threshold not met: ${safeParticipantCount}/${safeThreshold} participants`,
    };
  }

  if (typeof quorumPercent === "number" && Number.isFinite(quorumPercent)) {
    const achievedPercent = (safeParticipantCount / safeThreshold) * 100;
    if (achievedPercent < quorumPercent) {
      return {
        valid: false,
        reason: `Quorum not met: ${achievedPercent.toFixed(0)}% < ${quorumPercent}%`,
      };
    }
  }

  return { valid: true };
}

/**
 * Constitutional Appeal Process - Law 4
 * Right to challenge constitutional decisions.
 */
export function createAppeal(
  action: ConstitutionalAction,
  appellantId: string,
  reason: string,
  evidence?: string[],
): ConstitutionalAppeal {
  return {
    id: crypto.randomUUID(),
    actionId: action.id,
    appellantId: safeString(appellantId),
    reason: safeString(reason),
    evidence: safeStringArray(evidence),
    status: "PENDING",
    filedAt: nowIso(),
    escalationPath: "REVIEW",
    reviewBoard: [],
  };
}