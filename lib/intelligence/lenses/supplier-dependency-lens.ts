/**
 * lib/intelligence/lenses/supplier-dependency-lens.ts — Supplier Dependency Lens
 *
 * Assesses supplier or vendor dependency risk. Produces dependency type,
 * single-source risk, switching time, substitution feasibility, and
 * continuity path.
 *
 * Used by: OPERATIONAL_AND_EXECUTION, TECHNOLOGY_AND_DEPENDENCY,
 *          LEGAL_AND_CONTRACTUAL (vendor/supplier/dependency)
 */

import type { KernelLensResult, LensFinding, DecisionEvidenceNode, KernelContradiction, DecisionConstraint } from '../types'

export async function supplierDependencyLens(rawContext: string): Promise<KernelLensResult> {
  const raw = rawContext.toLowerCase()
  const findings: LensFinding[] = []
  const evidenceNodes: DecisionEvidenceNode[] = []
  const contradictions: KernelContradiction[] = []

  // ── Dependency detection ─────────────────────────────────────────────────
  const isSoleSupplier = raw.includes('sole supplier') || raw.includes('only supplier') || raw.includes('single source')
  const hasForceMajeure = raw.includes('force majeure') || raw.includes('cannot guarantee') || raw.includes('cannot deliver')
  const hasSwitchingTime = raw.includes('weeks') || raw.includes('months') || raw.includes('qualification') || raw.includes('switching')
  const hasInventory = raw.includes('inventory') || raw.includes('stock') || raw.includes('weeks of') || raw.includes('months of')
  const hasContractLeverage = raw.includes('contract') || raw.includes('sla') || raw.includes('service level') || raw.includes('penalty')
  const hasCustomerImpact = raw.includes('customer') || raw.includes('client') || raw.includes('order') || raw.includes('firm order')
  const hasPenaltyExposure = raw.includes('penalty') || raw.includes('liable') || raw.includes('cannot absorb') || raw.includes('fine')

  // ── Constraint mapping ───────────────────────────────────────────────────
  if (isSoleSupplier) {
    findings.push({
      domain: 'constraint',
      data: {
        type: 'dependency',
        description: 'Sole supplier dependency — no alternative source for critical component or service',
        severity: 'CRITICAL',
        isBinding: true,
      },
    })
    evidenceNodes.push({
      kind: 'dependency_constraint',
      label: 'Constraint: Sole supplier dependency',
      summary: 'The organisation depends on a single supplier with no qualified alternative. This creates critical vulnerability.',
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'supplier-dependency',
    })
  }

  if (hasForceMajeure) {
    findings.push({
      domain: 'constraint',
      data: {
        type: 'delivery',
        description: 'Supplier has issued force majeure or cannot guarantee delivery — supply is interrupted',
        severity: 'CRITICAL',
        isBinding: true,
      },
    })
    evidenceNodes.push({
      kind: 'supply_interruption',
      label: 'Constraint: Supply interruption',
      summary: 'Supplier cannot guarantee delivery. Supply is interrupted with no confirmed resolution timeline.',
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'supplier-dependency',
    })
  }

  if (hasSwitchingTime) {
    findings.push({
      domain: 'constraint',
      data: {
        type: 'time',
        description: 'Switching to alternative supplier requires significant lead time',
        severity: 'HIGH',
        isBinding: true,
      },
    })
    evidenceNodes.push({
      kind: 'switching_constraint',
      label: 'Constraint: Switching lead time',
      summary: 'Qualifying and switching to an alternative supplier requires significant time that may exceed available inventory.',
      severity: 'HIGH',
      confidence: 0.8,
      sourceStage: 'kernel',
      sourceLens: 'supplier-dependency',
    })
  }

  if (hasCustomerImpact && hasPenaltyExposure) {
    contradictions.push({
      id: 'supply-failure-vs-customer-obligation',
      between: ['supplier-dependency-lens', 'obligation-lens'],
      contradiction: 'Supply interruption creates inability to meet customer obligations, with penalty exposure',
      severity: 'CRITICAL',
      resolutionRule: '',
      outputEffect: '',
    })
  }

  // ── Continuity path ──────────────────────────────────────────────────────
  if (isSoleSupplier || hasForceMajeure) {
    const inventoryWeeks = raw.match(/(\d+)\s*weeks?\s+of\s+(inventory|stock|supply)/)
    const switchingWeeks = raw.match(/(\d+)\s*weeks?\s+(qualification|switching|lead)/)

    let continuityNote = 'Supply continuity is at risk. '
    if (inventoryWeeks && switchingWeeks) {
      const inv = parseInt(inventoryWeeks[1])
      const sw = parseInt(switchingWeeks[1])
      if (inv < sw) {
        continuityNote += `Current inventory (${inv} weeks) is insufficient to cover switching time (${sw} weeks). Gap: ${sw - inv} weeks.`
      } else {
        continuityNote += `Current inventory (${inv} weeks) may cover switching time (${sw} weeks).`
      }
    } else if (inventoryWeeks) {
      continuityNote += `Current inventory: ${inventoryWeeks[1]} weeks.`
    }

    findings.push({
      domain: 'evidence',
      data: {
        type: 'continuity_assessment',
        description: continuityNote,
      },
    })

    // Forbidden action
    evidenceNodes.push({
      kind: 'forbidden_action',
      label: 'Forbidden: Assume supply will resume without confirmed commitment',
      summary: 'Do not assume the supplier will resume delivery without a confirmed written commitment and recovery timeline.',
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'supplier-dependency',
    })
  }

  // ── Contract leverage ────────────────────────────────────────────────────
  if (!hasContractLeverage && (isSoleSupplier || hasForceMajeure)) {
    evidenceNodes.push({
      kind: 'contract_gap',
      label: 'Gap: No contract leverage referenced',
      summary: 'No contract, SLA, or penalty clause is referenced. Without contractual leverage, the organisation has limited recourse.',
      severity: 'HIGH',
      confidence: 0.7,
      sourceStage: 'kernel',
      sourceLens: 'supplier-dependency',
    })
  }

  return {
    lensId: 'supplier-dependency',
    lensVersion: '1.0.0',
    applied: isSoleSupplier || hasForceMajeure || hasSwitchingTime,
    confidence: isSoleSupplier || hasForceMajeure ? 'HIGH' : 'MEDIUM',
    findings,
    evidenceNodes,
    contradictions,
    recommendedEvents: [],
  }
}
