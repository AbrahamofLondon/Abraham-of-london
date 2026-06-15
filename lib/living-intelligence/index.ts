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