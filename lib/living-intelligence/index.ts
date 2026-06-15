/**
 * lib/living-intelligence/index.ts
 *
 * Public API for the Living Intelligence Engine.
 *
 * Phase A+B: Estate structure contradiction detection.
 * Phase C:   Product truth verification (doctrine, behaviour, evidence, memory).
 *
 * This module exports the complete pipeline:
 *   1. Load estate snapshot
 *   2. Detect contradictions
 *   3. Classify interventions
 *   4. Generate recommendations
 *   5. Check guardrails
 *   6. Check doctrine claims
 *   7. Run behaviour probes
 *   8. Audit living components
 *   9. Run learning engine
 *  10. Compose report
 */

export type {
  ProductAuthorityState, CommercialStatus, GmiEditionStatus,
  LifecycleState, ReadinessStatus, ResolverActionState,
  ProductSnapshot, GmiEditionSnapshot, ContentFamilySnapshot,
  BuildSnapshot, EstateSnapshot,
  ContradictionSeverity, Contradiction,
  InterventionClassification, Intervention,
  RecommendationAction, Recommendation,
  GuardrailViolation, LivingReport,
} from "./estate-state-contract";

export {
  SOURCE_OF_TRUTH_MAP, SOURCE_OF_TRUTH_DESCRIPTIONS,
  getAuthorityFor, describeSource,
} from "./source-of-truth-map";

export { loadEstateSnapshot } from "./estate-snapshot-loader";
export { detectAllContradictions } from "./contradiction-detector";
export { classifyContradictions } from "./intervention-classifier";
export { generateRecommendations } from "./living-recommendation-engine";
export { checkAllGuardrails, GUARDRAILS } from "./living-guardrails";
export { buildLivingReport, composeMarkdownReport } from "./living-report-composer";

// Phase C exports
export { DOCTRINE_CLAIMS, getDoctrineClaim, getDoctrineClaimsByDomain, getDoctrineClaimsByPosture } from "./product-doctrine-contract";
export type { DoctrineClaim, EvidencePosture } from "./product-doctrine-contract";
export type { BehaviourProbe, BehaviourReport, BehaviourStatus } from "./product-behaviour-contract";
export { checkAllDoctrineClaims } from "./doctrine-claim-loader";
export type { DoctrineCheckResult } from "./doctrine-claim-loader";
export { runBehaviourProbes } from "./behaviour-probe-engine";
export { classifyPosture, createPosturedFinding } from "./evidence-posture-engine";
export type { PosturedFinding } from "./evidence-posture-engine";
export { mergeIntoMemory, getMemory, getRepeatedContradictions, getResolvedContradictions } from "./drift-memory-store";
export type { DriftMemoryEntry, DriftMemoryStore, FindingToRemember, MemoryEntryStatus } from "./drift-memory-store";
export { runLearningEngine } from "./governed-learning-engine";
export type { LearnedInsight } from "./governed-learning-engine";
export { auditLivingComponents } from "./living-component-auditor";
export type { ComponentAudit, ComponentAuditStatus } from "./living-component-auditor";

// ─── Living State Object layer (additive) ────────────────────────────────────
// Reusable, estate-wide operational state intelligence. This sits beside the
// estate-structure system above; it does not replace it. Each product area
// provides a domain adapter, but all adapters emit the same LivingStateObject,
// and the engine (not the presentation layer) owns the cross-cutting rules.

export type {
  LivingStateDomain, LivingStateSubjectType, LivingStateStage,
  LivingStateBlockerCode, LivingStateSeverity, LivingStateActor,
  LivingStateBlocker, LivingStateActionType, LivingStateNextAction,
  LivingStateEvidenceStatus, LivingStateEvidence,
  LivingStateConsentStatus, LivingStateConsent,
  LivingStateArtifactStatus, LivingStateArtifact,
  LivingStatePublication, LivingStateMemory, LivingStateObject,
} from "./living-state-object-contract";
export {
  LIVING_STATE_SEVERITY_RANK, LIVING_STATE_NON_TERMINAL_STAGES, LIVING_STATE_NEVER_INFER,
} from "./living-state-object-contract";

export type { LivingDomainAdapter, LivingDomainAdapterInput } from "./living-domain-adapter-contract";
export { readString, readBool, readNumber, readStringArray } from "./living-domain-adapter-contract";

export { evaluateLivingStateObject, evaluateLivingStateEstate } from "./living-state-engine";
export type { EvaluateContext, LivingStateEstateSummary } from "./living-state-engine";

export {
  emptyMemoryStore, coerceMemoryStore, deriveMemory, applyMemoryToBatch, summariseMemory,
  LIVING_STATE_MEMORY_VERSION,
} from "./living-state-memory";
export type { LivingStateMemoryRecord, LivingStateMemoryStore } from "./living-state-memory";

export { normaliseRoute, routeExists, resolveRepairRoute } from "./living-state-route-map";

export { buildLivingStateViewModel, LIVING_STATE_ENGINE_VERSION } from "./living-state-view-model";
export type {
  LivingStateViewModel, LivingStateDomainRollup,
  LivingStateUserFacing, LivingStateOperatorFacing,
} from "./living-state-view-model";

export { composeLivingStateObjectsPayload, composeLivingStateSummaryMarkdown } from "./living-state-report-composer";
export type { LivingStateObjectsPayload } from "./living-state-report-composer";

export { boardroomAdapter } from "./adapters/boardroom-adapter";
export { assessmentAdapter } from "./adapters/assessment-adapter";
export { commercialAdapter } from "./adapters/commercial-adapter";
export { fulfilmentAdapter } from "./adapters/fulfilment-adapter";
export { gmiAdapter } from "./adapters/gmi-adapter";
export { contentAdapter } from "./adapters/content-adapter";
export { decisionCentreAdapter } from "./adapters/decision-centre-adapter";
export { strategyRoomAdapter } from "./adapters/strategy-room-adapter";
export { retainerOversightAdapter } from "./adapters/retainer-oversight-adapter";
export { professionalAdapter } from "./adapters/professional-adapter";