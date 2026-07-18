export type DecisionEngineRole =
  | 'INTAKE_TRANSFORM'
  | 'EVALUATION_AUTHORITY'
  | 'JUDGEMENT_COMPOSER'
  | 'WORKFLOW_ORCHESTRATOR'
  | 'ADAPTER'
  | 'LEGACY'
  | 'DEAD_CODE'
  | 'UNKNOWN'

export type CanonicalArchitectureDecision =
  | 'LAYERED_CANONICAL_ARCHITECTURE'
  | 'INTELLIGENCE_KERNEL_CANONICAL'
  | 'DECISION_KERNEL_CANONICAL'
  | 'RETIRE_AND_REBUILD'

export const SELECTED_DECISION_AUTHORITY_ARCHITECTURE: CanonicalArchitectureDecision =
  'LAYERED_CANONICAL_ARCHITECTURE'

export const SINGLE_RECORD_CONTRACT = {
  canonicalCaseId: 'Every decision-processing workflow must carry exactly one canonical caseId.',
  canonicalJourneyId: 'Every persisted diagnostic workflow must carry exactly one canonical journeyId or explicitly document that no journey exists.',
  authoritativeStateVersion: 'Evaluation outputs must reference one authoritative decision-state version.',
  parentVersionLinkage: 'Derived state versions must link to their parent version and must not overwrite history silently.',
  idempotentRequestIdentity: 'Every write-capable workflow must accept or derive an idempotent request identity.',
  noIndependentKernelPersistence: 'Kernels may evaluate but must not become independent sources of canonical persistence.',
  derivedJudgementReference: 'Judgement composers must reference the authoritative state version rather than recalculate canonical evaluation facts.',
  orchestratorRoutingOnly: 'Orchestrators may route and sequence engines but must not become sources of truth.',
} as const

export type DecisionWorkflowInvocation = {
  workflowId: string
  route: string
  evaluationAuthorities: string[]
  judgementComposers: string[]
  canonicalDecisionRecordsCreated: string[]
  reconciliationContract?: string | null
}

export function assertSingleRecordContract(invocation: DecisionWorkflowInvocation): void {
  if (invocation.evaluationAuthorities.length > 1 && !invocation.reconciliationContract) {
    throw new Error(
      `Workflow ${invocation.workflowId} invokes multiple evaluation authorities without an explicit reconciliation contract.`,
    )
  }

  if (new Set(invocation.canonicalDecisionRecordsCreated).size !== invocation.canonicalDecisionRecordsCreated.length) {
    throw new Error(`Workflow ${invocation.workflowId} creates duplicate canonical decision records.`)
  }
}

export function classifyUserReportedHelpfulness(input: {
  caseId: string
  helpful: boolean | null
  note?: string | null
}) {
  return {
    caseId: input.caseId,
    signalType: 'USER_REPORTED_HELPFULNESS' as const,
    helpful: input.helpful,
    note: input.note?.slice(0, 500) ?? null,
    verifiedAction: false,
    verifiedOutcome: false,
    structuralChange: false,
    financialReturn: false,
  }
}

export function requiresMonetaryCostBeforeClaim(claimType: string): boolean {
  return [
    'NUMERICAL_ROI_CLAIM',
    'PERSONALISED_FINANCIAL_URGENCY',
    'COMMERCIAL_PRICING_COMPARISON',
    'COST_BASED_CHECKOUT_COPY',
  ].includes(claimType)
}
