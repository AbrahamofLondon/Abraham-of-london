/**
 * lib/sovereign/index.ts
 *
 * Sovereign Intelligence Layer — public entry point.
 *
 * This module exports the full institutional intelligence stack:
 * signals, forensics, commons, institutional memory, and cohort intelligence.
 *
 * Usage:
 *   import { detectIntelligenceSignals, generateForensicAccount } from "@/lib/sovereign";
 */

export {
  detectIntelligenceSignals,
  detectPrimarySignal,
  detectSignalsAbove,
  summariseSignals,
} from "./intelligence-signals";

export type {
  IntelligenceSignal,
  SignalInput,
  SignalSeverity,
  SignalOutcome,
} from "./intelligence-signals";

export {
  generateForensicAccount,
  formatForensicNarrative,
} from "./decision-forensics";

export type {
  ForensicAccount,
  ForensicOutcome,
  ForensicPredictorResult,
  DecisionContext,
} from "./decision-forensics";

export {
  recordCommonsEntry,
  queryCommons,
  calculatePercentile,
  getPatternFrequency,
  getCommonsSize,
  computeBenchmarkReport,
} from "./intelligence-commons";

export type {
  CommonsRecord,
  CommonsDataSource,
  PercentileResult,
  PatternFrequency,
  BenchmarkDistribution,
} from "./intelligence-commons";

export {
  buildInstitutionalMemoryReport,
} from "./institutional-memory";

export type {
  SessionSnapshot,
  RecurringPattern,
  ContradictionCluster,
  TrajectoryArc,
  InstitutionalMemoryReport,
} from "./institutional-memory";

export {
  matchCohort,
} from "./cohort-intelligence";

export type {
  CohortInput,
  CohortProfile,
  CohortMatchResult,
  CohortOutcome,
  CohortDefinition,
} from "./cohort-intelligence";
