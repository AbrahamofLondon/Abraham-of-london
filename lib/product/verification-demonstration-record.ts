/**
 * lib/product/verification-demonstration-record.ts
 *
 * INTERNAL DEMONSTRATION ONLY — not for production use or client-facing surfaces.
 *
 * Shows the full governed verification loop:
 *   detect → compare → consequence → recommend → verify → operator review
 *   → memory update → future influence
 *
 * Used to:
 *   1. Validate that the verification spine is end-to-end coherent
 *   2. Train operators on the review workflow
 *   3. Demonstrate the system's evidence accountability to governance stakeholders
 *
 * The demo record uses a reserved sourceId prefix ("demo_") so it can be
 * filtered out of live operator queues.
 */

import type {
  SignalVerificationRecord,
  SignalVerificationStatus,
  VerificationEvidencePosture,
} from "@/lib/product/signal-verification-record";
import type { OperatorReviewOutcome } from "@/lib/product/operator-outcome-review";

// ─── Demo loop snapshot ───────────────────────────────────────────────────────

export type DemonstrationLoopEvent = {
  phase: string;
  status: SignalVerificationStatus | "CREATED" | "SUBMITTED" | "REVIEWED" | "APPLIED";
  description: string;
  timestamp: string;
};

export type VerificationDemonstrationRecord = {
  label: "INTERNAL_DEMONSTRATION_ONLY";
  demoId: string;
  createdAt: string;

  // Phase 1 — Signal detection
  detect: {
    surface: "fast-diagnostic";
    conditionName: string;
    severity: "ALERT";
    score: number;
    comparisonBasis: string;
    comparisonMaturityLevel: number;
  };

  // Phase 2 — Comparison and consequence
  compare: {
    band: string;
    basisLabel: string;
    caveat: string;
    requiresDisclosure: boolean;
  };

  // Phase 3 — Consequence path
  consequence: {
    thirtyDay: string;
    sixtyDay: string;
    ninetyDay: string;
    compoundingPoint: string;
    correctionPoint: string;
  };

  // Phase 4 — Recommendation
  recommend: {
    nextAdmissibleMove: string;
    rationale: string;
  };

  // Phase 5 — Verification record created
  verify: Pick<
    SignalVerificationRecord,
    | "verificationKey"
    | "verificationStatus"
    | "verificationEvidencePosture"
    | "operatorReviewRequired"
    | "verificationDueAt"
  >;

  // Phase 6 — User verification submitted
  userVerification: {
    didAct: "YES";
    changedState: "IMPROVED";
    evidenceSummary: string;
    systemDiagnosisAccuracy: "ACCURATE";
    evidencePostureAfter: VerificationEvidencePosture;
  };

  // Phase 7 — Operator review
  operatorReview: {
    outcome: OperatorReviewOutcome;
    operatorNote: string;
    memoryApproved: boolean;
    reviewedAt: string;
  };

  // Phase 8 — Memory update
  memoryUpdate: {
    event: "MEMORY_UPDATED";
    memoryTargets: string[];
    memoryWeight: number;
    futureInfluence: string;
  };

  // Full audit trail
  trail: DemonstrationLoopEvent[];
};

// ─── Demo record factory ──────────────────────────────────────────────────────

/**
 * Returns a static demonstration record showing the full verification loop.
 * This record is never persisted to the database — it is used for training,
 * governance review, and internal validation only.
 */
export function buildVerificationDemonstrationRecord(): VerificationDemonstrationRecord {
  const now = new Date("2026-05-12T09:00:00.000Z");
  const demoId = "demo_verification_loop_001";
  const verificationKey = "a3f8c2d1e9b74f0a"; // deterministic demo key

  const trail: DemonstrationLoopEvent[] = [
    {
      phase: "P1 — Detect",
      status: "CREATED",
      description: "Fast Diagnostic submitted. Signal 'Ownership Ambiguity at Decision Layer' detected with ALERT severity against INTERNAL_OBSERVED_RECORDS comparison basis (maturity 2).",
      timestamp: now.toISOString(),
    },
    {
      phase: "P2 — Compare",
      status: "CREATED",
      description: "Comparison band resolved: FRAGILE. Basis is internal observed records — unverified disclosure required. maturityGateRejection: null (maturity 2 is allowed for internal observed).",
      timestamp: new Date(now.getTime() + 1000).toISOString(),
    },
    {
      phase: "P3 — Consequence",
      status: "CREATED",
      description: "Consequence path projected: 30d → accountability vacuum forms; 60d → board-level pattern becomes visible; 90d → compounding decision risk activates.",
      timestamp: new Date(now.getTime() + 2000).toISOString(),
    },
    {
      phase: "P4 — Recommend",
      status: "CREATED",
      description: "Next admissible move: Mandate Clarity Framework. Rationale: signal recurrence at 3+ cycles with no ownership resolution requires structural intervention.",
      timestamp: new Date(now.getTime() + 3000).toISOString(),
    },
    {
      phase: "P5 — Verify record created",
      status: "PENDING_VERIFICATION",
      description: `PENDING_VERIFICATION record created with verificationKey: ${verificationKey}. operatorReviewRequired: true (ALERT severity). verificationDueAt: +14 days. Idempotent — re-submission returns same record.`,
      timestamp: new Date(now.getTime() + 4000).toISOString(),
    },
    {
      phase: "P6 — User verification submitted",
      status: "COMPLETED",
      description: "User confirmed: didAct=YES, changedState=IMPROVED, evidenceSummary provided. classifyOutcomeVerification → COMPLETED / ACTION_CONFIRMED. evidencePosture: ACTION_CONFIRMED. memoryWeight: 0.5.",
      timestamp: new Date(now.getTime() + 86400000 * 7).toISOString(),
    },
    {
      phase: "P7 — Operator review",
      status: "OPERATOR_REVIEWED",
      description: "Operator reviewed record. outcome: ACCURACY_CONFIRMED. memoryApproved: true. Note: 'Pattern confirmed across 2 independent principal accounts. Maturity upgrade warranted.'",
      timestamp: new Date(now.getTime() + 86400000 * 10).toISOString(),
    },
    {
      phase: "P8 — Memory update",
      status: "MEMORY_UPDATED",
      description: "applyVerificationToMemory() called. memoryTargets: [COMPARISON_BASIS_MATURITY, SIGNAL_RECURRENCE, INSTITUTIONAL_RECORD]. COMPARISON_BASIS_MATURITY upgrade queued — contributes toward maturity 3 threshold (requires OUTCOME_VERIFIED_RECORDS basis type).",
      timestamp: new Date(now.getTime() + 86400000 * 10 + 5000).toISOString(),
    },
  ];

  return {
    label: "INTERNAL_DEMONSTRATION_ONLY",
    demoId,
    createdAt: now.toISOString(),

    detect: {
      surface: "fast-diagnostic",
      conditionName: "Ownership Ambiguity at Decision Layer",
      severity: "ALERT",
      score: 34,
      comparisonBasis: "INTERNAL_OBSERVED_RECORDS",
      comparisonMaturityLevel: 2,
    },

    compare: {
      band: "FRAGILE",
      basisLabel: "Internal observed records (unverified)",
      caveat: "Pattern observed internally. Not yet confirmed by outcome-verified records. Treat as directional, not conclusive.",
      requiresDisclosure: true,
    },

    consequence: {
      thirtyDay: "Accountability vacuum forms at the point of key decisions.",
      sixtyDay: "Board-level pattern becomes visible — stakeholders begin to compensate.",
      ninetyDay: "Compounding decision risk activates — correction cost increases materially.",
      compoundingPoint: "Month 3 without structural intervention.",
      correctionPoint: "Mandate Clarity Framework deployed within 30 days halts compounding.",
    },

    recommend: {
      nextAdmissibleMove: "Mandate Clarity Framework",
      rationale: "Signal recurrence at 3+ cycles with no ownership resolution requires structural intervention before board-level pattern solidifies.",
    },

    verify: {
      verificationKey,
      verificationStatus: "PENDING_VERIFICATION",
      verificationEvidencePosture: "SELF_REPORTED_ONLY",
      operatorReviewRequired: true,
      verificationDueAt: new Date(now.getTime() + 86400000 * 14).toISOString(),
    },

    userVerification: {
      didAct: "YES",
      changedState: "IMPROVED",
      evidenceSummary: "Mandate clarity session completed. Decision ownership documented and ratified at board level. Follow-up cadence agreed.",
      systemDiagnosisAccuracy: "ACCURATE",
      evidencePostureAfter: "ACTION_CONFIRMED",
    },

    operatorReview: {
      outcome: "ACCURACY_CONFIRMED",
      operatorNote: "Pattern confirmed across 2 independent principal accounts. Mandate clarity intervention produced measurable change within 6 weeks. Maturity upgrade warranted.",
      memoryApproved: true,
      reviewedAt: new Date(now.getTime() + 86400000 * 10).toISOString(),
    },

    memoryUpdate: {
      event: "MEMORY_UPDATED",
      memoryTargets: ["COMPARISON_BASIS_MATURITY", "SIGNAL_RECURRENCE", "INSTITUTIONAL_RECORD"],
      memoryWeight: 0.5,
      futureInfluence: "Contributes toward OUTCOME_VERIFIED_RECORDS threshold for maturity 3. Signal recurrence pattern updated. Future diagnostics with same pattern will show higher confidence caveat.",
    },

    trail,
  };
}
