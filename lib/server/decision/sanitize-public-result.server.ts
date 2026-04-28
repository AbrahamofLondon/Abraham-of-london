import "server-only";

export type PublicDecisionResult = {
  state: "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
  directive: string;
  summary: string;
  recommendations: string[];
  escalation?: {
    required: boolean;
    label: string;
  };
};

export function sanitizePublicDecisionResult(input: {
  posture: PublicDecisionResult["state"];
  summary: string;
  recommendations: string[];
  route: string;
}): PublicDecisionResult {
  return {
    state: input.posture,
    directive: "Governed analysis complete.",
    summary: input.summary,
    recommendations: input.recommendations.slice(0, 4),
    escalation: {
      required: input.route === "STRATEGY",
      label: input.route === "STRATEGY" ? "Private escalation available" : "Further diagnosis required",
    },
  };
}
