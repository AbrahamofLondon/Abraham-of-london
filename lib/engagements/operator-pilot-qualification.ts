/**
 * lib/engagements/operator-pilot-qualification.ts
 *
 * §6/§7 — the Operator Pilot qualification engine. The Operator Pilot is NOT another
 * Decision Signal: its job is to assess whether a serious organisation and a real
 * decision situation are appropriate for a CONTROLLED pilot. This engine is deterministic
 * and testable, and — critically — it never auto-approves. The best a submission can
 * reach automatically is POTENTIALLY_SUITABLE, which still routes to HUMAN_REVIEW; an
 * incomplete intake can never be accepted.
 */

export type DecisionStage = "EXPLORING" | "FRAMING" | "DECIDING" | "COMMITTED";
export type Materiality = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type GovernanceSensitivity = "NONE" | "SOME" | "HIGH" | "REGULATED";

export interface PilotIntake {
  organisation: string;
  role: string;
  authorityToEngage: boolean;
  decisionDomain: string;
  materiality: Materiality;
  decisionStage: DecisionStage;
  affectedStakeholders: string;
  decisionDeadline: string | null; // ISO date or null
  existingEvidence: string;
  knownContradictions: string;
  governanceSensitivity: GovernanceSensitivity;
  confidentialityRequired: boolean;
  desiredOutcome: string;
  willingToParticipateInCheckpoints: boolean;
  contactEmail: string;
}

export type QualificationStatus =
  | "INCOMPLETE"
  | "MORE_INFO_REQUIRED"
  | "POTENTIALLY_SUITABLE"
  | "UNSUITABLE"
  | "HUMAN_REVIEW_REQUIRED";

export interface QualificationResult {
  status: QualificationStatus;
  /** never true for an automatic path — acceptance is always a human decision. */
  autoAccepted: false;
  reasons: string[];
  missingFields: string[];
  /** what the applicant should expect next. */
  nextStep: string;
  score: number;
}

const REQUIRED_TEXT: (keyof PilotIntake)[] = ["organisation", "role", "decisionDomain", "affectedStakeholders", "existingEvidence", "desiredOutcome", "contactEmail"];

function missing(intake: PilotIntake): string[] {
  const out: string[] = [];
  for (const k of REQUIRED_TEXT) {
    const v = intake[k];
    if (typeof v !== "string" || v.trim().length < 2) out.push(k);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(intake.contactEmail ?? "")) if (!out.includes("contactEmail")) out.push("contactEmail");
  return out;
}

/**
 * Assess a pilot intake. Fail-closed and never auto-approves:
 *   • missing required fields → INCOMPLETE (cannot proceed);
 *   • no authority to engage OR only exploring → MORE_INFO_REQUIRED;
 *   • low materiality / no contradiction / unwilling on checkpoints → UNSUITABLE (proportionate);
 *   • regulated or high-sensitivity → always HUMAN_REVIEW_REQUIRED (never auto);
 *   • otherwise POTENTIALLY_SUITABLE — still a human decision.
 */
export function qualifyPilotIntake(intake: PilotIntake): QualificationResult {
  const missingFields = missing(intake);
  if (missingFields.length > 0) {
    return { status: "INCOMPLETE", autoAccepted: false, missingFields, reasons: ["Required information is missing; the intake cannot be assessed yet."], nextStep: "Complete the highlighted fields and resubmit.", score: 0 };
  }

  const reasons: string[] = [];

  // Hard proportionality gates → UNSUITABLE (we will not run a controlled pilot that is not warranted)
  if (intake.materiality === "LOW") reasons.push("The decision's materiality is low; a controlled pilot is not proportionate.");
  if (!intake.willingToParticipateInCheckpoints) reasons.push("The pilot requires participation in checkpoints; without it the engagement cannot produce governed evidence.");
  if (reasons.length > 0) {
    return { status: "UNSUITABLE", autoAccepted: false, missingFields: [], reasons, nextStep: "A lighter instrument (e.g. the Decision Exposure Instrument) is the proportionate next step.", score: 20 };
  }

  // More information needed
  const moreInfo: string[] = [];
  if (!intake.authorityToEngage) moreInfo.push("Authority to engage is not confirmed — a pilot needs a sponsor who can act on the finding.");
  if (intake.decisionStage === "EXPLORING") moreInfo.push("The decision is still at the exploring stage; a pilot is scoped for a framed or live decision.");
  if (intake.knownContradictions.trim().length < 2 && intake.decisionStage !== "COMMITTED") moreInfo.push("No contradiction or competing obligation was described — the strongest pilots have at least one.");
  if (moreInfo.length > 0) {
    return { status: "MORE_INFO_REQUIRED", autoAccepted: false, missingFields: [], reasons: moreInfo, nextStep: "We will follow up to clarify these points before assessing suitability.", score: 45 };
  }

  // Sensitivity always escalates to a human — never auto
  if (intake.governanceSensitivity === "REGULATED" || intake.governanceSensitivity === "HIGH" || intake.confidentialityRequired) {
    return { status: "HUMAN_REVIEW_REQUIRED", autoAccepted: false, missingFields: [], reasons: ["Governance sensitivity or confidentiality requires a human reviewer before any acceptance."], nextStep: "A reviewer will assess suitability and contact you; nothing is accepted automatically.", score: 70 };
  }

  // Best automatic outcome — still a human decision
  const materialityScore = { LOW: 0, MODERATE: 60, HIGH: 80, CRITICAL: 90 }[intake.materiality];
  return {
    status: "POTENTIALLY_SUITABLE",
    autoAccepted: false,
    missingFields: [],
    reasons: ["The organisation, authority, decision stage and materiality are consistent with a controlled pilot."],
    nextStep: "A reviewer will confirm suitability and propose scope. Acceptance is a human decision — this is not an automatic approval.",
    score: materialityScore,
  };
}
