/**
 * Toolkit Registry — SSOT for all deployable toolkit systems.
 */

import type { Toolkit } from "./types";

export const TOOLKITS: Toolkit[] = [
  {
    slug: "institutional-diagnostics",
    title: "Institutional Diagnostics Toolkit",
    domain: "Governance & Systems",
    description: "Structured diagnostic system for institutional coherence and failure detection.",
    components: ["Culture audit", "Governance audit", "Systems audit", "Leadership alignment audit", "Crisis vulnerability test", "Growth strain test"],
    outputs: ["Institutional Risk Map", "Alignment Score", "Failure Pattern Identification"],
    linkedFrameworks: ["AI-02", "CX-20"],
    linkedProducts: ["decision_exposure_instrument", "executive_reporting"],
    tier: "public",
  },
  {
    slug: "renewal-reform",
    title: "Renewal & Reform Toolkit",
    domain: "Institutional Transformation",
    description: "Systematic approach to institutional renewal when drift has become structural.",
    components: ["Decay assessment", "Reform sequencing", "Stakeholder alignment", "Implementation tracking", "Post-reform stability check"],
    outputs: ["Reform Roadmap", "Stakeholder Alignment Map", "Stability Forecast"],
    linkedFrameworks: ["DX-40", "PD-31"],
    linkedProducts: ["intervention_path_selector", "strategy_room"],
    tier: "paid",
  },
  {
    slug: "succession-engineering",
    title: "Succession Engineering Toolkit",
    domain: "Leadership Continuity",
    description: "Structured succession planning that preserves institutional identity across leadership transitions.",
    components: ["Leadership profile audit", "Successor readiness assessment", "Knowledge transfer protocol", "Transition timeline", "Identity preservation checklist"],
    outputs: ["Succession Readiness Score", "Transition Plan", "Knowledge Transfer Matrix"],
    linkedFrameworks: ["ND-14", "FD-07"],
    linkedProducts: ["mandate_clarity_framework", "strategy_room"],
    tier: "enterprise",
  },
  {
    slug: "crisis-leadership",
    title: "Crisis Leadership Toolkit",
    domain: "Decision Under Pressure",
    description: "Framework for maintaining decision authority and institutional order during crisis.",
    components: ["Crisis classification", "Authority preservation protocol", "Communication governance", "Decision escalation framework", "Post-crisis audit"],
    outputs: ["Crisis Response Protocol", "Authority Chain", "Post-Crisis Assessment"],
    linkedFrameworks: ["CX-20", "PD-31"],
    linkedProducts: ["intervention_path_selector", "strategy_room"],
    tier: "paid",
  },
  {
    slug: "culture-shaping",
    title: "Culture Shaping Toolkit",
    domain: "Organisational Identity",
    description: "Systematic approach to diagnosing and reshaping organisational culture through structural alignment.",
    components: ["Culture pattern audit", "Values-behaviour gap analysis", "Ritual and practice inventory", "Narrative assessment", "Alignment verification"],
    outputs: ["Culture Health Score", "Gap Map", "Alignment Protocol"],
    linkedFrameworks: ["AI-02"],
    linkedProducts: ["decision_exposure_instrument", "executive_reporting"],
    tier: "public",
  },
  {
    slug: "board-governance",
    title: "Board Governance Toolkit",
    domain: "Institutional Oversight",
    description: "Governance framework for boards and oversight bodies operating under accountability pressure.",
    components: ["Board structure template", "Oversight protocol framework", "Accountability matrix", "Ethical guardrail model", "Decision authority mapping"],
    outputs: ["Board Effectiveness Assessment", "Governance Protocol", "Accountability Framework"],
    linkedFrameworks: ["EG-01", "PD-31"],
    linkedProducts: ["mandate_clarity_framework", "executive_reporting"],
    tier: "enterprise",
  },
  {
    slug: "leadership-formation",
    title: "Leadership Formation Toolkit",
    domain: "Character & Capability",
    description: "Structured formation system for leaders who must operate under sustained pressure and ambiguity.",
    components: ["Character assessment", "Decision pattern analysis", "Pressure response profiling", "Accountability structure", "Formation pathway"],
    outputs: ["Leadership Profile", "Formation Plan", "Accountability Protocol"],
    linkedFrameworks: ["DX-40"],
    linkedProducts: ["operator_decision_pack", "strategy_room"],
    tier: "paid",
  },
];

export function getToolkit(slug: string): Toolkit | undefined {
  return TOOLKITS.find((t) => t.slug === slug);
}

export function getToolkitsByTier(tier: Toolkit["tier"]): Toolkit[] {
  return TOOLKITS.filter((t) => t.tier === tier);
}

export function getToolkitsForProduct(productCode: string): Toolkit[] {
  return TOOLKITS.filter((t) => t.linkedProducts.includes(productCode));
}
