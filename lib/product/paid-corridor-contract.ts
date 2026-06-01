/**
 * Paid Corridor Authority Map.
 *
 * The paid corridor contains only Operational Decision Intelligence stages.
 * Purpose Alignment is a separate product line: it may contribute optional,
 * auditable behavioural evidence, but it is not a prerequisite, not a corridor
 * stage, and not a corporate diagnosis.
 */

export type PaidCorridorStage =
  | 'team_assessment'
  | 'enterprise_assessment'
  | 'executive_reporting'
  | 'boardroom_mode'
  | 'strategy_room'
  | 'retainer_oversight'

export type CorridorCapabilityStatus = 'ACTIVE' | 'PARTIALLY_WIRED' | 'GATED' | 'DORMANT'

export type CorridorCapability = {
  name: string
  status: CorridorCapabilityStatus
  gatedReason?: string
}

export type ReadinessStatus = 'ACTIVE' | 'PARTIALLY_WIRED' | 'GATED' | 'DORMANT'
export type OverclaimRisk = 'LOW' | 'MEDIUM' | 'HIGH'

export type PaidCorridorRecord = {
  stage: PaidCorridorStage
  corridorRole: string
  userPerceptionShift: string
  coreQuestionAnswered: string
  minimumEvidenceRequired: string[]
  engineRequirements: string[]
  activeCapabilities: CorridorCapability[]
  gatedCapabilities: CorridorCapability[]
  dormantRelevantCapabilities: CorridorCapability[]
  primaryOutput: string
  mustShow: string[]
  mustNotShow: string[]
  unlocksNext: PaidCorridorStage[]
  paymentJustification: string
  nonOverlapBoundary: string
  upgradeTrigger: string
  firstImpressionMoment: string
  currentReadiness: ReadinessStatus
  riskOfOverclaiming: OverclaimRisk
  nextWiringAction: string
}

const TEAM_ASSESSMENT: PaidCorridorRecord = {
  stage: 'team_assessment',
  corridorRole: 'Decision perception divergence across multiple respondents on one decision.',
  userPerceptionShift: 'From "I think the team agrees" to "Here is where respondents diverge on decision, owner, blocker, evidence, and execution confidence."',
  coreQuestionAnswered: 'Does this team share a common understanding of the decision, its owner, its blocker, and its consequences?',
  minimumEvidenceRequired: [
    'Multi-respondent records, minimum 2 respondents',
    'Perceived decision per respondent',
    'Perceived owner per respondent',
    'Perceived blocker per respondent',
    'Authority clarity scale per respondent',
    'Evidence clarity scale per respondent',
    'Execution confidence scale per respondent',
  ],
  engineRequirements: [
    'team respondent aggregation helper',
    'cross-respondent contradiction summary',
    'authority/evidence/execution scales',
  ],
  activeCapabilities: [
    { name: 'Authority clarity measurement', status: 'ACTIVE' },
    { name: 'Evidence confidence aggregation', status: 'ACTIVE' },
    { name: 'Execution confidence aggregation', status: 'ACTIVE' },
    { name: 'Team respondent aggregation', status: 'ACTIVE' },
  ],
  gatedCapabilities: [
    { name: 'ContradictionForcing from respondent answer patterns', status: 'GATED', gatedReason: 'Engine exists but is not invoked by a production path.' },
    { name: 'Similar case surfacing', status: 'GATED', gatedReason: 'Requires populated resolved case store.' },
  ],
  dormantRelevantCapabilities: [],
  primaryOutput: 'Team divergence report with authority, evidence, blocker, and execution confidence deltas.',
  mustShow: [
    'Respondent count and aggregation basis',
    'Divergence boundaries',
    'Authority/evidence/execution confidence differences',
    'Next admissible move',
  ],
  mustNotShow: [
    'Enterprise exposure analysis',
    'Domain interdependency map',
    'Board-grade recommendation',
    'Scenario stress test results',
    'Cross-respondent divergence from a single respondent',
  ],
  unlocksNext: ['enterprise_assessment'],
  paymentJustification: 'Multi-respondent intelligence that cannot be derived from an individual diagnostic or Purpose Alignment.',
  nonOverlapBoundary: 'Team measures perception divergence; Enterprise analyses organisational stress architecture.',
  upgradeTrigger: 'Divergence reveals structural dependencies, exposure, or board challenge readiness beyond team perception.',
  firstImpressionMoment: 'The buyer sees named divergence across respondents that was invisible in ordinary meetings.',
  currentReadiness: 'ACTIVE',
  riskOfOverclaiming: 'LOW',
  nextWiringAction: 'Keep expanding shared-reference invite mechanics while preserving aggregate-only output.',
}

const ENTERPRISE_ASSESSMENT: PaidCorridorRecord = {
  stage: 'enterprise_assessment',
  corridorRole: 'Organisational stress architecture across dependency, scenario, exposure, and board challenge readiness.',
  userPerceptionShift: 'From "We have decision problems" to "Here is what breaks across the organisation under dependency, exposure, and challenge pressure."',
  coreQuestionAnswered: 'Where do organisational decisions depend on each other, and what breaks under pressure?',
  minimumEvidenceRequired: [
    'Domain scores across key decision areas',
    'Dependency map between functions, people, systems, or external parties',
    'Scenario stress responses using valid enterprise scenario bank IDs',
    'Financial exposure evidence',
    'Client or market exposure evidence',
    'Regulatory or compliance exposure evidence',
    'Board challenge readiness evidence',
  ],
  engineRequirements: [
    'scenario-stress-test for valid scenario responses',
    'decision-simulation-engine for degradation projection',
    'domain-interdependency remains gated until contradictionGraph is produced',
  ],
  activeCapabilities: [
    { name: 'Scenario stress analysis from enterprise orchestrator', status: 'ACTIVE' },
    { name: 'Decision simulation projections', status: 'ACTIVE' },
    { name: 'Cost of delay quantification', status: 'ACTIVE' },
    { name: 'Constitutional assessment', status: 'ACTIVE' },
    { name: 'Adversarial preview', status: 'ACTIVE' },
    { name: 'Enterprise dependency and exposure result surface', status: 'ACTIVE' },
  ],
  gatedCapabilities: [
    { name: 'DomainInterdependency', status: 'GATED', gatedReason: 'Requires contradictionGraph plus domainScores; domainScores exist but contradictionGraph is not produced.' },
    { name: 'Escalation engine', status: 'GATED', gatedReason: 'Requires case memory store.' },
    { name: 'Intervention engine', status: 'GATED', gatedReason: 'Requires drift tribunal findings.' },
    { name: 'Breach detector', status: 'GATED', gatedReason: 'Requires contract store.' },
  ],
  dormantRelevantCapabilities: [],
  primaryOutput: 'Enterprise stress architecture report with dependency, scenario, exposure, and board challenge readiness.',
  mustShow: [
    'Dependency basis',
    'Scenario stress summary when valid scenario responses exist',
    'Financial/client/regulatory exposure evidence',
    'Board challenge readiness',
    'Gated domain-interdependency boundary',
  ],
  mustNotShow: [
    'Final board recommendation',
    'Governed execution management',
    'Adversarial boardroom session',
    'Retained oversight',
  ],
  unlocksNext: ['executive_reporting', 'strategy_room'],
  paymentJustification: 'Wider and deeper organisational evidence than Team or Constitutional: dependencies, scenarios, exposure, and board readiness across the decision architecture.',
  nonOverlapBoundary: 'Enterprise tests stress architecture; Executive Reporting converts evidence into board-grade judgement.',
  upgradeTrigger: 'Enterprise evidence reveals board-level exposure requiring a judged executive brief or governed execution.',
  firstImpressionMoment: 'The buyer sees a stress map that connects dependencies, scenarios, exposure, and board challenge risk.',
  currentReadiness: 'ACTIVE',
  riskOfOverclaiming: 'LOW',
  nextWiringAction: 'Produce contradictionGraph before activating DomainInterdependency.',
}

const EXECUTIVE_REPORTING: PaidCorridorRecord = {
  stage: 'executive_reporting',
  corridorRole: 'Board-grade decision judgement from accumulated evidence carry-forward.',
  userPerceptionShift: 'From "We have analysis" to "Here is the board-grade judgement, evidence basis, and governed recommendation."',
  coreQuestionAnswered: 'What should senior decision makers know, what evidence supports it, and what judgement follows?',
  minimumEvidenceRequired: [
    'Prior case state from diagnostic or paid surfaces',
    'Evidence carry-forward from earlier surfaces',
    'Constitutional assessment or authority evidence',
    'Governed memory items',
    'Evidence lineage and confidence basis',
  ],
  engineRequirements: [
    'governed-memory-presenter',
    'executive-reporting public DTO',
    'evidence carry-forward presenter',
  ],
  activeCapabilities: [
    { name: 'Governed memory presentation', status: 'ACTIVE' },
    { name: 'Constitutional guidance assembly', status: 'ACTIVE' },
    { name: 'Executive Reporting Public DTO', status: 'ACTIVE' },
    { name: 'Evidence Carry-Forward Presenter', status: 'ACTIVE' },
  ],
  gatedCapabilities: [
    { name: 'Escalation engine', status: 'GATED', gatedReason: 'Requires case memory store.' },
    { name: 'Drift rules', status: 'GATED', gatedReason: 'Requires prior recommendation history.' },
  ],
  dormantRelevantCapabilities: [],
  primaryOutput: 'Board-grade executive report with judgement, evidence lineage, and recommended decision posture.',
  mustShow: [
    'Evidence carry-forward basis',
    'Board-grade judgement',
    'Constitutional or authority basis',
    'What is known, missing, and gated',
  ],
  mustNotShow: [
    'Enterprise stress-test execution as the core product',
    'Governed execution checkpoints',
    'Adversarial boardroom session',
    'Retained oversight cycles',
  ],
  unlocksNext: ['boardroom_mode', 'strategy_room'],
  paymentJustification: 'Board-grade synthesis and judgement that requires accumulated evidence rather than a single assessment output.',
  nonOverlapBoundary: 'Executive Reporting judges and packages evidence; Enterprise stress-tests structure and Strategy Room manages execution.',
  upgradeTrigger: 'The report exposes objections or execution risk requiring boardroom scrutiny or governed execution.',
  firstImpressionMoment: 'The buyer sees a defensible judgement with traceable evidence carry-forward.',
  currentReadiness: 'ACTIVE',
  riskOfOverclaiming: 'LOW',
  nextWiringAction: 'Extend durable recommendation/outcome history inputs without duplicating Enterprise stress-test UI.',
}

const BOARDROOM_MODE: PaidCorridorRecord = {
  stage: 'boardroom_mode',
  corridorRole: 'Adversarial board scrutiny of recommendation quality, objections, trade-offs, and decision paths.',
  userPerceptionShift: 'From "We have a recommendation" to "This recommendation has survived or failed the hardest board challenge."',
  coreQuestionAnswered: 'If challenged by the most hostile stakeholder, does this recommendation survive?',
  minimumEvidenceRequired: [
    'Executive report or equivalent board-grade brief',
    'Evidence tier at multi_source or better',
    'Adversarial challenge vectors',
    'Contradiction or objection history',
  ],
  engineRequirements: [
    'adversarial-preview',
    'constitutional route assessment',
    'boardroom archive for durable history',
  ],
  activeCapabilities: [
    { name: 'Adversarial preview and challenge', status: 'ACTIVE' },
    { name: 'Constitutional route assessment', status: 'ACTIVE' },
    { name: 'Boardroom dossier generation', status: 'ACTIVE' },
    { name: 'Boardroom archive', status: 'ACTIVE' },
  ],
  gatedCapabilities: [
    { name: 'Boardroom dossier export pipeline', status: 'GATED', gatedReason: 'PDF export route exists but full boardroom session/archive loop is not proven as a single production path.' },
  ],
  dormantRelevantCapabilities: [],
  primaryOutput: 'Adversarial board challenge record with objections, trade-offs, and recommendation resilience.',
  mustShow: [
    'Challenge basis',
    'Recommendation stress result',
    'Trade-off map',
    'Archive boundary',
  ],
  mustNotShow: [
    'Governed execution management',
    'Checkpoint-based follow-up',
    'Retained oversight',
    'Enterprise structural analysis as the primary output',
  ],
  unlocksNext: ['strategy_room'],
  paymentJustification: 'Adversarial board scrutiny that cannot be safely self-administered by the same team producing the recommendation.',
  nonOverlapBoundary: 'Boardroom Mode tests recommendation quality; Strategy Room manages execution after a decision is made.',
  upgradeTrigger: 'Boardroom scrutiny reveals execution risk requiring governed checkpoints and owner pressure.',
  firstImpressionMoment: 'The buyer sees objections surfaced before hostile stakeholders surface them.',
  currentReadiness: 'ACTIVE',
  riskOfOverclaiming: 'LOW',
  nextWiringAction: 'Connect boardroom archive persistence to production boardroom sessions for longitudinal scrutiny history.',
}

const STRATEGY_ROOM: PaidCorridorRecord = {
  stage: 'strategy_room',
  corridorRole: 'Governed execution with checkpoint, intervention, owner pressure, and outcome verification logic.',
  userPerceptionShift: 'From "We know what to do" to "Execution is governed with owners, checkpoints, intervention pressure, and consequences for drift."',
  coreQuestionAnswered: 'Is this decision being executed with structural accountability, and what happens if it drifts?',
  minimumEvidenceRequired: [
    'Prior case state',
    'Named owner and accountable authority',
    'Recommendation or decision to execute',
    'Checkpoint basis',
    'Intervention or constraint map',
    'Outcome verification path',
  ],
  engineRequirements: [
    'recommendation outcome ledger',
    'checkpoint service',
    'governed memory presenter',
    'intervention engines remain gated until drift/case memory exists',
  ],
  activeCapabilities: [
    { name: 'Strategy Room admission gate', status: 'ACTIVE' },
    { name: 'Canonical snapshot builder', status: 'ACTIVE' },
    { name: 'Execution record persistence', status: 'ACTIVE' },
    { name: 'Execution feedback loop', status: 'ACTIVE' },
    { name: 'Execution Flow UI component', status: 'ACTIVE' },
    { name: 'Recommendation outcome tracking', status: 'PARTIALLY_WIRED' },
    { name: 'Checkpoint service', status: 'PARTIALLY_WIRED' },
    { name: 'Governed memory presentation', status: 'ACTIVE' },
    { name: 'Decision Centre living adapter', status: 'ACTIVE' },
  ],
  gatedCapabilities: [
    { name: 'Escalation engine', status: 'GATED', gatedReason: 'Requires case memory persistence.' },
    { name: 'Intervention engine', status: 'GATED', gatedReason: 'Requires drift tribunal findings.' },
    { name: 'Drift rules/tribunal', status: 'GATED', gatedReason: 'Requires prior recommendations and outcome history.' },
    { name: 'Route correction', status: 'GATED', gatedReason: 'Requires multi-turn evidence accumulation.' },
  ],
  dormantRelevantCapabilities: [],
  primaryOutput: 'Governed execution record with checkpoints, owner pressure, intervention posture, and outcome verification.',
  mustShow: [
    'Owner and authority pressure',
    'Checkpoint/intervention logic',
    'Recommendation status',
    'Outcome verification path',
    'Memory threshold before retainer claims',
  ],
  mustNotShow: [
    'Retained oversight without durable memory threshold',
    'Enterprise stress architecture as the primary product',
    'Board-grade material generation as the primary product',
  ],
  unlocksNext: ['retainer_oversight'],
  paymentJustification: 'Execution governance and owner-pressure logic that prevents a recommendation from decaying into informal drift.',
  nonOverlapBoundary: 'Strategy Room governs an execution; Retainer Oversight learns across multiple cycles.',
  upgradeTrigger: 'Execution produces enough durable recommendation/outcome memory, recurrence, drift, and cadence evidence to justify retained oversight.',
  firstImpressionMoment: 'The buyer sees exactly who owns the next checkpoint and what intervention follows drift.',
  currentReadiness: 'ACTIVE',
  riskOfOverclaiming: 'LOW',
  nextWiringAction: 'Feed durable execution memory into retained oversight when recurrence and cadence evidence accumulates.',
}

const RETAINER_OVERSIGHT: PaidCorridorRecord = {
  stage: 'retainer_oversight',
  corridorRole: 'Institutional learning across cycles: recommendation/outcome memory, recurrence, drift, and oversight cadence.',
  userPerceptionShift: 'From "We handled that decision" to "The organisation now learns across cycles and detects recurring failure patterns."',
  coreQuestionAnswered: 'Is the organisation learning from decisions, or repeating the same structural failures across cycles?',
  minimumEvidenceRequired: [
    'Durable recommendation memory',
    'Durable outcome memory',
    'Multiple oversight or execution cycles',
    'Recurrence evidence',
    'Drift evidence',
    'Oversight cadence',
  ],
  engineRequirements: [
    'retainer-cycle-memory-engine',
    'oversight cadence engine',
    'oversight cycle comparison',
    'oversight review decision engine',
    'behavioral trend engine',
  ],
  activeCapabilities: [
    { name: 'Retainer Cycle Memory Engine with supplied data', status: 'PARTIALLY_WIRED' },
    { name: 'Oversight Brief Composer', status: 'PARTIALLY_WIRED' },
    { name: 'Signal continuity tracking', status: 'ACTIVE' },
    { name: 'Governed memory presentation', status: 'ACTIVE' },
  ],
  gatedCapabilities: [
    { name: 'Oversight Cadence Engine', status: 'GATED', gatedReason: 'Requires retained oversight account memory and recurring cycle data.' },
    { name: 'Oversight Cycle Comparison', status: 'GATED', gatedReason: 'Requires two or more completed oversight cycles.' },
    { name: 'Oversight Review Decision Engine', status: 'GATED', gatedReason: 'Requires durable recommendation/outcome memory.' },
    { name: 'Behavioral Trend Engine in retained oversight', status: 'GATED', gatedReason: 'Trend computation exists but retained oversight production consumption is incomplete.' },
    { name: 'Assumption drift detector', status: 'GATED', gatedReason: 'Requires outcome records.' },
    { name: 'Failure pattern calibrator', status: 'GATED', gatedReason: 'Requires historical outcome records.' },
  ],
  dormantRelevantCapabilities: [],
  primaryOutput: 'Retained oversight brief and institutional learning record across cycles.',
  mustShow: [
    'Recommendation memory',
    'Outcome memory',
    'Recurrence and drift evidence',
    'Oversight cadence basis',
    'Cycle comparison boundary',
  ],
  mustNotShow: [
    'New diagnostic analysis',
    'New team or enterprise assessment',
    'Single-execution Strategy Room management',
    'Board-grade material generation as the primary product',
  ],
  unlocksNext: [],
  paymentJustification: 'Institutional intelligence that compounds only with durable recommendation/outcome memory, recurrence detection, drift monitoring, and oversight cadence.',
  nonOverlapBoundary: 'Retainer Oversight learns across cycles; Strategy Room governs one execution cycle.',
  upgradeTrigger: 'N/A: terminal paid corridor stage.',
  firstImpressionMoment: 'The buyer sees recurring decision patterns and drift across cycles, not a one-off report.',
  currentReadiness: 'GATED',
  riskOfOverclaiming: 'HIGH',
  nextWiringAction: 'Connect durable recommendation/outcome/recurrence cadence before describing retainer oversight as active.',
}

export const PAID_CORRIDOR_RECORDS: PaidCorridorRecord[] = [
  TEAM_ASSESSMENT,
  ENTERPRISE_ASSESSMENT,
  EXECUTIVE_REPORTING,
  BOARDROOM_MODE,
  STRATEGY_ROOM,
  RETAINER_OVERSIGHT,
]

export function getCorridorRecord(stage: PaidCorridorStage): PaidCorridorRecord | undefined {
  return PAID_CORRIDOR_RECORDS.find(record => record.stage === stage)
}

export function getCorridorCapabilities(stage: PaidCorridorStage): CorridorCapability[] {
  const record = getCorridorRecord(stage)
  if (!record) return []
  return [
    ...record.activeCapabilities,
    ...record.gatedCapabilities,
    ...record.dormantRelevantCapabilities,
  ]
}

export function getCorridorMissingAssets(stage: PaidCorridorStage): string[] {
  const record = getCorridorRecord(stage)
  if (!record) return []
  return [...record.gatedCapabilities, ...record.dormantRelevantCapabilities].map(capability => capability.name)
}

export function getAllMissingAssets(): Array<{ stage: PaidCorridorStage; asset: string }> {
  return PAID_CORRIDOR_RECORDS.flatMap(record =>
    getCorridorMissingAssets(record.stage).map(asset => ({ stage: record.stage, asset })),
  )
}

export function getNextWiringPriorities(): Array<{ stage: PaidCorridorStage; priority: string }> {
  return PAID_CORRIDOR_RECORDS.map(record => ({
    stage: record.stage,
    priority: record.nextWiringAction,
  }))
}
