/**
 * lib/product/governed-case-contract.ts
 *
 * Normalised governed case spine for the Decision Centre and all product surfaces.
 *
 * This is NOT a new Prisma model. It is a canonical type layer that maps existing
 * server-authoritative types (LivingCase, DiagnosticJourney, StrategyRoomExecutionSession)
 * into a consistent, client-safe governed case record.
 *
 * Every product surface that creates a governed record maps to one of these types.
 * The persistence source remains the existing Prisma models — this contract is the
 * read-side projection.
 */

import type { LivingCase } from "@/lib/product/living-case-store";
import type { SaveCaseSource } from "@/lib/product/save-case-continuity";

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNED CASE TYPE — which product surface created this case
// ─────────────────────────────────────────────────────────────────────────────

export type GovernedCaseType =
  | "FAST_DIAGNOSTIC"
  | "PURPOSE_ALIGNMENT"
  | "CONSTITUTIONAL_DIAGNOSTIC"
  | "TEAM_ASSESSMENT"
  | "ENTERPRISE_ASSESSMENT"
  | "EXECUTIVE_REPORT"
  | "STRATEGY_ROOM_RECORD"
  | "RETURN_BRIEF"
  | "PROOF_PACK";

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNED CASE STATUS
// ─────────────────────────────────────────────────────────────────────────────

export type GovernedCaseStatus =
  | "ACTIVE"
  | "WATCH"
  | "ESCALATED"
  | "RESOLVED"
  | "INSUFFICIENT_EVIDENCE"
  | "UNKNOWN";

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNED CASE RECORD — the canonical read-side contract
// ─────────────────────────────────────────────────────────────────────────────

export type GovernedCaseRecord = {
  /** Stable case identifier (journeyKey or session ID) */
  caseId: string;
  /** Email of the case owner, if known */
  ownerEmail?: string | null;
  /** Which product surface created this case */
  sourceType: GovernedCaseType;
  /** Human-readable title derived from the decision or case context */
  title: string;
  /** Primary finding or condition classification */
  primaryFinding?: string | null;
  /** Evidence confidence posture */
  evidencePosture: "USER_REPORTED" | "SYSTEM_INFERRED" | "OPERATOR_VERIFIED" | "THIRD_PARTY";
  /** Governance implication summary */
  governanceImplication?: string | null;
  /** The single next earned action for this case */
  nextEarnedAction?: {
    label: string;
    href: string;
    reason: string;
  } | null;
  /** Consequence timeline projection */
  consequenceTimeline?: {
    sevenDays: string;
    thirtyDays: string;
    ninetyDays: string;
  } | null;
  /** Deterministic hash of the safe canonical payload */
  provenanceHash?: string | null;
  /** ISO timestamp of case creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a LivingCase status to a GovernedCaseStatus.
 */
export function deriveGovernedCaseStatus(livingCase: LivingCase): GovernedCaseStatus {
  switch (livingCase.status) {
    case "open":
    case "active":
      return "ACTIVE";
    case "under_intervention":
      return "ESCALATED";
    case "monitoring":
      return "WATCH";
    case "resolved":
      return "RESOLVED";
    case "persistent":
      return "WATCH";
    default:
      return "UNKNOWN";
  }
}

/**
 * Maps a SaveCaseSource (carry-forward contract) to a GovernedCaseType.
 */
export function mapSaveSourceToGovernedType(source: SaveCaseSource): GovernedCaseType {
  switch (source) {
    case "DECISION_DELAY_CALCULATOR":
      return "FAST_DIAGNOSTIC";
    case "FAST_DIAGNOSTIC":
      return "FAST_DIAGNOSTIC";
    case "BOARD_SUMMARY":
      return "FAST_DIAGNOSTIC";
  }
}

/**
 * Maps a product surface ID to a GovernedCaseType.
 */
export function mapSurfaceToGovernedType(surfaceId: string): GovernedCaseType {
  switch (surfaceId) {
    case "fast-diagnostic":
    case "board-summary-preview":
    case "decision-delay-exposure-calculator":
      return "FAST_DIAGNOSTIC";
    case "purpose-alignment":
      return "PURPOSE_ALIGNMENT";
    case "constitutional-diagnostic":
      return "CONSTITUTIONAL_DIAGNOSTIC";
    case "team-assessment":
      return "TEAM_ASSESSMENT";
    case "enterprise-assessment":
      return "ENTERPRISE_ASSESSMENT";
    case "executive-reporting":
    case "executive-reporting-run":
      return "EXECUTIVE_REPORT";
    case "strategy-room":
      return "STRATEGY_ROOM_RECORD";
    case "return-brief":
      return "RETURN_BRIEF";
    case "proof-pack":
      return "PROOF_PACK";
    default:
      return "FAST_DIAGNOSTIC";
  }
}
