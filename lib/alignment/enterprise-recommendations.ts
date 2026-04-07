// lib/alignment/enterprise-recommendations.ts

export type EnterpriseInterventionEntry = {
  title: string;
  action: string;
  impact: string;
  urgency?: "STANDARD" | "ELEVATED" | "HIGH" | "CRITICAL";
  investmentTier?: "STANDARD" | "PRIORITY" | "STRATEGIC" | "EXECUTIVE";
  operatingSignal?: string;
};

export const STRATEGIC_INTERVENTIONS: Record<
  string,
  EnterpriseInterventionEntry
> = {
  RESOURCE_FLOW: {
    title: "Liquidity & Bottleneck Audit",
    action:
      "Map the path of a single critical budget request from initiation to deployment. Identify approval throttles, silent queues, and decision bottlenecks constraining front-line execution.",
    impact:
      "Reduces operational drag, improves capital deployment visibility, and shortens speed-to-market.",
    urgency: "HIGH",
    investmentTier: "STRATEGIC",
    operatingSignal: "Capital friction and execution lag",
  },

  COMMUNICATION_RESONANCE: {
    title: "Feedback Loop Re-Architecture",
    action:
      "Implement a structured truth-to-power channel for 48 hours following key strategic decisions, bypassing managerial filtration and forcing signal capture from the operating edge.",
    impact:
      "Reduces leadership mirage, closes the signal delta, and restores feedback fidelity.",
    urgency: "HIGH",
    investmentTier: "STRATEGIC",
    operatingSignal: "Filtered reality and message distortion",
  },

  PSYCHOLOGICAL_SAFETY: {
    title: "Failure Disclosure Protocol",
    action:
      "Require executive leadership to disclose a recent strategic miss, the assumptions behind it, and the learning loop created from it. Convert error-reporting from private fear into governed transparency.",
    impact:
      "Improves early-warning visibility before weak signals harden into systemic failure.",
    urgency: "ELEVATED",
    investmentTier: "PRIORITY",
    operatingSignal: "Suppressed truth and defensive culture",
  },

  STRATEGIC_CLARITY: {
    title: "Commander’s Intent Reset",
    action:
      "Reduce the 12-month mission into one executable sentence of command intent, then test for 80% recall across decision-bearing teams and operating units.",
    impact:
      "Synchronises decentralised decisions and reduces interpretive fragmentation.",
    urgency: "CRITICAL",
    investmentTier: "EXECUTIVE",
    operatingSignal: "Strategic ambiguity and drift at the edge",
  },

  GOVERNANCE_DISCIPLINE: {
    title: "Decision Rights Re-Codification",
    action:
      "Re-document who decides, who advises, who vetoes, and who executes across the top 10 recurring decision classes. Eliminate ghost authority and soft duplication.",
    impact:
      "Sharpens accountability, improves speed, and reduces governance confusion.",
    urgency: "HIGH",
    investmentTier: "EXECUTIVE",
    operatingSignal: "Authority overlap and accountability fog",
  },

  EXECUTION_ALIGNMENT: {
    title: "Execution Cadence Reset",
    action:
      "Install a disciplined weekly review cycle linking strategic priorities to named owners, visible deadlines, variance reporting, and correction decisions.",
    impact:
      "Improves operating tempo and turns strategy from aspiration into rhythm.",
    urgency: "HIGH",
    investmentTier: "STRATEGIC",
    operatingSignal: "Execution softness and poor follow-through",
  },

  LEADERSHIP_COHERENCE: {
    title: "Leadership Alignment Tribunal",
    action:
      "Conduct a closed executive alignment session to surface divergence in interpretation, posture, and priority before it leaks into the wider enterprise.",
    impact:
      "Reduces leadership perception gap and prevents downstream confusion.",
    urgency: "CRITICAL",
    investmentTier: "EXECUTIVE",
    operatingSignal: "Executive incoherence and mixed signals",
  },

  TRUST_INFRASTRUCTURE: {
    title: "Trust Repair Protocol",
    action:
      "Identify the three highest-friction trust points across teams, document the breach pattern, assign repair owners, and force visible remediation within one operating cycle.",
    impact:
      "Restores confidence in leadership follow-through and lowers relational drag.",
    urgency: "ELEVATED",
    investmentTier: "PRIORITY",
    operatingSignal: "Trust erosion and hidden collaboration tax",
  },

  DECISION_QUALITY: {
    title: "Decision Hygiene Review",
    action:
      "Audit recent strategic decisions for evidence quality, time pressure, stakeholder distortion, and post-decision learning. Convert the findings into a live decision standard.",
    impact:
      "Improves judgement quality and lowers avoidable error recurrence.",
    urgency: "HIGH",
    investmentTier: "STRATEGIC",
    operatingSignal: "Low-grade judgement decay",
  },

  OPERATING_MODEL: {
    title: "Operating Model Stress Test",
    action:
      "Review whether the current structure still fits the real work being done. Identify duplicate layers, decision congestion, and role architecture that now obstructs throughput.",
    impact:
      "Improves structural fit and exposes organisation design debt.",
    urgency: "HIGH",
    investmentTier: "EXECUTIVE",
    operatingSignal: "Structural mismatch and wasted motion",
  },
};

const FALLBACK_INTERVENTION: EnterpriseInterventionEntry = {
  title: "Strategic Correction Sprint",
  action:
    "Run a focused corrective sprint to surface the underlying operational issue, assign a responsible owner, define one measurable correction target, and review progress within a fixed cadence.",
  impact:
    "Creates immediate directional control while preserving room for deeper institutional diagnosis.",
  urgency: "STANDARD",
  investmentTier: "STANDARD",
  operatingSignal: "Generic variance requiring disciplined correction",
};

export function getStrategicIntervention(
  domain: string,
): EnterpriseInterventionEntry {
  const normalized = String(domain || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return STRATEGIC_INTERVENTIONS[normalized] || {
    ...FALLBACK_INTERVENTION,
    title: normalized
      ? `${normalized.replace(/_/g, " ")} Correction Protocol`
      : FALLBACK_INTERVENTION.title,
  };
}

export function listStrategicInterventions(): EnterpriseInterventionEntry[] {
  return Object.values(STRATEGIC_INTERVENTIONS);
}

export default {
  STRATEGIC_INTERVENTIONS,
  getStrategicIntervention,
  listStrategicInterventions,
};