/**
 * lib/product/oversight-cycle-consequence-projection.ts
 *
 * Projects what happens if the client ignores the current oversight cycle.
 * Conservative and evidence-bound. No fake forecasting.
 */

import type { OversightBrief } from "@/lib/product/oversight-brief-contract";

type MovementDimension = "COST" | "COMMITMENT" | "RECURRENCE" | "OPTION_DECAY" | "IRREVERSIBILITY" | "LOSS";

type LikelyMovement = {
  dimension: MovementDimension;
  direction: "WORSENING" | "UNCHANGED" | "UNKNOWN";
  explanation: string;
};

export type CycleConsequenceProjection = {
  available: boolean;
  projection?: {
    summary: string;
    likelyMovement: LikelyMovement[];
    requiredAction: string;
  };
  warnings: string[];
};

export function projectOversightCycleConsequence(input: {
  costOfInaction?: OversightBrief["costOfInaction"];
  patternRecurrence?: OversightBrief["patternRecurrence"];
  verification?: OversightBrief["verification"];
  irreversibility?: OversightBrief["irreversibility"];
  strategicOptions?: OversightBrief["strategicOptions"];
  decisionLosses?: OversightBrief["decisionLosses"];
}): CycleConsequenceProjection {
  const movements: LikelyMovement[] = [];
  const warnings: string[] = [];

  // Cost
  if (input.costOfInaction && input.costOfInaction.totalEstimated > 0) {
    movements.push({
      dimension: "COST",
      direction: "WORSENING",
      explanation: `Cost of inaction is currently £${input.costOfInaction.totalEstimated.toLocaleString()} and will continue accumulating without intervention.`,
    });
  }

  // Commitment
  if (input.verification && input.verification.unresolvedBreaches > 0) {
    movements.push({
      dimension: "COMMITMENT",
      direction: "WORSENING",
      explanation: `${input.verification.unresolvedBreaches} unresolved commitment breach${input.verification.unresolvedBreaches !== 1 ? "es" : ""} will compound if not addressed.`,
    });
  } else if (input.verification && input.verification.commitmentsDue > 0) {
    movements.push({
      dimension: "COMMITMENT",
      direction: "WORSENING",
      explanation: `${input.verification.commitmentsDue} commitment${input.verification.commitmentsDue !== 1 ? "s" : ""} due for verification. Ignoring this cycle risks breach classification.`,
    });
  }

  // Recurrence
  if (input.patternRecurrence && (input.patternRecurrence.status === "POSSIBLE_RECURRENCE" || input.patternRecurrence.status === "VERIFIED_RECURRENCE")) {
    movements.push({
      dimension: "RECURRENCE",
      direction: "WORSENING",
      explanation: `Pattern recurrence is ${input.patternRecurrence.status === "VERIFIED_RECURRENCE" ? "verified" : "possible"}. Without structural correction, repetition will continue.`,
    });
  }

  // Option decay
  if (input.strategicOptions && input.strategicOptions.options.some((o) => o.status === "CLOSING")) {
    const closingCount = input.strategicOptions.options.filter((o) => o.status === "CLOSING").length;
    movements.push({
      dimension: "OPTION_DECAY",
      direction: "WORSENING",
      explanation: `${closingCount} strategic option${closingCount !== 1 ? "s are" : " is"} closing. Delay increases the risk of permanent option loss.`,
    });
  }

  // Irreversibility
  if (input.irreversibility && input.irreversibility.score >= 45) {
    movements.push({
      dimension: "IRREVERSIBILITY",
      direction: "WORSENING",
      explanation: `Irreversibility index is ${input.irreversibility.score}/100 (${input.irreversibility.level}). Without action, the situation moves closer to unrecoverable.`,
    });
  }

  // Loss
  if (input.decisionLosses && input.decisionLosses.entries.length > 0) {
    movements.push({
      dimension: "LOSS",
      direction: "WORSENING",
      explanation: `${input.decisionLosses.entries.length} realised loss${input.decisionLosses.entries.length !== 1 ? "es" : ""} recorded. Inaction risks additional permanent losses.`,
    });
  }

  if (movements.length === 0) {
    return {
      available: false,
      warnings: ["Insufficient evidence to project cycle consequence. Brief contains no material signals."],
    };
  }

  const worseningCount = movements.filter((m) => m.direction === "WORSENING").length;
  const summary = `If this oversight cycle is ignored, ${worseningCount} dimension${worseningCount !== 1 ? "s are" : " is"} likely to worsen: ${movements.filter((m) => m.direction === "WORSENING").map((m) => m.dimension.toLowerCase().replace("_", " ")).join(", ")}.`;

  const requiredAction = worseningCount >= 3
    ? "Immediate executive review required. Multiple dimensions are deteriorating simultaneously."
    : worseningCount >= 1
      ? "Address the worsening dimension before the next oversight cycle."
      : "Monitor current state.";

  return {
    available: true,
    projection: {
      summary,
      likelyMovement: movements,
      requiredAction,
    },
    warnings,
  };
}
