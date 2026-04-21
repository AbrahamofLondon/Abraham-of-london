import fs from "fs";
import path from "path";

export type DecisionAssetCategory =
  | "worksheet"
  | "framework"
  | "toolkit"
  | "report"
  | "brief";

export type AssetAudit = {
  slug: string;
  category: DecisionAssetCategory;
  currentState: {
    exists: boolean;
    accessible: boolean;
    gated: boolean;
    leaking: boolean;
  };
  qualityScore: {
    clarity: number;
    decisionImpact: number;
    uniqueness: number;
    systemIntegration: number;
  };
  verdict: "underpriced" | "fair" | "overpriced" | "not_sellable";
  requiredFix: string;
};

export type DecisionInstrumentSection = {
  context: string;
  decisionFrame: string;
  input: string[];
  process: string[];
  output: string[];
  failureSignal: string;
};

export type PremiumDecisionAsset = {
  slug: string;
  title: string;
  category: DecisionAssetCategory;
  priceGbp: number;
  executiveReportingSection: string;
  upsellPath: string;
  instrument: DecisionInstrumentSection;
};

export const PREMIUM_DECISION_ASSETS: PremiumDecisionAsset[] = [
  {
    slug: "decision-exposure-calculator",
    title: "Decision Exposure Instrument",
    category: "worksheet",
    priceGbp: 29,
    executiveReportingSection: "Financial Exposure",
    upsellPath: "If this exposure is material or disputed, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used when a delayed decision is creating cost, dependency blockage, or political exposure.",
      decisionFrame:
        "Forces DECIDE NOW, ESCALATE, or DOCUMENT AND HOLD.",
      input: [
        "Decision statement",
        "Named owner",
        "Weekly direct and indirect cost",
        "Blocked dependencies",
        "Current escalation status",
      ],
      process: [
        "Name the decision and owner.",
        "Calculate weekly financial exposure.",
        "Count blocked dependencies.",
        "Score political exposure from 1 to 5.",
        "Classify exposure as GREEN, AMBER, or RED.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "financial exposure figure",
      ],
      failureSignal:
        "If cost or owner cannot be named, the problem is not delay; it is governance ambiguity.",
    },
  },
  {
    slug: "mandate-clarity-framework",
    title: "Mandate Clarity Framework",
    category: "framework",
    priceGbp: 49,
    executiveReportingSection: "Constitutional Posture",
    upsellPath: "If authority conflict remains after mapping, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used when nobody can state who owns a decision, escalation, or consequence.",
      decisionFrame:
        "Forces CONFIRM OWNER, REASSIGN MANDATE, or ESCALATE AUTHORITY.",
      input: [
        "Decision domain",
        "Assumed owner",
        "Documented owner",
        "Escalation path",
        "Last mandate review date",
      ],
      process: [
        "Define the decision domain.",
        "Compare assumed owner with documented owner.",
        "Map escalation authority.",
        "Identify phantom accountability.",
        "Classify mandate clarity from 0 to 100.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "authority map",
      ],
      failureSignal:
        "If ownership cannot be documented, the organisation is operating on social permission instead of authority.",
    },
  },
  {
    slug: "structural-failure-diagnostic-canvas",
    title: "Structural Failure Diagnostic Canvas",
    category: "worksheet",
    priceGbp: 19,
    executiveReportingSection: "Failure Modes",
    upsellPath: "If cascade effects cross domains, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used immediately after a material failure before blame narratives harden.",
      decisionFrame:
        "Forces PEOPLE, PROCESS, STRUCTURE, or GOVERNANCE as primary failure source.",
      input: [
        "Failure event",
        "Affected scope",
        "Failure timeline",
        "Known decisions preceding failure",
      ],
      process: [
        "State the failure in one sentence.",
        "Score each failure domain from 0 to 5.",
        "Identify the highest-scoring domain.",
        "Map cascade into other domains.",
        "Assign corrective owner.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "cascade map",
      ],
      failureSignal:
        "If the team cannot agree on the failure sentence, the failure is still politically contested.",
    },
  },
  {
    slug: "team-alignment-gap-map",
    title: "Team Alignment Gap Map",
    category: "worksheet",
    priceGbp: 29,
    executiveReportingSection: "Team Reality",
    upsellPath: "If leadership and team reality diverge materially, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used when leadership believes priorities are clear but execution indicates otherwise.",
      decisionFrame:
        "Forces ALIGN, RESEQUENCE, or STOP MISDIRECTED WORK.",
      input: [
        "Leadership top five priorities",
        "Team top five work streams",
        "Timeframe under review",
        "Evidence source for actual work",
      ],
      process: [
        "Rank leadership priorities.",
        "Rank actual work streams.",
        "Mark direct, partial, or absent alignment.",
        "Calculate alignment score.",
        "Name the largest divergence.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "alignment score",
      ],
      failureSignal:
        "If actual work streams cannot be named, the team is not managed through observable priorities.",
    },
  },
  {
    slug: "escalation-readiness-scorecard",
    title: "Escalation Readiness Scorecard",
    category: "worksheet",
    priceGbp: 19,
    executiveReportingSection: "Escalation Confidence",
    upsellPath: "If escalation risk is high and evidence is contested, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used before escalating a sensitive issue to prevent premature or delayed escalation.",
      decisionFrame:
        "Forces ESCALATE NOW, GATHER EVIDENCE, or RESOLVE LOCALLY.",
      input: [
        "Issue statement",
        "Prior resolution attempts",
        "Evidence gathered",
        "Escalation target",
        "Cost of non-escalation",
      ],
      process: [
        "State the issue.",
        "List prior attempts and outcomes.",
        "Score evidence strength.",
        "Score political risk.",
        "Compare structural risk against political risk.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "evidence gap",
      ],
      failureSignal:
        "If evidence cannot be shown, escalation is currently emotion rather than governance.",
    },
  },
  {
    slug: "governance-drift-detector",
    title: "Governance Drift Detector",
    category: "framework",
    priceGbp: 49,
    executiveReportingSection: "Governance Integrity",
    upsellPath: "If governance is DRIFTING or BROKEN, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used quarterly or when governance intent no longer matches actual behaviour.",
      decisionFrame:
        "Forces MAINTAIN, CORRECT, or REBUILD GOVERNANCE.",
      input: [
        "Stated governance principles",
        "Observed decision behaviours",
        "Review timeframe",
        "Known mandate changes",
      ],
      process: [
        "List up to five principles.",
        "Document actual behaviour for each.",
        "Score drift from 0 to 5.",
        "Classify root cause.",
        "Set corrective priority.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "drift score",
      ],
      failureSignal:
        "If stated principles cannot be produced, governance is cultural habit rather than institutional design.",
    },
  },
  {
    slug: "strategic-priority-stack-builder",
    title: "Strategic Priority Stack Builder",
    category: "framework",
    priceGbp: 49,
    executiveReportingSection: "Priority Stack",
    upsellPath: "If the cut line is politically resisted, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used when the organisation has more priorities than resources.",
      decisionFrame:
        "Forces FUND, DEFER, or KILL.",
      input: [
        "Current priorities",
        "Available budget",
        "Time horizon",
        "Stakeholder constraints",
      ],
      process: [
        "List all priorities.",
        "Attach cost, time, and stakeholder dependency.",
        "Remove impossible items.",
        "Score impact, feasibility, and political alignment.",
        "Draw the resource cut line.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "ranked priority stack",
      ],
      failureSignal:
        "If leaders refuse a cut line, the issue is not prioritisation; it is avoidance of trade-offs.",
    },
  },
  {
    slug: "execution-risk-index",
    title: "Execution Risk Index",
    category: "framework",
    priceGbp: 29,
    executiveReportingSection: "Trajectory Outlook",
    upsellPath: "If execution risk is HIGH, proceed to Executive Reporting before commitment.",
    instrument: {
      context:
        "Used before committing resources to a project, initiative, or restructuring.",
      decisionFrame:
        "Forces COMMIT, REPAIR PLAN, or STOP.",
      input: [
        "Initiative name",
        "Success criteria",
        "Milestones",
        "Resource dependencies",
        "Known risks",
      ],
      process: [
        "Define success.",
        "Score milestone confidence.",
        "Score dependency certainty.",
        "Flag single points of failure.",
        "Classify execution risk.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "single points of failure",
      ],
      failureSignal:
        "If dependency certainty cannot be scored, the plan is not yet executable.",
    },
  },
  {
    slug: "intervention-path-selector",
    title: "Intervention Path Selector",
    category: "toolkit",
    priceGbp: 79,
    executiveReportingSection: "Governed Recommendations",
    upsellPath: "If the intervention path is disputed, proceed to Executive Reporting.",
    instrument: {
      context:
        "Used when leadership must choose between fixing, restructuring, or escalating.",
      decisionFrame:
        "Forces FIX, RESTRUCTURE, or ESCALATE.",
      input: [
        "Problem statement",
        "Severity",
        "Available resources",
        "Time constraint",
        "Previous intervention attempts",
      ],
      process: [
        "Classify severity.",
        "Score fix feasibility.",
        "Score restructure feasibility.",
        "Score escalation legitimacy.",
        "Select primary path and fallback.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "intervention brief",
      ],
      failureSignal:
        "If no path is feasible, the condition has exceeded the current authority system.",
    },
  },
  {
    slug: "board-brief-template-structured",
    title: "Board Brief Template (Structured)",
    category: "toolkit",
    priceGbp: 129,
    executiveReportingSection: "Boardroom Export",
    upsellPath: "If source findings are incomplete, proceed to Executive Reporting before briefing the board.",
    instrument: {
      context:
        "Used when diagnostic findings must become a board-ready decision brief.",
      decisionFrame:
        "Forces INFORM, SEEK DECISION, or REQUEST AUTHORITY.",
      input: [
        "Source findings",
        "Severity",
        "Recommended actions",
        "Financial implications",
        "Timeline",
      ],
      process: [
        "Write the board statement in three sentences.",
        "Classify severity.",
        "Map governance domains affected.",
        "Assign owner, deadline, resource, and metric.",
        "State the board decision required.",
      ],
      output: [
        "classification",
        "decision implication",
        "next action",
        "board-ready brief",
      ],
      failureSignal:
        "If the board decision cannot be stated, the brief is informational noise.",
    },
  },
];

export function findPremiumDecisionAsset(
  slug: string,
): PremiumDecisionAsset | null {
  return (
    PREMIUM_DECISION_ASSETS.find((asset) => asset.slug === slug.trim()) || null
  );
}

export function auditPremiumDecisionAsset(
  asset: PremiumDecisionAsset,
): AssetAudit {
  const publicPath = path.join(
    process.cwd(),
    "public",
    "assets",
    "downloads",
    `${asset.slug}.pdf`,
  );
  const exists = fs.existsSync(publicPath);

  return {
    slug: asset.slug,
    category: asset.category,
    currentState: {
      exists,
      accessible: exists,
      gated: false,
      leaking: exists,
    },
    qualityScore: {
      clarity: 8,
      decisionImpact: 9,
      uniqueness: 7,
      systemIntegration: 9,
    },
    verdict: exists ? "fair" : "not_sellable",
    requiredFix: exists
      ? "Move binary out of public static serving and deliver only through canonical entitlement-gated download."
      : "Generate canonical asset binary, register identity, and expose only through entitlement-gated download.",
  };
}

export function auditPremiumDecisionAssets(): AssetAudit[] {
  return PREMIUM_DECISION_ASSETS.map(auditPremiumDecisionAsset);
}
