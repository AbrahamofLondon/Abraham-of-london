import "server-only";

import { getDynamicThreshold, getDynamicWeightMultiplier } from "@/lib/security/dynamic-threshold";

export function resolveDynamicPolicy(input: {
  sessionContext: string;
  strategyBase?: number;
  diagnosticBase?: number;
}) {
  return {
    strategyGate: getDynamicThreshold(
      input.strategyBase ?? 65,
      `${input.sessionContext}:strategy`,
    ),
    diagnosticGate: getDynamicThreshold(
      input.diagnosticBase ?? 35,
      `${input.sessionContext}:diagnostic`,
    ),
    trustModifier: getDynamicWeightMultiplier(1, `${input.sessionContext}:trust`, {
      driftPercent: 0.04,
    }),
  };
}
