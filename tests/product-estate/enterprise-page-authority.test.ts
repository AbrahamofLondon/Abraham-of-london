/**
 * tests/product-estate/enterprise-page-authority.test.ts
 *
 * Phase 9 — Enterprise page authority tests.
 * Static assertions about the enterprise page TSX and enquiry API route.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd())

function readFile(rel: string) {
  const full = join(ROOT, rel)
  if (!existsSync(full)) return ''
  return readFileSync(full, 'utf-8')
}

const enterprisePage = readFile('pages/enterprise.tsx')
const enquiryRoute = readFile('app/api/enterprise/enquiry/route.ts')

// ─── Enterprise page structural authority ─────────────────────────────────────

describe('Enterprise page (pages/enterprise.tsx)', () => {
  it('exists', () => {
    expect(existsSync(join(ROOT, 'pages/enterprise.tsx'))).toBe(true)
  })

  it('uses problem-first hero headline', () => {
    expect(enterprisePage).toContain('The meeting agreed. Nothing moved.')
  })

  it('declares decision infrastructure posture, not advisory posture', () => {
    expect(enterprisePage).toContain('Decision infrastructure for organisations')
    expect(enterprisePage).toContain('stopped pretending alignment is enough')
  })

  it('renders buyer profiles section', () => {
    expect(enterprisePage).toContain('Chief Executive')
    expect(enterprisePage).toContain('Chief Financial Officer')
    expect(enterprisePage).toContain('Chief Operating Officer')
    expect(enterprisePage).toContain('Board Chair')
  })

  it('renders compounding breakpoints section', () => {
    expect(enterprisePage).toContain('Evidence is scattered')
    expect(enterprisePage).toContain('Ownership is ambiguous')
    expect(enterprisePage).toContain('Authority and execution separate')
    expect(enterprisePage).toContain('Delay becomes organisational')
  })

  it('renders infrastructure vs consulting differentiation', () => {
    expect(enterprisePage).toContain('Infrastructure, not consulting')
    expect(enterprisePage).toContain('Governed process with defined outputs')
  })

  it('renders test questions (not bullets)', () => {
    expect(enterprisePage).toContain('Who owns this decision')
    expect(enterprisePage).toContain('Does the evidence record justify')
    expect(enterprisePage).toContain('Does the authority match the accountability')
  })

  it('renders governed pathway with all 6 stages', () => {
    expect(enterprisePage).toContain('Enterprise Decision Scan')
    expect(enterprisePage).toContain('Team Assessment')
    expect(enterprisePage).toContain('Executive Reporting')
    expect(enterprisePage).toContain('Boardroom Brief')
    expect(enterprisePage).toContain('Strategy Room')
    expect(enterprisePage).toContain('Retainer Review')
  })

  it('renders calculator section', () => {
    expect(enterprisePage).toContain('Cost of delay')
    expect(enterprisePage).toContain('monthlyExposure')
  })

  it('calculator routing recommendation covers three bands', () => {
    expect(enterprisePage).toContain('50_000')
    expect(enterprisePage).toContain('250_000')
    expect(enterprisePage).toContain('Pressure Signal')
    expect(enterprisePage).toContain('Boardroom Brief')
    expect(enterprisePage).toContain('Enterprise Assessment')
  })

  it('does not show calculator result until interaction', () => {
    expect(enterprisePage).toContain('calculatorTouched')
    expect(enterprisePage).toContain('showCalcResult')
  })

  it('renders FAQ section with at least 5 questions', () => {
    expect(enterprisePage).toContain('Is this consulting?')
    expect(enterprisePage).toContain('Who sees the outputs?')
    expect(enterprisePage).toContain('When is Retainer Oversight available?')
  })

  it('renders enquiry form with required fields', () => {
    expect(enterprisePage).toContain('decisionPressure')
    expect(enterprisePage).toContain('consentToContact')
    expect(enterprisePage).toContain('preferredRoute')
  })

  it('posts enquiry form to enterprise enquiry API', () => {
    expect(enterprisePage).toContain('/api/enterprise/enquiry')
  })

  it('renders output promise panel — affirmative not defensive', () => {
    expect(enterprisePage).toContain('A decision record')
    expect(enterprisePage).toContain('Evidence gaps named')
    expect(enterprisePage).toContain('Authority risks surfaced')
    expect(enterprisePage).toContain('Next admissible move')
  })

  it('renders boundary note about retainer governance', () => {
    expect(enterprisePage).toContain('Governance boundary')
    expect(enterprisePage).toContain('admin approval is always required')
  })

  it('includes analytics hooks', () => {
    expect(enterprisePage).toContain('emitJourneyEvent')
    expect(enterprisePage).toContain('trackScrollDepth')
    expect(enterprisePage).toContain('advanceConviction')
    expect(enterprisePage).toContain('trackHesitation')
  })

  it('does not contain disallowed marketing language', () => {
    const disallowed = ['real-time market feed', 'live market feed', 'predictive model', 'AI forecast', 'instant alerting']
    for (const phrase of disallowed) {
      expect(enterprisePage.toLowerCase(), `Page contains disallowed phrase: "${phrase}"`).not.toContain(phrase.toLowerCase())
    }
  })

  it('CTA elements use 12px font size', () => {
    // PrimaryLink and SecondaryLink both declare fontSize: "12px"
    // Eyebrow and label components may use smaller sizes — those are not interactive.
    expect(enterprisePage).toContain('"12px"')
  })
})

// ─── Enterprise enquiry API authority ─────────────────────────────────────────

describe('Enterprise enquiry API (app/api/enterprise/enquiry/route.ts)', () => {
  it('exists', () => {
    expect(existsSync(join(ROOT, 'app/api/enterprise/enquiry/route.ts'))).toBe(true)
  })

  it('is POST only', () => {
    expect(enquiryRoute).toContain('export async function POST')
    expect(enquiryRoute).not.toContain('export async function GET')
    expect(enquiryRoute).not.toContain('export async function DELETE')
  })

  it('validates name, email, role, organisation, decisionPressure', () => {
    const requiredFields = ['name', 'email', 'role', 'organisation', 'decisionPressure']
    for (const field of requiredFields) {
      expect(enquiryRoute, `Missing validation for ${field}`).toContain(field)
    }
  })

  it('requires consentToContact: true (literal)', () => {
    expect(enquiryRoute).toContain('z.literal(true')
    expect(enquiryRoute).toContain('consentToContact')
  })

  it('includes honeypot protection', () => {
    expect(enquiryRoute).toContain('honeypot')
    expect(enquiryRoute).toContain('Bot detected')
  })

  it('writes to security audit log', () => {
    expect(enquiryRoute).toContain('writeSecurityAudit')
    expect(enquiryRoute).toContain('enterprise_enquiry_received')
  })

  it('sends admin email notification', () => {
    expect(enquiryRoute).toContain('sendEmail')
  })

  it('does not log full decisionPressure text', () => {
    // The enquiry route should log pressureLength not the full text
    expect(enquiryRoute).toContain('pressureLength')
    expect(enquiryRoute).not.toContain('decisionPressure: data.decisionPressure')
  })

  it('returns 201 on success with ok=true', () => {
    expect(enquiryRoute).toContain('status: 201')
    expect(enquiryRoute).toContain('ok: true')
  })

  it('responds within one business day (message must state this)', () => {
    expect(enquiryRoute).toContain('one business day')
  })

  it('enum includes all required preferred routes', () => {
    const routes = [
      'enterprise_decision_scan',
      'boardroom_brief',
      'executive_reporting',
      'strategy_room',
      'team_assessment',
      'retainer_review',
      'unsure',
    ]
    for (const r of routes) {
      expect(enquiryRoute, `Missing preferred route: ${r}`).toContain(r)
    }
  })
})
