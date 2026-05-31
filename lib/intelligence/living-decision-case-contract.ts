/**
 * lib/intelligence/living-decision-case-contract.ts
 *
 * Living Decision Case — the governed institutional record.
 *
 * The Living Decision Case is not a generic JSON object.
 * It is a governed institutional record with:
 *   - Append-only events
 *   - Typed relational index fields
 *   - Versioned serialised state
 *   - Separate disclosure outputs
 *   - Separate entitlement records
 *   - Separate review records
 *   - Separate outcome records
 *
 * The moat is not merely the intelligence.
 * The moat is the governed case record.
 *
 * Contract version: 1.0.0
 */

import type { DecisionClass, DisclosureTier, ConfidenceLevel } from "./decision-class-taxonomy";
import type { ConsentState, SourceAperture } from "./living-case-events";

export const CASE_CONTRACT_VERSION = "1.0.0";
export const KERNEL_VERSION = "0.1.0";   // Bumped when kernel logic changes
export const ONTOLOGY_VERSION = "1.0.0"; // Bumped when primitives change

// ─── Sub-types: Actors and Authority ─────────────────────────────────────────

export type ActorRole =
  | "decision_maker"
  | "approver"
  | "implementer"
  | "reviewer"
  | "challenger"
  | "beneficiary"
  | "affected_party"
  | "regulator"
  | "unknown";

export type ActorCandidate = {
  label: string;            // e.g. "the CEO", "HMRC", "the board"
  role: ActorRole;
  named: boolean;           // Is this a named individual or a role/institution?
  authorityLevel: "confirmed" | "inferred" | "unknown";
};

export type DecisionActor = ActorCandidate & {
  id: string;
  conflicts?: string[];     // Any disclosed conflicts of interest
};

export type AuthorityType =
  | "statutory"
  | "board_mandate"
  | "delegated"
  | "contractual"
  | "informal"
  | "unknown";

export type DecisionAuthority = {
  id: string;
  actorId: string;
  authorityType: AuthorityType;
  authorityBasis: string;       // What the authority rests on
  confirmed: boolean;
  conflictsDetected: boolean;
};

// ─── Sub-types: Obligations ───────────────────────────────────────────────────

export type ObligationType =
  | "statutory_filing"
  | "regulatory_compliance"
  | "contractual_commitment"
  | "court_order"
  | "informal_expectation"
  | "none";

export type DecisionObligation = {
  id: string;
  obligationType: ObligationType;
  description: string;
  source: string;              // Where this obligation comes from
  deadline?: string;           // ISO date if known
  deadlineConfirmed: boolean;
  penaltyIfBreached?: string;
  regulatedBoundary: boolean;
};

// ─── Sub-types: Evidence ─────────────────────────────────────────────────────

export type EvidenceStatus =
  | "verified"
  | "cited_unverified"
  | "assumed"
  | "absent"
  | "stale"
  | "contested";

export type DecisionEvidenceNode = {
  id: string;
  claim: string;              // The claim this evidence supports
  status: EvidenceStatus;
  source?: string;
  dateOfEvidence?: string;    // When the evidence was current
  expiryRisk: boolean;        // Would this evidence have a shelf life?
  loadBearing: boolean;       // Would the decision change if this evidence were wrong?
};

// ─── Sub-types: Constraints ───────────────────────────────────────────────────

export type ConstraintType =
  | "cash"
  | "time"
  | "access"
  | "authority"
  | "records"
  | "capability"
  | "legal"
  | "political";

export type DecisionConstraint = {
  id: string;
  constraintType: ConstraintType;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKING";
  makesIdealPathInaccessible: boolean;
  viableAlternative?: string;
};

// ─── Sub-types: Dependencies ──────────────────────────────────────────────────

export type DependencyType =
  | "person_must_act"
  | "data_must_arrive"
  | "approval_must_be_granted"
  | "system_must_be_ready"
  | "external_party"
  | "regulatory_decision";

export type DecisionDependency = {
  id: string;
  dependencyType: DependencyType;
  description: string;
  owner?: string;
  deadline?: string;
  resolved: boolean;
  blocksDecision: boolean;
};

// ─── Sub-types: Incentives ────────────────────────────────────────────────────

export type DecisionIncentive = {
  id: string;
  actor: string;
  incentiveDescription: string;
  alignedWithDecision: boolean;
  conflictDetected: boolean;
};

// ─── Sub-types: Consequences ──────────────────────────────────────────────────

export type ConsequenceDirection = "if_delayed" | "if_wrong" | "if_right" | "if_abandoned";
export type ConsequenceSeverity = "low" | "moderate" | "high" | "severe";

export type DecisionConsequence = {
  id: string;
  direction: ConsequenceDirection;
  description: string;
  severity: ConsequenceSeverity;
  timeframe: "immediate" | "short" | "medium" | "long";
  reversible: boolean;
};

// ─── Sub-types: Reversibility ─────────────────────────────────────────────────

export type DecisionReversibility = {
  level: "freely_reversible" | "costly_to_reverse" | "difficult_to_reverse" | "irreversible";
  basis: string;
  windowExists: boolean;
  windowClosingDate?: string;
  costOfReversal?: string;
};

// ─── Sub-types: Options and Viable Moves ─────────────────────────────────────

export type OptionType = "ideal" | "constrained" | "fallback" | "forbidden";

export type DecisionOption = {
  id: string;
  optionType: OptionType;
  label: string;
  description: string;
  accessibilityConstraint?: string;  // What prevents the ideal path
  requiresFunds: boolean;
  requiresProfessional: boolean;
  evidenceBasis: EvidenceStatus;
};

export type DecisionMove = {
  id: string;
  sequence: number;
  label: string;
  description: string;
  priority: "urgent" | "important" | "useful";
  requiresFunds: boolean;
  accessibilityNote?: string;
};

export type ForbiddenAction = {
  id: string;
  action: string;
  reason: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
};

// ─── Sub-types: Adversarial Challenge ────────────────────────────────────────

export type AdversarialChallengeType =
  | "authority_challenge"
  | "evidence_challenge"
  | "obligation_challenge"
  | "consequence_challenge"
  | "constraint_misrepresentation"
  | "regulatory_exposure"
  | "hostile_interpretation";

export type AdversarialChallenge = {
  id: string;
  challengeType: AdversarialChallengeType;
  challenge: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  response?: string;      // How the case addresses this challenge
  unresolved: boolean;
};

export type LoadBearingAssumption = {
  assumption: string;
  evidenceBasis: string;
  ifWrong: string;
  verificationPath: string;
};

export type InformationGap = {
  gap: string;
  impact: string;
  acquisitionPath: string;
};

export type SelfAdversarialChallenge = {
  loadBearingAssumptions: LoadBearingAssumption[];
  classificationConfidence: {
    primaryClass: DecisionClass;
    confidence: ConfidenceLevel;
    alternativeClass?: DecisionClass;
    implication: string;
  };
  informationGaps: InformationGap[];
  kernelLimitations: string[];
};

// ─── Sub-types: Regulated Boundary ───────────────────────────────────────────

export type RegulatedBoundaryState = {
  hit: boolean;
  boundaryTypes: string[];
  outputSuppressed: string[];
  professionalBriefRequired: boolean;
  disclaimer: string;
};

export type ProfessionalBrief = {
  recommendedProfessional: string;   // Category, not a specific name
  questionsToBring: string[];
  contextToProvide: string[];
  freeOptions: string[];
  urgencyNote?: string;
};

// ─── Sub-types: Viability ─────────────────────────────────────────────────────

export type DecisionViability = {
  idealPathAccessible: boolean;
  viableConstrainedPath: boolean;
  fallbackExists: boolean;
  nothingViable: boolean;
  viabilityNote: string;
};

// ─── Sub-types: Disclosure, Review, Verification, Continuity ─────────────────

export type TieredDisclosureState = {
  currentTier: DisclosureTier;
  entitlements: DisclosureTier[];
  freeSignalRendered: boolean;
  paidOutputPending: boolean;
  humanReviewRequired: boolean;
};

export type HumanReviewState = {
  required: boolean;
  triggered: boolean;
  tier: "STANDARD" | "URGENT" | "EXECUTIVE" | "FOUNDER" | null;
  triggerReasons: string[];
  amendmentCount: number;
  outcome: "APPROVED" | "AMENDED" | "REJECTED" | "PENDING" | null;
  reviewerId?: string;
  completedAt?: string;
};

export type CaseVerificationRecord = {
  verificationReference?: string;   // Public token issued when case is verified
  verified: boolean;
  verifiedAt?: string;
  verifierType: "system" | "human_reviewer" | "founder" | null;
};

export type ContinuityRecord = {
  caseCanBeReturned: boolean;
  lastReviewedAt?: string;
  nextReviewDue?: string;
  driftDetected: boolean;
  outcomeRecorded: boolean;
  retainerActive: boolean;
};

export type CaseOutcomeState = {
  recorded: boolean;
  outcomeType?: "RESOLVED" | "PARTIALLY_RESOLVED" | "ESCALATED" | "ABANDONED";
  outcomeAt?: string;
  learningNotes?: string;
};

export type CaseLearningTrace = {
  id: string;
  traceType: "assumption_validated" | "assumption_failed" | "pattern_confirmed" | "drift_detected";
  description: string;
  recordedAt: string;
  calibrationImpact: boolean;
};

// ─── Translation result ───────────────────────────────────────────────────────

export type VocabularyState = 1 | 2 | 3 | 4 | 5;
// 1 — Urgency without structure
// 2 — Structure without diagnosis
// 3 — Diagnosis without path
// 4 — Path without governance
// 5 — Misclassified stakes

export type ClarificationQuestion = {
  field: string;
  question: string;
  whyNeeded: string;
  exampleAnswer: string;
};

export type TranslationResult = {
  vocabularyState: VocabularyState;
  situationSummary: string;
  kernelInterpretation: string;
  translationConfidence: ConfidenceLevel;
  clarificationRequired: ClarificationQuestion[];
  decisionClass: DecisionClass;
  alternativeClasses: Array<{ cls: DecisionClass; confidence: ConfidenceLevel }>;
  initialActors: ActorCandidate[];
  surfacedDimensions: string[];
  preservedAmbiguities: string[];
  hiddenStakesDetected: boolean;
};

// ─── Classification result ────────────────────────────────────────────────────

export type DecisionClassCandidate = {
  cls: DecisionClass;
  confidence: ConfidenceLevel;
  rationale: string;
};

// ─── The Living Decision Case ─────────────────────────────────────────────────

export type LivingDecisionCase = {
  // Identity
  id: string;
  caseReference: string;
  contractVersion: typeof CASE_CONTRACT_VERSION;
  kernelVersion: string;
  ontologyVersion: typeof ONTOLOGY_VERSION;
  createdAt: string;
  updatedAt: string;
  status: "active" | "closed" | "pending_review" | "pending_payment";

  // Source and consent
  source: {
    aperture: SourceAperture;
    createdBy?: string;
    organisationId?: string;
    consentState: ConsentState;
  };

  // Translation (first gate output)
  translation: TranslationResult;

  // Classification
  classification: {
    primaryClass: DecisionClass;
    alternativeClasses: DecisionClassCandidate[];
    confidence: ConfidenceLevel;
    classificationRationale: string;
  };

  // Situation model
  situationModel: {
    rawInputHash: string;           // SHA-256 of raw input — never the input itself
    rawInputLength: number;
    buyerLanguageSummary: string;
    institutionalInterpretation: string;
    coreTension: string;
    coreParadox?: string;
  };

  // The 10 governed dimensions
  actorMap: DecisionActor[];
  authorityMap: DecisionAuthority[];
  obligationMap: DecisionObligation[];
  evidenceGraph: DecisionEvidenceNode[];
  constraintGraph: DecisionConstraint[];
  dependencyMap: DecisionDependency[];
  incentiveMap: DecisionIncentive[];
  consequenceMap: DecisionConsequence[];
  reversibilityMap: DecisionReversibility;
  viabilityMap: DecisionViability;

  // Adversarial intelligence
  adversarialChallenge: AdversarialChallenge[];
  selfAdversarialChallenge: SelfAdversarialChallenge | null;

  // Actionable outputs
  options: DecisionOption[];
  minimumViablePath: DecisionMove[];
  forbiddenActions: ForbiddenAction[];
  whatMustNotBeDelayed: string[];
  whatWouldChangeRecommendation: string[];

  // Regulated boundary
  regulatedBoundary: RegulatedBoundaryState;
  professionalBrief?: ProfessionalBrief;

  // Governance state
  disclosure: TieredDisclosureState;
  review: HumanReviewState;
  verification: CaseVerificationRecord;
  continuity: ContinuityRecord;

  // Outcome and learning
  outcome: CaseOutcomeState;
  learningTrace: CaseLearningTrace[];

  // Quality and confidence
  confidence: ConfidenceLevel;
  qualityChecksPassed: string[];
  qualityChecksFailed: string[];
};

// ─── Partial case (for building incrementally) ────────────────────────────────

export type PartialLivingDecisionCase = Partial<LivingDecisionCase> & {
  id: string;
  caseReference: string;
  contractVersion: typeof CASE_CONTRACT_VERSION;
  kernelVersion: string;
  ontologyVersion: typeof ONTOLOGY_VERSION;
  createdAt: string;
  updatedAt: string;
  status: LivingDecisionCase["status"];
  source: LivingDecisionCase["source"];
};

// ─── Aperture output types ────────────────────────────────────────────────────
// What each tier actually renders to the buyer

export type FreeSignalOutput = {
  caseId: string;
  caseReference: string;
  tier: "FREE_SIGNAL";
  decisionClass: DecisionClass;
  situationClass: string;             // Human-readable label
  whatSystemSaw: string;              // Non-generic, case-specific
  primaryFailurePoint: string;
  governingTension: string | null;
  consequenceClass: string;
  directionOfMinimumViableMove: string;
  demoRef: string;
  issuedAt: string;
  upgradeAvailable: boolean;
};

export type BasicBriefOutput = FreeSignalOutput & {
  tier: "BASIC_BRIEF";
  shortFailureMap: Array<{ point: string; severity: string; description: string }>;
  minimumViableMove: string;
  shortFallback: string;
  forbiddenActions: string[];
};

export type FullDossierOutput = BasicBriefOutput & {
  tier: "FULL_DOSSIER";
  authorityMap: DecisionAuthority[];
  obligationMap: DecisionObligation[];
  constraintGraph: DecisionConstraint[];
  evidenceGraph: DecisionEvidenceNode[];
  adversarialChallenge: AdversarialChallenge[];
  selfAdversarialChallenge: SelfAdversarialChallenge;
  minimumViablePath: DecisionMove[];
  whatMustNotBeDelayed: string[];
  regulatedBoundaryOutput?: string;
  professionalBrief?: ProfessionalBrief;
  verificationReference: string;
  humanReviewState: string;
};
