/**
 * lib/intelligence/accountability/customer-falsification-watchdog.ts
 *
 * §14 — Customer Falsification Watchdog.
 *
 * Monitors explicit customer-stated triggers against authoritative evidence.
 * Turns falsification discipline into an active customer capability.
 *
 * Evidence sources: later customer evidence, reporting cycle, approved external evidence,
 * released GMI edition, verified operator evidence.
 *
 * States: MONITORING → EVIDENCE_INSUFFICIENT → TRIGGER_APPROACHING → TRIGGER_REACHED → REVIEW_REQUIRED → REVISED → CLOSED
 */
export type WatchdogState = "MONITORING" | "EVIDENCE_INSUFFICIENT" | "TRIGGER_APPROACHING" | "TRIGGER_REACHED" | "REVIEW_REQUIRED" | "REVISED" | "CLOSED";
export type EvidenceSource = "customer_evidence" | "reporting_cycle" | "external_evidence" | "gmi_edition" | "operator_evidence";

export interface FalsificationTrigger {
  triggerId: string;
  caseId: string;
  tenantId: string;
  commitment: string;
  statedTrigger: string;
  evidenceSource: EvidenceSource;
  sourceReference: string;
  monitoredSince: string;
  state: WatchdogState;
  lastEvaluatedAt: string;
  evaluationCount: number;
  alertSent: boolean;
  alertSentAt: string | null;
  resolvedAt: string | null;
  notes: string;
}

export interface WatchdogEvaluation {
  triggerId: string;
  previousState: WatchdogState;
  newState: WatchdogState;
  reason: string;
  evidenceMatched: boolean;
  alertRequired: boolean;
}

const STATE_PROGRESSION: Record<WatchdogState, WatchdogState[]> = {
  MONITORING: ["EVIDENCE_INSUFFICIENT", "TRIGGER_APPROACHING", "CLOSED"],
  EVIDENCE_INSUFFICIENT: ["MONITORING", "TRIGGER_APPROACHING", "CLOSED"],
  TRIGGER_APPROACHING: ["TRIGGER_REACHED", "MONITORING", "CLOSED"],
  TRIGGER_REACHED: ["REVIEW_REQUIRED", "CLOSED"],
  REVIEW_REQUIRED: ["REVISED", "CLOSED"],
  REVISED: ["CLOSED", "MONITORING"],
  CLOSED: [],
};

export function createTrigger(input: {
  caseId: string; tenantId: string; commitment: string; statedTrigger: string; evidenceSource: EvidenceSource; sourceReference: string;
}): FalsificationTrigger {
  return {
    triggerId: `wt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    caseId: input.caseId,
    tenantId: input.tenantId,
    commitment: input.commitment,
    statedTrigger: input.statedTrigger,
    evidenceSource: input.evidenceSource,
    sourceReference: input.sourceReference,
    monitoredSince: new Date().toISOString(),
    state: "MONITORING",
    lastEvaluatedAt: new Date().toISOString(),
    evaluationCount: 0,
    alertSent: false,
    alertSentAt: null,
    resolvedAt: null,
    notes: "",
  };
}

export function evaluateTrigger(trigger: FalsificationTrigger, evidenceStrength: "none" | "weak" | "moderate" | "strong"): WatchdogEvaluation {
  const prevState = trigger.state;
  let newState: WatchdogState = prevState;
  let reason = "";
  let evidenceMatched = false;
  let alertRequired = false;

  switch (prevState) {
    case "MONITORING":
      if (evidenceStrength === "strong") { newState = "TRIGGER_APPROACHING"; reason = "Strong evidence matches trigger condition"; evidenceMatched = true; }
      else if (evidenceStrength === "moderate") { newState = "EVIDENCE_INSUFFICIENT"; reason = "Moderate evidence but insufficient for trigger"; }
      else { reason = "No significant evidence change"; }
      break;
    case "EVIDENCE_INSUFFICIENT":
      if (evidenceStrength === "strong") { newState = "TRIGGER_APPROACHING"; reason = "Sufficient evidence now available"; evidenceMatched = true; }
      else if (evidenceStrength === "none") { newState = "MONITORING"; reason = "Evidence no longer expected"; }
      else { reason = "Still insufficient evidence"; }
      break;
    case "TRIGGER_APPROACHING":
      if (evidenceStrength === "strong") { newState = "TRIGGER_REACHED"; reason = "Trigger condition fully met"; evidenceMatched = true; alertRequired = true; }
      else if (evidenceStrength === "none") { newState = "MONITORING"; reason = "Trigger condition no longer approaching"; }
      else { reason = "Approaching but not yet reached"; }
      break;
    case "TRIGGER_REACHED":
      newState = "REVIEW_REQUIRED"; reason = "Trigger reached — review required"; alertRequired = true;
      break;
    case "REVIEW_REQUIRED":
      newState = "REVISED"; reason = "Review completed — commitment revised"; evidenceMatched = true;
      break;
    case "REVISED":
      newState = "CLOSED"; reason = "Watchdog cycle complete";
      break;
    case "CLOSED":
      reason = "Watchdog already closed";
      break;
  }

  return { triggerId: trigger.triggerId, previousState: prevState, newState, reason, evidenceMatched, alertRequired };
}

export function buildAlertMessage(trigger: FalsificationTrigger): string {
  return `You previously said this decision should be revisited if "${trigger.statedTrigger}". The recorded evidence now meets that condition. Review is required.`;
}

// ── §14 evidence-admissibility gate (mandatory) ───────────────────────────────
// The raw state machine above trusts a caller-supplied strength. §14 forbids two
// things it cannot enforce alone: converting DRAFT GMI into authoritative trigger
// evidence, and using weak proxy evidence to force a high-stakes review. This gate
// is the admissibility authority that must sit in front of the state machine for any
// real evaluation.

export interface ObservedEvidence {
  source: EvidenceSource;
  claimedStrength: "none" | "weak" | "moderate" | "strong";
  /** for a gmi_edition source: the edition's release state. DRAFT/CONTROLLED are inadmissible. */
  editionState?: "DRAFT" | "CONTROLLED" | "RELEASED";
  /** whether the evidence is verified / human-approved (i.e. authoritative). */
  verified?: boolean;
}

export interface AdmissibilityResult {
  admissibleStrength: "none" | "weak" | "moderate" | "strong";
  admissible: boolean;
  downgraded: boolean;
  reason: string;
}

/**
 * Assess whether observed evidence may drive a high-stakes transition.
 *   • DRAFT/CONTROLLED GMI editions are never authoritative → strength forced to none;
 *   • weak proxy evidence is recorded but can never escalate;
 *   • claimed-strong evidence that is not verified is capped at moderate.
 */
export function assessEvidenceAdmissibility(ev: ObservedEvidence): AdmissibilityResult {
  if (ev.source === "gmi_edition" && ev.editionState && ev.editionState !== "RELEASED") {
    return { admissibleStrength: "none", admissible: false, downgraded: true, reason: `A ${ev.editionState} GMI edition is not authoritative trigger evidence; only a RELEASED edition counts.` };
  }
  if (ev.claimedStrength === "weak") {
    return { admissibleStrength: "weak", admissible: true, downgraded: false, reason: "Weak proxy evidence is recorded but cannot force a high-stakes review." };
  }
  if (ev.claimedStrength === "strong" && ev.verified === false) {
    return { admissibleStrength: "moderate", admissible: true, downgraded: true, reason: "Unverified evidence cannot count as strong; capped at moderate until verified." };
  }
  return { admissibleStrength: ev.claimedStrength, admissible: true, downgraded: false, reason: "Evidence admissible at claimed strength." };
}

/** Public entry: gate admissibility (§14), then advance the state machine. */
export function evaluateTriggerWithEvidence(
  trigger: FalsificationTrigger,
  ev: ObservedEvidence,
): WatchdogEvaluation & { admissibility: AdmissibilityResult } {
  const admissibility = assessEvidenceAdmissibility(ev);
  const evaluation = evaluateTrigger(trigger, admissibility.admissibleStrength);
  return { ...evaluation, admissibility };
}
