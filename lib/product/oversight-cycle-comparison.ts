import type { OversightBrief } from "@/lib/product/oversight-brief-contract";

export function compareOversightCycles(input: {
  current: OversightBrief;
  previous?: OversightBrief;
}): {
  available: boolean;
  deltas: Array<{
    dimension:
      | "COST"
      | "COMMITMENT"
      | "RECURRENCE"
      | "DECISION_CREDIT"
      | "COUNSEL"
      | "BOARDROOM"
      | "OUTCOME"
      | "IRREVERSIBILITY";
    direction: "IMPROVED" | "WORSENED" | "UNCHANGED" | "NEW";
    explanation: string;
  }>;
  warnings: string[];
} {
  const previous = input.previous;
  if (!previous) {
    return {
      available: false,
      deltas: [],
      warnings: ["No previous oversight cycle exists. Trend comparison is unavailable."],
    };
  }

  const deltas: Array<{
    dimension:
      | "COST"
      | "COMMITMENT"
      | "RECURRENCE"
      | "DECISION_CREDIT"
      | "COUNSEL"
      | "BOARDROOM"
      | "OUTCOME"
      | "IRREVERSIBILITY";
    direction: "IMPROVED" | "WORSENED" | "UNCHANGED" | "NEW";
    explanation: string;
  }> = [];
  const warnings: string[] = [];

  const currentCost = input.current.costOfInaction?.totalEstimated ?? null;
  const previousCost = previous.costOfInaction?.totalEstimated ?? null;
  if (currentCost != null || previousCost != null) {
    const direction =
      previousCost == null && currentCost != null
        ? "NEW"
        : currentCost === previousCost
          ? "UNCHANGED"
          : (currentCost ?? 0) < (previousCost ?? 0)
            ? "IMPROVED"
            : "WORSENED";
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
    direction:
      currentCommitment === previousCommitment
        ? "UNCHANGED"
        : currentCommitment < previousCommitment
          ? "IMPROVED"
          : "WORSENED",
    explanation: `Unresolved commitment breaches moved from ${previousCommitment} to ${currentCommitment}.`,
  });

  const recurrenceCount = (brief: OversightBrief) =>
    brief.activeCases.filter((item) => (item.primaryRisk || "").toLowerCase().includes("recurrence")).length;
  const currentRecurrence = recurrenceCount(input.current);
  const previousRecurrence = recurrenceCount(previous);
  if (currentRecurrence > 0 || previousRecurrence > 0) {
    deltas.push({
      dimension: "RECURRENCE",
      direction:
        previousRecurrence === 0 && currentRecurrence > 0
          ? "NEW"
          : currentRecurrence === previousRecurrence
            ? "UNCHANGED"
            : currentRecurrence < previousRecurrence
              ? "IMPROVED"
              : "WORSENED",
      explanation: `Recurrence-linked cases moved from ${previousRecurrence} to ${currentRecurrence}.`,
    });
  } else {
    warnings.push("Recurrence movement is unavailable because neither cycle contains a persisted recurrence signal.");
  }

  const currentCredit = input.current.decisionCredit?.score;
  const previousCredit = previous.decisionCredit?.score;
  if (typeof currentCredit === "number" && typeof previousCredit === "number") {
    deltas.push({
      dimension: "DECISION_CREDIT",
      direction:
        currentCredit === previousCredit
          ? "UNCHANGED"
          : currentCredit > previousCredit
            ? "IMPROVED"
            : "WORSENED",
      explanation: `Decision credit moved from ${previousCredit} to ${currentCredit}.`,
    });
  } else {
    warnings.push("Decision credit movement is unavailable because one cycle lacks a credit score.");
  }

  const currentCounsel = input.current.counsel.requiredNow;
  const previousCounsel = previous.counsel.requiredNow;
  deltas.push({
    dimension: "COUNSEL",
    direction:
      previousCounsel === 0 && currentCounsel > 0
        ? "NEW"
        : currentCounsel === previousCounsel
          ? "UNCHANGED"
          : currentCounsel < previousCounsel
            ? "IMPROVED"
            : "WORSENED",
    explanation: `Counsel-required items moved from ${previousCounsel} to ${currentCounsel}.`,
  });

  const currentBoardroom = input.current.boardroom.dossiersAvailable;
  const previousBoardroom = previous.boardroom.dossiersAvailable;
  deltas.push({
    dimension: "BOARDROOM",
    direction:
      previousBoardroom === 0 && currentBoardroom > 0
        ? "NEW"
        : currentBoardroom === previousBoardroom
          ? "UNCHANGED"
          : currentBoardroom < previousBoardroom
            ? "IMPROVED"
            : "WORSENED",
    explanation: `Boardroom-qualified dossiers moved from ${previousBoardroom} to ${currentBoardroom}.`,
  });

  const currentOutcome =
    (input.current.retainedEnforcement?.improvementSignals ?? 0) - (input.current.retainedEnforcement?.deteriorationSignals ?? 0);
  const previousOutcome =
    (previous.retainedEnforcement?.improvementSignals ?? 0) - (previous.retainedEnforcement?.deteriorationSignals ?? 0);
  if (input.current.retainedEnforcement || previous.retainedEnforcement) {
    deltas.push({
      dimension: "OUTCOME",
      direction:
        currentOutcome === previousOutcome
          ? "UNCHANGED"
          : currentOutcome > previousOutcome
            ? "IMPROVED"
            : "WORSENED",
      explanation: `Net retained outcome movement shifted from ${previousOutcome} to ${currentOutcome}.`,
    });
  } else {
    warnings.push("Outcome movement is unavailable because no retained enforcement evidence exists in either cycle.");
  }

  const currentIrreversibility = input.current.retainedEnforcement?.enforcementBreaches;
  const previousIrreversibility = previous.retainedEnforcement?.enforcementBreaches;
  if (typeof currentIrreversibility === "number" && typeof previousIrreversibility === "number") {
    deltas.push({
      dimension: "IRREVERSIBILITY",
      direction:
        currentIrreversibility === previousIrreversibility
          ? "UNCHANGED"
          : currentIrreversibility < previousIrreversibility
            ? "IMPROVED"
            : "WORSENED",
      explanation: `Enforcement breaches as irreversibility proxy moved from ${previousIrreversibility} to ${currentIrreversibility}.`,
    });
  } else {
    warnings.push("Irreversibility movement is unavailable because no comparable enforcement-breach history exists.");
  }

  return {
    available: true,
    deltas,
    warnings,
  };
}
