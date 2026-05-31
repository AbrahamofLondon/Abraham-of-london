/**
 * lib/intelligence/lenses/investor-diligence-lens.ts — Investor Diligence Lens
 *
 * Assesses whether an investor pitch or fundraising claim can survive
 * due diligence. Produces traction claim inventory, committed vs projected
 * revenue separation, due diligence attack surface, and financial promotion
 * boundary check.
 *
 * Used by: FINANCIAL_AND_CAPITAL, COMMERCIAL_AND_MARKET (pitch/traction/raise)
 */

import type { KernelLensResult, LensFinding, DecisionEvidenceNode, KernelContradiction } from '../types'

export async function investorDiligenceLens(rawContext: string): Promise<KernelLensResult> {
  const raw = rawContext.toLowerCase()
  const findings: LensFinding[] = []
  const evidenceNodes: DecisionEvidenceNode[] = []
  const contradictions: KernelContradiction[] = []

  // ── Traction claim inventory ─────────────────────────────────────────────
  const claims: Array<{ claim: string; category: 'growth' | 'revenue' | 'customer' | 'market'; supported: boolean; evidence: string }> = []

  if (raw.includes('growth') || raw.includes('% growth') || raw.includes('year-on-year') || raw.includes('yoy')) {
    claims.push({
      claim: 'Growth rate or trajectory',
      category: 'growth',
      supported: /\d+%/.test(raw) && (raw.includes('audited') || raw.includes('verified') || raw.includes('signed')),
      evidence: /\d+%/.test(raw) ? `Growth rate cited: ${raw.match(/\d+%/)?.[0] ?? 'unknown'}` : 'Growth asserted without percentage',
    })
  }

  if (raw.includes('revenue') || raw.includes('arr') || raw.includes('mrr') || raw.includes('turnover')) {
    const hasCommitted = raw.includes('signed') || raw.includes('contracted') || raw.includes('committed')
    const hasProjected = raw.includes('projected') || raw.includes('forecast') || raw.includes('expected') || raw.includes('pipeline')
    claims.push({
      claim: 'Revenue position',
      category: 'revenue',
      supported: hasCommitted && !hasProjected,
      evidence: hasCommitted && hasProjected
        ? 'Revenue includes both committed and projected figures — these must be separated for due diligence'
        : hasCommitted ? 'Revenue referenced as committed/signed' : 'Revenue referenced but not confirmed as committed',
    })
  }

  if (raw.includes('customer') || raw.includes('client') || raw.includes('user') || raw.includes('beta')) {
    const hasNumbers = /\d+/.test(raw)
    claims.push({
      claim: 'Customer or user base',
      category: 'customer',
      supported: hasNumbers && (raw.includes('signed') || raw.includes('paying') || raw.includes('active')),
      evidence: hasNumbers ? `Customer count cited: ${raw.match(/\d+/)?.[0] ?? 'unknown'}` : 'Customer base asserted without numbers',
    })
  }

  if (raw.includes('market') || raw.includes('tam') || raw.includes('sam') || raw.includes('som') || raw.includes('market size')) {
    claims.push({
      claim: 'Market size or position',
      category: 'market',
      supported: raw.includes('source') || raw.includes('report') || raw.includes('analyst') || raw.includes('third-party'),
      evidence: raw.includes('source') || raw.includes('report') ? 'Market data cited with source' : 'Market claim without cited source',
    })
  }

  // ── Committed vs projected separation ────────────────────────────────────
  const hasCommittedRevenue = raw.includes('signed') || raw.includes('contracted') || raw.includes('committed')
  const hasProjectedRevenue = raw.includes('projected') || raw.includes('forecast') || raw.includes('pipeline') || raw.includes('expected')
  const hasInvestorInterest = raw.includes('interested') || raw.includes('discussion') || raw.includes('lead investor') || raw.includes('term sheet')

  if (hasCommittedRevenue && hasProjectedRevenue) {
    evidenceNodes.push({
      kind: 'diligence_warning',
      label: 'Diligence: Committed and projected revenue not separated',
      summary: 'The pitch appears to mix committed revenue (signed/contracted) with projected revenue (pipeline/forecast). These must be clearly separated for due diligence. Presenting projected revenue as committed is a known investor claim risk.',
      severity: 'HIGH',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'investor-diligence',
    })
  }

  if (hasInvestorInterest && !hasCommittedRevenue) {
    evidenceNodes.push({
      kind: 'diligence_warning',
      label: 'Diligence: Investor interest without committed revenue',
      summary: 'Investor interest or discussions are referenced but no committed revenue is cited. Due diligence will probe the gap between interest and commitment.',
      severity: 'MEDIUM',
      confidence: 0.7,
      sourceStage: 'kernel',
      sourceLens: 'investor-diligence',
    })
  }

  // ── Due diligence attack surface ─────────────────────────────────────────
  const unsupportedClaims = claims.filter(c => !c.supported)
  if (unsupportedClaims.length > 0) {
    contradictions.push({
      id: 'investor-claim-vs-evidence',
      between: ['investor-diligence-lens', 'evidence-lens'],
      contradiction: `${unsupportedClaims.length} claim(s) in the investor narrative would not survive due diligence: ${unsupportedClaims.map(c => `${c.claim} (${c.category})`).join(', ')}`,
      severity: unsupportedClaims.length > 1 ? 'CRITICAL' : 'HIGH',
      resolutionRule: '',
      outputEffect: '',
    })

    for (const uc of unsupportedClaims) {
      evidenceNodes.push({
        kind: 'diligence_risk',
        label: `Due diligence risk: ${uc.claim}`,
        summary: `${uc.claim} would be challenged in due diligence. ${uc.evidence}`,
        severity: 'HIGH',
        confidence: 0.8,
        sourceStage: 'kernel',
        sourceLens: 'investor-diligence',
      })
    }
  }

  // ── Financial promotion boundary ─────────────────────────────────────────
  if (raw.includes('investor') || raw.includes('raise') || raw.includes('fundraising') || raw.includes('series')) {
    evidenceNodes.push({
      kind: 'financial_promotion_boundary',
      label: 'Boundary: Financial promotion regulation may apply',
      summary: 'If this pitch is being made to UK investors, financial promotion regulations may apply. Claims about growth, revenue, or market position must be clear, fair, and not misleading. The system cannot provide regulated financial promotion advice.',
      severity: 'MEDIUM',
      confidence: 0.8,
      sourceStage: 'kernel',
      sourceLens: 'investor-diligence',
    })
  }

  // ── Defensible investor claim ────────────────────────────────────────────
  const supportedClaims = claims.filter(c => c.supported)
  if (supportedClaims.length > 0) {
    findings.push({
      domain: 'evidence',
      data: {
        type: 'defensible_investor_claim',
        description: `The strongest defensible investor narrative focuses on: ${supportedClaims.map(c => c.claim).join(', ')}. These claims have supporting evidence and would survive initial due diligence.`,
      },
    })
  }

  // ── Forbidden actions ────────────────────────────────────────────────────
  if (hasProjectedRevenue && !hasCommittedRevenue) {
    evidenceNodes.push({
      kind: 'forbidden_action',
      label: 'Forbidden: Present projected revenue as committed or confirmed',
      summary: 'Do not present pipeline, forecast, or projected revenue as committed or confirmed revenue. This is a known due diligence failure point and may constitute misrepresentation.',
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'investor-diligence',
    })
  }

  return {
    lensId: 'investor-diligence',
    lensVersion: '1.0.0',
    applied: claims.length > 0,
    confidence: claims.length > 0 ? (unsupportedClaims.length === 0 ? 'HIGH' : 'MEDIUM') : 'LOW',
    findings,
    evidenceNodes,
    contradictions,
    recommendedEvents: [],
  }
}
