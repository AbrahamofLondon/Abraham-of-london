/**
 * Capital Narrative — structured positioning for investors, partners, and institutional capital.
 *
 * Category: Decision Authority Infrastructure (DAI)
 * Not SaaS, consulting, or analytics.
 *
 * "Organisations do not fail from lack of data.
 *  They fail from unresolved contradictions in decision-making."
 */

export const CAPITAL_NARRATIVE = {
  category: "Decision Authority Infrastructure (DAI)",

  oneLiner: "We identify contradictions, price the cost, assign ownership, and verify execution.",

  problem: "Organisations do not fail from lack of data. They fail from unresolved contradictions in decision-making.",

  existingMarketGap: [
    { category: "SaaS", limitation: "Surfaces data, does not enforce decisions" },
    { category: "Consulting", limitation: "Advises, does not verify execution" },
    { category: "Analytics", limitation: "Measures outcomes, not behaviour" },
    { category: "Coaching", limitation: "Individual, not structural" },
  ],

  newCategoryDefinition: "DAI = Identify → Price → Assign → Enforce → Verify",

  coreInsight: "Not 'better decisions' — fewer unresolved decisions.",

  productStack: [
    { layer: "Signal Capture", products: ["Fast Diagnostic", "Purpose Alignment"] },
    { layer: "Structural Diagnosis", products: ["Constitutional", "Team", "Enterprise"] },
    { layer: "Economic Exposure", products: ["Executive Reporting"] },
    { layer: "Execution Enforcement", products: ["Strategy Room"] },
    { layer: "Verification Loop", products: ["Outcome Verification", "Pressure System"] },
  ],

  supportingEngines: [
    "Intelligence Spine",
    "Governance layer (integrity, breach, pressure)",
    "Follow-up + retargeting",
    "Social proof engine",
    "Call analytics",
    "Boardroom Mode",
    "Enterprise Portfolio",
  ],

  defensibility: [
    { moat: "Data Flywheel", description: "Every user generates decision patterns, cost signals, behavioural outcomes. System accuracy increases with usage." },
    { moat: "Enforcement Layer", description: "Most competitors stop at insight. This system controls the execution loop." },
    { moat: "Economic Anchoring", description: "Every decision tied to £ cost, time decay, probability shift." },
    { moat: "Closed-Loop System", description: "Diagnosis → Action → Outcome → Feedback → self-improving." },
  ],

  monetisation: {
    transactional: [
      { product: "Executive Reporting", price: "£295", description: "Priced consequence + decision framing" },
      { product: "Strategy Room (Entry)", price: "£750", description: "Single decision enforcement" },
      { product: "Strategy Room (Active)", price: "£1,250", description: "Multi-decision enforcement" },
    ],
    enterprise: [
      { tier: "Entry", price: "£5k–£10k/month", scope: "1–2 critical decision streams" },
      { tier: "Core", price: "£10k–£25k/month", scope: "Cross-functional enforcement" },
      { tier: "Extended", price: "£25k–£50k/month", scope: "Board-level integration" },
    ],
  },

  unitEconomics: {
    funnel: "1000 Fast → 10-15% ER → 5-8% SR → 1-2% Enterprise",
    characteristics: ["High ACV", "Low CAC (inbound-controlled)", "Strong LTV (retainers)"],
  },

  targetMarket: {
    primary: "Mid-market companies (£5M–£200M revenue), founder-led or exec-driven",
    entryPoint: "One unresolved decision costing £5k+/month",
    expansion: "Every company has multiple such decisions",
  },

  goToMarket: [
    { phase: 1, description: "Founder-led sales, inbound (diagnostic-led)" },
    { phase: 2, description: "Content + proof engine, retargeting + pressure loops" },
    { phase: 3, description: "Enterprise rollout, decision portfolios" },
  ],

  keyMetrics: {
    product: ["TAR% (accuracy trust)", "DAR% (execution rate)", "QER% (economic conversion)"],
    revenue: ["ER conversion", "SR entry", "ACV", "Retention"],
    system: ["Pressure index trends", "Breach reduction", "Structural change rate"],
  },

  risks: [
    { risk: "Misdiagnosis", mitigation: "Arbiter tournament + feedback loop + TAR monitoring" },
    { risk: "Buyer readiness", mitigation: "Inbound gating + do-not-sell filter" },
    { risk: "Organisational resistance", mitigation: "Boardroom Mode + stakeholder mapping" },
  ],

  whyNow: "Data abundance → decision paralysis. AI acceleration → faster consequences. Delay is becoming more expensive, faster. This system sits where cost of delay > tolerance for ambiguity.",

  investorStory: {
    opening: "Organisations are not failing because they lack insight. They are failing because they cannot execute decisions under pressure.",
    middle: "We built a system that identifies contradictions, prices the cost of delay, assigns ownership, and enforces execution.",
    close: "This is the infrastructure layer for decision authority in modern organisations.",
  },

  raisingFor: ["Scaling distribution", "Strengthening data layer", "Enterprise rollout"],
  notRaisingFor: ["Finding product-market fit", "Building MVP"],
} as const;
