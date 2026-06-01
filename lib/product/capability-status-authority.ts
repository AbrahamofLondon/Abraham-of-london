import type { PaidCorridorStage as PaidCorridorSurface } from '@/lib/product/paid-corridor-contract'
import type { ProductLine } from '@/lib/product/product-line-contract'

export type CapabilityStatus =
  | 'ACTIVE'
  | 'PARTIALLY_WIRED'
  | 'GATED'
  | 'DORMANT'
  | 'LEGACY'
  | 'DUPLICATE'
  | 'INTERNAL'
  | 'UNKNOWN'

export type CapabilityLayer =
  | 'CAPTURE'
  | 'INTELLIGENCE'
  | 'SIMULATION'
  | 'EVIDENCE'
  | 'MEMORY'
  | 'GOVERNANCE'
  | 'REPORTING'
  | 'BOARDROOM'
  | 'STRATEGY_ROOM'
  | 'OVERSIGHT'
  | 'RETAINER'
  | 'COMMERCIAL'
  | 'RESEARCH'
  | 'PREDICTIVE'
  | 'SECURITY_PRIVACY'
  | 'UI_SURFACE'
  | 'TEST'

export type CapabilityRecord = {
  capabilityId: string
  filePath: string
  productLine: ProductLine
  layer: CapabilityLayer
  status: CapabilityStatus
  corridorStage?: PaidCorridorSurface
  importsCount?: number
  tests?: string[]
  usedBy?: string[]
  outputDestination?: string[]
  dataRequired?: string[]
  outputProduced?: string[]
  gatingReason?: string
  riskIfIgnored?: string
  recommendation?: string
  lastVerifiedCommit?: string
}

const VERIFIED_COMMIT = 'd3bddf218'

export const CAPABILITY_STATUS_RECORDS: CapabilityRecord[] = [
  {
    capabilityId: 'ScenarioStressTest',
    filePath: 'lib/engine/scenario-stress-test.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'SIMULATION',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'enterprise_assessment',
    importsCount: 3,
    tests: ['tests/engine/scenario-stress-test-enterprise.test.ts', 'tests/intelligence/decision-intelligence-orchestrator.test.ts'],
    usedBy: ['lib/intelligence/decision-intelligence-orchestrator.ts', 'pages/diagnostics/enterprise-assessment.tsx', 'pages/api/diagnostics/enterprise.ts'],
    outputDestination: ['enterprise_assessment findings', 'orchestrator engineTrace'],
    dataRequired: ['scenarioResponses with valid ENTERPRISE_SCENARIO_IDS', 'domainScores'],
    outputProduced: ['scenario-stress-test findings', 'scenario engine trace'],
    gatingReason: 'Not full enterprise simulation until downstream executive/reporting surfaces consume scenario findings.',
    recommendation: 'Keep scenario bank IDs central and wire scenario findings into executive/reporting carry-forward before marking fully ACTIVE.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'DomainInterdependency',
    filePath: 'lib/engine/domain-interdependency.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'INTELLIGENCE',
    status: 'GATED',
    corridorStage: 'enterprise_assessment',
    dataRequired: ['contradictionGraph', 'domainScores'],
    gatingReason: 'Requires contradictionGraph plus domainScores; domainScores exist, but contradictionGraph is not produced for this enterprise path.',
    riskIfIgnored: 'Enterprise may overclaim structural dependency intelligence.',
    recommendation: 'Produce and pass contradictionGraph before activating domain interdependency output.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'ContradictionForcing',
    filePath: 'lib/engine/contradiction-forcing.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'INTELLIGENCE',
    status: 'GATED',
    dataRequired: ['answer pattern set', 'surface-specific contradiction prompts'],
    gatingReason: 'Engine is registered for future preparation but is not invoked by a production path.',
    recommendation: 'Wire only after answer-pattern fields are captured consistently.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Team Respondent Aggregation',
    filePath: 'lib/intelligence/team-respondent-aggregation.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'CAPTURE',
    status: 'ACTIVE',
    corridorStage: 'team_assessment',
    usedBy: ['pages/diagnostics/team-assessment.tsx', 'pages/api/diagnostics/submit.ts', 'pages/api/diagnostics/team-alignment.ts', 'lib/intelligence/decision-intelligence-orchestrator.ts'],
    outputDestination: ['team_assessment evidenceBasis', 'team_assessment unresolvedItems', 'team_assessment engineTrace'],
    dataRequired: ['multi-respondent records', 'explicit respondent form fields', 'shared team case reference'],
    outputProduced: ['aggregate-only respondent divergence when at least 2 records exist', 'single-respondent gate when fewer than 2 records exist'],
    recommendation: 'Keep respondent payloads audience-unsafe and surface only aggregate findings.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Decision Centre Living Adapter',
    filePath: 'lib/product/decision-centre-living-adapter.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'UI_SURFACE',
    status: 'ACTIVE',
    corridorStage: 'strategy_room',
    tests: ['tests/product/decision-centre-living-adapter.test.ts'],
    usedBy: ['pages/decision-centre.tsx'],
    outputDestination: ['Decision Centre living layer view model'],
    outputProduced: ['living layer progress', 'case continuity status'],
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Constitutional Living Adapter',
    filePath: 'lib/product/constitutional-living-adapter.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'UI_SURFACE',
    status: 'ACTIVE',
    tests: ['tests/product/constitutional-living-adapter.test.ts'],
    usedBy: ['components/diagnostics/ConstitutionalDiagnostic.tsx'],
    outputDestination: ['Constitutional diagnostic living layer view model'],
    dataRequired: ['constitutionalStructural preferred over legacy derived facts'],
    outputProduced: ['constitutional living view model'],
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Evidence Carry-Forward Presenter',
    filePath: 'lib/product/evidence-carry-forward-presenter.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'REPORTING',
    status: 'ACTIVE',
    corridorStage: 'executive_reporting',
    dataRequired: ['prior stage evidence', 'evidence lineage'],
    usedBy: ['lib/product/executive-reporting-public-dto.ts', 'app/api/executive-reporting/run/route.ts', 'pages/diagnostics/executive-reporting/run.tsx'],
    outputDestination: ['Executive Reporting public result', 'Executive Reporting run result UI'],
    outputProduced: ['public-safe carried-forward evidence', 'evidence gaps', 'board-grade judgement inputs'],
    recommendation: 'Continue expanding durable recommendation/outcome ledger inputs without exposing raw evidence payloads.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Executive Reporting Public DTO',
    filePath: 'lib/product/executive-reporting-public-dto.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'REPORTING',
    status: 'ACTIVE',
    corridorStage: 'executive_reporting',
    usedBy: ['app/api/executive-reporting/run/route.ts', 'pages/diagnostics/executive-reporting/run.tsx'],
    outputDestination: ['Executive Reporting API response', 'Executive Reporting result components'],
    outputProduced: ['public-safe executive reporting DTO', 'executiveJudgement block with evidence carry-forward and gated recommendation'],
    recommendation: 'Keep Boardroom dossier output gated by Boardroom qualification.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Boardroom Archive',
    filePath: 'lib/product/boardroom-archive.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'BOARDROOM',
    status: 'ACTIVE',
    corridorStage: 'boardroom_mode',
    usedBy: ['app/api/executive-reporting/export/boardroom-pdf/route.ts', 'pages/diagnostics/executive-reporting/run.tsx', 'lib/constitution/boardroom-mode.ts'],
    outputDestination: ['Executive Reporting Boardroom Dossier section', 'Boardroom PDF export'],
    outputProduced: ['BoardroomDossier with objections, evidence weaknesses, decision paths, refusal conditions'],
    dataRequired: ['executiveJudgement', 'recommendation', 'evidenceBasis', 'evidence gaps', 'consequence of delay', 'governance conditions'],
    recommendation: 'Boardroom dossier generation is production-wired from Executive Reporting. Keep dossier content gated by boardroom.qualified flag.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Boardroom Mode Adapter',
    filePath: 'app/admin/intelligence-foundry/simulation/boardroom-mode/PageClient.tsx',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'BOARDROOM',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'boardroom_mode',
    outputDestination: ['Foundry simulation surface'],
    gatingReason: 'Simulation adapter exists; production boardroom archive/session loop remains separate from the dossier generation pipeline.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Strategy Room Adapter',
    filePath: 'app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'STRATEGY_ROOM',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'strategy_room',
    outputDestination: ['Foundry simulation surface'],
    gatingReason: 'Foundry adapter is not the same as production governed execution.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Strategy Room execution record persistence',
    filePath: 'lib/product/recommendation-outcome-ledger.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'STRATEGY_ROOM',
    status: 'ACTIVE',
    corridorStage: 'strategy_room',
    tests: ['tests/product/recommendation-outcome-ledger.test.ts'],
    usedBy: [
      'lib/strategy-room/admission.ts',
      'lib/strategy-room/canonical-snapshot.ts',
      'lib/strategy-room/execution-record.ts',
      'lib/strategy-room/execution-feedback.ts',
      'lib/strategy-room/session-service.ts',
      'app/api/strategy-room/execution/route.ts',
      'app/api/strategy-room/execution/[id]/route.ts',
      'app/api/strategy-room/execution/[id]/decisions/route.ts',
      'components/strategy-room/ExecutionFlow.tsx',
    ],
    outputDestination: [
      'recommendation outcome ledger',
      'Strategy Room execution session (StrategyRoomExecutionSession)',
      'Strategy Room decision log (StrategyDecisionLog)',
      'consequence timeline (ConsequenceTimeline)',
      'escalation events (EscalationEvent)',
    ],
    outputProduced: [
      'execution session with canonical snapshot and intervention stack',
      'execution record with decision, authority, owner, timeline',
      'decision log with status transitions (pending → executed/blocked)',
      'execution feedback with trajectory and decision snapshot',
      'checkpoint creation for each execution state transition',
      'consequence timeline and escalation events',
    ],
    recommendation: 'End-to-end execution loop proven: admission → session → execution record → decision logging → feedback → outcome verification. Keep retainer/oversight gated.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Oversight Brief Composer',
    filePath: 'lib/product/oversight-brief-composer.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'OVERSIGHT',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'retainer_oversight',
    tests: ['lib/product/oversight-brief-composer.test.ts'],
    outputDestination: ['oversight brief object when called'],
    outputProduced: ['oversight brief'],
    gatingReason: 'Composer exists, but retainer production path is not connected to durable recommendation/outcome/recurrence cadence.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Oversight Cadence Engine',
    filePath: 'lib/product/oversight-cadence-engine.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'RETAINER',
    status: 'GATED',
    corridorStage: 'retainer_oversight',
    dataRequired: ['durable oversight cycle history', 'cadence state'],
    gatingReason: 'Requires retained oversight account memory and recurring cycle data before activation.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Oversight Cycle Comparison',
    filePath: 'lib/product/oversight-cycle-comparison.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'RETAINER',
    status: 'GATED',
    corridorStage: 'retainer_oversight',
    dataRequired: ['two or more completed oversight cycles'],
    gatingReason: 'Requires durable cycle history across completed oversight cycles.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Oversight Review Decision Engine',
    filePath: 'lib/product/oversight-review-decision-engine.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'RETAINER',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'retainer_oversight',
    tests: ['tests/product/decision-centre-retainer-memory.test.ts'],
    outputDestination: ['operator review queue status transitions'],
    outputProduced: ['APPROVED_FOR_CONTACT, DECLINED, NEEDS_MORE_HISTORY status transitions on queue entries'],
    dataRequired: ['queue entry id', 'reviewer identity', 'optional review note'],
    gatingReason: 'Operator decision helpers (approveForContact, declineReview, requestMoreHistory) wired with Prisma persistence and auth-guarded API routes. Automated review decisions require durable recommendation/outcome memory before activation.',
    recommendation: 'Keep PARTIALLY_WIRED. Do not promote to ACTIVE until automated review decisions are production-proven.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Retainer Review Queue',
    filePath: 'lib/product/retainer-review-queue.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'RETAINER',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'retainer_oversight',
    tests: ['tests/product/decision-centre-retainer-memory.test.ts'],
    outputDestination: ['operator review queue entries', 'Prisma persistence via auth-guarded API routes'],
    outputProduced: ['RetainerReviewQueueEntry with PENDING_REVIEW, APPROVED_FOR_CONTACT, DECLINED, NEEDS_MORE_HISTORY transitions'],
    dataRequired: ['REVIEW_READY or OVERSIGHT_READY readiness status', 'available signals', 'missing requirements'],
    gatingReason: 'Prisma persistence added, auth-guarded API routes, operator decision path. Retainer Oversight remains GATED.',
    recommendation: 'Do not promote to ACTIVE until end-to-end retainer oversight production path is proven. Do not use to activate Retainer Oversight.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Retainer Cycle Memory Engine',
    filePath: 'lib/product/retainer-cycle-memory-engine.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'RETAINER',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'retainer_oversight',
    tests: ['lib/product/retainer-cycle-memory-engine.test.ts', 'lib/product/retainer-cycle-memory.e2e.test.ts'],
    outputDestination: ['client-safe oversight brief when supplied'],
    dataRequired: ['current metrics', 'prior cycle metrics', 'governance flags'],
    outputProduced: ['retainer cycle memory summary'],
    gatingReason: 'Engine works with supplied data; production retained oversight path still needs durable recurrence cadence.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Behavioral Trend Engine',
    filePath: 'lib/behavioral/behavioral-trend-engine.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'EVIDENCE',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'retainer_oversight',
    outputProduced: ['behavioral trend metrics'],
    gatingReason: 'Trend computation exists, but retained oversight production consumption is not complete.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Signal Continuity',
    filePath: 'lib/product/signal-continuity.ts',
    productLine: 'SHARED_INFRASTRUCTURE',
    layer: 'EVIDENCE',
    status: 'ACTIVE',
    usedBy: ['engine activation registry active surfaces'],
    outputDestination: ['signal continuity badge'],
    outputProduced: ['NEW, REPEATED, WORSENING, IMPROVING, or RESOLVED signal status'],
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Governed Memory Presenter',
    filePath: 'lib/product/governed-memory-presenter.ts',
    productLine: 'SHARED_INFRASTRUCTURE',
    layer: 'MEMORY',
    status: 'ACTIVE',
    usedBy: ['decision_centre', 'strategy_room', 'executive_reporting'],
    outputDestination: ['governed memory panel'],
    outputProduced: ['GovernedMemoryItem[]'],
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Financial Exposure Persistence',
    filePath: 'lib/product/financial-exposure-persistence.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'EVIDENCE',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'enterprise_assessment',
    outputProduced: ['financial exposure evidence records'],
    gatingReason: 'Persistence exists, but full governed memory/executive carry-forward path is not complete.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Decision Dependency Graph',
    filePath: 'lib/product/decision-dependency-graph.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'INTELLIGENCE',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'enterprise_assessment',
    outputProduced: ['decision dependency graph'],
    gatingReason: 'Graph capability exists but is not yet the activated DomainInterdependency engine path.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Checkpoint Service',
    filePath: 'lib/product/checkpoint-service.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'STRATEGY_ROOM',
    status: 'PARTIALLY_WIRED',
    corridorStage: 'strategy_room',
    outputDestination: ['checkpoint records when called'],
    outputProduced: ['checkpoint state'],
    gatingReason: 'Checkpoint logic exists, but complete governed execution owner-pressure loop is not proven here.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Cost-of-Inaction Clock',
    filePath: 'lib/product/cost-of-inaction-clock.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'SIMULATION',
    status: 'ACTIVE',
    outputDestination: ['Decision Centre cost-of-inaction display'],
    outputProduced: ['inaction clock and urgency reasons'],
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Counsel Room Resolver / Counsel workflow',
    filePath: 'lib/product/counsel-room-resolver.ts',
    productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
    layer: 'GOVERNANCE',
    status: 'PARTIALLY_WIRED',
    outputProduced: ['counsel room routing decision'],
    gatingReason: 'Workflow contracts and resolver exist, but counsel review persistence is not a paid corridor active capability.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Research Foundry adapters',
    filePath: 'app/admin/intelligence-foundry',
    productLine: 'RESEARCH_FOUNDRY',
    layer: 'RESEARCH',
    status: 'INTERNAL',
    outputDestination: ['admin foundry simulation and QA surfaces'],
    outputProduced: ['research simulation records'],
    recommendation: 'Do not treat Foundry adapters as production paid corridor capabilities without a production user path.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
  {
    capabilityId: 'Predictive scenario/time-series/trajectory engines',
    filePath: 'lib/intelligence/gmi-growth-scenario-model.ts',
    productLine: 'RESEARCH_FOUNDRY',
    layer: 'PREDICTIVE',
    status: 'GATED',
    dataRequired: ['validated source evidence', 'current time-series inputs', 'publication quality gates'],
    gatingReason: 'Predictive/research engines are not production corridor capabilities unless invoked by a production path and labelled with evidence class.',
    recommendation: 'Keep predictive engines out of paid corridor claims until production invocation and disclosure are proven.',
    lastVerifiedCommit: VERIFIED_COMMIT,
  },
]

export function getCapabilityRecord(capabilityId: string): CapabilityRecord | undefined {
  return CAPABILITY_STATUS_RECORDS.find(record => record.capabilityId === capabilityId)
}

export function getCapabilitiesByStatus(status: CapabilityStatus): CapabilityRecord[] {
  return CAPABILITY_STATUS_RECORDS.filter(record => record.status === status)
}

export function getCapabilitiesForCorridorStage(stage: PaidCorridorSurface): CapabilityRecord[] {
  return CAPABILITY_STATUS_RECORDS.filter(record => record.corridorStage === stage)
}

export function validateCapabilityStatusAuthority(): string[] {
  const errors: string[] = []

  for (const record of CAPABILITY_STATUS_RECORDS) {
    if (record.status === 'ACTIVE' && !record.outputDestination?.length && !record.outputProduced?.length) {
      errors.push(`${record.capabilityId}: ACTIVE capability must have outputDestination or state-changing outputProduced`)
    }
    if (record.status === 'GATED' && !record.gatingReason) {
      errors.push(`${record.capabilityId}: GATED capability must have gatingReason`)
    }
    if (record.productLine === 'RESEARCH_FOUNDRY' && record.corridorStage && record.status === 'ACTIVE') {
      errors.push(`${record.capabilityId}: Research Foundry capability must not be ACTIVE in paid corridor by default`)
    }
  }

  return errors
}
