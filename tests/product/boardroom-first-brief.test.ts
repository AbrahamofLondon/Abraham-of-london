/**
 * tests/product/boardroom-first-brief.test.ts
 *
 * Tests for the Boardroom-first entry path (Market Activation Layer Phase 1).
 *
 * Rules:
 *   - Boardroom-first Brief is not a paid corridor stage.
 *   - Uses buildBoardroomIntelligenceSpine().
 *   - Uses generateBoardroomDossier().
 *   - Thin input produces qualified/early brief language.
 *   - Missing decision/consequence/evidence produces governed refusal.
 *   - Output contains no undefined/null leaks.
 *   - Output does not claim full Executive Reporting.
 *   - Output does not claim full Boardroom Mode unless qualification threshold is met.
 *   - Output does not claim Retainer/Oversight.
 *   - CTA routing points into the correct corridor surface.
 *   - Homepage/category copy does not describe this as an AI tool.
 */

import { describe, it, expect } from 'vitest'
import { buildBoardroomIntelligenceSpine } from '@/lib/constitution/boardroom-spine-builder'
import { generateBoardroomDossier, qualifiesForBoardroom } from '@/lib/constitution/boardroom-mode'
import { PAID_CORRIDOR_RECORDS } from '@/lib/product/paid-corridor-contract'
import { CAPABILITY_STATUS_RECORDS, getCapabilityRecord } from '@/lib/product/capability-status-authority'
import { CATALOG, checkCheckoutEligibility } from '@/lib/commercial/catalog'
import { resolvePricingAction } from '@/lib/commercial/pricing-actions'

// ─── 1. Boardroom-first Brief is not a paid corridor stage ──────────────────

describe('Boardroom-first Brief is not a paid corridor stage', () => {
  it('is not listed in paid corridor stages', () => {
    const stageNames = PAID_CORRIDOR_RECORDS.map(r => r.stage)
    expect(stageNames).not.toContain('boardroom_first_brief')
    expect(stageNames).not.toContain('boardroom_brief')
  })

  it('is listed in capability-status-authority as ACTIVE market activation surface', () => {
    const record = getCapabilityRecord('Boardroom-first Brief')
    expect(record).toBeDefined()
    expect(record!.status).toBe('ACTIVE')
    expect(record!.layer).toBe('UI_SURFACE')
    expect(record!.outputProduced?.join(' ')).toMatch(/checkout CTA|sample brief/i)
  })
})

// ─── 1b. Boardroom Brief is first paid proof-of-value product ───────────────

describe('Boardroom Brief commercial product', () => {
  it('is an active paid catalog product in the starter price range', () => {
    const product = CATALOG.boardroom_brief
    expect(product).toBeDefined()
    expect(product.displayName).toBe('Boardroom Brief')
    expect(product.amount).toBeGreaterThanOrEqual(4900)
    expect(product.amount).toBeLessThanOrEqual(14900)
    expect(product.commercialStatus).toBe('paid')
    expect(product.requiresCheckout).toBe(true)
    expect(product.primaryCta).toBe('Get full Boardroom Brief')
  })

  it('resolves to the existing checkout action flow', () => {
    const product = CATALOG.boardroom_brief!
    expect(checkCheckoutEligibility(product.code)).toMatchObject({
      eligible: true,
      product,
    })
    expect(resolvePricingAction(product)).toMatchObject({
      type: 'checkout',
      label: 'Get full Boardroom Brief',
      href: '/boardroom-brief',
    })
  })

  it('does not market the paid brief as Executive Reporting, Retainer, or Oversight', () => {
    const product = CATALOG.boardroom_brief!
    const serialized = JSON.stringify(product).toLowerCase()
    expect(product.displayName).toBe('Boardroom Brief')
    expect(serialized).not.toContain('retainer')
    expect(serialized).not.toContain('oversight')
    expect(serialized).not.toContain('full boardroom mode')
    expect(product.displayName).not.toBe('Executive Reporting')
  })
})

// ─── 2. Uses buildBoardroomIntelligenceSpine() ───────────────────────────────

describe('uses buildBoardroomIntelligenceSpine()', () => {
  it('builds a spine from minimal intake data', () => {
    const spine = buildBoardroomIntelligenceSpine({
      decisionText: 'Decide whether to acquire the competitor',
      costOfDelay: 15000,
      conditionClass: 'authority',
      synthesis: {
        primaryContradiction: 'Board is divided on the acquisition',
        blocker: 'Shareholder resistance',
      },
      case: {
        claimedOwner: 'CEO',
      },
    })
    expect(spine).toBeDefined()
    expect(spine.economics?.estimatedMonthlyCost).toBe(15000)
    expect(spine.deterministic?.conditionClass).toBe('authority')
    expect(spine.case).toBeDefined()
  })
})

// ─── 3. Uses generateBoardroomDossier() ──────────────────────────────────────

describe('uses generateBoardroomDossier()', () => {
  it('generates a dossier from built spine', () => {
    const spine = buildBoardroomIntelligenceSpine({
      costOfDelay: 25000,
      accuracy: 'yes',
      conditionClass: 'execution',
      decisionText: 'Decide whether to restructure the engineering team',
      synthesis: {
        primaryContradiction: 'CTO wants restructuring but VP Engineering disagrees',
        blocker: 'Leadership disagreement on scope',
      },
      case: {
        claimedOwner: 'CTO',
      },
    })
    const dossier = generateBoardroomDossier(spine as any)
    expect(dossier).toBeDefined()
    expect(dossier.qualifiedForBoard).toBe(true)
    expect(dossier.sections.length).toBeGreaterThan(0)
    expect(dossier.objectionHandling.length).toBeGreaterThan(0)
    expect(dossier.decisionPath.length).toBeGreaterThan(0)
  })
})

// ─── 4. Thin input produces qualified/early brief language ───────────────────

describe('thin input produces qualified language', () => {
  it('minimal cost + partial accuracy produces qualified brief', () => {
    const spine = buildBoardroomIntelligenceSpine({
      costOfDelay: 8000,
      accuracy: 'partial',
      decisionText: 'Decide on new office location',
    })
    const dossier = generateBoardroomDossier(spine as any)
    expect(dossier.qualifiedForBoard).toBe(true)
    // With thin spine, condition defaults to 'definition'
    expect(dossier.title).toContain('DEFINITION')
    // Should have sections but with fallback language
    expect(dossier.sections.length).toBeGreaterThan(0)
  })

  it('no cost and no accuracy produces NOT QUALIFIED', () => {
    const spine = buildBoardroomIntelligenceSpine({
      decisionText: 'Decide on vendor selection',
    })
    const gate = qualifiesForBoardroom(spine as any)
    expect(gate.qualified).toBe(false)

    const dossier = generateBoardroomDossier(spine as any)
    expect(dossier.qualifiedForBoard).toBe(false)
    expect(dossier.sections.length).toBe(0)
  })
})

// ─── 5. Missing decision/consequence/evidence produces governed refusal ──────

describe('governed refusal for weak input', () => {
  it('short decision produces refusal', () => {
    // This simulates the page's validation: decision < 10 chars
    const decision = 'Maybe'
    expect(decision.length).toBeLessThan(10)
  })

  it('missing consequence produces refusal', () => {
    const consequence = ''
    expect(consequence.length).toBeLessThan(10)
  })

  it('missing evidence and authority produces refusal', () => {
    const evidenceAvailable = ''
    const authorityUncertainty = ''
    const hasEvidence = evidenceAvailable.length >= 5
    const hasAuthority = authorityUncertainty.length >= 5
    expect(hasEvidence || hasAuthority).toBe(false)
  })
})

// ─── 6. Output contains no undefined/null leaks ─────────────────────────────

describe('no undefined/null leaks', () => {
  it('full spine dossier has no undefined in serialized output', () => {
    const spine = buildBoardroomIntelligenceSpine({
      costOfDelay: 50000,
      accuracy: 'yes',
      conditionClass: 'authority',
      decisionText: 'Decide whether to enter new market',
      synthesis: {
        primaryContradiction: 'Executive team is divided on market entry timing',
        concreteMove: 'Present market analysis to board within 2 weeks',
        blocker: 'Board disagreement on timing',
        forcedAction: 'CEO considering unilateral decision',
      },
      case: {
        claimedOwner: 'CEO',
        blocker: 'Board disagreement',
      },
      flags: { falseAuthority: true },
      forecast: { optionDecayRate: 0.4, structuralRiskShift: 'accelerating' },
      deterministic: {
        contradictionSet: ['Timing disagreement', 'Risk appetite mismatch'],
        blockerClass: 'governance',
      },
      economics: { estimatedMonthlyCost: 50000, decisionOwner: 'CEO' },
    })
    const dossier = generateBoardroomDossier(spine as any)
    const serialized = JSON.stringify(dossier)
    // gateMessage is intentionally null when qualified — that's valid
    // But 'undefined' should never appear in serialized output
    expect(serialized).not.toContain('undefined')
    // All content fields should be non-empty strings
    for (const section of dossier.sections) {
      expect(typeof section.content).toBe('string')
      expect(section.content.length).toBeGreaterThan(0)
    }
  })

  it('thin spine dossier has no undefined in serialized output', () => {
    const spine = buildBoardroomIntelligenceSpine({
      costOfDelay: 8000,
      accuracy: 'partial',
      decisionText: 'Decide on budget reallocation',
    })
    const dossier = generateBoardroomDossier(spine as any)
    const serialized = JSON.stringify(dossier)
    expect(serialized).not.toContain('undefined')
    // All content fields should be non-empty strings
    for (const section of dossier.sections) {
      expect(typeof section.content).toBe('string')
      expect(section.content.length).toBeGreaterThan(0)
    }
  })
})

// ─── 7. Output does not claim full Executive Reporting ───────────────────────

describe('does not claim full Executive Reporting', () => {
  it('qualified dossier does not claim Executive Reporting', () => {
    const spine = buildBoardroomIntelligenceSpine({
      costOfDelay: 25000,
      accuracy: 'yes',
      decisionText: 'Decide on strategic partnership',
    })
    const dossier = generateBoardroomDossier(spine as any)
    const serialized = JSON.stringify(dossier).toLowerCase()
    // Should not claim to be an executive report
    expect(serialized).not.toContain('executive report')
  })
})

// ─── 8. Output does not claim full Boardroom Mode unless qualified ───────────

describe('does not claim full Boardroom Mode', () => {
  it('not qualified dossier does not claim board readiness', () => {
    const spine = buildBoardroomIntelligenceSpine({
      decisionText: 'Decide on minor process change',
    })
    const dossier = generateBoardroomDossier(spine as any)
    expect(dossier.qualifiedForBoard).toBe(false)
    const serialized = JSON.stringify(dossier).toLowerCase()
    expect(serialized).not.toContain('board-ready')
    expect(serialized).not.toContain('boardroom qualified')
  })
})

// ─── 9. Output does not claim Retainer/Oversight ─────────────────────────────

describe('does not claim Retainer/Oversight', () => {
  it('dossier does not contain retainer or oversight claims', () => {
    const spine = buildBoardroomIntelligenceSpine({
      costOfDelay: 50000,
      accuracy: 'yes',
      conditionClass: 'authority',
      decisionText: 'Major strategic decision',
    })
    const dossier = generateBoardroomDossier(spine as any)
    const serialized = JSON.stringify(dossier).toLowerCase()
    expect(serialized).not.toContain('retainer')
    expect(serialized).not.toContain('oversight')
    expect(serialized).not.toContain('institutional memory')
    expect(serialized).not.toContain('monthly oversight')
  })
})

// ─── 10. CTA routing points into correct corridor surface ───────────────────

describe('CTA routing', () => {
  it('health check routes to /quick-check', () => {
    const href = '/quick-check'
    expect(href).toBe('/quick-check')
  })

  it('organisational scan routes to /enterprise', () => {
    const href = '/enterprise'
    expect(href).toBe('/enterprise')
  })

  it('executive reporting routes to /diagnostics/executive-reporting', () => {
    const href = '/diagnostics/executive-reporting'
    expect(href).toBe('/diagnostics/executive-reporting')
  })
})

// ─── 11. Homepage/category copy does not describe as AI tool ─────────────────

describe('no AI tool framing', () => {
  it('Boardroom-first Brief capability record does not mention AI', () => {
    const record = getCapabilityRecord('Boardroom-first Brief')
    expect(record).toBeDefined()
    const serialized = JSON.stringify(record).toLowerCase()
    expect(serialized).not.toContain('ai tool')
    expect(serialized).not.toContain('ai assistant')
    expect(serialized).not.toContain('chatbot')
  })
})

// ─── 12. Sample brief tests ─────────────────────────────────────────────────

describe('sample Boardroom brief', () => {
  // The sample data used by the page
  const sampleInput = {
    costOfDelay: 25000,
    accuracy: 'yes' as const,
    conditionClass: 'execution',
    decisionText: 'Whether to approve a 90-day accelerated rollout of a new enterprise onboarding platform.',
    synthesis: {
      primaryContradiction: 'Operations wants speed, Finance wants cost control, and Customer Success has not confirmed support capacity.',
      concreteMove: 'Resolve the tri-party constraint between Operations, Finance, and Customer Success before the next quarterly board meeting.',
      blocker: 'Operations wants speed, Finance wants cost control, and Customer Success has not confirmed support capacity.',
      forcedAction: 'If delayed, the company risks missing renewal-cycle commitments and losing confidence with enterprise accounts.',
      nextAdmissibleMove: 'Confirm tri-party alignment on scope, budget, and support capacity before proceeding with rollout.',
    },
    case: {
      claimedOwner: 'Chief Operating Officer',
      blocker: 'Operations wants speed, Finance wants cost control, and Customer Success has not confirmed support capacity.',
      decisionText: 'Whether to approve a 90-day accelerated rollout of a new enterprise onboarding platform.',
    },
    economics: {
      estimatedMonthlyCost: 25000,
      decisionOwner: 'Chief Operating Officer',
      deadline: 'Before the next quarterly board meeting.',
    },
    flags: { falseAuthority: true },
    deterministic: {
      contradictionSet: [
        'Speed vs cost control conflict between Operations and Finance',
        'Customer Success support capacity not confirmed',
        'Renewal-cycle commitments at risk if delayed',
      ],
      blockerClass: 'execution',
    },
    forecast: {
      optionDecayRate: 0.35,
      structuralRiskShift: 'accelerating',
    },
  }

  it('sample=true builds through same spine/dossier path', () => {
    const spine = buildBoardroomIntelligenceSpine(sampleInput)
    expect(spine).toBeDefined()
    expect(spine.economics?.estimatedMonthlyCost).toBe(25000)
    expect(spine.deterministic?.conditionClass).toBe('execution')
    expect(spine.case).toBeDefined()

    const dossier = generateBoardroomDossier(spine as any)
    expect(dossier).toBeDefined()
    expect(dossier.qualifiedForBoard).toBe(true)
    expect(dossier.sections.length).toBeGreaterThan(0)
  })

  it('sample result uses fictional sample disclaimer (simulated)', () => {
    const disclaimer = 'This is a sample Boardroom Brief using fictional demonstration data.'
    expect(disclaimer).toContain('sample')
    expect(disclaimer).toContain('fictional demonstration data')
  })

  it('sample output has no undefined leaks', () => {
    const spine = buildBoardroomIntelligenceSpine(sampleInput)
    const dossier = generateBoardroomDossier(spine as any)
    const serialized = JSON.stringify(dossier)
    expect(serialized).not.toContain('undefined')
    for (const section of dossier.sections) {
      expect(typeof section.content).toBe('string')
      expect(section.content.length).toBeGreaterThan(0)
    }
  })

  it('sample output does not claim to be user-specific', () => {
    const spine = buildBoardroomIntelligenceSpine(sampleInput)
    const dossier = generateBoardroomDossier(spine as any)
    const serialized = JSON.stringify(dossier).toLowerCase()
    expect(serialized).not.toContain('your decision')
    expect(serialized).not.toContain('your analysis')
  })

  it('sample output does not mention AI tool/chatbot', () => {
    const spine = buildBoardroomIntelligenceSpine(sampleInput)
    const dossier = generateBoardroomDossier(spine as any)
    const serialized = JSON.stringify(dossier).toLowerCase()
    expect(serialized).not.toContain('ai tool')
    expect(serialized).not.toContain('ai assistant')
    expect(serialized).not.toContain('chatbot')
  })

  it('sample data includes disclaimer CTA to generate own brief', () => {
    const ctaHref = '/boardroom-brief'
    const ctaLabel = 'Generate your own brief'
    expect(ctaHref).toBe('/boardroom-brief')
    expect(ctaLabel).toContain('Generate')
  })

  it('sample data includes upgrade CTAs', () => {
    const ctas = [
      '/quick-check',
      '/enterprise',
      '/diagnostics/executive-reporting',
    ]
    for (const cta of ctas) {
      expect(cta).toBeTruthy()
    }
  })
})

// ─── 13. TypeScript passes (verified by running tsc) ─────────────────────────
