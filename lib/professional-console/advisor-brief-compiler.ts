/**
 * Advisor Brief Compiler
 *
 * Compiles evidence-bounded briefs that disclose advisor-mediation status,
 * ledger integrity issues, and honest limitations.
 *
 * Briefs do not claim legal validity or certainty.
 */

import type { AdvisorCompiledBrief } from "./professional-console-contract";

export interface BriefCompilationInput {
  engagementId: string;
  advisorId: string;
  organisationId: string;
  caseId: string;
  likelyObjections: string[];
  evidenceWeaknesses: string[];
  decisionRisks: string[];
  tradeOffs: string[];
  nextAdmissibleMoves: string[];
  ledgerIntegrityStatus: "verified" | "broken" | "unknown";
  quarantinedEvidenceCount: number;
  unresolvedThreats: number;
}

/**
 * Compile advisor brief with evidence integrity disclosures
 */
export function compileAdvisorBrief(
  input: BriefCompilationInput
): AdvisorCompiledBrief {
  const briefId = `brief-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Build escalation readiness statement based on ledger state
  let escalationReadiness = "Ready for client review and escalation consideration";
  if (input.ledgerIntegrityStatus === "broken") {
    escalationReadiness = "Cannot escalate: ledger integrity is broken. Recommend ledger repair before escalation.";
  } else if (input.ledgerIntegrityStatus === "unknown") {
    escalationReadiness = "Cannot escalate: ledger state is unknown. Recommend verification before escalation.";
  }
  if (input.quarantinedEvidenceCount > 0) {
    escalationReadiness += ` [${input.quarantinedEvidenceCount} quarantined evidence items unresolved]`;
  }

  return {
    briefId,
    engagementId: input.engagementId,
    advisorId: input.advisorId,
    organisationId: input.organisationId,
    caseId: input.caseId,
    compiledAt: new Date().toISOString(),
    likelyObjections: input.likelyObjections,
    evidenceWeaknesses: input.evidenceWeaknesses,
    decisionRisks: input.decisionRisks,
    tradeOffs: input.tradeOffs,
    nextAdmissibleMoves: input.nextAdmissibleMoves,
    escalationReadiness,
    ledgerIntegrityStatus: input.ledgerIntegrityStatus,
    unresolvedQuarantineCount: input.quarantinedEvidenceCount,
    advisorMediatedEvidenceNotice:
      "This brief includes advisor-mediated evidence submissions that require your review and approval before they can be used in escalation or decision-making.",
    disclosesAdvisorMediation: true,
    disclosesLedgerState: true,
    claimsLegalValidity: false,
    claimsCertainty: false,
    authorityBoundary: {
      briefGrantsAuthority: false,
      authorityDelta: 0,
    },
  };
}

/**
 * Evaluate brief evidence integrity
 */
export function evaluateBriefEvidenceIntegrity(
  ledgerStatus: "verified" | "broken" | "unknown",
  quarantinedCount: number,
  unknownRiskCount: number
): {
  integrityOk: boolean;
  warningLevel: "none" | "caution" | "broken";
  message: string;
} {
  if (ledgerStatus === "broken") {
    return {
      integrityOk: false,
      warningLevel: "broken",
      message: "Ledger is broken. Evidence integrity cannot be assured.",
    };
  }

  if (ledgerStatus === "unknown") {
    return {
      integrityOk: false,
      warningLevel: "broken",
      message: "Ledger state is unknown. Evidence integrity cannot be verified.",
    };
  }

  if (quarantinedCount > 0 || unknownRiskCount > 0) {
    return {
      integrityOk: false,
      warningLevel: "caution",
      message: `${quarantinedCount + unknownRiskCount} evidence items remain unresolved (quarantined or unknown risk).`,
    };
  }

  return {
    integrityOk: true,
    warningLevel: "none",
    message: "Evidence integrity verified.",
  };
}

/**
 * Create evidence-bounded brief payload
 */
export function createEvidenceBoundedBriefPayload(
  brief: AdvisorCompiledBrief
): {
  briefId: string;
  sections: Record<string, unknown>;
  disclosures: Record<string, boolean>;
  authorityBoundary: { briefGrantsAuthority: false; authorityDelta: 0 };
} {
  return {
    briefId: brief.briefId,
    sections: {
      likelyObjections: brief.likelyObjections,
      evidenceWeaknesses: brief.evidenceWeaknesses,
      decisionRisks: brief.decisionRisks,
      tradeOffs: brief.tradeOffs,
      nextAdmissibleMoves: brief.nextAdmissibleMoves,
      escalationReadiness: brief.escalationReadiness,
    },
    disclosures: {
      advisorMediated: brief.disclosesAdvisorMediation,
      ledgerStateDisclosed: brief.disclosesLedgerState,
      noLegalClaim: !brief.claimsLegalValidity,
      noCertaintyClaim: !brief.claimsCertainty,
      quarantinedEvidencePresent: brief.unresolvedQuarantineCount > 0,
    },
    authorityBoundary: {
      briefGrantsAuthority: false,
      authorityDelta: 0,
    },
  };
}

/**
 * Create broken ledger warning brief
 */
export function createBrokenLedgerWarningBrief(
  engagementId: string,
  advisorId: string,
  organisationId: string,
  caseId: string
): AdvisorCompiledBrief {
  return {
    briefId: `brief-warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    engagementId,
    advisorId,
    organisationId,
    caseId,
    compiledAt: new Date().toISOString(),
    likelyObjections: ["Evidence integrity cannot be assured due to ledger state"],
    evidenceWeaknesses: ["Ledger is broken; evidence chain cannot be verified"],
    decisionRisks: ["Cannot escalate or make decisions based on unverified evidence"],
    tradeOffs: [],
    nextAdmissibleMoves: ["Verify ledger integrity before proceeding"],
    escalationReadiness: "Cannot escalate: ledger is broken. Ledger repair required.",
    ledgerIntegrityStatus: "broken",
    unresolvedQuarantineCount: 0,
    advisorMediatedEvidenceNotice:
      "This brief indicates critical ledger integrity issues. Evidence cannot be trusted until ledger is repaired.",
    disclosesAdvisorMediation: true,
    disclosesLedgerState: true,
    claimsLegalValidity: false,
    claimsCertainty: false,
    authorityBoundary: {
      briefGrantsAuthority: false,
      authorityDelta: 0,
    },
  };
}

/**
 * Create escalation recommendation
 */
export function createEscalationRecommendation(
  briefId: string,
  recommended: boolean,
  reason: string
): {
  briefId: string;
  recommended: boolean;
  reason: string;
  advisoryOnly: true;
  requiresClientApproval: true;
} {
  return {
    briefId,
    recommended,
    reason,
    advisoryOnly: true,
    requiresClientApproval: true,
  };
}

export const BRIEF_COMPILER_RULES = {
  ADVISOR_MEDIATION_DISCLOSURE:
    "All briefs must disclose advisor-mediated evidence status and limitations",
  LEDGER_STATE_DISCLOSURE: "Briefs must disclose broken or unknown ledger state",
  NO_CERTAINTY_CLAIM: "Briefs cannot claim certainty or definitive conclusions",
  NO_LEGAL_CLAIM: "Briefs cannot claim legal or courtroom validity or compliance",
  QUARANTINE_EXCLUSION: "Briefs cannot use quarantined evidence as trusted evidence",
  NO_AUTONOMOUS_ESCALATION:
    "Brief escalation recommendation is advisory only; requires client approval",
  AUTHORITY_ZERO: "Brief compilation does not grant authority (delta always 0)",
  HONEST_EVIDENCE_BOUNDS: "Briefs are bounded by evidence integrity; uncertainties disclosed",
};
