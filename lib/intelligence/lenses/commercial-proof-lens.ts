/**
 * lib/intelligence/lenses/commercial-proof-lens.ts — Commercial Proof Lens
 *
 * Assesses whether a commercial claim can survive buyer, regulator, or
 * competitor challenge. Produces claim inventory, proof basis, unsupported
 * claim flags, and a defensible narrowed claim.
 *
 * Used by: COMMERCIAL_AND_MARKET, FINANCIAL_AND_CAPITAL (pitch/claim),
 *          REPUTATIONAL_AND_EXPOSURE (public claim risk)
 */

import type { KernelLensResult, LensFinding, DecisionEvidenceNode, KernelContradiction, ConfidenceLevel } from '../types'

export async function commercialProofLens(rawContext: string): Promise<KernelLensResult> {
  const raw = rawContext.toLowerCase()
  const findings: LensFinding[] = []
  const evidenceNodes: DecisionEvidenceNode[] = []
  const contradictions: KernelContradiction[] = []

  // ── Claim inventory ──────────────────────────────────────────────────────
  const claims: Array<{ claim: string; evidence: string; supported: boolean }> = []

  // Market leadership / growth claims
  if (raw.includes('market leadership') || raw.includes('market leader') || raw.includes('leading')) {
    claims.push({
      claim: 'Market leadership or leading position',
      evidence: raw.includes('data') || raw.includes('survey') || raw.includes('report') || raw.includes('analyst') ? 'Referenced in text' : 'No supporting evidence cited',
      supported: raw.includes('data') || raw.includes('survey') || raw.includes('report') || raw.includes('analyst'),
    })
  }

  if (raw.includes('growth') || raw.includes('year-on-year') || raw.includes('yoy') || raw.includes('% growth')) {
    claims.push({
      claim: 'Growth rate or trajectory',
      evidence: raw.includes('revenue') || raw.includes('customer') || raw.includes('signed') ? 'Referenced in text' : 'Asserted without supporting data',
      supported: raw.includes('revenue') || raw.includes('customer') || raw.includes('signed'),
    })
  }

  if (raw.includes('customer') || raw.includes('user') || raw.includes('adoption') || raw.includes('beta')) {
    const hasNumbers = /\d+/.test(raw)
    claims.push({
      claim: 'Customer adoption or user base',
      evidence: hasNumbers ? `Quantified: ${raw.match(/\d+/)?.[0] ?? 'unknown'}` : 'Qualitative only — no numbers',
      supported: hasNumbers,
    })
  }

  if (raw.includes('revenue') || raw.includes('revenue model') || raw.includes('pricing')) {
    claims.push({
      claim: 'Revenue or pricing position',
      evidence: raw.includes('generating') || raw.includes('signed') || raw.includes('contracted') ? 'Revenue referenced as active' : 'Revenue referenced but not confirmed as generated',
      supported: raw.includes('generating') || raw.includes('signed') || raw.includes('contracted'),
    })
  }

  if (raw.includes('traction') || raw.includes('momentum') || raw.includes('adoption rate')) {
    claims.push({
      claim: 'Traction or momentum',
      evidence: raw.includes('data') || raw.includes('signed') || raw.includes('customer') ? 'Referenced with supporting context' : 'Asserted without supporting evidence',
      supported: raw.includes('data') || raw.includes('signed') || raw.includes('customer'),
    })
  }

  // ── Evidence assessment ──────────────────────────────────────────────────
  const unsupportedClaims = claims.filter(c => !c.supported)
  const totalClaims = claims.length

  if (unsupportedClaims.length > 0) {
    findings.push({
      domain: 'evidence',
      data: {
        type: 'unsupported_commercial_claims',
        count: unsupportedClaims.length,
        total: totalClaims,
        claims: unsupportedClaims.map(c => c.claim),
      },
    })

    for (const uc of unsupportedClaims) {
      evidenceNodes.push({
        kind: 'unsupported_claim',
        label: `Unsupported claim: ${uc.claim}`,
        summary: `${uc.claim} is asserted without supporting evidence. ${uc.evidence}`,
        severity: 'HIGH',
        confidence: 0.8,
        sourceStage: 'kernel',
        sourceLens: 'commercial-proof',
      })
    }

    // Adversarial challenge: hostile buyer/regulator would attack unsupported claims
    contradictions.push({
      id: 'commercial-claim-vs-evidence-gap',
      between: ['commercial-proof-lens', 'evidence-lens'],
      contradiction: `${unsupportedClaims.length} of ${totalClaims || 'several'} commercial claim(s) lack supporting evidence and would not survive buyer, regulator, or competitor challenge`,
      severity: unsupportedClaims.length > 1 ? 'CRITICAL' : 'HIGH',
      resolutionRule: '',
      outputEffect: '',
    })
  }

  // Defensible narrowed claim
  if (totalClaims > 0) {
    const supportedClaims = claims.filter(c => c.supported)
    if (supportedClaims.length > 0) {
      findings.push({
        domain: 'evidence',
        data: {
          type: 'defensible_narrowed_claim',
          description: `The strongest defensible position is to narrow from ${totalClaims} claim(s) to the ${supportedClaims.length} that have supporting evidence: ${supportedClaims.map(c => c.claim).join(', ')}`,
          narrowedClaims: supportedClaims.map(c => c.claim),
        },
      })
    } else {
      findings.push({
        domain: 'evidence',
        data: {
          type: 'no_defensible_claim',
          description: 'No claim currently has sufficient supporting evidence to survive challenge. The minimum viable path is to gather evidence before making any public claim.',
        },
      })
    }
  }

  // Forbidden action: do not publish unsupported claim
  if (unsupportedClaims.length > 0) {
    evidenceNodes.push({
      kind: 'forbidden_action',
      label: 'Forbidden: Publish unsupported commercial claim',
      summary: `Do not publish or present the following claim(s) without supporting evidence: ${unsupportedClaims.map(c => c.claim).join(', ')}`,
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'commercial-proof',
    })
  }

  // Minimum viable proof path
  if (unsupportedClaims.length > 0) {
    findings.push({
      domain: 'evidence',
      data: {
        type: 'minimum_viable_proof_path',
        description: unsupportedClaims.length === 1
          ? `Gather supporting evidence for: ${unsupportedClaims[0].claim}. A single data point, customer reference, or third-party validation may be sufficient.`
          : `Prioritise evidence gathering for the most critical claim: ${unsupportedClaims[0].claim}. Then address remaining ${unsupportedClaims.length - 1} claim(s).`,
      },
    })
  }

  return {
    lensId: 'commercial-proof',
    lensVersion: '1.0.0',
    applied: totalClaims > 0,
    confidence: totalClaims > 0 ? (unsupportedClaims.length === 0 ? 'HIGH' : 'MEDIUM') : 'LOW',
    findings,
    evidenceNodes,
    contradictions,
    recommendedEvents: [],
  }
}
