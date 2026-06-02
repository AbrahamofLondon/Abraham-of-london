/**
 * lib/product/product-estate-contract.ts
 *
 * Canonical commercial product estate source of truth for Abraham of London.
 *
 * This file is the authoritative map of every product, instrument, intelligence
 * report, and service in the product estate. All product surfacing on /products,
 * /pricing, homepage, and footer must derive from this file.
 *
 * Rules:
 *   - Do not mark a live product as planned.
 *   - Do not mark a planned product as purchasable.
 *   - Do not hide a live governed product from both products and pricing.
 *   - Retainer Oversight remains retainer_gated until cadence/cycle is live.
 *   - Purpose Alignment is family: purpose_alignment, not operational_decision_corridor.
 *   - GMI must appear on both products and pricing.
 *   - All governed instruments are live — do not hide them.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductEstateFamily =
  | 'market_activation'
  | 'operational_decision_corridor'
  | 'governed_instruments'
  | 'governed_playbooks'
  | 'market_intelligence'
  | 'purpose_alignment'
  | 'advisory_and_retained_oversight'
  | 'knowledge_and_samples'

export type ProductEstateAvailability =
  | 'open_entry'
  | 'free'
  | 'paid'
  | 'evidence_gated'
  | 'auth_required'
  | 'operator_review'
  | 'retainer_gated'
  | 'planned'
  | 'admin_only'
  | 'manual_billing'
  | 'contracted'
  | 'inactive'

export type ProductEstateItem = {
  id: string
  family: ProductEstateFamily
  name: string
  shortDescription: string
  buyerDescription: string
  availability: ProductEstateAvailability
  route?: string
  checkoutProductCode?: string
  priceLabel?: string
  primaryCTA?: string
  secondaryCTA?: string
  secondaryRoute?: string
  governed: boolean
  live: boolean
  purchasable: boolean
  gatedReason?: string
  shouldAppearOnProducts: boolean
  shouldAppearOnPricing: boolean
  shouldAppearOnHomepage?: boolean
  relatedItems?: string[]
}

// ─── Product Estate ───────────────────────────────────────────────────────────

export const PRODUCT_ESTATE: ProductEstateItem[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET ACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'decision_pressure_signal',
    family: 'market_activation',
    name: 'Decision Pressure Signal',
    shortDescription: 'Free pressure reading for a single consequential decision.',
    buyerDescription: 'Paste the decision you are avoiding. Get a pressure band, missing evidence, authority risk, and next admissible move.',
    availability: 'free',
    route: '/decision-pressure',
    priceLabel: 'Free',
    primaryCTA: 'Start free signal',
    governed: true,
    live: true,
    purchasable: false,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
    shouldAppearOnHomepage: true,
  },

  {
    id: 'boardroom_brief',
    family: 'market_activation',
    name: 'Boardroom Brief',
    shortDescription: 'Generate a boardroom-style challenge brief for one serious decision.',
    buyerDescription: 'A paid boardroom-readiness brief with likely objections, evidence weaknesses, trade-offs, decision paths, and the next admissible move.',
    availability: 'paid',
    route: '/boardroom-brief',
    checkoutProductCode: 'boardroom_brief',
    priceLabel: '£99',
    primaryCTA: 'Generate a brief',
    secondaryCTA: 'View sample',
    secondaryRoute: '/boardroom-brief?sample=true',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
    shouldAppearOnHomepage: true,
  },

  {
    id: 'fast_diagnostic',
    family: 'market_activation',
    name: 'Fast Diagnostic',
    shortDescription: 'Identify the decision fracture, required move, and checkpoint.',
    buyerDescription: 'Free diagnostic entry. Identifies the primary condition and produces one required move with a 48-hour checkpoint.',
    availability: 'free',
    route: '/diagnostics/fast',
    priceLabel: 'Free',
    primaryCTA: 'Start Fast Diagnostic',
    governed: true,
    live: true,
    purchasable: false,
    shouldAppearOnProducts: false,
    shouldAppearOnPricing: true,
    shouldAppearOnHomepage: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATIONAL DECISION CORRIDOR
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'team_assessment',
    family: 'operational_decision_corridor',
    name: 'Team Assessment',
    shortDescription: 'Detect where respondents diverge on decision, owner, blocker, and evidence.',
    buyerDescription: 'Tests whether respondents are describing the same decision, owner, blocker, and evidence position. Aggregate-only output.',
    availability: 'paid',
    route: '/diagnostics/team-assessment',
    priceLabel: 'Paid',
    primaryCTA: 'Start Team Assessment',
    governed: true,
    live: true,
    purchasable: false, // no self-serve catalog product code — billed through enterprise/platform path
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'enterprise_assessment',
    family: 'operational_decision_corridor',
    name: 'Enterprise Assessment',
    shortDescription: 'Tests where the organisation breaks under dependency, exposure, and scenario pressure.',
    buyerDescription: 'Organisational stress architecture across authority, evidence, dependency, and scenario pressure. Escalation pathway included.',
    availability: 'paid',
    route: '/enterprise',
    priceLabel: 'Paid',
    primaryCTA: 'Run organisational scan',
    governed: true,
    live: true,
    purchasable: false, // no self-serve catalog product code — billed through enterprise pathway
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'strategy_room_extended',
    family: 'operational_decision_corridor',
    name: 'Strategy Room — Active / Multi-Decision',
    shortDescription: 'Extended Strategy Room access for multi-decision governed execution.',
    buyerDescription: 'Strategy Room entry extended to cover multiple decisions and longer execution cycles.',
    availability: 'evidence_gated',
    route: '/strategy-room',
    checkoutProductCode: 'strategy_room_extended',
    priceLabel: '£1,250',
    primaryCTA: 'View Strategy Room',
    governed: true,
    live: true,
    purchasable: true,
    gatedReason: 'Requires prior case state and evidence record.',
    shouldAppearOnProducts: false, // surfaced via /pricing only — not a separate product card on /products
    shouldAppearOnPricing: true,
  },

  {
    id: 'executive_reporting',
    family: 'operational_decision_corridor',
    name: 'Executive Reporting',
    shortDescription: 'Converts carried evidence into board-grade judgement and recommendation.',
    buyerDescription: 'Turns accumulated evidence into board-grade decision options, recommendation posture, and governance conditions.',
    availability: 'paid',
    route: '/diagnostics/executive-reporting',
    checkoutProductCode: 'executive_reporting',
    priceLabel: '£295',
    primaryCTA: 'Proceed to Executive Reporting',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'boardroom_mode',
    family: 'operational_decision_corridor',
    name: 'Boardroom Mode',
    shortDescription: 'Adversarial boardroom challenge for executive judgement.',
    buyerDescription: 'Tests whether executive judgement survives adversarial boardroom scrutiny. Evidence threshold required.',
    availability: 'evidence_gated',
    route: '/boardroom',
    priceLabel: 'Paid / evidence-gated',
    primaryCTA: 'View Boardroom Mode',
    governed: true,
    live: true,
    purchasable: false, // no self-serve checkout — unlocked through evidence-gated progression
    gatedReason: 'Requires prior evidence record meeting boardroom qualification threshold.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'professional_subscription',
    family: 'operational_decision_corridor',
    name: 'Professional',
    shortDescription: 'Continuity layer: unlimited active governed cases, Return Brief generation, and collaboration.',
    buyerDescription: 'Keeps governed cases active over time. Unlocks Return Brief generation, client-safe evidence export, reviewer links, and organisation workspace.',
    availability: 'paid',
    route: '/pricing',
    checkoutProductCode: 'professional',
    priceLabel: '£59/month',
    primaryCTA: 'Start Professional',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: false,
    shouldAppearOnPricing: true,
  },

  {
    id: 'professional_annual',
    family: 'operational_decision_corridor',
    name: 'Professional — Annual',
    shortDescription: 'Annual Professional subscription with continuity layer for governed cases.',
    buyerDescription: 'Annual billing for the Professional continuity layer. Same features as monthly, billed annually.',
    availability: 'paid',
    route: '/pricing',
    checkoutProductCode: 'professional_annual',
    priceLabel: 'Annual',
    primaryCTA: 'Start Professional Annual',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: false,
    shouldAppearOnPricing: true,
  },

  {
    id: 'strategy_room',
    family: 'operational_decision_corridor',
    name: 'Strategy Room',
    shortDescription: 'Governed execution with checkpoints, owner pressure, and outcome verification.',
    buyerDescription: 'Turns an approved decision into governed execution with ownership, blockers, checkpoints, and outcome feedback loops.',
    availability: 'evidence_gated',
    route: '/strategy-room',
    checkoutProductCode: 'strategy_room',
    priceLabel: '£750',
    primaryCTA: 'View Strategy Room',
    governed: true,
    live: true,
    purchasable: true,
    gatedReason: 'Requires prior case state and evidence record.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'retainer_review_queue',
    family: 'operational_decision_corridor',
    name: 'Retainer Review Queue',
    shortDescription: 'Request retained oversight review for qualifying cases.',
    buyerDescription: 'Allows qualifying cases with sufficient durable evidence to request operator-reviewed retained oversight consideration.',
    availability: 'operator_review',
    priceLabel: 'Review request',
    primaryCTA: 'Request review where eligible',
    governed: true,
    live: true,
    purchasable: false,
    gatedReason: 'Requires REVIEW_READY or OVERSIGHT_READY readiness status.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
  },

  {
    id: 'retainer_oversight',
    family: 'operational_decision_corridor',
    name: 'Retainer Oversight',
    shortDescription: 'Retained oversight after sufficient durable decision history.',
    buyerDescription: 'Only available after sufficient durable recommendation memory, recurrence evidence, outcome history, and readiness threshold.',
    availability: 'retainer_gated',
    route: '/retainer',
    priceLabel: 'Custom / readiness-gated',
    governed: true,
    live: false,
    purchasable: false,
    gatedReason: 'Requires durable recommendation/outcome memory, recurrence, drift evidence, and operator readiness review.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GOVERNED INSTRUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'decision_exposure_instrument',
    family: 'governed_instruments',
    name: 'Decision Exposure Instrument',
    shortDescription: 'Measure decision exposure across financial, operational, and strategic dimensions.',
    buyerDescription: 'Quantifies the cost of being wrong before the market enforces it. Writes to Decision Centre memory.',
    availability: 'paid',
    route: '/decision-instruments/decision-exposure-instrument',
    checkoutProductCode: 'decision_exposure_instrument',
    priceLabel: '£29',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'mandate_clarity_framework',
    family: 'governed_instruments',
    name: 'Mandate Clarity Framework',
    shortDescription: 'Classify whether decision ownership, scope, and accountability are clear.',
    buyerDescription: 'Identifies where mandate is unclear, contested, or delegated without accountability.',
    availability: 'paid',
    route: '/decision-instruments/mandate-clarity-framework',
    checkoutProductCode: 'mandate_clarity_framework',
    priceLabel: '£49',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'intervention_path_selector',
    family: 'governed_instruments',
    name: 'Intervention Path Selector',
    shortDescription: 'Select the optimal intervention path given constraints and stakeholder state.',
    buyerDescription: 'Risk-adjusted intervention routing from evidence through to action path.',
    availability: 'paid',
    route: '/decision-instruments/intervention-path-selector',
    checkoutProductCode: 'intervention_path_selector',
    priceLabel: '£79',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'escalation_readiness_scorecard',
    family: 'governed_instruments',
    name: 'Escalation Readiness Scorecard',
    shortDescription: 'Determine whether escalation is premature, warranted, or overdue.',
    buyerDescription: 'Classifies escalation readiness across evidence, authority, and consequence dimensions.',
    availability: 'paid',
    route: '/decision-instruments/escalation-readiness-scorecard',
    checkoutProductCode: 'escalation_readiness_scorecard',
    priceLabel: '£19',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'structural_failure_diagnostic_canvas',
    family: 'governed_instruments',
    name: 'Structural Failure Diagnostic Canvas',
    shortDescription: 'Identify whether the issue is strategic, operational, or governance-based.',
    buyerDescription: 'Diagnoses whether problems are structural or symptomatic before intervention is chosen.',
    availability: 'paid',
    route: '/decision-instruments/structural-failure-diagnostic-canvas',
    checkoutProductCode: 'structural_failure_diagnostic_canvas',
    priceLabel: '£19',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'execution_risk_index',
    family: 'governed_instruments',
    name: 'Execution Risk Index',
    shortDescription: 'Measure whether a decision can survive execution reality.',
    buyerDescription: 'Tests execution survivability across 8 factors before commitment.',
    availability: 'paid',
    route: '/decision-instruments/execution-risk-index',
    checkoutProductCode: 'execution_risk_index',
    priceLabel: '£49',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'team_alignment_gap_map',
    family: 'governed_instruments',
    name: 'Decision Alignment Gap Map',
    shortDescription: 'Map where decision owners and operators diverge on reality and action.',
    buyerDescription: 'Shows where agreement is assumed but execution diverges.',
    availability: 'paid',
    route: '/decision-instruments/team-alignment-gap-map',
    checkoutProductCode: 'team_alignment_gap_map',
    priceLabel: '£29',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'governance_drift_detector',
    family: 'governed_instruments',
    name: 'Governance Drift Detector',
    shortDescription: 'Detect governance drift across 6 dimensions before structural failure.',
    buyerDescription: 'Identifies silent organisational decay in governance standards.',
    availability: 'paid',
    route: '/decision-instruments/governance-drift-detector',
    checkoutProductCode: 'governance_drift_detector',
    priceLabel: '£49',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'strategic_priority_stack_builder',
    family: 'governed_instruments',
    name: 'Strategic Priority Stack Builder',
    shortDescription: 'Convert competing priorities into a governed ranked stack.',
    buyerDescription: 'Produces a conflict-detected priority stack with governance rationale.',
    availability: 'paid',
    route: '/decision-instruments/strategic-priority-stack-builder',
    checkoutProductCode: 'strategic_priority_stack_builder',
    priceLabel: '£79',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'board_brief_builder',
    family: 'governed_instruments',
    name: 'Board Brief Builder',
    shortDescription: 'Turn a decision record into a board-ready brief with objection handling.',
    buyerDescription: 'Produces board-grade structured briefs with objections and decision paths.',
    availability: 'paid',
    route: '/decision-instruments/board-brief-builder',
    checkoutProductCode: 'board_brief_builder',
    priceLabel: '£129',
    primaryCTA: 'Open instrument',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'operator_decision_pack',
    family: 'governed_instruments',
    name: 'Operator Decision Pack',
    shortDescription: 'Decision Exposure, Mandate Clarity, and Intervention Path in one pack.',
    buyerDescription: 'Includes three core instruments: Decision Exposure, Mandate Clarity Framework, and Intervention Path Selector.',
    availability: 'paid',
    route: '/decision-instruments/operator-decision-pack',
    checkoutProductCode: 'operator_decision_pack',
    priceLabel: '£129',
    primaryCTA: 'Get pack',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
    relatedItems: ['decision_exposure_instrument', 'mandate_clarity_framework', 'intervention_path_selector'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GOVERNED PLAYBOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'execution_integrity_protocol',
    family: 'governed_playbooks',
    name: 'Execution Integrity Protocol',
    shortDescription: 'Restore execution discipline without rewriting strategy.',
    buyerDescription: 'Controlled-release governed methodology run for execution restoration.',
    availability: 'manual_billing',
    route: '/playbooks/execution-integrity-protocol',
    checkoutProductCode: 'execution_integrity_protocol',
    priceLabel: '£49',
    primaryCTA: 'Request access',
    governed: true,
    live: true,
    purchasable: false,
    gatedReason: 'Controlled release — request access while self-serve checkout is not enabled.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'alignment_audit_playbook',
    family: 'governed_playbooks',
    name: 'The Alignment Audit Playbook',
    shortDescription: 'Diagnose organisational misalignment before intervention.',
    buyerDescription: 'Controlled-release methodology run for pre-intervention misalignment diagnosis.',
    availability: 'manual_billing',
    route: '/playbooks/the-alignment-audit-playbook',
    checkoutProductCode: 'alignment_audit_playbook',
    priceLabel: '£49',
    primaryCTA: 'Request access',
    governed: true,
    live: true,
    purchasable: false,
    gatedReason: 'Controlled release — request access while self-serve checkout is not enabled.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  {
    id: 'drift_detection_framework',
    family: 'governed_playbooks',
    name: 'The Drift Detection Framework',
    shortDescription: 'Identify silent organisational decay before it becomes structural failure.',
    buyerDescription: 'Controlled-release methodology for detecting governance and execution drift.',
    availability: 'manual_billing',
    route: '/playbooks/the-drift-detection-framework',
    checkoutProductCode: 'drift_detection_framework',
    priceLabel: '£39',
    primaryCTA: 'Request access',
    governed: true,
    live: true,
    purchasable: false,
    gatedReason: 'Controlled release — request access while self-serve checkout is not enabled.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'gmi_q1_2026',
    family: 'market_intelligence',
    name: 'Global Market Intelligence Report — Q1 2026',
    shortDescription: 'Quarterly market intelligence that reviews prior material calls before issuing the next report.',
    buyerDescription: 'Disciplined quarterly intelligence built on prior-call review and verification, not prediction theatre. Q1 2026 coverage, active for Q2 2026 decision use.',
    availability: 'paid',
    route: '/artifacts/global-market-intelligence-report-q1-2026',
    checkoutProductCode: 'gmi_q1_2026',
    priceLabel: '£59',
    primaryCTA: 'View intelligence report',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
    relatedItems: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PURPOSE ALIGNMENT (separate product line)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'personal_decision_audit',
    family: 'purpose_alignment',
    name: 'Personal Decision Audit',
    shortDescription: 'Expose contradiction between stated mandate, behaviour, and competing obligation.',
    buyerDescription: 'Mandate clarity, obligation conflict map, decision behaviour pattern, alignment drift warning, and personal decision constitution.',
    availability: 'paid',
    route: '/diagnostics/purpose-alignment',
    checkoutProductCode: 'personal_decision_audit',
    priceLabel: '£49',
    primaryCTA: 'Start Personal Decision Audit',
    governed: true,
    live: true,
    purchasable: true,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVISORY AND RETAINED OVERSIGHT
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'operator_pilot',
    family: 'advisory_and_retained_oversight',
    name: 'Operator Pilot',
    shortDescription: 'Selective governed pilot review for serious live decisions.',
    buyerDescription: 'Assisted review path for operators and advisors with serious client decision work.',
    availability: 'operator_review',
    route: '/engagements/operator-pilot',
    priceLabel: 'Selective',
    primaryCTA: 'Request review',
    governed: true,
    live: true,
    purchasable: false,
    gatedReason: 'Selective opening — reviewed individually.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
  },

  {
    id: 'retained_oversight_engagement',
    family: 'advisory_and_retained_oversight',
    name: 'Retained Oversight Review',
    shortDescription: 'Retained review pathway for qualifying cases with durable history.',
    buyerDescription: 'Selective engagement pathway for cases that have accumulated sufficient durable recommendation and outcome history.',
    availability: 'retainer_gated',
    route: '/engagements/retained-oversight',
    priceLabel: 'Custom',
    primaryCTA: 'View pathway',
    governed: true,
    live: false,
    purchasable: false,
    gatedReason: 'Requires durable case history and readiness review.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
  },

  {
    id: 'professionals_access',
    family: 'advisory_and_retained_oversight',
    name: 'Professional Access',
    shortDescription: 'Decision infrastructure for advisors and consultants with client decision work.',
    buyerDescription: 'Use Boardroom Briefs, instruments, and enterprise scans with clients. Selective opening with potential revenue share.',
    availability: 'operator_review',
    route: '/professionals',
    priceLabel: 'Selective',
    primaryCTA: 'Request professional access',
    governed: true,
    live: true,
    purchasable: false,
    gatedReason: 'Selective opening for approved professional referrers.',
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE AND SAMPLES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'boardroom_brief_sample',
    family: 'knowledge_and_samples',
    name: 'Sample Boardroom Brief',
    shortDescription: 'Inspectable sample of a board-grade challenge brief.',
    buyerDescription: 'Free sample showing the structure and depth of a full Boardroom Brief using fictional demonstration data.',
    availability: 'free',
    route: '/boardroom-brief?sample=true',
    priceLabel: 'Free',
    primaryCTA: 'View sample',
    governed: true,
    live: true,
    purchasable: false,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
  },

  {
    id: 'published_briefs',
    family: 'knowledge_and_samples',
    name: 'Published Briefs',
    shortDescription: 'Market-facing briefings and applied decision intelligence.',
    buyerDescription: 'Public briefings and evidence artifacts from the Abraham of London intelligence line.',
    availability: 'free',
    route: '/briefs',
    priceLabel: 'Free',
    primaryCTA: 'Read briefs',
    governed: true,
    live: true,
    purchasable: false,
    shouldAppearOnProducts: true,
    shouldAppearOnPricing: false,
  },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getProductEstateItems(): ProductEstateItem[] {
  return PRODUCT_ESTATE
}

export function getProductsForDirectory(): ProductEstateItem[] {
  return PRODUCT_ESTATE.filter(p => p.shouldAppearOnProducts)
}

export function getProductsForPricing(): ProductEstateItem[] {
  return PRODUCT_ESTATE.filter(p => p.shouldAppearOnPricing)
}

export function getLiveGovernedProducts(): ProductEstateItem[] {
  return PRODUCT_ESTATE.filter(p => p.live && p.governed)
}

export function getMissingCommercialSurfaceWarnings(): string[] {
  const warnings: string[] = []
  for (const item of PRODUCT_ESTATE) {
    if (item.live && item.purchasable && !item.shouldAppearOnPricing) {
      warnings.push(`${item.name} (${item.id}): live purchasable product not appearing on pricing page`)
    }
    if (item.live && item.governed && !item.shouldAppearOnProducts && !item.shouldAppearOnPricing) {
      warnings.push(`${item.name} (${item.id}): live governed product invisible on both products and pricing`)
    }
  }
  return warnings
}

export function getProductEstateItemById(id: string): ProductEstateItem | undefined {
  return PRODUCT_ESTATE.find(p => p.id === id)
}

export function getProductsByFamily(family: ProductEstateFamily): ProductEstateItem[] {
  return PRODUCT_ESTATE.filter(p => p.family === family)
}
