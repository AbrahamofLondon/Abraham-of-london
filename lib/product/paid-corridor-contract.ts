/**
 * lib/product/paid-corridor-contract.ts
 *
 * Paid Corridor Authority Map — defines what each paid surface stage
 * captures, proves, unlocks, and must not claim.
 *
 * Rules:
 *   - No stage may promise output without matching capability.
 *   - No stage may duplicate another stage's core role.
 *   - Retainer requires durable recommendation/outcome memory.
 *   - Team cannot claim divergence without multi-respondent records.
 *   - Enterprise requires scenario/dependency/exposure evidence.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaidCorridorStage =
  | 'team_assessment'
  | 'enterprise_assessment'
  | 'executive_reporting'
  | 'boardroom_mode'
  | 'strategy_room'
  | 'retainer_oversight'

export type CorridorCapabilityStatus = 'AVAILABLE_NOW' | 'DORMANT' | 'GATED'

export type CorridorCapability = {
  name: string
  status: CorridorCapabilityStatus
  gatedReason?: string
}

export type PaidCorridorRecord = {
  stage: PaidCorridorStage
  corridorRole: string
  userPerceptionShift: string
  coreQuestionAnswered: string
  requiredEvidence: string[]
  capabilitiesAvailable: CorridorCapability[]
  capabilitiesDormant: CorridorCapability[]
  outputsAllowed: string[]
  outputsProhibited: string[]
  upgradeTrigger: string
  nonOverlapBoundary: string
  paymentJustification: string
  missingAssets: string[]
  nextWiringPriority: string
}

// ---------------------------------------------------------------------------
// Corridor Records
// ---------------------------------------------------------------------------

const TEAM_ASSESSMENT: PaidCorridorRecord = {
  stage: 'team_assessment',
  corridorRole: 'Detects perception divergence across team members on a single decision',
  userPerceptionShift: 'From "I think the team agrees" to "Here is exactly where the team diverges and why it matters"',
  coreQuestionAnswered: 'Does this team share a common understanding of the decision, its owner, its blocker, and its consequences?',
  requiredEvidence: [
    'Multi-respondent answers (minimum 2)',
    'Perceived decision per respondent',
    'Perceived owner per respondent',
    'Perceived blocker per respondent',
    'Authority clarity scale per respondent',
    'Evidence clarity scale per respondent',
    'Execution confidence scale per respondent',
  ],
  capabilitiesAvailable: [
    { name: 'Cross-respondent contradiction detection', status: 'AVAILABLE_NOW' },
    { name: 'Authority clarity measurement', status: 'AVAILABLE_NOW' },
    { name: 'Evidence confidence aggregation', status: 'AVAILABLE_NOW' },
    { name: 'Execution risk simulation', status: 'AVAILABLE_NOW' },
    { name: 'Governed memory presentation', status: 'AVAILABLE_NOW' },
  ],
  capabilitiesDormant: [
    { name: 'Contradiction forcing from answer patterns', status: 'GATED', gatedReason: 'ContradictionForcing engine not invoked in production' },
    { name: 'Similar case surfacing', status: 'GATED', gatedReason: 'Requires populated case store' },
    { name: 'Leadership avoidance detection from private signals', status: 'DORMANT', gatedReason: 'leadership_avoidance_signal field not yet captured' },
  ],
  outputsAllowed: [
    'Team divergence analysis',
    'Authority clarity score',
    'Evidence clarity score',
    'Execution confidence score',
    'Blocker divergence map',
    'Contradiction summary',
    'Next admissible move',
  ],
  outputsProhibited: [
    'Enterprise exposure analysis',
    'Domain interdependency map',
    'Board-grade recommendation',
    'Scenario stress test results',
    'Financial exposure quantification',
    'Cross-respondent insight from single respondent',
  ],
  upgradeTrigger: 'Team reveals structural or cross-domain issues beyond team-level perception',
  nonOverlapBoundary: 'Team detects perception divergence; Enterprise tests structural dependencies and exposure',
  paymentJustification: 'Multi-respondent intelligence that cannot be derived from a single diagnostic',
  missingAssets: ['ContradictionForcing wiring', 'SimilarCaseSurfacer wiring', 'leadership_avoidance_signal field'],
  nextWiringPriority: 'Wire ContradictionForcing to team respondent answer patterns',
}

const ENTERPRISE_ASSESSMENT: PaidCorridorRecord = {
  stage: 'enterprise_assessment',
  corridorRole: 'Tests organisational decision dependencies, scenarios, exposure, and board challenge readiness',
  userPerceptionShift: 'From "We have some issues" to "Here are the structural dependencies, exposure levels, and failure scenarios across your decision architecture"',
  coreQuestionAnswered: 'Where do your organisational decisions depend on each other, and what breaks under pressure?',
  requiredEvidence: [
    'Domain scores across key decision areas',
    'Dependency map between decisions',
    'Scenario stress responses (3 scenarios minimum)',
    'Financial exposure data',
    'Client/market exposure data',
    'Regulatory/compliance exposure data',
    'Board challenge readiness assessment',
  ],
  capabilitiesAvailable: [
    { name: 'Domain interdependency mapping', status: 'AVAILABLE_NOW' },
    { name: 'Decision simulation (30/60/90 day)', status: 'AVAILABLE_NOW' },
    { name: 'Cost of delay quantification', status: 'AVAILABLE_NOW' },
    { name: 'Constitutional assessment', status: 'AVAILABLE_NOW' },
    { name: 'Assessment engine (constitutional guidance)', status: 'AVAILABLE_NOW' },
    { name: 'Adversarial preview', status: 'AVAILABLE_NOW' },
    { name: 'Governed memory presentation', status: 'AVAILABLE_NOW' },
  ],
  capabilitiesDormant: [
    { name: 'Scenario stress test analysis', status: 'GATED', gatedReason: 'ScenarioStressTest engine not invoked by orchestrator' },
    { name: 'Escalation engine', status: 'GATED', gatedReason: 'Requires case memory store' },
    { name: 'Intervention engine', status: 'GATED', gatedReason: 'Requires drift tribunal findings' },
    { name: 'Breach detector', status: 'GATED', gatedReason: 'Requires contract store' },
    { name: 'Drift rules/tribunal', status: 'GATED', gatedReason: 'Requires case memory with prior recommendations' },
    { name: 'Assumption drift detector', status: 'GATED', gatedReason: 'Requires 100+ outcome records' },
    { name: 'Failure pattern calibrator', status: 'GATED', gatedReason: 'Requires 500+ outcome records' },
  ],
  outputsAllowed: [
    'Domain interdependency map',
    'Systemic lock detection',
    'Scenario stress results',
    'Degradation projection',
    'Intervention sequence',
    'Financial exposure summary',
    'Governance readiness assessment',
    'Next admissible move',
  ],
  outputsProhibited: [
    'Final board recommendation (Executive Reporting role)',
    'Governed execution management (Strategy Room role)',
    'Adversarial scrutiny session (Boardroom Mode role)',
    'Retained oversight (Retainer role)',
  ],
  upgradeTrigger: 'Enterprise reveals board-level exposure requiring executive-grade reporting or governed execution',
  nonOverlapBoundary: 'Enterprise tests structural dependencies; Executive Reporting converts to board-grade material',
  paymentJustification: 'Organisational-level intelligence across domains, scenarios, and exposure that cannot be derived from individual assessments',
  missingAssets: ['ScenarioStressTest invocation', 'EscalationEngine wiring', 'InterventionEngine wiring'],
  nextWiringPriority: 'Wire ScenarioStressTest engine to orchestrator for enterprise surface',
}

const EXECUTIVE_REPORTING: PaidCorridorRecord = {
  stage: 'executive_reporting',
  corridorRole: 'Converts accumulated intelligence into board-grade decision material with constitutional guidance',
  userPerceptionShift: 'From "We have analysis" to "Here is a board-ready brief with constitutional guidance, governed memory, and degradation projections"',
  coreQuestionAnswered: 'What should the board know, what evidence supports it, and what is the governed recommendation?',
  requiredEvidence: [
    'Prior case state from diagnostic/assessment stages',
    'Constitutional assessment output',
    'Governed memory items',
    'Evidence tier at multi_source or above',
    'Degradation projections',
  ],
  capabilitiesAvailable: [
    { name: 'Constitutional guidance assembly', status: 'AVAILABLE_NOW' },
    { name: 'Decision simulation projections', status: 'AVAILABLE_NOW' },
    { name: 'Governed memory presentation', status: 'AVAILABLE_NOW' },
    { name: 'Domain interdependency analysis', status: 'AVAILABLE_NOW' },
    { name: 'Adversarial preview', status: 'AVAILABLE_NOW' },
    { name: 'Cost of delay quantification', status: 'AVAILABLE_NOW' },
  ],
  capabilitiesDormant: [
    { name: 'Escalation engine', status: 'GATED', gatedReason: 'Requires case memory store' },
    { name: 'Drift rules', status: 'GATED', gatedReason: 'Requires prior recommendation history' },
    { name: 'Failure pattern calibrator', status: 'GATED', gatedReason: 'Requires outcome history' },
  ],
  outputsAllowed: [
    'Executive summary brief',
    'Constitutional guidance with matched assets',
    'Governed memory panel',
    'Degradation projection',
    'Evidence carry-forward',
    'Next admissible move',
  ],
  outputsProhibited: [
    'Enterprise stress-test execution (Enterprise role)',
    'Governed execution checkpoints (Strategy Room role)',
    'Adversarial scrutiny session (Boardroom Mode role)',
    'Retained oversight cycles (Retainer role)',
  ],
  upgradeTrigger: 'Board brief reveals execution gaps requiring governed intervention or adversarial scrutiny',
  nonOverlapBoundary: 'Executive Reporting produces board material; Boardroom Mode tests it under adversarial pressure',
  paymentJustification: 'Board-grade intelligence synthesis that requires multi-stage evidence accumulation',
  missingAssets: ['Evidence carry-forward presenter wiring', 'Executive-specific PDF dossier generation'],
  nextWiringPriority: 'Wire evidence carry-forward into executive report output',
}

const BOARDROOM_MODE: PaidCorridorRecord = {
  stage: 'boardroom_mode',
  corridorRole: 'Adversarial scrutiny of decision quality — objections, trade-offs, decision paths under pressure',
  userPerceptionShift: 'From "We have a recommendation" to "We have tested this recommendation against the hardest objections and it holds/fails"',
  coreQuestionAnswered: 'If challenged by the most hostile stakeholder, does this recommendation survive?',
  requiredEvidence: [
    'Executive report or equivalent board-grade brief',
    'Constitutional assessment with route',
    'Adversarial challenge vectors',
    'Evidence tier at multi_source or above',
    'Governed memory with contradiction history',
  ],
  capabilitiesAvailable: [
    { name: 'Adversarial preview and challenge', status: 'AVAILABLE_NOW' },
    { name: 'Constitutional route assessment', status: 'AVAILABLE_NOW' },
    { name: 'Contradiction resolution', status: 'AVAILABLE_NOW' },
    { name: 'Decision simulation under pressure', status: 'AVAILABLE_NOW' },
    { name: 'Governed memory presentation', status: 'AVAILABLE_NOW' },
  ],
  capabilitiesDormant: [
    { name: 'Boardroom archive history', status: 'DORMANT', gatedReason: 'boardroom-archive-contract exists but archive persistence not wired' },
    { name: 'Boardroom dossier generation', status: 'DORMANT', gatedReason: 'boardroom-dossier-types exists but generation pipeline not wired' },
  ],
  outputsAllowed: [
    'Adversarial objection analysis',
    'Trade-off map',
    'Decision path comparison',
    'Recommendation stress test',
    'Governed memory with challenge history',
  ],
  outputsProhibited: [
    'Governed execution management (Strategy Room role)',
    'Checkpoint-based follow-up (Strategy Room role)',
    'Retained oversight cycles (Retainer role)',
    'Enterprise structural analysis (Enterprise role)',
  ],
  upgradeTrigger: 'Boardroom scrutiny reveals execution gaps requiring governed intervention with checkpoints',
  nonOverlapBoundary: 'Boardroom Mode tests recommendations; Strategy Room manages their execution',
  paymentJustification: 'Adversarial quality assurance that cannot be safely self-administered',
  missingAssets: ['Boardroom archive wiring', 'Boardroom dossier pipeline', 'Challenge history persistence'],
  nextWiringPriority: 'Wire boardroom archive to persistent case memory',
}

const STRATEGY_ROOM: PaidCorridorRecord = {
  stage: 'strategy_room',
  corridorRole: 'Governed decision execution — intervention stacks, checkpoints, owner pressure, outcome accountability',
  userPerceptionShift: 'From "We know what to do" to "We are executing under governed conditions with checkpoints, accountability, and course correction"',
  coreQuestionAnswered: 'Is this decision being executed with structural accountability, and what happens if it drifts?',
  requiredEvidence: [
    'Prior case state with constitutional assessment',
    'Recommendation outcome ledger entries',
    'Evidence tier at multi_source or above',
    'Governed memory items',
    'Intervention stack',
    'Constraint map',
  ],
  capabilitiesAvailable: [
    { name: 'Full engine suite (all ACTIVE engines)', status: 'AVAILABLE_NOW' },
    { name: 'Constitutional guidance assembly', status: 'AVAILABLE_NOW' },
    { name: 'Decision simulation projections', status: 'AVAILABLE_NOW' },
    { name: 'Governed memory presentation', status: 'AVAILABLE_NOW' },
    { name: 'Recommendation outcome tracking', status: 'AVAILABLE_NOW' },
  ],
  capabilitiesDormant: [
    { name: 'Escalation engine', status: 'GATED', gatedReason: 'Requires case memory store' },
    { name: 'Intervention engine', status: 'GATED', gatedReason: 'Requires drift tribunal findings' },
    { name: 'Drift rules/tribunal', status: 'GATED', gatedReason: 'Requires case memory with prior recommendations' },
    { name: 'Route correction', status: 'GATED', gatedReason: 'Requires multi-turn evidence accumulation' },
    { name: 'Assumption drift detector', status: 'GATED', gatedReason: 'Requires 100+ outcome records' },
    { name: 'Failure pattern calibrator', status: 'GATED', gatedReason: 'Requires 500+ outcome records' },
  ],
  outputsAllowed: [
    'Intervention stack',
    'Constraint map',
    'Governed memory panel',
    'Recommendation status tracking',
    'Outcome tracking',
    'Next admissible move',
    'Living layer progress',
  ],
  outputsProhibited: [
    'Retained oversight without memory threshold (Retainer role)',
    'Enterprise structural analysis (Enterprise role)',
    'Board-grade material generation (Executive Reporting role)',
  ],
  upgradeTrigger: 'Strategy Room execution generates enough outcome history to justify retained oversight',
  nonOverlapBoundary: 'Strategy Room manages execution; Retainer Oversight monitors patterns across executions',
  paymentJustification: 'Governed execution management with structural accountability that prevents informal drift',
  missingAssets: ['EscalationEngine wiring', 'InterventionEngine wiring', 'DriftRules/Tribunal wiring', 'RouteCorrection wiring'],
  nextWiringPriority: 'Wire EscalationEngine once case memory persistence is production-ready',
}

const RETAINER_OVERSIGHT: PaidCorridorRecord = {
  stage: 'retainer_oversight',
  corridorRole: 'Institutional intelligence — recurrence detection, drift monitoring, outcome learning, oversight cadence',
  userPerceptionShift: 'From "We handled that decision" to "We now have institutional memory that prevents the same failure pattern from recurring"',
  coreQuestionAnswered: 'Is this organisation learning from its decisions, or is it repeating the same structural failures?',
  requiredEvidence: [
    'Durable recommendation outcome ledger with OUTCOME_REPORTED entries',
    'Multiple resolved cases with outcome verification',
    'Governed memory spanning multiple decision cycles',
    'Behavioral trend data across time',
    'Pattern recurrence evidence',
  ],
  capabilitiesAvailable: [
    { name: 'Signal continuity tracking', status: 'AVAILABLE_NOW' },
    { name: 'Governed memory presentation', status: 'AVAILABLE_NOW' },
    { name: 'Pattern recurrence detection', status: 'AVAILABLE_NOW' },
    { name: 'Cost of inaction quantification', status: 'AVAILABLE_NOW' },
  ],
  capabilitiesDormant: [
    { name: 'Assumption drift detector', status: 'GATED', gatedReason: 'Requires 100+ outcome records' },
    { name: 'Failure pattern calibrator', status: 'GATED', gatedReason: 'Requires 500+ outcome records' },
    { name: 'Drift rules/tribunal', status: 'GATED', gatedReason: 'Requires case memory with prior recommendations' },
    { name: 'Breach detector', status: 'GATED', gatedReason: 'Requires contract store' },
    { name: 'Oversight cadence engine', status: 'DORMANT', gatedReason: 'oversight-cadence-engine.ts exists but 0 imports' },
    { name: 'Oversight cycle comparison', status: 'DORMANT', gatedReason: 'oversight-cycle-comparison.ts exists but 0 imports' },
    { name: 'Oversight review decision engine', status: 'DORMANT', gatedReason: 'oversight-review-decision-engine.ts exists but 0 imports' },
    { name: 'Behavioral trend engine', status: 'DORMANT', gatedReason: 'behavioral-trend-engine.ts partially wired (1 import)' },
  ],
  outputsAllowed: [
    'Institutional pattern report',
    'Recurrence detection',
    'Drift monitoring',
    'Outcome learning summary',
    'Oversight cadence recommendations',
    'Cross-cycle comparison',
    'Behavioral trend analysis',
  ],
  outputsProhibited: [
    'New diagnostic analysis (Diagnostic surface role)',
    'New team/enterprise assessment (Assessment surface role)',
    'Execution management (Strategy Room role)',
    'Board-grade material generation (Executive Reporting role)',
  ],
  upgradeTrigger: 'N/A — Retainer is the terminal corridor stage',
  nonOverlapBoundary: 'Retainer monitors patterns across executions; Strategy Room manages individual executions',
  paymentJustification: 'Institutional intelligence that compounds over time — requires durable memory, outcome verification, and pattern learning that cannot exist without persistent data',
  missingAssets: [
    'Oversight cadence engine wiring',
    'Oversight cycle comparison wiring',
    'Oversight review decision engine wiring',
    'Behavioral trend engine full wiring',
    'AssumptionDriftDetector production activation (requires 100+ cases)',
    'FailurePatternCalibrator production activation (requires 500+ cases)',
    'DriftRules/Tribunal wiring',
    'BreachDetector wiring',
  ],
  nextWiringPriority: 'Wire oversight cadence engine and cycle comparison for first retained oversight delivery',
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PAID_CORRIDOR_RECORDS: PaidCorridorRecord[] = [
  TEAM_ASSESSMENT,
  ENTERPRISE_ASSESSMENT,
  EXECUTIVE_REPORTING,
  BOARDROOM_MODE,
  STRATEGY_ROOM,
  RETAINER_OVERSIGHT,
]

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export function getCorridorRecord(stage: PaidCorridorStage): PaidCorridorRecord | undefined {
  return PAID_CORRIDOR_RECORDS.find(r => r.stage === stage)
}

export function getCorridorCapabilities(stage: PaidCorridorStage): CorridorCapability[] {
  const record = getCorridorRecord(stage)
  if (!record) return []
  return [...record.capabilitiesAvailable, ...record.capabilitiesDormant]
}

export function getCorridorMissingAssets(stage: PaidCorridorStage): string[] {
  return getCorridorRecord(stage)?.missingAssets ?? []
}

export function getAllMissingAssets(): Array<{ stage: PaidCorridorStage; asset: string }> {
  const missing: Array<{ stage: PaidCorridorStage; asset: string }> = []
  for (const record of PAID_CORRIDOR_RECORDS) {
    for (const asset of record.missingAssets) {
      missing.push({ stage: record.stage, asset })
    }
  }
  return missing
}

export function getNextWiringPriorities(): Array<{ stage: PaidCorridorStage; priority: string }> {
  return PAID_CORRIDOR_RECORDS.map(r => ({ stage: r.stage, priority: r.nextWiringPriority }))
}
