/**
 * lib/product/retainer-intake-contract.ts
 *
 * Retainer/Oversight Intake v0 — governed oversight readiness intake.
 * This is not a marketing form. This is not a sales qualification quiz.
 * This captures the structural mandate for ongoing oversight.
 *
 * No React. No database dependency. Pure type contract.
 */

export type RetainerIntakeResponse = {
  oversightNeed: string;
  priorAttempts: string;
  failureCause: string;
  costExposure: string;
  irreversibilityConcern: string;
  authorityOwner: string;
  stopSignal: string;
  verificationCriteria: string;
  failureCriteria: string;
  refusalBoundary: string;
};

export type RetainerIntakeQuestion = {
  id: keyof RetainerIntakeResponse;
  label: string;
  question: string;
  placeholder: string;
  help?: string;
  required: boolean;
  rows: number;
};

export const RETAINER_INTAKE_QUESTIONS: RetainerIntakeQuestion[] = [
  {
    id: "oversightNeed",
    label: "Oversight mandate",
    question: "What decision, pattern, or organisational condition requires ongoing oversight?",
    placeholder: "Name the structural condition — not the project, not the initiative, but the thing that recurs or deteriorates without governed attention.",
    help: "If this can be fixed once and forgotten, it does not need a retainer. If it keeps returning, name it.",
    required: true,
    rows: 4,
  },
  {
    id: "priorAttempts",
    label: "Prior correction",
    question: "What has already been tried to resolve this?",
    placeholder: "Name the specific interventions, not 'we tried various things.' If nothing has been tried, say so.",
    required: true,
    rows: 3,
  },
  {
    id: "failureCause",
    label: "Why correction failed",
    question: "Why did the prior correction not hold?",
    placeholder: "Was it authority reversal? Stakeholder non-compliance? Resource withdrawal? Environmental change? Name the structural cause.",
    help: "This determines whether oversight addresses the root cause or repeats the failed pattern.",
    required: true,
    rows: 3,
  },
  {
    id: "costExposure",
    label: "Cost exposure",
    question: "What becomes more expensive if this continues without oversight?",
    placeholder: "Name the financial, reputational, structural, or political cost that accumulates each cycle.",
    required: true,
    rows: 3,
  },
  {
    id: "irreversibilityConcern",
    label: "Irreversibility",
    question: "What becomes harder to reverse the longer this goes unaddressed?",
    placeholder: "What options close? What damage compounds? What trust erodes?",
    required: true,
    rows: 3,
  },
  {
    id: "authorityOwner",
    label: "Authority",
    question: "Who has the authority to act on oversight recommendations?",
    placeholder: "Name the person or role. 'The board' or 'leadership team' is not specific enough.",
    required: true,
    rows: 2,
  },
  {
    id: "stopSignal",
    label: "Stop signal",
    question: "What must stop happening for the condition to improve?",
    placeholder: "Name the behaviour, decision pattern, or structural condition that must cease — not what must start.",
    help: "This is distinct from 'what must be done.' This asks what must end.",
    required: true,
    rows: 3,
  },
  {
    id: "verificationCriteria",
    label: "Success evidence",
    question: "What evidence would prove oversight is working after 30 days?",
    placeholder: "Name the observable change — not a feeling, not a metric. What would you point to?",
    required: true,
    rows: 3,
  },
  {
    id: "failureCriteria",
    label: "Failure evidence",
    question: "What evidence would prove oversight is failing after 30 days?",
    placeholder: "What would tell you this is not working? Name the specific signal.",
    required: false,
    rows: 2,
  },
  {
    id: "refusalBoundary",
    label: "Refusal boundary",
    question: "What should the system refuse to ignore, even if it is uncomfortable?",
    placeholder: "Name the thing that must be surfaced regardless of political cost or client discomfort.",
    help: "This defines the oversight boundary. The system will hold this line.",
    required: false,
    rows: 3,
  },
];

export function validateRetainerIntake(input: Partial<RetainerIntakeResponse>): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  for (const q of RETAINER_INTAKE_QUESTIONS) {
    if (q.required && !input[q.id]?.trim()) {
      missing.push(q.id);
    }
  }
  return { valid: missing.length === 0, missing };
}

export function retainerIntakeToEvidenceCapture(input: RetainerIntakeResponse): Record<string, string | undefined> {
  return {
    priorAttempts: input.priorAttempts?.trim() || undefined,
    failureCause: input.failureCause?.trim() || undefined,
    verificationCriteria: input.verificationCriteria?.trim() || undefined,
    stopSignal: input.stopSignal?.trim() || undefined,
    recurrenceSignal: input.oversightNeed?.trim() || undefined,
    escalationTrigger: input.irreversibilityConcern?.trim() || undefined,
    decisionDependency: input.authorityOwner?.trim() || undefined,
  };
}
