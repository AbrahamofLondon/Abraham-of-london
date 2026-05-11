import { generateForensicAccount } from "@/lib/sovereign/decision-forensics";

export type DecisionRisk = {
  summary: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

/**
 * @deprecated Use generateForensicAccount() from @/lib/sovereign/decision-forensics instead.
 * This function returns template strings. The forensics engine returns grounded
 * accounts of what actually happened to organisations facing the same decision.
 */
export function simulateDecisionRisk(input: {
  trajectory: string;
  readiness: number;
  authority: string;
}): DecisionRisk[] {
  const account = generateForensicAccount({
    type: "HOLD",
    trajectoryDirection: input.trajectory as "IMPROVING" | "STABLE" | "DETERIORATING",
    readinessScore: input.readiness,
    authorityClarity:
      input.authority === "DIRECT"
        ? "CLEAR"
        : input.authority === "DELEGATED"
          ? "CLEAR"
          : "CONTESTED",
  });

  return account.structuralWarnings.map((warning, i) => ({
    summary: warning,
    severity: i === 0 && input.trajectory === "DETERIORATING" ? "HIGH" : "MEDIUM",
  }));
}

export { generateForensicAccount };