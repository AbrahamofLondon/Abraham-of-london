import { noStoreJson } from "@/lib/server/security/app-route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_GOVERNED_DECISION = {
  inputQuality: {
    decisionClarity: "high",
    evidenceDensity: "multi-source",
    authorityStated: true,
    deadlineStated: true,
    deterministic: true,
  },
  c3Score: {
    clarity: 0.82,
    context: 0.78,
    consequence: 0.74,
    specificityScore: 0.78,
    tier: "FULL_SYNTHESIS",
    confidenceBand: "high",
  },
  contradictions: [
    "The sponsor says execution is urgent, but no owner has been given authority to force the move.",
    "The decision has a stated deadline, but the current process still routes through a committee without binding accountability.",
  ],
  decisionKernelDirective: {
    required: "Escalate to named authority and replace committee approval with one accountable owner.",
    blocked: true,
    reason: "Execution cannot proceed while authority remains distributed across a non-binding committee.",
  },
  refusalOrRestrictionReason:
    "Strategy escalation is restricted until one binding owner is named and the approval path is reduced to a single accountable decision-maker.",
  actionSimulation: [
    {
      action: "escalate",
      immediateEffect: "Escalation surfaces the authority vacuum and forces a named authority response.",
      riskShift: "decreases",
      recommendation: "Escalate with evidence and a deadline.",
      confidence: 0.82,
    },
    {
      action: "do nothing",
      immediateEffect: "Informal authority continues to fill the vacuum.",
      riskShift: "increases",
      recommendation: "Do not treat delay as neutral. It compounds governance drift.",
      confidence: 0.79,
    },
  ],
  evidenceTier: "multi_source",
  nextRequiredAction:
    "Name the single accountable owner and attach a non-delegable deadline before execution is permitted.",
} as const;

export async function GET() {
  return noStoreJson({
    ok: true,
    demo: DEMO_GOVERNED_DECISION,
  });
}
