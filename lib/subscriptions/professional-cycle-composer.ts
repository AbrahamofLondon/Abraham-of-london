export interface ProfessionalCycleInput {
  accountId: string;
  currentAccountState: string;
  activeDecisionIssues: string[];
  priorCommitments: string[];
}

export interface ProfessionalCycleOutput {
  accountId: string;
  currentAccountState: string;
  activeDecisionIssues: string[];
  priorCommitments: string[];
  movementSinceLastCycle: string;
  deteriorationOrImprovementSignals: string[];
  nextOversightAction: string;
  escalationTrigger: string;
  renewalContinuityValue: string;
}

export function composeProfessionalCycle(input: ProfessionalCycleInput): ProfessionalCycleOutput {
  return {
    accountId: input.accountId,
    currentAccountState: input.currentAccountState,
    activeDecisionIssues: input.activeDecisionIssues,
    priorCommitments: input.priorCommitments,
    movementSinceLastCycle: "Cycle movement must compare current state against prior commitments before release.",
    deteriorationOrImprovementSignals: ["Evidence movement", "Decision delay", "Owner clarity", "Escalation need"],
    nextOversightAction: "Select one oversight action that compounds decision memory and reduces next-cycle ambiguity.",
    escalationTrigger: "Escalate when unresolved issues create customer, commercial, governance, or delivery exposure.",
    renewalContinuityValue: "Renewal value must come from compounding memory, not repeated static reports.",
  };
}
