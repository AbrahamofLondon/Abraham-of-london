// lib/constitution/constitutional-authority.ts
// ─── CONSTITUTIONAL AUTHORITY ENFORCEMENT ─────────────────────────────────────

import { ConstitutionalDecision, AuthorityType, ReadinessTier } from './rules';

export type AuthorityLevel = 'OBSERVER' | 'PARTICIPANT' | 'DELEGATE' | 'AUTHORITY' | 'SOVEREIGN';
export type EscalationPath = 'NONE' | 'REVIEW' | 'APPEAL' | 'OVERRIDE' | 'CONSTITUTIONAL_COURT';

export interface ConstitutionalAuthority {
  userId: string;
  campaignId: string;
  authorityLevel: AuthorityLevel;
  grantedAt: string;
  expiresAt?: string;
  grantedBy: string;
  signature: string; // Cryptographic signature
  scope: string[]; // Domains or actions this authority covers
  restrictions?: string[];
}

export interface ConstitutionalAction {
  id: string;
  type: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'OVERRIDE' | 'APPEAL';
  domain?: string;
  payload: unknown;
  authoritySignature: string;
  timestamp: string;
  constitutionalDecision: ConstitutionalDecision;
  auditHash: string; // Chain to previous action
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

/**
 * Constitutional Authority Enforcement - Law 1
 * No action shall be taken without proper authority level.
 */
export function validateAuthority(
  action: ConstitutionalAction,
  authority: ConstitutionalAuthority,
  requiredLevel: AuthorityLevel
): { valid: boolean; reason?: string; escalation?: EscalationPath } {
  // Check if authority exists and is valid
  if (!authority) {
    return { valid: false, reason: 'No constitutional authority found', escalation: 'APPEAL' };
  }

  // Check expiration
  if (authority.expiresAt && new Date(authority.expiresAt) < new Date()) {
    return { valid: false, reason: 'Constitutional authority expired', escalation: 'REVIEW' };
  }

  // Check level hierarchy
  const levelOrder: Record<AuthorityLevel, number> = {
    OBSERVER: 0,
    PARTICIPANT: 1,
    DELEGATE: 2,
    AUTHORITY: 3,
    SOVEREIGN: 4,
  };

  const requiredOrder = levelOrder[requiredLevel];
  const actualOrder = levelOrder[authority.authorityLevel];

  if (actualOrder < requiredOrder) {
    return {
      valid: false,
      reason: `Insufficient authority: ${authority.authorityLevel} < ${requiredLevel}`,
      escalation: actualOrder === 0 ? 'NONE' : 'APPEAL',
    };
  }

  // Check scope
  if (action.domain && authority.scope.length > 0 && !authority.scope.includes(action.domain)) {
    return {
      valid: false,
      reason: `Authority scope does not cover domain: ${action.domain}`,
      escalation: 'REVIEW',
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
  previousHash: string
): AuditEntry {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    actionId: action.id,
    campaignId: action.payload?.campaignId || 'unknown',
    userId: action.authoritySignature.split(':')[0] || 'system',
    action,
    previousHash,
    hash: '',
    timestamp: new Date().toISOString(),
  };

  // Create cryptographic hash
  const content = `${entry.previousHash}:${entry.actionId}:${entry.timestamp}:${JSON.stringify(action)}`;
  entry.hash = Buffer.from(content).toString('base64') + ':' + content.length;

  return entry;
}

/**
 * Threshold Guard - Law 3
 * Minimum participants required for constitutional validity.
 */
export function validateThreshold(
  participantCount: number,
  threshold: number = 5,
  quorumPercent?: number
): { valid: boolean; reason?: string } {
  if (participantCount < threshold) {
    return {
      valid: false,
      reason: `Anonymity threshold not met: ${participantCount}/${threshold} participants`,
    };
  }

  if (quorumPercent && (participantCount / threshold) * 100 < quorumPercent) {
    return {
      valid: false,
      reason: `Quorum not met: ${((participantCount / threshold) * 100).toFixed(0)}% < ${quorumPercent}%`,
    };
  }

  return { valid: true };
}

/**
 * Constitutional Appeal Process - Law 4
 * Right to challenge constitutional decisions.
 */
export interface ConstitutionalAppeal {
  id: string;
  actionId: string;
  appellantId: string;
  reason: string;
  evidence?: string[];
  status: 'PENDING' | 'REVIEWING' | 'UPHELD' | 'OVERTURNED' | 'ESCALATED';
  filedAt: string;
  resolvedAt?: string;
  resolution?: string;
  escalationPath: EscalationPath;
  reviewBoard: string[]; // IDs of reviewers
}

export function createAppeal(
  action: ConstitutionalAction,
  appellantId: string,
  reason: string,
  evidence?: string[]
): ConstitutionalAppeal {
  return {
    id: crypto.randomUUID(),
    actionId: action.id,
    appellantId,
    reason,
    evidence,
    status: 'PENDING',
    filedAt: new Date().toISOString(),
    escalationPath: 'REVIEW',
    reviewBoard: [],
  };
}