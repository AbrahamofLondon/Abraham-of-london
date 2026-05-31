/**
 * lib/commercial/ladder.ts — The Only Commercial Structure
 *
 * The catalogue collapses into one ladder.
 * No discount bundles. No "instrument packs." No consumer e-commerce behaviour.
 * The buyer pays for access depth, review level, record durability, and continuity.
 */

export type LadderTier =
  | 'free_signal'
  | 'basic_brief'
  | 'full_dossier'
  | 'urgent_operational'
  | 'executive_board'
  | 'retained_continuity'

export interface LadderProduct {
  tier: LadderTier
  price: number
  displayPrice: string
  accessType: 'free' | 'one_time' | 'subscription'
  duration: 'lifetime' | 'monthly' | 'quarterly'
  includes: string[]
  deliveryFormat: 'web' | 'combined' | 'governed_methodology_run'
  writesToMemory: boolean
  dossierEligible: boolean
  nextAdmissibleMove: string
  stripePriceId?: string | null
  stripeProductId?: string | null
}

export const COMMERCIAL_LADDER: Record<LadderTier, LadderProduct> = {
  free_signal: {
    tier: 'free_signal',
    price: 0,
    displayPrice: 'Free',
    accessType: 'free',
    duration: 'lifetime',
    includes: [
      'Situation classification',
      'Primary failure point',
      'Governing tension',
      'Consequence class',
      'Direction of minimum viable move',
    ],
    deliveryFormat: 'web',
    writesToMemory: false,
    dossierEligible: false,
    nextAdmissibleMove: 'Basic Brief (£49–£95)',
  },

  basic_brief: {
    tier: 'basic_brief',
    price: 4900,
    displayPrice: '£49',
    accessType: 'one_time',
    duration: 'lifetime',
    includes: [
      'Short failure map',
      'Primary and secondary failure',
      'Minimum viable move',
      'Short fallback',
      'What not to do',
    ],
    deliveryFormat: 'web',
    writesToMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: 'Full Dossier (£295–£495)',
  },

  full_dossier: {
    tier: 'full_dossier',
    price: 29500,
    displayPrice: '£295',
    accessType: 'one_time',
    duration: 'lifetime',
    includes: [
      'Authority map',
      'Obligation map',
      'Constraint graph',
      'Evidence graph',
      'Adversarial challenge',
      'Self-adversarial challenge',
      'Minimum viable path',
      'Forbidden actions',
      'Fallback path',
      'What must not be delayed',
      'Record reference',
      'Human review state',
      'Regulated boundary output',
      'Professional brief',
    ],
    deliveryFormat: 'combined',
    writesToMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: 'Urgent Operational (£750–£1,250) or Executive Board (from £2,500)',
  },

  urgent_operational: {
    tier: 'urgent_operational',
    price: 75000,
    displayPrice: '£750',
    accessType: 'one_time',
    duration: 'lifetime',
    includes: [
      'Everything in Full Dossier, plus:',
      '24–48 hour sequence',
      'Triage priority',
      'Escalation triggers',
      'Human-reviewed execution order',
    ],
    deliveryFormat: 'combined',
    writesToMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: 'Executive Board (from £2,500)',
  },

  executive_board: {
    tier: 'executive_board',
    price: 250000,
    displayPrice: 'From £2,500',
    accessType: 'one_time',
    duration: 'lifetime',
    includes: [
      'Everything in Urgent Operational, plus:',
      'Board-ready summary',
      'Actor and authority map',
      'Options comparison',
      'Adversarial review',
      'Decision conditions',
      'Founder review',
      'Continuity record',
    ],
    deliveryFormat: 'combined',
    writesToMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: 'Retained Continuity (monthly/quarterly)',
  },

  retained_continuity: {
    tier: 'retained_continuity',
    price: 0, // Contracted
    displayPrice: 'Monthly / Quarterly',
    accessType: 'subscription',
    duration: 'monthly',
    includes: [
      'Everything in Executive Board, plus:',
      'Case drift tracking',
      'Outcome follow-up',
      'Monthly decision memory',
      'Recurring review',
      'Strategy Room integration',
    ],
    deliveryFormat: 'governed_methodology_run',
    writesToMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: 'Strategy Room (attached to active cases only)',
  },
}

export function getLadderProduct(tier: LadderTier): LadderProduct {
  return COMMERCIAL_LADDER[tier]
}

export function getLadderTierByPrice(amount: number): LadderTier | null {
  for (const [tier, product] of Object.entries(COMMERCIAL_LADDER)) {
    if (product.price === amount && product.accessType !== 'free') return tier as LadderTier
  }
  return null
}

export function getUpgradePath(currentTier: LadderTier): LadderTier[] {
  const tiers: LadderTier[] = [
    'free_signal',
    'basic_brief',
    'full_dossier',
    'urgent_operational',
    'executive_board',
    'retained_continuity',
  ]
  const currentIndex = tiers.indexOf(currentTier)
  return tiers.slice(currentIndex + 1)
}

export function isTierUpgrade(currentTier: LadderTier, targetTier: LadderTier): boolean {
  const tiers: LadderTier[] = [
    'free_signal',
    'basic_brief',
    'full_dossier',
    'urgent_operational',
    'executive_board',
    'retained_continuity',
  ]
  return tiers.indexOf(targetTier) > tiers.indexOf(currentTier)
}
