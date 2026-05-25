/**
 * lib/research/foundry-rule-registry.ts
 *
 * Single source of truth for every named semantic rule in the Intelligence Foundry.
 * Every mappingTrace.sourceRule must resolve to an entry here.
 *
 * No semantic fix exists only in code.
 * No derived mapping is untraced.
 * No fallback is silent.
 */

export type RuleCategory =
  | "mapping"
  | "financial"
  | "qualification"
  | "scoring"
  | "status"
  | "performance"
  | "safety"
  | "fallback";

export type FoundryRule = {
  id: string;
  title: string;
  category: RuleCategory;
  description: string;
  limitation: string;
  promotionRequirement: string;
  introducedBy?: string;
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const FOUNDRY_RULES: FoundryRule[] = [
  // ── Bridge: ER → IntelligenceSpine mappings ──────────────────────────────
  {
    id: "bridge:financial_exposure_monthly_normalisation_v1",
    title: "ER totalExposure normalised to monthly cost",
    category: "financial",
    description:
      "Executive Reporting financialExposure.totalExposure combines annualised execution loss and one-off replacement exposure. Boardroom Mode expects estimated monthly cost, so v1 normalises total exposure across 12 months.",
    limitation:
      "Financial exposure normalisation is a v1 bridge estimate. It does not yet distinguish recurring monthly cost from one-off replacement cost.",
    promotionRequirement:
      "Split Executive Reporting exposure into recurring monthly cost, annualised execution loss, and one-off replacement exposure before Boardroom qualification.",
    introducedBy: "executive-report-boardroom-bridge-adapter.ts",
  },
  {
    id: "bridge:er_state_to_spine_condition_class_v1",
    title: "ER state mapped to IntelligenceSpine condition class",
    category: "mapping",
    description:
      "ExecutiveReport.state (ORDERED/MISALIGNED/DISORDERED) is mapped to IntelligenceSpine.deterministic.conditionClass. DISORDERED→instability, MISALIGNED→execution, ORDERED→execution.",
    limitation:
      "MISALIGNED and ORDERED both map to 'execution' condition class. The spine cannot distinguish between ordered and misaligned execution states.",
    promotionRequirement:
      "Add a 'misaligned' condition class to IntelligenceSpine to preserve the distinction.",
    introducedBy: "executive-report-to-intelligence-spine.ts",
  },
  {
    id: "bridge:failure_modes_to_contradiction_set_v1",
    title: "ER failure modes mapped to spine contradiction set",
    category: "mapping",
    description:
      "ExecutiveReport.failureModes are mapped to IntelligenceSpine.deterministic.contradictionSet, prefixed with 'Failure mode: ' for traceability.",
    limitation:
      "Failure modes are string labels, not structured contradiction objects. The mapping is semantic but not structural.",
    promotionRequirement:
      "Map failure modes to structured contradiction objects with severity, domain, and evidence fields.",
    introducedBy: "executive-report-to-intelligence-spine.ts",
  },
  {
    id: "bridge:narrative_to_synthesis_v1",
    title: "ER narrative mapped to spine synthesis",
    category: "mapping",
    description:
      "ExecutiveReport.narrative.summary is mapped to IntelligenceSpine.synthesis.verdict. narrative.headline is used as case.decision and quotedUserLanguage.",
    limitation:
      "Synthesis is derived from narrative — not from full diagnostic pipeline. The mapped synthesis lacks priorAttempt analysis and concreteMove depth.",
    promotionRequirement:
      "Wire full diagnostic pipeline to generate synthesis instead of deriving from narrative alone.",
    introducedBy: "executive-report-to-intelligence-spine.ts",
  },
  {
    id: "bridge:priority_stack_to_concrete_move_v1",
    title: "ER priority stack first item mapped to concrete move",
    category: "mapping",
    description:
      "ExecutiveReport.priorityStack[0] is mapped to IntelligenceSpine.synthesis.concreteMove. If empty, falls back to narrative.mandate.",
    limitation:
      "Only the first priority stack item is mapped. Remaining items are lost.",
    promotionRequirement:
      "Map full priority stack to an ordered list of recommended actions on the spine.",
    introducedBy: "executive-report-to-intelligence-spine.ts",
  },
  {
    id: "bridge:resonance_to_c3_specificity_v1",
    title: "ER average dissonance inverted to C3 specificity score",
    category: "scoring",
    description:
      "ExecutiveReport resonance averageDissonance is inverted (1 - dissonance/100) and clamped to [0.1, 1.0] to approximate IntelligenceSpine.c3.specificityScore.",
    limitation:
      "This is a low-confidence approximation. C3 specificity score is normally derived from decision clarity, context, and consequence — not from dissonance alone.",
    promotionRequirement:
      "Derive C3 score from actual decision clarity, context, and consequence inputs rather than inverting dissonance.",
    introducedBy: "executive-report-to-intelligence-spine.ts",
  },
  {
    id: "bridge:hcd_ogr_data_loss_v1",
    title: "HCD and OGR data lost in ER→spine mapping",
    category: "safety",
    description:
      "IntelligenceSpine has no humanCapital or governance fields. HCD aggregate data and OGR manifest data (sovereignCertainty, integrationTax) are lost during mapping. Documented as mapping gaps.",
    limitation:
      "HCD risk scores, burnout indices, replacement costs, OGR sovereign certainty, integration tax, and velocity multiplier are not preserved in the mapped spine.",
    promotionRequirement:
      "Extend IntelligenceSpine with humanCapital/humanDynamics and governance/manifest fields.",
    introducedBy: "executive-report-to-intelligence-spine.ts",
  },

  // ── Adapter: Fast Diagnostic ─────────────────────────────────────────────
  {
    id: "adapter:fast_diagnostic_validation_scoring_only_v1",
    title: "Fast Diagnostic adapter wraps scoring only, not AI synthesis",
    category: "safety",
    description:
      "The Fast Diagnostic adapter validates inputs and computes deterministic scores (percentageScore, severityFromScore, verdictFromScore). AI-generated fields (synthesis, forecast, anchorNarrative, signals) are returned as null.",
    limitation:
      "Full FastDiagnosticResult with AI synthesis is not wrapped. The adapter produces deterministic scores only.",
    promotionRequirement:
      "Wire the full AI synthesis pipeline and return complete FastDiagnosticResult with forecast, anchor narrative, and signal detection.",
    introducedBy: "fast-diagnostic-adapter.ts",
  },

  // ── Adapter: Constitutional Diagnostic ───────────────────────────────────
  {
    id: "adapter:constitutional_diagnostic_deterministic_bundle_v1",
    title: "Constitutional Diagnostic adapter wraps deterministic bundle only",
    category: "safety",
    description:
      "The Constitutional Diagnostic adapter wraps deriveConstitutionalDiagnosticBundle() — domain scoring, constitutional routing, readiness tier, and deterministic route decision. Does not run AI narrative generation or executive synthesis.",
    limitation:
      "Does not run AI narrative generation or executive synthesis. Does not produce strategy room session or boardroom dossier. Does not persist session state.",
    promotionRequirement:
      "Add AI narrative generation dry-run adapter. Wire strategy room session simulation.",
    introducedBy: "constitutional-diagnostic-adapter.ts",
  },

  // ── Adapter: Strategy Room ───────────────────────────────────────────────
  {
    id: "adapter:strategy_room_directive_derivation_v1",
    title: "Strategy Room directive derives from synthetic TensionThread",
    category: "scoring",
    description:
      "The Strategy Room adapter builds a synthetic TensionThread from score components and derives a decision directive via deriveDecisionDirective(). The thread is not from a real user diagnostic history.",
    limitation:
      "Directive derives from synthetic TensionThread built from score — not from real user diagnostic history. Full admission check requires getDiagnosticJourney() (DB) which is not called.",
    promotionRequirement:
      "Wire evaluateStrategyRoomAdmission() with a mock/stub DiagnosticJourney to prove full admission logic.",
    introducedBy: "strategy-room-adapter.ts",
  },
  {
    id: "adapter:strategy_room_authority_override_v1",
    title: "Strategy Room authority gate overrides score threshold",
    category: "qualification",
    description:
      "The Strategy Room intake gate requires authority='Yes, fully' or 'Yes, with board approval'. If authority='No', the gate fails regardless of score. This is a hard gate, not a weighted component.",
    limitation:
      "Authority gate is binary. There is no partial-authority path that could allow borderline cases through with conditions.",
    promotionRequirement:
      "Add conditional-authority path with mandated oversight conditions for borderline authority cases.",
    introducedBy: "strategy-room-adapter.ts",
  },

  // ── Adapter: Boardroom Mode ──────────────────────────────────────────────
  {
    id: "adapter:boardroom_synthetic_spine_dossier_v1",
    title: "Boardroom adapter uses synthetic IntelligenceSpine fixtures",
    category: "safety",
    description:
      "The Boardroom Mode adapter uses synthetic IntelligenceSpine fixtures — not real user spines from production DB. Dossier generation is pure JSON, no PDF rendering.",
    limitation:
      "Uses synthetic IntelligenceSpine fixtures. Does not render PDF. Does not persist boardroom artefacts. Does not validate payment or entitlement gate.",
    promotionRequirement:
      "Wire real Executive Reporting result → IntelligenceSpine transformation. Add PDF render dry-run adapter. Add entitlement/payment gate dry-run check.",
    introducedBy: "boardroom-mode-adapter.ts",
  },
  {
    id: "adapter:boardroom_qualification_gate_v1",
    title: "Boardroom qualification gate: cost + accuracy threshold",
    category: "qualification",
    description:
      "Boardroom activation requires: (cost >= £5k AND accuracy in ['yes','partial']) OR (cost >= £20k regardless of accuracy). Below threshold returns 'resolve operationally'.",
    limitation:
      "Qualification gate is based solely on estimatedMonthlyCost and accuracyFeedback. Does not consider decision complexity, stakeholder impact, or regulatory requirements.",
    promotionRequirement:
      "Add multi-factor qualification scoring that considers decision complexity, stakeholder count, regulatory impact, and financial exposure.",
    introducedBy: "boardroom-mode-adapter.ts",
  },

  // ── Adapter: Executive Reporting ─────────────────────────────────────────
  {
    id: "adapter:executive_reporting_builder_fixture_v1",
    title: "Executive Reporting adapter uses synthetic fixtures",
    category: "safety",
    description:
      "The Executive Reporting adapter uses synthetic RawExecutiveResponse[], HCDMetrics[], and OGRMetrics fixtures — not real campaign responses from production DB.",
    limitation:
      "Uses synthetic fixtures. Does not persist reports. Does not call executive-report-service.ts (DB-bound). Does not emit lineage events.",
    promotionRequirement:
      "Wire real campaign RawExecutiveResponse[] from assessment runs. Wire real HCDMetrics[] from human capital diagnostic sessions.",
    introducedBy: "executive-reporting-adapter.ts",
  },
  {
    id: "adapter:executive_reporting_state_thresholds_v1",
    title: "ER state classification thresholds",
    category: "scoring",
    description:
      "Executive report state is classified: DISORDERED when averageDissonance > 30 OR HCD riskScore='CRITICAL'. MISALIGNED when averageDissonance > 12 OR HCD riskScore='HIGH' OR not authorized. Otherwise ORDERED.",
    limitation:
      "Thresholds are fixed constants. They do not adapt to organisational size, industry, or market conditions.",
    promotionRequirement:
      "Make state thresholds configurable per organisation or industry vertical.",
    introducedBy: "executive-reporting-adapter.ts",
  },
  {
    id: "adapter:executive_reporting_financial_exposure_v1",
    title: "ER financial exposure calculation",
    category: "financial",
    description:
      "Financial exposure = replacementCost + executionLoss. executionLoss = revenue * (dragRatio * 0.55 + certaintyPenalty * 0.45) where revenue = targetRevenue * 1000.",
    limitation:
      "Financial exposure figures are illustrative — derived from synthetic inputs only. Revenue scaling (×1000) is a v1 approximation.",
    promotionRequirement:
      "Use real revenue data from CRM or financial systems instead of synthetic targetRevenue × 1000.",
    introducedBy: "executive-reporting-adapter.ts",
  },

  // ── Adapter: Pattern Recurrence ──────────────────────────────────────────
  {
    id: "adapter:pattern_recurrence_detection_v1",
    title: "Pattern Recurrence detection with synthetic baseline/current",
    category: "scoring",
    description:
      "The Pattern Recurrence adapter detects recurring contradictions, decision keys, and authority failures by comparing baseline and current evidence sets. Uses synthetic fixtures when real data is unavailable.",
    limitation:
      "Requires pre-existing evidence nodes and decision objects. Works best with real data from DiagnosticJourney. Synthetic fixtures may not capture real recurrence patterns.",
    promotionRequirement:
      "Wire real evidence data from DiagnosticJourney queries instead of synthetic fixtures.",
    introducedBy: "pattern-recurrence-adapter.ts",
  },

  // ── Performance Range ────────────────────────────────────────────────────
  {
    id: "performance:bounded_internal_benchmark_v1",
    title: "Performance Range bounded to 25 iterations, 10s total",
    category: "performance",
    description:
      "Performance Range benchmarks are capped at 25 iterations and 10 seconds total runtime. Timeout risk is flagged when any single iteration exceeds 2000ms.",
    limitation:
      "Performance benchmarks are internal only. Results do not represent production latency under real load, concurrent users, or network conditions.",
    promotionRequirement:
      "Add production-load simulation with concurrent request patterns and realistic data volumes.",
    introducedBy: "performance-range-service.ts",
  },
];

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getRule(id: string): FoundryRule | undefined {
  return FOUNDRY_RULES.find((r) => r.id === id);
}

export function getRulesByCategory(category: RuleCategory): FoundryRule[] {
  return FOUNDRY_RULES.filter((r) => r.category === category);
}

export function ruleExists(id: string): boolean {
  return FOUNDRY_RULES.some((r) => r.id === id);
}

export function getAllRuleIds(): string[] {
  return FOUNDRY_RULES.map((r) => r.id);
}
