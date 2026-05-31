/**
 * lib/intelligence/types.ts — Shared types for the Decision Intelligence Kernel
 *
 * This is the single source of truth for all kernel types.
 * No other file should redefine these types.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Decision Class Taxonomy
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionClass =
  | 'COMPLIANCE_AND_FILING'
  | 'GOVERNANCE_AND_BOARD'
  | 'COMMERCIAL_AND_MARKET'
  | 'OPERATIONAL_AND_EXECUTION'
  | 'STRATEGIC_AND_POSITIONING'
  | 'REPUTATIONAL_AND_EXPOSURE'
  | 'FINANCIAL_AND_CAPITAL'
  | 'LEGAL_AND_CONTRACTUAL'
  | 'PEOPLE_AND_AUTHORITY'
  | 'TECHNOLOGY_AND_DEPENDENCY'
  | 'CONTINUITY_AND_TRANSITION'
  | 'LOW_STAKES_PREFERENCE'

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export type SourceAperture =
  | 'web'
  | 'api'
  | 'admin'
  | 'strategy_room'
  | 'paid_basic_brief'
  | 'paid_full_dossier'
  | 'paid_urgent_operational'
  | 'paid_executive_board'

export type ConsentState = 'granted' | 'pending' | 'withdrawn'

export type HumanReviewTier = 'STANDARD' | 'URGENT' | 'EXECUTIVE' | 'FOUNDER'

export type CaseStatus = 'open' | 'active' | 'under_review' | 'resolved' | 'closed'

export type DisclosureTier =
  | 'free_signal'
  | 'basic_brief'
  | 'full_dossier'
  | 'urgent_operational'
  | 'executive_board'
  | 'retained_continuity'

// ─────────────────────────────────────────────────────────────────────────────
// Translation
// ─────────────────────────────────────────────────────────────────────────────

export interface TranslationResult {
  vocabularyState: 1 | 2 | 3 | 4 | 5
  situationSummary: string
  kernelInterpretation: string
  translationConfidence: ConfidenceLevel
  clarificationRequired: ClarificationQuestion[]
  decisionClass: DecisionClass
  /** Alternative classes where two or more domains are plausible — translation law requires preservation */
  alternativeClasses: DecisionClassCandidate[]
  initialActors: ActorCandidate[]
  surfacedDimensions: string[]   // Short labels for rendering: "timing", "financial", etc.
  detectedSignals: string[]      // Structured signals for logic: "constraint:cash", "obligation:deadline", etc.
  preservedAmbiguities: string[]
  hiddenStakesDetected: boolean
}

export interface ClarificationQuestion {
  domain: string
  question: string
  rationale: string
}

export interface ActorCandidate {
  name: string
  role: string
  confidence: ConfidenceLevel
  source: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification
// ─────────────────────────────────────────────────────────────────────────────

export interface DecisionClassCandidate {
  decisionClass: DecisionClass
  confidence: ConfidenceLevel
  reason: string
}

export interface ClassificationResult {
  primaryClass: DecisionClass
  alternativeClasses: DecisionClassCandidate[]
  confidence: ConfidenceLevel
  classificationRationale: string
}

export interface DecisionClassDefinition {
  class: DecisionClass
  label: string
  description: string
  mandatoryLenses: string[]
  optionalLenses: string[]
  primaryAdversarialVectors: string[]
  regulatedBoundaryTriggers: string[]
  defaultTier: DisclosureTier
  humanReviewThreshold: string
  forbiddenOutputClaims: string[]
  qualityChecks: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Situation Model
// ─────────────────────────────────────────────────────────────────────────────

export interface SituationModel {
  rawContext: string
  buyerLanguageSummary: string
  institutionalInterpretation: string
  coreTension: string
  coreParadox?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision Actors, Authority, Obligation
// ─────────────────────────────────────────────────────────────────────────────

export interface DecisionActor {
  name: string
  role: string
  authority: string
  interest: string
  influence: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: ConfidenceLevel
  source: string
}

export interface DecisionAuthority {
  holder: string
  scope: string
  limitation: string | null
  evidenceBasis: string
  confidence: ConfidenceLevel
  source: string
}

export interface DecisionObligation {
  description: string
  type: 'contractual' | 'regulatory' | 'fiduciary' | 'statutory' | 'moral'
  deadline: string | null
  consequence: string | null
  evidenceBasis: string
  confidence: ConfidenceLevel
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence & Constraints
// ─────────────────────────────────────────────────────────────────────────────

export interface DecisionEvidenceNode {
  kind: string
  label: string
  summary: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
  sourceStage: string
  sourceLens?: string
  provenance?: Record<string, unknown>
}

export interface DecisionConstraint {
  description: string
  type: 'cash' | 'time' | 'authority' | 'capacity' | 'legal' | 'regulatory' | 'technical' | 'other'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isBinding: boolean
  evidenceBasis: string
  ifWrong?: string
  verificationPath?: string
  forbids?: string
  forbidReason?: string
  blocks?: string[]
}

export interface DecisionDependency {
  description: string
  type: string
  critical: boolean
  status: string
  owner: string | null
}

export interface DecisionIncentive {
  actor: string
  incentive: string
  alignment: 'ALIGNED' | 'MISALIGNED' | 'NEUTRAL'
  strength: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface DecisionConsequence {
  description: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timeSensitivity: 'NONE' | 'WITHIN_48_HOURS' | 'IMMEDIATE' | 'THIS_QUARTER'
  probability: number
  mustNotDelay?: string
}

export interface DecisionReversibility {
  assessment: string
  reversibilityScore: number
  irreversibleElements: string[]
  timeToReverse: string | null
}

export interface DecisionViability {
  assessment: string
  viablePathExists: boolean
  confidence: ConfidenceLevel
  blockingConstraints: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Adversarial & Options
// ─────────────────────────────────────────────────────────────────────────────

export interface KernelContradiction {
  id: string
  between: string[]
  contradiction: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  resolutionRule: string
  outputEffect: string
}

export interface AdversarialChallenge {
  vector: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  evidenceBasis: string
  mitigationPath: string | null
}

export interface SelfAdversarialChallenge {
  loadBearingAssumptions: Assumption[]
  classificationConfidence: {
    primaryClass: DecisionClass
    confidence: ConfidenceLevel
    alternativeClass?: DecisionClass
    implication: string
  }
  informationGaps: InformationGap[]
  kernelLimitations: string[]
}

export interface Assumption {
  assumption: string
  evidenceBasis: string
  ifWrong: string
  verificationPath: string
}

export interface InformationGap {
  gap: string
  impact: string
  acquisitionPath: string
}

export interface DecisionOption {
  label: string
  description: string
  advantage: string
  risk: string
  constraint: string
  recommended: boolean
}

export interface DecisionMove {
  order: number
  action: string
  description: string
  rationale: string
  urgency: 'IMMEDIATE' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  isNegativeConstraint?: boolean
  timeframe?: string
}

export interface ForbiddenAction {
  action: string
  reason: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// ─────────────────────────────────────────────────────────────────────────────
// Regulated Boundary
// ─────────────────────────────────────────────────────────────────────────────

export interface RegulatedBoundaryState {
  hit: boolean
  type?: string
  allTriggers?: string[]
  output?: RegulatedBoundaryOutput
}

export interface RegulatedBoundaryOutput {
  regulatedBoundaryIdentified: boolean
  whatThisMeans: string
  whatWeCanStillMap: string[]
  professionalBrief: {
    purpose: string
    suggestedProfession: string
    whatToBring: string[]
    questionsToAsk: string[]
  }
  whatToDoNext: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Human Review
// ─────────────────────────────────────────────────────────────────────────────

export interface HumanReviewState {
  state: 'not_required' | 'pending' | 'in_review' | 'amended' | 'completed'
  tier: HumanReviewTier | null
  triggers: HumanReviewTrigger[]
}

export interface HumanReviewTrigger {
  type: string
  severity: HumanReviewTier | 'LOW' | 'MEDIUM' | 'HIGH'
}

// ─────────────────────────────────────────────────────────────────────────────
// Disclosure
// ─────────────────────────────────────────────────────────────────────────────

export interface DisclosureState {
  currentTier: DisclosureTier
}

export interface DisclosureOutput {
  tier: DisclosureTier
  sections: DisclosureSection[]
  quality: OutputQuality
}

export interface DisclosureSection {
  id: string
  label: string
  content: unknown
  type: 'badge' | 'prose' | 'list' | 'structured' | 'action' | 'ordered_actions' | 'table' | 'metadata'
}

export interface OutputQuality {
  genericOutputDetected: boolean
  missingAuthorityMap: boolean
  missingObligationMap: boolean
  missingEvidenceGraph: boolean
  missingAdversarialChallenge: boolean
  missingMinimumViablePath: boolean
  selfAdversarialPresent: boolean
  humanReviewAssessed: boolean
  regulatedBoundaryRespected: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Kernel Lens
// ─────────────────────────────────────────────────────────────────────────────

export interface KernelLensResult {
  lensId: string
  lensVersion: string
  applied: boolean
  confidence: ConfidenceLevel
  findings: LensFinding[]
  evidenceNodes: DecisionEvidenceNode[]
  contradictions: KernelContradiction[]
  recommendedEvents: LivingCaseEventDraft[]
}

export interface LensFinding {
  domain: 'authority' | 'obligation' | 'constraint' | 'evidence' | 'consequence' | 'dependency' | 'incentive'
  data: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Living Decision Case — The Core Object
// ─────────────────────────────────────────────────────────────────────────────

export interface LivingDecisionCase {
  id: string
  caseReference: string
  contractVersion: string
  kernelVersion: string
  ontologyVersion: string

  source: {
    aperture: SourceAperture
    createdBy?: string
    organisationId?: string
    consentState: ConsentState
  }

  translation: TranslationResult
  classification: ClassificationResult
  situationModel: SituationModel

  actorMap: DecisionActor[]
  authorityMap: DecisionAuthority[]
  obligationMap: DecisionObligation[]
  evidenceGraph: DecisionEvidenceNode[]
  constraintGraph: DecisionConstraint[]
  dependencyMap: DecisionDependency[]
  incentiveMap: DecisionIncentive[]
  consequenceMap: DecisionConsequence[]
  reversibilityMap: DecisionReversibility | null
  viabilityMap: DecisionViability | null

  adversarialChallenge: KernelContradiction[]
  selfAdversarialChallenge: SelfAdversarialChallenge | null

  options: DecisionOption[]
  minimumViablePath: DecisionMove[]
  forbiddenActions: ForbiddenAction[]
  whatMustNotBeDelayed: string[]
  whatWouldChangeRecommendation: string[]

  regulatedBoundary: RegulatedBoundaryState
  professionalBrief?: RegulatedBoundaryOutput

  disclosure: DisclosureState
  review: HumanReviewState
  verification: CaseVerificationRecord | null
  continuity: CaseContinuityRecord | null
  outcome: CaseOutcomeState | null
  learningTrace: CaseLearningTrace[]

  // Metadata
  createdAt?: string
  updatedAt?: string
  caseStatus?: CaseStatus
}

// ─────────────────────────────────────────────────────────────────────────────
// Case Records
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseVerificationRecord {
  verified: boolean
  verifiedAt: string
  verifiedBy: string | null
  method: string
  reference: string
}

export interface CaseContinuityRecord {
  active: boolean
  lastReviewDate: string | null
  nextReviewDate: string | null
  driftDetected: boolean
  driftDetails: string[]
}

export interface CaseOutcomeState {
  outcomeType: 'resolved' | 'escalated' | 'abandoned' | 'pending' | 'persistent'
  outcomeSummary: string
  outcomeDetail: Record<string, unknown> | null
  recordedAt: string | null
  recordedBy: string | null
}

export interface CaseLearningTrace {
  event: string
  kernelVersion: string
  timestamp: string
  detail: Record<string, unknown> | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Kernel Input / Output
// ─────────────────────────────────────────────────────────────────────────────

export interface KernelInput {
  caseId: string
  caseReference: string
  rawScenario: string
  aperture: SourceAperture
  requestedTier?: DisclosureTier
  createdBy?: string
  organisationId?: string
  clarifications?: Record<string, string>
}

export interface KernelResult {
  caseId: string
  status: 'COMPLETED' | 'CLARIFICATION_REQUIRED' | 'QUALITY_FAILED'
  translation: TranslationResult
  classification?: ClassificationResult
  livingCase?: LivingDecisionCase
  output: DisclosureOutput | null
  questions?: ClarificationQuestion[]
  qualityFailures?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────

export type LivingCaseEventType =
  | 'CASE_CREATED'
  | 'TRANSLATION_COMPLETED'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RECEIVED'
  | 'CASE_CLASSIFIED'
  | 'LENS_APPLIED'
  | 'SELF_ADVERSARIAL_COMPLETED'
  | 'ADVERSARIAL_CHALLENGE_ADDED'
  | 'REGULATED_BOUNDARY_HIT'
  | 'PROFESSIONAL_BRIEF_GENERATED'
  | 'TIER_DISCLOSED'
  | 'PAYMENT_RECEIVED'
  | 'ENTITLEMENT_GRANTED'
  | 'HUMAN_REVIEW_TRIGGERED'
  | 'HUMAN_REVIEW_AMENDMENT'
  | 'HUMAN_REVIEW_COMPLETED'
  | 'QUALITY_STANDARD_FAILED'
  | 'QUALITY_STANDARD_PASSED'
  | 'DOSSIER_GENERATED'
  | 'STRATEGY_ROOM_SESSION_STARTED'
  | 'STRATEGY_ROOM_UPDATE'
  | 'STRATEGY_ROOM_SESSION_COMPLETED'
  | 'VERIFICATION_REFERENCE_ISSUED'
  | 'OUTCOME_RECORDED'
  | 'DRIFT_DETECTED'
  | 'CALIBRATION_UPDATED'
  | 'CASE_CLOSED'

export interface LivingCaseEventDraft {
  eventType: LivingCaseEventType
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
  actorId?: string
  actorType?: 'system' | 'buyer' | 'admin' | 'reviewer'
}

// ─────────────────────────────────────────────────────────────────────────────
// Quality Gates
// ─────────────────────────────────────────────────────────────────────────────

export interface QualityGateResult {
  passed: boolean
  failures: string[]
  checkedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Outcome Learning
// ─────────────────────────────────────────────────────────────────────────────

export interface SimilarCase {
  caseId: string
  caseReference: string
  primaryClass: DecisionClass
  similarityScore: number
  outcome: CaseOutcomeState | null
}

export interface DriftReport {
  driftDetected: boolean
  reason: string
  patterns: DriftPattern[]
}

export interface DriftPattern {
  assumption: string
  priorFailureRate: number
  currentCaseCount: number
  alert: boolean
}

export interface FailedAssumption {
  assumption: string
  failureRate: number
  instanceCount: number
}

export interface ActiveAssumption {
  assumption: string
  evidenceBasis: string
}

export interface CalibrationReport {
  calibrated: boolean
  reason?: string
  decisionClass?: DecisionClass
  totalCases?: number
  failureRate?: number
  patterns: FailurePattern[]
}

export interface FailurePattern {
  pattern: string
  frequency: number
  instanceCount: number
  recommendation: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisma-compatible persistence types
// ─────────────────────────────────────────────────────────────────────────────

export interface LivingCaseRecord {
  id: string
  caseReference: string
  contractVersion: string
  kernelVersion: string
  ontologyVersion: string
  sourceAperture: string
  createdById: string | null
  organisationId: string | null
  consentState: string
  primaryClass: string
  alternativeClasses: unknown
  classificationConfidence: string
  translationState: string
  caseStatus: string
  currentTier: string
  regulatedBoundaryHit: boolean
  regulatedBoundaryType: string | null
  requiresHumanReview: boolean
  humanReviewTier: string | null
  humanReviewState: string
  qualityStandardPassed: boolean | null
  qualityStandardFailure: string | null
  serializedCase: unknown
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  closedAt: Date | null
}

export interface LivingCaseEventRecord {
  id: string
  caseId: string
  eventType: string
  eventVersion: string
  actorId: string | null
  actorType: string | null
  payload: unknown
  metadata: unknown
  createdAt: Date
}
