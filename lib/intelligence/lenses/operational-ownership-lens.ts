/**
 * lib/intelligence/lenses/operational-ownership-lens.ts — Operational Ownership Lens
 *
 * Assesses whether operational ownership, accountability, and recovery
 * paths are clear. Produces decision owner, execution owner, failure owner,
 * handoff gaps, authority gaps, and recurrence risk.
 *
 * Used by: OPERATIONAL_AND_EXECUTION, PEOPLE_AND_AUTHORITY,
 *          TECHNOLOGY_AND_DEPENDENCY
 */

import type { KernelLensResult, LensFinding, DecisionEvidenceNode, KernelContradiction } from '../types'

export async function operationalOwnershipLens(rawContext: string): Promise<KernelLensResult> {
  const raw = rawContext.toLowerCase()
  const findings: LensFinding[] = []
  const evidenceNodes: DecisionEvidenceNode[] = []
  const contradictions: KernelContradiction[] = []

  // ── Ownership detection ──────────────────────────────────────────────────
  const hasClearOwner = raw.includes('responsible') || raw.includes('owner') || raw.includes('accountable') || raw.includes('assigned')
  const hasDisputedOwner = raw.includes('says it is') || raw.includes('not my') || raw.includes('not our') || raw.includes('blaming') || raw.includes('no one knows')
  const hasMultipleTeams = (raw.match(/team/g) || []).length > 1 || raw.includes('engineering') && raw.includes('operations') || raw.includes('infrastructure')
  const hasAuthorityGap = raw.includes('no authority') || raw.includes('cannot decide') || raw.includes('not authorised') || raw.includes('waiting for')
  const hasRecurrence = raw.includes('again') || raw.includes('recurring') || raw.includes('repeated') || raw.includes('always') || raw.includes('never')
  const hasVendorBlame = raw.includes('vendor') || raw.includes('supplier') || raw.includes('third-party') || raw.includes('external')

  // ── Ownership assessment ─────────────────────────────────────────────────
  if (!hasClearOwner || hasDisputedOwner) {
    if (hasDisputedOwner) {
      findings.push({
        domain: 'evidence',
        data: {
          type: 'ownership_disputed',
          description: 'Ownership is disputed between teams or individuals. Each party is attributing responsibility elsewhere.',
        },
      })
      findings.push({
        domain: 'constraint',
        data: {
          type: 'ownership',
          description: 'No clear owner for operational failure resolution — ownership is disputed between teams',
          severity: 'CRITICAL',
          isBinding: true,
        },
      })
      evidenceNodes.push({
        kind: 'ownership_gap',
        label: 'Ownership gap: Disputed accountability',
        summary: 'Multiple parties are attributing responsibility elsewhere. No one has accepted ownership. This is the primary failure mode — without clear ownership, no recovery action can be assigned.',
        severity: 'CRITICAL',
        confidence: 0.9,
        sourceStage: 'kernel',
        sourceLens: 'operational-ownership',
      })

      contradictions.push({
        id: 'ownership-vs-accountability',
        between: ['operational-ownership-lens', 'authority-lens'],
        contradiction: 'Operational ownership is disputed — each party attributes responsibility elsewhere. Without clear ownership, no recovery action can be assigned and the failure will recur.',
        severity: 'CRITICAL',
        resolutionRule: '',
        outputEffect: '',
      })
    }

    if (hasMultipleTeams && !hasClearOwner) {
      evidenceNodes.push({
        kind: 'ownership_gap',
        label: 'Ownership gap: Multiple teams, no clear owner',
        summary: 'Multiple teams are referenced but no single owner is identified. In multi-team operational failures, the absence of a designated owner guarantees coordination failure.',
        severity: 'HIGH',
        confidence: 0.8,
        sourceStage: 'kernel',
        sourceLens: 'operational-ownership',
      })
    }
  }

  // ── Authority gap ────────────────────────────────────────────────────────
  if (hasAuthorityGap) {
    findings.push({
      domain: 'authority',
      data: {
        type: 'authority_gap',
        description: 'The person or team responsible for resolution lacks the authority to act',
      },
    })
    evidenceNodes.push({
      kind: 'authority_gap',
      label: 'Authority gap: Responsible but not authorised',
      summary: 'The responsible party lacks authority to execute the required action. Authority must be delegated or escalated before resolution can proceed.',
      severity: 'HIGH',
      confidence: 0.8,
      sourceStage: 'kernel',
      sourceLens: 'operational-ownership',
    })
  }

  // ── Recovery path ────────────────────────────────────────────────────────
  if (hasDisputedOwner || hasAuthorityGap) {
    findings.push({
      domain: 'evidence',
      data: {
        type: 'recovery_path',
        description: hasDisputedOwner
          ? 'First step: Escalate to the authority that can assign ownership. The dispute itself must be resolved by someone with authority over all parties.'
          : 'First step: Clarify and delegate the authority needed for the responsible party to act.',
      },
    })
  }

  // ── Recurrence risk ──────────────────────────────────────────────────────
  if (hasRecurrence) {
    evidenceNodes.push({
      kind: 'recurrence_risk',
      label: 'Recurrence risk: Pattern of repeated failure',
      summary: 'The language suggests this is a recurring issue. Without root cause analysis and ownership assignment, the failure pattern will continue.',
      severity: 'HIGH',
      confidence: 0.7,
      sourceStage: 'kernel',
      sourceLens: 'operational-ownership',
    })

    findings.push({
      domain: 'evidence',
      data: {
        type: 'recurrence_risk',
        description: 'Recurring failure pattern detected. Root cause analysis and permanent ownership assignment are required to prevent recurrence.',
      },
    })
  }

  // ── Vendor blame deflection ──────────────────────────────────────────────
  if (hasVendorBlame && hasDisputedOwner) {
    evidenceNodes.push({
      kind: 'deflection_pattern',
      label: 'Deflection pattern: Internal teams blaming vendor',
      summary: 'Internal teams are attributing the failure to a vendor while disputing internal ownership. Even if the vendor is at fault, internal ownership for vendor management and resolution must be assigned.',
      severity: 'MEDIUM',
      confidence: 0.7,
      sourceStage: 'kernel',
      sourceLens: 'operational-ownership',
    })
  }

  // ── What must not be delayed ─────────────────────────────────────────────
  if (hasDisputedOwner) {
    evidenceNodes.push({
      kind: 'must_not_delay',
      label: 'Must not delay: Assign clear ownership',
      summary: 'Every hour without clear ownership is compounding the operational failure. Ownership must be assigned immediately by the authority that oversees all involved parties.',
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'operational-ownership',
    })
  }

  return {
    lensId: 'operational-ownership',
    lensVersion: '1.0.0',
    applied: hasDisputedOwner || !hasClearOwner || hasAuthorityGap || hasRecurrence,
    confidence: hasDisputedOwner ? 'HIGH' : 'MEDIUM',
    findings,
    evidenceNodes,
    contradictions,
    recommendedEvents: [],
  }
}
