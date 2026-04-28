import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — public-safe. No internal signal names.
// ─────────────────────────────────────────────────────────────────────────────

export type ExecutionFailureInput = {
  state: string;
  publicConditions?: string[];
  directive: string;
};

export type ExecutionFailurePublic = {
  likelyFailureMode: string;
  whyExecutionWillStall: string;
  requiredCorrection: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function assessExecutionFailure(input: ExecutionFailureInput): ExecutionFailurePublic {
  const state = input.state.toUpperCase();
  const conditions = (input.publicConditions ?? []).map(c => c.toLowerCase());

  // Pattern matching on public-safe state + conditions
  if (state === "DISORDERED") {
    return {
      likelyFailureMode: "Authority collapse",
      whyExecutionWillStall: "No single authority can enforce the directive. Execution requires governance reconstruction before action.",
      requiredCorrection: "Establish a single decision authority with explicit mandate before attempting to execute. The directive is correct but the structure to enforce it does not exist.",
    };
  }

  if (state === "MISALIGNED") {
    const hasAuthorityCondition = conditions.some(c => c.includes("authority") || c.includes("ownership"));

    if (hasAuthorityCondition) {
      return {
        likelyFailureMode: "Contested ownership",
        whyExecutionWillStall: "The directive will stall because ownership is disputed or distributed. Multiple parties believe they hold authority, and none will defer.",
        requiredCorrection: "Name one accountable owner. Communicate the mandate explicitly. Remove shared ownership before issuing the next action.",
      };
    }

    return {
      likelyFailureMode: "Contradictory execution",
      whyExecutionWillStall: "Different parts of the organisation interpret the directive differently. Execution will diverge before completion.",
      requiredCorrection: "Define the outcome in one sentence. Validate that interpretation matches across at least two stakeholder groups before proceeding.",
    };
  }

  if (state === "DRIFTING") {
    return {
      likelyFailureMode: "Informal override",
      whyExecutionWillStall: "The formal directive will be acknowledged but not enforced. Informal decision patterns will override within the first cycle.",
      requiredCorrection: "Attach a measurable deadline and a named reporter. Without visible accountability, the drift will absorb the directive.",
    };
  }

  // ORDERED — execution should succeed
  return {
    likelyFailureMode: "Low risk",
    whyExecutionWillStall: "Current structural condition supports execution. Monitor for early resistance signals rather than anticipating systemic failure.",
    requiredCorrection: "Proceed with the directive. Establish a 30-day verification checkpoint to confirm the action held.",
  };
}
