/**
 * Verification Engine — determines whether a commitment was fulfilled.
 *
 * Self-report alone: max 0.6
 * Behavioural signal: up to 0.85
 * Documentary evidence: up to 0.9
 * Conflicting evidence: disputed
 * No evidence by deadline: failed
 */

import type { VerificationStatus } from "./types";

export type VerificationInput = {
  selfReport?: boolean;
  selfReportText?: string;
  behavioralSignal?: { type: string; confidence: number };
  documentaryEvidence?: string;
  strategyRoomLog?: boolean;
  adminOverride?: boolean;
};

export type VerificationResult = {
  verificationStatus: VerificationStatus;
  confidence: number;
  evidenceSummary: string;
  requiresManualReview: boolean;
};

export function verifyCommitment(input: VerificationInput, deadlinePassed: boolean): VerificationResult {
  let confidence = 0;
  const evidence: string[] = [];
  let disputed = false;

  // Self-report
  if (input.selfReport) {
    confidence = Math.max(confidence, 0.6);
    evidence.push("Self-reported completion" + (input.selfReportText ? `: "${input.selfReportText.slice(0, 80)}"` : ""));
  }

  // Behavioural signal
  if (input.behavioralSignal) {
    const bConf = Math.min(0.85, input.behavioralSignal.confidence);
    if (bConf > confidence) confidence = bConf;
    evidence.push(`Behavioural signal (${input.behavioralSignal.type}): ${Math.round(bConf * 100)}% confidence`);

    // Conflict: self-report says yes, behaviour says no
    if (input.selfReport && input.behavioralSignal.confidence < 0.3) {
      disputed = true;
      evidence.push("CONFLICT: self-report contradicts behavioural signal");
    }
  }

  // Documentary evidence
  if (input.documentaryEvidence) {
    confidence = Math.max(confidence, 0.9);
    evidence.push(`Documentary evidence: "${input.documentaryEvidence.slice(0, 80)}"`);
  }

  // Strategy Room log
  if (input.strategyRoomLog) {
    confidence = Math.max(confidence, 0.85);
    evidence.push("Strategy Room decision log confirms action");
  }

  // Admin override
  if (input.adminOverride) {
    confidence = 1.0;
    evidence.push("Admin manual verification override");
  }

  // Determine status
  let verificationStatus: VerificationStatus;
  if (disputed) {
    verificationStatus = "disputed";
  } else if (deadlinePassed && confidence === 0) {
    verificationStatus = "failed";
  } else if (input.behavioralSignal && confidence >= 0.7) {
    verificationStatus = "behavior_verified";
  } else if (input.selfReport) {
    verificationStatus = "self_reported";
  } else {
    verificationStatus = "pending";
  }

  return {
    verificationStatus,
    confidence: Math.round(confidence * 100) / 100,
    evidenceSummary: evidence.join(". ") || "No evidence submitted.",
    requiresManualReview: disputed || (confidence > 0 && confidence < 0.5),
  };
}
