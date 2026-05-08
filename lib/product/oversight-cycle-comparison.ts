import type { OversightBrief } from "@/lib/product/oversight-brief-contract";

export type OversightCycleComparisonDimension =
  | "SIGNAL_COUNT"
  | "COST"
  | "COMMITMENT"
  | "RECURRENCE"
  | "DECISION_CREDIT"
  | "COUNSEL"
  | "BOARDROOM"
  | "OUTCOME"
  | "IRREVERSIBILITY"
  | "OPTION_DECAY"
  | "LOSS_REGISTER"
  | "DEPENDENCY_RISK";

export type OversightCycleComparison = {
  available: boolean;
  deltas: Array<{
    dimension: OversightCycleComparisonDimension;
    direction: "IMPROVED" | "WORSENED" | "UNCHANGED" | "NEW";
    explanation: string;
  }>;
  warnings: string[];
};

function signalCount(brief: OversightBrief): number {
  return [
    brief.costOfInaction && brief.costOfInaction.totalEstimated > 0,
    brief.verification.unresolvedBreaches > 0,
    brief.patternRecurrence && brief.patternRecurrence.status !== "NO_PRIOR_PATTERN",
    brief.counsel.requiredNow > 0,
    brief.boardroom.dossiersAvailable > 0,
    brief.decisionCredit?.score != null,
    (brief.irreversibility?.score ?? 0) >= 45,
    (brief.strategicOptions?.options.length ?? 0) > 0,
    (brief.decisionLosses?.entries.length ?? 0) > 0,
    (brief.decisionDependencies?.conflicts.length ?? 0) > 0,
  ].filter(Boolean).length;
}

function recurrenceCount(brief: OversightBrief): number {
  return brief.patternRecurrence?.priorCount ?? 0;
}

function optionCount(brief: OversightBrief): number {
  return brief.strategicOptions?.options.filter((item) => item.status === "CLOSING" || item.status === "EXPIRED").length ?? 0;
}

function lossCount(brief: OversightBrief): number {
  return brief.decisionLosses?.entries.length ?? 0;
}

function dependencyCount(brief: OversightBrief): number {
  return brief.decisionDependencies?.conflicts.filter((item) => item.severity === "HIGH" || item.severity === "CRITICAL").length ?? 0;
}

function deltaDirection(input: { current: number | null; previous: number | null; lowerIsBetter?: boolean }): "IMPROVED" | "WORSENED" | "UNCHANGED" | "NEW" {
  const { current, previous, lowerIsBetter = false } = input;
  if (previous == null && current != null) return "NEW";
  if ((current ?? 0) === (previous ?? 0)) return "UNCHANGED";
  if (lowerIsBetter) {
    return (current ?? 0) < (previous ?? 0) ? "IMPROVED" : "WORSENED";
  }
  return (current ?? 0) > (previous ?? 0) ? "IMPROVED" : "WORSENED";
}

export function compareOversightCycles(input: {
  current: OversightBrief;
  previous?: OversightBrief;
}): OversightCycleComparison {
  const previous = input.previous;
  if (!previous) {
    return {
      available: false,
      deltas: [],
      warnings: ["No previous oversight cycle exists. Trend comparison is unavailable."],
    };
  }

  const deltas: OversightCycleComparison["deltas"] = [];
  const warnings: string[] = [];

  const currentSignalCount = signalCount(input.current);
  const previousSignalCount = signalCount(previous);
  deltas.push({
    dimension: "SIGNAL_COUNT",
    direction: deltaDirection({ current: currentSignalCount, previous: previousSignalCount }),
    explanation: `Visible oversight signal count moved from ${previousSignalCount} to ${currentSignalCount}.`,
  });

  const currentCost = input.current.costOfInaction?.totalEstimated ?? null;
  const previousCost = previous.costOfInaction?.totalEstimated ?? null;
  if (currentCost != null || previousCost != null) {
    const direction = deltaDirection({ current: currentCost, previous: previousCost, lowerIsBetter: true });
    deltas.push({
      dimension: "COST",
      direction,
      explanation:
        direction === "NEW"
          ? `Cost exposure is now visible at ${currentCost ?? 0}.`
          : `Cost exposure moved from ${previousCost ?? 0} to ${currentCost ?? 0}.`,
    });
  } else {
    warnings.push("Cost movement is unavailable because no cost basis exists in either cycle.");
  }

  const currentCommitment = input.current.verification.unresolvedBreaches;
  const previousCommitment = previous.verification.unresolvedBreaches;
  deltas.push({
    dimension: "COMMITMENT",
    direction: deltaDirection({ current: currentCommitment, previous: previousCommitment, lowerIsBetter: true }),
    explanation: `Unresolved commitment breaches moved from ${previousCommitment} to ${currentCommitment}.`,
  });

  const currentRecurrence = recurrenceCount(input.current);
  const previousRecurrence = recurrenceCount(previous);
  if (currentRecurrence > 0 || previousRecurrence > 0) {
    deltas.push({
      dimension: "RECURRENCE",
      direction: deltaDirection({ current: currentRecurrence, previous: previousRecurrence, lowerIsBetter: true }),
      explanation: `Persisted recurrence count moved from ${previousRecurrence} to ${currentRecurrence}.`,
    });
  } else {
    warnings.push("Recurrence movement is unavailable because neither cycle contains a persisted recurrence signal.");
  }

  const currentCredit = input.current.decisionCredit?.score ?? null;
  const previousCredit = previous.decisionCredit?.score ?? null;
  if (currentCredit != null && previousCredit != null) {
    deltas.push({
      dimension: "DECISION_CREDIT",
      direction: deltaDirection({ current: currentCredit, previous: previousCredit }),
      explanation: `Decision credit moved from ${previousCredit} to ${currentCredit}.`,
    });
  } else {
    warnings.push("Decision credit movement is unavailable because one cycle lacks a credit score.");
  }

  const currentCounsel = input.current.counsel.requiredNow;
  const previousCounsel = previous.counsel.requiredNow;
  deltas.push({
    dimension: "COUNSEL",
    direction: deltaDirection({ current: currentCounsel, previous: previousCounsel, lowerIsBetter: true }),
    explanation: `Counsel-required items moved from ${previousCounsel} to ${currentCounsel}.`,
  });

  const currentBoardroom = input.current.boardroom.dossiersAvailable;
  const previousBoardroom = previous.boardroom.dossiersAvailable;
  deltas.push({
    dimension: "BOARDROOM",
    direction: deltaDirection({ current: currentBoardroom, previous: previousBoardroom, lowerIsBetter: true }),
    explanation: `Boardroom-qualified dossiers moved from ${previousBoardroom} to ${currentBoardroom}.`,
  });

  const currentOutcome = (input.current.retainedEnforcement?.improvementSignals ?? 0) - (input.current.retainedEnforcement?.deteriorationSignals ?? 0);
  const previousOutcome = (previous.retainedEnforcement?.improvementSignals ?? 0) - (previous.retainedEnforcement?.deteriorationSignals ?? 0);
  if (input.current.retainedEnforcement || previous.retainedEnforcement) {
    deltas.push({
      dimension: "OUTCOME",
      direction: deltaDirection({ current: currentOutcome, previous: previousOutcome }),
      explanation: `Net retained outcome movement shifted from ${previousOutcome} to ${currentOutcome}.`,
    });
  } else {
    warnings.push("Outcome movement is unavailable because no retained enforcement evidence exists in either cycle.");
  }

  const currentIrreversibility = input.current.irreversibility?.score
    ?? input.current.retainedEnforcement?.enforcementBreaches
    ?? null;
  const previousIrreversibility = previous.irreversibility?.score
    ?? previous.retainedEnforcement?.enforcementBreaches
    ?? null;
  if (currentIrreversibility != null || previousIrreversibility != null) {
    deltas.push({
      dimension: "IRREVERSIBILITY",
      direction: deltaDirection({ current: currentIrreversibility, previous: previousIrreversibility, lowerIsBetter: true }),
      explanation: `Irreversibility pressure moved from ${previousIrreversibility ?? 0} to ${currentIrreversibility ?? 0}.`,
    });
  } else {
    warnings.push("Irreversibility movement is unavailable because no comparable irreversibility history exists.");
  }

  const currentOptionDecay = optionCount(input.current);
  const previousOptionDecay = optionCount(previous);
  if (currentOptionDecay > 0 || previousOptionDecay > 0) {
    deltas.push({
      dimension: "OPTION_DECAY",
      direction: deltaDirection({ current: currentOptionDecay, previous: previousOptionDecay, lowerIsBetter: true }),
      explanation: `Closing or expired strategic options moved from ${previousOptionDecay} to ${currentOptionDecay}.`,
    });
  } else {
    warnings.push("Option decay movement is unavailable because neither cycle contains a persisted option-risk signal.");
  }

  const currentLossCount = lossCount(input.current);
  const previousLossCount = lossCount(previous);
  if (currentLossCount > 0 || previousLossCount > 0) {
    deltas.push({
      dimension: "LOSS_REGISTER",
      direction: deltaDirection({ current: currentLossCount, previous: previousLossCount, lowerIsBetter: true }),
      explanation: `Persisted loss register entries moved from ${previousLossCount} to ${currentLossCount}.`,
    });
  } else {
    warnings.push("Loss register movement is unavailable because no decision losses are archived in either cycle.");
  }

  const currentDependencyCount = dependencyCount(input.current);
  const previousDependencyCount = dependencyCount(previous);
  if (currentDependencyCount > 0 || previousDependencyCount > 0) {
    deltas.push({
      dimension: "DEPENDENCY_RISK",
      direction: deltaDirection({ current: currentDependencyCount, previous: previousDependencyCount, lowerIsBetter: true }),
      explanation: `High-severity dependency conflicts moved from ${previousDependencyCount} to ${currentDependencyCount}.`,
    });
  } else {
    warnings.push("Dependency risk movement is unavailable because neither cycle contains persisted high-severity dependency conflicts.");
  }

  return {
    available: true,
    deltas,
    warnings,
  };
}
