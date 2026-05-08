import {
  type AssessmentEvidenceCapture,
  isUnsafeAssessmentEvidenceText,
  summarizeAssessmentEvidenceText,
} from "@/lib/product/evidence-capture-contract";

export type EvidenceCarryForwardRow = {
  key: keyof AssessmentEvidenceCapture;
  label: string;
  value: string;
  accent: string;
};

export type EvidenceCarryForwardDisplay = {
  title: string;
  intro: string;
  impact?: string;
  rows: EvidenceCarryForwardRow[];
};

function safeValue(value: string | undefined, max = 220): string | null {
  if (!value) return null;
  if (isUnsafeAssessmentEvidenceText(value)) {
    return "Evidence captured but withheld from display.";
  }
  return summarizeAssessmentEvidenceText(value, max);
}

function pushRow(
  rows: EvidenceCarryForwardRow[],
  evidence: AssessmentEvidenceCapture,
  config: {
    key: keyof AssessmentEvidenceCapture;
    label: string;
    accent: string;
    fallback?: string;
    max?: number;
  },
) {
  const raw = evidence[config.key];
  if (!raw) return;
  const nextValue = safeValue(raw, config.max ?? 220);
  if (!nextValue) return;
  rows.push({
    key: config.key,
    label: config.label,
    value: config.fallback ?? nextValue,
    accent: config.accent,
  });
}

export function buildExecutiveEvidenceCarryForward(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "decisionDependency",
    label: "Decision dependency",
    accent: "rgba(201,169,110,0.75)",
  });
  pushRow(rows, evidence, {
    key: "failureCause",
    label: "Reported failure cause",
    accent: "rgba(252,165,165,0.72)",
  });
  pushRow(rows, evidence, {
    key: "priorAttempts",
    label: "Prior attempts",
    accent: "rgba(201,169,110,0.75)",
    fallback: "Earlier correction attempts were reported.",
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "Declared verification standard",
    accent: "rgba(110,231,183,0.72)",
  });
  pushRow(rows, evidence, {
    key: "escalationTrigger",
    label: "Captured escalation threshold",
    accent: "rgba(252,165,165,0.75)",
  });

  if (!rows.length) return null;

  let impact = "The recommendation stays governed against prior failure history rather than treating this as a new condition.";
  if (evidence.decisionDependency) {
    impact = "The recommendation is being shaped around the unresolved dependency rather than assuming execution authority already exists.";
  } else if (evidence.failureCause || evidence.priorAttempts) {
    impact = "The recommendation has been narrowed to avoid repeating earlier correction logic that was reported to fail or fail to hold.";
  } else if (evidence.verificationCriteria) {
    impact = "The recommendation is being shaped against the declared verification standard rather than generic progress language.";
  }

  return {
    title: "Evidence carried forward",
    intro: "This report has inherited prior governance evidence. It affects the recommendation because earlier failure logic, dependency, or proof standards remain relevant.",
    impact,
    rows: rows.slice(0, 3),
  };
}

export function buildStrategyEntryEvidenceMemory(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "failureCause",
    label: "Reported failure cause",
    accent: "rgba(252,165,165,0.72)",
  });
  pushRow(rows, evidence, {
    key: "priorAttempts",
    label: "Prior attempts",
    accent: "rgba(201,169,110,0.75)",
    fallback: "Earlier correction attempts were reported.",
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "Declared verification standard",
    accent: "rgba(110,231,183,0.72)",
  });
  pushRow(rows, evidence, {
    key: "decisionDependency",
    label: "Dependency to resolve",
    accent: "rgba(201,169,110,0.75)",
  });
  pushRow(rows, evidence, {
    key: "escalationTrigger",
    label: "Captured escalation threshold",
    accent: "rgba(252,165,165,0.75)",
  });

  if (!rows.length) return null;

  return {
    title: "Execution memory",
    intro: "Before execution begins, the system is carrying forward the following unresolved constraints.",
    rows,
  };
}

export function buildStrategySessionEvidenceMemory(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "failureCause",
    label: "Reported failure cause",
    accent: "rgba(252,165,165,0.72)",
    max: 180,
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "Declared verification standard",
    accent: "rgba(110,231,183,0.72)",
    max: 180,
  });
  pushRow(rows, evidence, {
    key: "stopSignal",
    label: "Stop condition",
    accent: "rgba(253,186,116,0.72)",
    max: 180,
  });
  pushRow(rows, evidence, {
    key: "escalationTrigger",
    label: "Captured escalation threshold",
    accent: "rgba(252,165,165,0.75)",
    max: 180,
  });

  if (!rows.length) return null;

  return {
    title: "Unresolved execution memory",
    intro: "These items remain active in this session. They should shape what is committed, stopped, or escalated.",
    rows: rows.slice(0, 4),
  };
}

export function buildDecisionCentreCaseMemory(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "priorAttempts",
    label: "What has already been tried",
    accent: "rgba(201,169,110,0.75)",
  });
  pushRow(rows, evidence, {
    key: evidence.failureCause ? "failureCause" : evidence.decisionDependency ? "decisionDependency" : "stopSignal",
    label: "What remains unresolved",
    accent: "rgba(252,165,165,0.72)",
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "What would count as proof",
    accent: "rgba(110,231,183,0.72)",
  });

  if (!rows.length) return null;

  return {
    title: "Case memory",
    intro: "This case is carrying forward prior evidence. The next step should not ignore it.",
    rows: rows.slice(0, 3),
  };
}
