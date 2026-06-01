/**
 * Canonical product-line authority.
 *
 * Purpose Alignment is a separate personal enforcement product line. It is not
 * a stage of Operational Decision Intelligence and ODI completion never depends
 * on Purpose Alignment completion.
 */

import type { ProductSurface } from '@/lib/intelligence/engine-activation-registry'

export type ProductLine =
  | 'PURPOSE_ALIGNMENT'
  | 'OPERATIONAL_DECISION_INTELLIGENCE'
  | 'SHARED_INFRASTRUCTURE'
  | 'RESEARCH_FOUNDRY'
  | 'COMMERCIAL_GROWTH'
  | 'LEGACY_UNKNOWN'

export type ProductLineRole =
  | 'PERSONAL_PATTERN_ENFORCEMENT'
  | 'CORPORATE_DECISION_ENFORCEMENT'
  | 'SHARED_EVIDENCE_INFRASTRUCTURE'
  | 'RESEARCH_VALIDATION'
  | 'COMMERCIAL_CONVERSION'
  | 'UNKNOWN_OR_LEGACY'

export type EvidenceType =
  | 'personal_pattern'
  | 'behavioural_contract'
  | 'contract_breach'
  | 'avoided_decision'
  | 'dissenter_signal'
  | 'case_decision'
  | 'stakeholder'
  | 'outcome'
  | 'recurrence'
  | 'provenance'
  | 'scenario_stress'
  | 'authority_structure'
  | 'evidence_lineage'
  | 'behavioural_signal'
  | 'oversight_cycle'

export type ProductLineContributionBridge = 'purpose_to_operational_decision'

export type ProductLineContribution = {
  source: ProductLine
  target: ProductLine
  evidenceType: EvidenceType
  confidence: number
  summary: string
  createdAt: string | Date
  bridge?: ProductLineContributionBridge
}

export type ProductLineIdentity = {
  productLine: ProductLine
  role: ProductLineRole
  label: string
  description: string
  dependsOn?: ProductLine[]
  mayContributeTo?: ProductLine[]
  isPaidCorridorStage: boolean
}

export const PURPOSE_ALIGNMENT_IDENTITY: ProductLineIdentity = {
  productLine: 'PURPOSE_ALIGNMENT',
  role: 'PERSONAL_PATTERN_ENFORCEMENT',
  label: 'Purpose Alignment',
  description:
    'Personal behavioural enforcement: avoided decisions, tolerated dysfunction, pattern-breaker contracts, and commitment verification.',
  dependsOn: [],
  mayContributeTo: ['OPERATIONAL_DECISION_INTELLIGENCE'],
  isPaidCorridorStage: false,
}

export const OPERATIONAL_DECISION_INTELLIGENCE_IDENTITY: ProductLineIdentity = {
  productLine: 'OPERATIONAL_DECISION_INTELLIGENCE',
  role: 'CORPORATE_DECISION_ENFORCEMENT',
  label: 'Operational Decision Intelligence',
  description:
    'Corporate decision enforcement across team divergence, enterprise stress, board-grade judgement, execution governance, and retained oversight.',
  dependsOn: [],
  mayContributeTo: ['SHARED_INFRASTRUCTURE'],
  isPaidCorridorStage: true,
}

export const PRODUCT_LINE_IDENTITIES: Record<ProductLine, ProductLineIdentity> = {
  PURPOSE_ALIGNMENT: PURPOSE_ALIGNMENT_IDENTITY,
  OPERATIONAL_DECISION_INTELLIGENCE: OPERATIONAL_DECISION_INTELLIGENCE_IDENTITY,
  SHARED_INFRASTRUCTURE: {
    productLine: 'SHARED_INFRASTRUCTURE',
    role: 'SHARED_EVIDENCE_INFRASTRUCTURE',
    label: 'Shared Infrastructure',
    description: 'Evidence, provenance, ledger, safety, and diagnostic journey infrastructure shared by multiple product lines.',
    dependsOn: [],
    mayContributeTo: ['PURPOSE_ALIGNMENT', 'OPERATIONAL_DECISION_INTELLIGENCE'],
    isPaidCorridorStage: false,
  },
  RESEARCH_FOUNDRY: {
    productLine: 'RESEARCH_FOUNDRY',
    role: 'RESEARCH_VALIDATION',
    label: 'Research Foundry',
    description: 'Research validation, simulation, benchmarking, and market intelligence assets that are not automatically production corridor capabilities.',
    dependsOn: [],
    mayContributeTo: ['SHARED_INFRASTRUCTURE'],
    isPaidCorridorStage: false,
  },
  COMMERCIAL_GROWTH: {
    productLine: 'COMMERCIAL_GROWTH',
    role: 'COMMERCIAL_CONVERSION',
    label: 'Commercial Growth',
    description: 'Conversion, pricing, catalogue, and growth instrumentation.',
    dependsOn: [],
    mayContributeTo: [],
    isPaidCorridorStage: false,
  },
  LEGACY_UNKNOWN: {
    productLine: 'LEGACY_UNKNOWN',
    role: 'UNKNOWN_OR_LEGACY',
    label: 'Legacy or Unknown',
    description: 'Unclassified legacy surface or module awaiting authority review.',
    dependsOn: [],
    mayContributeTo: [],
    isPaidCorridorStage: false,
  },
}

const PURPOSE_ALIGNMENT_EVIDENCE: EvidenceType[] = [
  'personal_pattern',
  'behavioural_contract',
  'contract_breach',
  'avoided_decision',
  'recurrence',
]

const ODI_EVIDENCE: EvidenceType[] = [
  'case_decision',
  'stakeholder',
  'outcome',
  'recurrence',
  'authority_structure',
  'scenario_stress',
  'evidence_lineage',
  'dissenter_signal',
  'oversight_cycle',
]

const SHARED_EVIDENCE: EvidenceType[] = [
  'provenance',
  'evidence_lineage',
  'recurrence',
  'behavioural_signal',
]

const CONTRIBUTION_POLICY: Partial<Record<ProductLine, Partial<Record<ProductLine, EvidenceType[]>>>> = {
  PURPOSE_ALIGNMENT: {
    PURPOSE_ALIGNMENT: PURPOSE_ALIGNMENT_EVIDENCE,
    OPERATIONAL_DECISION_INTELLIGENCE: ['avoided_decision', 'personal_pattern', 'recurrence'],
    SHARED_INFRASTRUCTURE: ['personal_pattern', 'behavioural_contract', 'contract_breach', 'avoided_decision', 'recurrence'],
  },
  OPERATIONAL_DECISION_INTELLIGENCE: {
    OPERATIONAL_DECISION_INTELLIGENCE: ODI_EVIDENCE,
    SHARED_INFRASTRUCTURE: ['case_decision', 'stakeholder', 'outcome', 'recurrence', 'authority_structure', 'scenario_stress', 'evidence_lineage', 'oversight_cycle'],
  },
  SHARED_INFRASTRUCTURE: {
    PURPOSE_ALIGNMENT: ['provenance', 'evidence_lineage', 'recurrence', 'behavioural_signal'],
    OPERATIONAL_DECISION_INTELLIGENCE: ['provenance', 'evidence_lineage', 'recurrence', 'behavioural_signal'],
    SHARED_INFRASTRUCTURE: SHARED_EVIDENCE,
  },
  RESEARCH_FOUNDRY: {
    SHARED_INFRASTRUCTURE: ['provenance', 'scenario_stress', 'evidence_lineage'],
  },
  COMMERCIAL_GROWTH: {
    SHARED_INFRASTRUCTURE: ['provenance'],
  },
}

const PURPOSE_ALIGNMENT_SURFACES = new Set<string>([
  'purpose_alignment',
  'purpose-alignment',
  'diagnostics/purpose-alignment',
  '/purpose-alignment',
  '/diagnostics/purpose-alignment',
])

const OPERATIONAL_DECISION_SURFACES = new Set<string>([
  'constitutional_diagnostic',
  'constitutional-diagnostic',
  'team_assessment',
  'team-assessment',
  'enterprise_assessment',
  'enterprise-assessment',
  'executive_reporting',
  'executive-reporting',
  'boardroom_mode',
  'boardroom-mode',
  'strategy_room',
  'strategy-room',
  'retainer_oversight',
  'retainer-oversight',
  'decision_centre',
  'decision-centre',
])

export function getProductLineIdentity(productLine: ProductLine): ProductLineIdentity {
  return PRODUCT_LINE_IDENTITIES[productLine]
}

export function getAllowedContributionTypes(source: ProductLine, target: ProductLine): EvidenceType[] {
  return [...(CONTRIBUTION_POLICY[source]?.[target] ?? [])]
}

export function assertContributionAllowed(contribution: ProductLineContribution): void {
  const missing = ['source', 'target', 'evidenceType', 'confidence', 'summary', 'createdAt'].filter((key) => {
    const value = contribution[key as keyof ProductLineContribution]
    return value === undefined || value === null || value === ''
  })

  if (missing.length > 0) {
    throw new Error(`ProductLineContribution missing required field(s): ${missing.join(', ')}`)
  }

  if (contribution.confidence < 0 || contribution.confidence > 1) {
    throw new Error('ProductLineContribution confidence must be between 0 and 1')
  }

  const allowed = getAllowedContributionTypes(contribution.source, contribution.target)
  if (!allowed.includes(contribution.evidenceType)) {
    throw new Error(
      `Contribution evidence "${contribution.evidenceType}" is not allowed from ${contribution.source} to ${contribution.target}`,
    )
  }

  if (
    contribution.source === 'PURPOSE_ALIGNMENT' &&
    contribution.target === 'OPERATIONAL_DECISION_INTELLIGENCE' &&
    contribution.evidenceType === 'recurrence' &&
    contribution.bridge !== 'purpose_to_operational_decision'
  ) {
    throw new Error('Purpose Alignment recurrence evidence requires the typed purpose_to_operational_decision bridge')
  }
}

export function isPurposeAlignmentSurface(surface: string | ProductSurface): boolean {
  return PURPOSE_ALIGNMENT_SURFACES.has(surface)
}

export function isOperationalDecisionSurface(surface: string | ProductSurface): boolean {
  return OPERATIONAL_DECISION_SURFACES.has(surface)
}

export function classifyCapabilityProductLine(filePathOrCapabilityName: string): ProductLine {
  const value = filePathOrCapabilityName.toLowerCase().replace(/\\/g, '/')

  if (value.includes('purpose-alignment') || value.includes('purpose_alignment')) {
    return 'PURPOSE_ALIGNMENT'
  }
  if (
    value.includes('team-respondent') ||
    value.includes('team_assessment') ||
    value.includes('enterprise') ||
    value.includes('executive-reporting') ||
    value.includes('boardroom') ||
    value.includes('strategy-room') ||
    value.includes('retainer') ||
    value.includes('oversight') ||
    value.includes('decision-centre') ||
    value.includes('scenario-stress') ||
    value.includes('domain-interdependency') ||
    value.includes('contradiction-forcing')
  ) {
    return 'OPERATIONAL_DECISION_INTELLIGENCE'
  }
  if (
    value.includes('provenance') ||
    value.includes('evidence') ||
    value.includes('ledger') ||
    value.includes('memory') ||
    value.includes('diagnostic-journey') ||
    value.includes('security') ||
    value.includes('privacy')
  ) {
    return 'SHARED_INFRASTRUCTURE'
  }
  if (value.includes('research') || value.includes('foundry') || value.includes('gmi') || value.includes('market-intelligence')) {
    return 'RESEARCH_FOUNDRY'
  }
  if (value.includes('commercial') || value.includes('catalogue') || value.includes('checkout') || value.includes('pricing')) {
    return 'COMMERCIAL_GROWTH'
  }

  return 'LEGACY_UNKNOWN'
}
