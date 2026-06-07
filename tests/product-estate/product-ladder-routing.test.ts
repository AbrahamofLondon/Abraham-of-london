import { describe, expect, it } from 'vitest'
import audit from '@/lib/product/product-estate-reality-audit.json'

describe('product ladder routing', () => {
  it('assigns one deliberate role to each core buyer state', () => {
    const roles = audit.ladder.map((step) => step.role)

    expect(new Set(roles).size).toBe(roles.length)
    expect(roles).toEqual([
      'acquisition',
      'diagnosis',
      'conversion',
      'reporting',
      'enterprise_retainer',
      'continuity',
      'supporting_intelligence',
      'supporting_evidence',
      'supporting_tools',
    ])
  })

  it('keeps Decision Instruments and GMI in support roles, not competing headline offers', () => {
    const gmi = audit.ladder.find((step) => step.productCode === 'gmi_quarterly')
    const instruments = audit.ladder.find((step) => step.productCode === 'decision_instruments')

    expect(gmi?.role).toBe('supporting_intelligence')
    expect(gmi?.purpose).toContain('feeds diagnosis')
    expect(instruments?.role).toBe('supporting_tools')
    expect(instruments?.purpose).toContain('support Strategy Room')
  })

  it('keeps Briefs/Vault/Editorial as doctrine and evidence base', () => {
    const briefs = audit.ladder.find((step) => step.productCode === 'briefs_vault_editorial')

    expect(briefs?.role).toBe('supporting_evidence')
    expect(briefs?.purpose).toContain('Doctrine and evidence base')
  })
})
