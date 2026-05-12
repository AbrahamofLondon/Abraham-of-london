/**
 * lib/product/instrument-signal-authority.ts
 *
 * Builds the signal authority block for decision instrument result pages.
 *
 * Covers the "7 questions every result page must answer":
 * 1. What was found? (conditionName + severity)
 * 2. Why does it matter? (consequence path)
 * 3. What are the odds? (comparisonBand from the basis presenter)
 * 4. What happens if nothing changes? (consequence.thirtyDays/sixtyDays/ninetyDays)
 * 5. What changes the outcome? (differentiator)
 * 6. What is the next admissible move? (nextMove from instrument recommendation)
 * 7. What is the evidence basis? (caveat)
 *
 * PUBLIC SURFACE SAFE — no raw scoring logic, no thresholds, no detection predicates.
 */

import { resolveComparisonPresentation } from "./comparison-basis-presenter";

export type InstrumentSignalSeverity = "CRITICAL" | "ALERT" | "CONCERN" | "WATCH";

export type InstrumentSignalAuthority = {
  conditionName: string;
  severity: InstrumentSignalSeverity;
  patternTag: string;
  comparisonBand: string | null;
  comparisonCaveat: string | null;
  /** Distribution basis label — how the comparison was derived (e.g. "Internal observed records") */
  comparisonBasisLabel: string | null;
  /** Distribution maturity level 0–5 — surfaces data quality signal (P9) */
  comparisonMaturityLevel: number | null;
  consequence: {
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
  };
  differentiator: string;
  nextMove: string;
  caveat: string;
};

// ─── Band → Severity Mapping ──────────────────────────────────────────────────

const CRITICAL_BANDS = new Set([
  "CRITICAL", "OVERDUE", "BLOCKED", "DISORDERED", "MISALIGNED",
]);
const ALERT_BANDS = new Set([
  "HIGH", "FRAGILE", "CONTESTED", "UNCLEAR", "ESCALATE",
  "NEAR_CRITICAL", "ELEVATED_RISK",
]);
const CONCERN_BANDS = new Set([
  "ELEVATED", "MODERATE", "DRIFTING", "DEVELOPING",
  "DELEGATED", "GOVERN", "NEAR_READY", "PARTIAL_BLOCK",
]);

export function bandToSeverity(band: string): InstrumentSignalSeverity {
  const upper = band.toUpperCase();
  if (CRITICAL_BANDS.has(upper)) return "CRITICAL";
  if (ALERT_BANDS.has(upper)) return "ALERT";
  if (CONCERN_BANDS.has(upper)) return "CONCERN";
  return "WATCH";
}

// ─── Severity Colours ─────────────────────────────────────────────────────────

export function severityColor(severity: InstrumentSignalSeverity): string {
  switch (severity) {
    case "CRITICAL": return "rgba(239,68,68,0.75)";
    case "ALERT":    return "rgba(249,115,22,0.72)";
    case "CONCERN":  return "rgba(251,191,36,0.70)";
    case "WATCH":    return "rgba(110,231,183,0.60)";
  }
}

export function severityBg(severity: InstrumentSignalSeverity): string {
  switch (severity) {
    case "CRITICAL": return "rgba(239,68,68,0.05)";
    case "ALERT":    return "rgba(249,115,22,0.04)";
    case "CONCERN":  return "rgba(251,191,36,0.03)";
    case "WATCH":    return "rgba(110,231,183,0.03)";
  }
}

// ─── Per-Instrument Configuration ────────────────────────────────────────────

type InstrumentConfig = {
  conditionName: (band: string) => string;
  patternTag: (band: string) => string;
  consequence: (severity: InstrumentSignalSeverity) => {
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
  };
  differentiator: string;
  caveat: string;
};

const INSTRUMENT_CONFIG: Record<string, InstrumentConfig> = {
  "decision-exposure-instrument": {
    conditionName: (band) => `Decision Exposure — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "CRITICAL") return "Decision cost is compounding — immediate structural intervention required";
      if (upper === "HIGH") return "Exposure growing — correction window is narrowing";
      if (upper === "MODERATE") return "Elevated exposure — deliberate correction is warranted";
      return "Exposure within manageable range — maintain diagnostic rigour";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Decision exposure compounds — options narrow materially as stakeholders absorb the unresolved cost",
        sixtyDays: "Exposure becomes embedded in operational behaviour — teams route around the decision rather than resolving it",
        ninetyDays: "Recovery cost exceeds intervention cost by a significant margin — structural reset required",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Exposure continues to accumulate without visible forcing event",
        sixtyDays: "Decision costs become normalised — the gap between stated and actual position widens",
        ninetyDays: "Pattern becomes structurally anchored and harder to reverse without external mandate",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Exposure holds at current level if deliberate correction begins now",
        sixtyDays: "Window for low-cost correction narrows — drift accelerates without intervention",
        ninetyDays: "Sustained inaction shifts the exposure band upward",
      };
      return {
        thirtyDays: "Trajectory holds — exposure remains within acceptable bounds",
        sixtyDays: "Return for structural review to confirm trajectory",
        ninetyDays: "Maintain diagnostic cadence — low exposure requires ongoing confirmation, not assumption",
      };
    },
    differentiator: "Whether the decision owner takes deliberate, bounded action in the next correction window — not whether they understand the exposure.",
    caveat: "Exposure classification is based on self-reported inputs. Not independently verified. Scenario only.",
  },

  "execution-risk-index": {
    conditionName: (band) => `Execution Risk — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "CRITICAL") return "Execution is structurally broken — at least one dimension is non-functional";
      if (upper === "HIGH") return "Significant execution gaps — failure risk is elevated across multiple dimensions";
      if (upper === "MODERATE") return "Execution risk is elevated — gaps require deliberate correction";
      return "Execution risk is within manageable range — maintain structural discipline";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Operational drag compounds — each week without structural intervention increases the failure surface",
        sixtyDays: "Execution failure becomes predictable — the system is showing the full signature of breakdown before it breaks",
        ninetyDays: "Recovery requires an external structural reset — the window for internal correction has effectively closed",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Execution gaps widen under pressure — the team is absorbing cost that should be resolved at the structural level",
        sixtyDays: "Cost of failure begins to exceed cost of correction",
        ninetyDays: "Structural drift accelerates — pattern becomes embedded in how decisions are executed",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Gaps hold if addressed deliberately — risk does not compound if corrective action begins",
        sixtyDays: "Window for low-cost correction narrows",
        ninetyDays: "Sustained inaction shifts the risk profile upward",
      };
      return {
        thirtyDays: "Risk trajectory holds — execution fundamentals are in place",
        sixtyDays: "Maintain structural discipline to prevent drift into elevated risk",
        ninetyDays: "Return for diagnostic review to confirm trajectory",
      };
    },
    differentiator: "Whether the intervention addresses root-cause structural failures or symptomatic operational issues — symptomatic fixes have a high recurrence rate.",
    caveat: "Execution risk classification is based on self-reported dimension scores. Scenario only — not independently verified.",
  },

  "escalation-readiness-scorecard": {
    conditionName: (band) => `Escalation Readiness — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "OVERDUE") return "Escalation is structurally overdue — delay is compounding consequence";
      if (upper === "READY") return "Conditions support escalation — readiness is confirmed";
      if (upper === "DEVELOPING") return "Readiness is developing — structured preparation will accelerate qualification";
      return "Escalation conditions are forming — deliberate readiness work is warranted";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Each week without escalation increases the cost of the eventual decision — the situation is absorbing resource without movement",
        sixtyDays: "Decision authority begins to erode — stakeholders route around the unresolved escalation",
        ninetyDays: "The escalation event is forced externally — on less favourable terms than if triggered proactively",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Readiness gaps remain visible to stakeholders — escalation credibility is at risk",
        sixtyDays: "Evidence requirements for escalation become harder to satisfy as conditions evolve",
        ninetyDays: "Window for structured escalation narrows — unplanned escalation becomes more likely",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Readiness holds if preparation continues deliberately",
        sixtyDays: "Escalation conditions may shift — maintain structural preparation",
        ninetyDays: "Return for readiness review before next escalation window",
      };
      return {
        thirtyDays: "Readiness is confirmed — proceed with structured escalation",
        sixtyDays: "Document the escalation rationale before conditions change",
        ninetyDays: "Escalation window is open — delay reduces optionality",
      };
    },
    differentiator: "Whether the escalation is led by the decision record or improvised under pressure — record-led escalations have materially better outcomes.",
    caveat: "Readiness score is based on self-reported conditions. Not independently verified. Escalation outcomes are scenario estimates.",
  },

  "mandate-clarity-framework": {
    conditionName: (band) => `Mandate Clarity — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "CONTESTED" || upper === "UNCLEAR") return "Mandate boundaries are contested or absent — decision authority is structurally ambiguous";
      if (upper === "DELEGATED") return "Mandate is delegated but not explicitly bounded — delegation risk is present";
      return "Direct mandate clarity confirmed — decision authority is structurally sound";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Contested mandate authority triggers friction at every consequential decision point",
        sixtyDays: "Teams route around unclear authority — shadow decisions accumulate",
        ninetyDays: "Authority dispute becomes embedded in team culture — recovery requires explicit redesign",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Delegation gaps create friction on decisions that require sign-off",
        sixtyDays: "Accountability gaps widen as the organisation scales",
        ninetyDays: "Mandate ambiguity becomes the default — clarity requires deliberate intervention",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Mandate clarity holds if boundaries are made explicit",
        sixtyDays: "Delegation should be formalised before the next scaling event",
        ninetyDays: "Return for mandate review — boundary clarity degrades under growth pressure",
      };
      return {
        thirtyDays: "Direct mandate is confirmed — maintain written boundary documentation",
        sixtyDays: "Return for review if team structure changes",
        ninetyDays: "Mandate clarity requires ongoing maintenance — not a one-time event",
      };
    },
    differentiator: "Whether the mandate boundary is written and signed versus understood and assumed — assumed mandate has a high failure rate under pressure.",
    caveat: "Authority classification is based on self-reported inputs. Mandate clarity is not independently verified.",
  },

  "governance-drift-detector": {
    conditionName: (band) => `Governance Drift — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "CRITICAL") return "Governance has structurally drifted — decision processes are operating outside their designed boundaries";
      if (upper === "HIGH") return "Significant governance drift detected — corrective realignment is required";
      if (upper === "MODERATE") return "Governance drift is elevated — deliberate correction will prevent escalation";
      return "Governance drift is within normal tolerance — maintain structural discipline";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Governance gaps compound — decisions made outside process boundaries accumulate liability",
        sixtyDays: "Drift becomes visible to external stakeholders — board or investor scrutiny is elevated",
        ninetyDays: "Governance failure creates a structural liability event — recovery requires formal redesign",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Drift continues without deliberate correction — each cycle of decisions outside process widens the gap",
        sixtyDays: "Governance confidence erodes internally — teams begin to question whether process is real",
        ninetyDays: "Drift becomes the operational default — structural realignment requires significant effort",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Drift holds at current level if corrective actions begin",
        sixtyDays: "Correction window narrows — realignment becomes more expensive",
        ninetyDays: "Return for governance review — drift compounds silently",
      };
      return {
        thirtyDays: "Governance is operating within acceptable tolerance",
        sixtyDays: "Maintain structural discipline during scaling or transition events",
        ninetyDays: "Return for periodic governance review to confirm trajectory",
      };
    },
    differentiator: "Whether governance realignment is treated as a structural task with explicit accountability or as a management initiative — structural treatment has significantly better outcomes.",
    caveat: "Drift detection is based on self-reported governance indicators. Not independently verified. Scenario only.",
  },

  "intervention-path-selector": {
    conditionName: (band) => {
      const upper = band.toUpperCase();
      if (upper === "ESCALATE") return "Intervention path: Escalate to governed execution";
      if (upper === "GOVERN") return "Intervention path: Govern through current structure";
      return "Intervention path: Monitor and maintain";
    },
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "ESCALATE") return "Situation requires immediate escalation — current structure is insufficient to resolve without external intervention";
      if (upper === "GOVERN") return "Situation is governable through existing structure with deliberate mandate clarity";
      return "Situation is stable — deliberate monitoring will prevent escalation";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL" || severity === "ALERT") return {
        thirtyDays: "Without escalation, the situation continues to absorb resource without resolution",
        sixtyDays: "Escalation credibility erodes — the longer the delay, the harder the case to make",
        ninetyDays: "Forced escalation on external terms — less favourable than proactive escalation",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Governance holds if mandate clarity is made explicit",
        sixtyDays: "Structured governance prevents drift into escalation territory",
        ninetyDays: "Return for review — governed situations can drift without diagnostic confirmation",
      };
      return {
        thirtyDays: "Monitoring confirms current trajectory — no escalation required",
        sixtyDays: "Maintain observation cadence and document conditions",
        ninetyDays: "Return for review — situations evolve and monitoring must be confirmed",
      };
    },
    differentiator: "Whether the intervention path is explicitly chosen based on evidence or defaulted to through inaction — defaulted paths have consistently worse outcomes.",
    caveat: "Intervention path is based on self-reported inputs and structural indicators. Not independently verified.",
  },

  "strategic-priority-stack-builder": {
    conditionName: (band) => `Resource Pressure — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "CRITICAL" || upper === "HIGH") return "Resource pressure is critical — priority conflicts are compressing execution capacity";
      if (upper === "ELEVATED" || upper === "MODERATE") return "Elevated resource pressure — priority stack requires deliberate management";
      return "Resource pressure is within manageable range — maintain stack discipline";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Priority conflicts compound — teams are making implicit trade-offs that should be explicit",
        sixtyDays: "Resource pressure forces low-quality decisions at speed — conflict costs accumulate",
        ninetyDays: "Stack collapse — the priority system breaks down and execution follows individual judgement rather than strategic direction",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Priority gaps widen — conflict between stated and funded priorities creates operational friction",
        sixtyDays: "Execution velocity drops as teams spend resource on resolving conflicts rather than delivering",
        ninetyDays: "Strategic drift — the priority stack no longer reflects the organisation's real choices",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Pressure holds if conflicts are resolved explicitly",
        sixtyDays: "Stack requires periodic review to remain accurate",
        ninetyDays: "Return for priority review — stacks decay without deliberate maintenance",
      };
      return {
        thirtyDays: "Priority stack is aligned — maintain structural discipline",
        sixtyDays: "Review stack at next significant resource decision",
        ninetyDays: "Periodic priority review prevents silent drift",
      };
    },
    differentiator: "Whether priority conflicts are resolved explicitly at the stack level or delegated implicitly to execution — delegated conflicts have significantly higher resolution costs.",
    caveat: "Priority stack and resource pressure classification are based on self-reported inputs. Scenario only.",
  },

  "structural-failure-diagnostic-canvas": {
    conditionName: (band) => `Structural Health — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const lower = band.replace(/_/g, " ").toLowerCase();
      return `Active failure pattern: ${lower}`;
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Active failure patterns compound — each week without structural intervention multiplies the failure surface",
        sixtyDays: "Failure modes become embedded in operational behaviour — teams adapt around broken structures rather than resolving them",
        ninetyDays: "Structural collapse requires external reset — internal correction is no longer accessible without significant disruption",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Failure patterns widen under operational pressure — gaps that are manageable now become critical under load",
        sixtyDays: "Structural health continues to degrade without root-cause intervention",
        ninetyDays: "Recovery window narrows — structural intervention becomes more expensive and disruptive",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Structural health holds if root-cause intervention begins",
        sixtyDays: "Symptomatic management without structural correction will not sustain health score",
        ninetyDays: "Return for structural review — health scores that appear stable can mask active drift",
      };
      return {
        thirtyDays: "Structural health is within functional range",
        sixtyDays: "Maintain structural discipline — health scores require ongoing confirmation",
        ninetyDays: "Return for structural review at next scaling or transition event",
      };
    },
    differentiator: "Whether the intervention targets the root structural failure or the visible symptom — symptomatic interventions have a high recurrence rate.",
    caveat: "Structural health score is based on self-reported dimension scores. Failure patterns are not independently verified. Scenario only.",
  },

  "team-alignment-gap-map": {
    conditionName: (band) => `Team Alignment — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "CRITICAL") return "Alignment has structurally broken down — divergence is operational, not cosmetic";
      if (upper === "HIGH" || upper === "ELEVATED") return "Significant alignment gaps — divergence is creating execution friction";
      if (upper === "MODERATE") return "Alignment gaps are elevated — deliberate correction will prevent escalation";
      return "Alignment is within functional range — maintain structural discipline";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Alignment breakdown compounds — divergent execution creates compounding re-work and misallocated resource",
        sixtyDays: "Team coherence erodes — shared execution becomes effectively impossible without structural intervention",
        ninetyDays: "Alignment failure becomes a structural liability — recovery requires explicit mandate redesign, not team management",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Alignment gaps widen under execution pressure — divergence that is tolerable now becomes critical at scale",
        sixtyDays: "Misaligned execution accumulates cost that exceeds the cost of deliberate correction",
        ninetyDays: "Structural realignment becomes more expensive as divergent patterns embed",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Alignment holds if gaps are addressed with explicit mandate clarity",
        sixtyDays: "Correction window narrows — alignment gaps compound quietly",
        ninetyDays: "Return for alignment review — scores that appear stable can mask active drift",
      };
      return {
        thirtyDays: "Alignment is confirmed — maintain explicit role and mandate documentation",
        sixtyDays: "Review at next team structure or remit change",
        ninetyDays: "Periodic alignment review prevents silent drift",
      };
    },
    differentiator: "Whether alignment gaps are addressed at the mandate level or the interpersonal level — mandate-level interventions resolve alignment structurally; interpersonal interventions rarely hold under pressure.",
    caveat: "Alignment score is based on self-reported gap indicators. Not independently verified. Scenario only.",
  },

  "board-brief-builder": {
    conditionName: (band) => `Board Readiness — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "BOARD_READY") return "Brief is board-ready — decision record meets escalation threshold";
      if (upper === "NEAR_READY") return "Brief is approaching board readiness — targeted strengthening will qualify it";
      if (upper === "DEVELOPING") return "Brief requires structural development before board presentation";
      return "Brief is early-stage — evidence and decision record require significant development";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL" || severity === "ALERT") return {
        thirtyDays: "Board presentation with an unqualified brief risks undermining institutional confidence in the decision",
        sixtyDays: "Delay in strengthening the brief allows the decision conditions to evolve — brief may become out of date",
        ninetyDays: "Window for informed board decision narrows — forced presentation on incomplete record",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Brief strengthening is achievable within the current qualification window",
        sixtyDays: "Evidence gaps should be addressed before next board cycle",
        ninetyDays: "Return for brief review before presentation — readiness degrades if conditions change",
      };
      return {
        thirtyDays: "Brief is confirmed board-ready — proceed with presentation",
        sixtyDays: "Document the decision record before conditions evolve",
        ninetyDays: "Board presentation window is open — delay reduces optionality",
      };
    },
    differentiator: "Whether the board brief is built from the decision record or constructed for presentation — record-built briefs have materially higher credibility and better decision outcomes.",
    caveat: "Board readiness score is based on self-reported inputs. Not independently verified. Board decision outcomes are scenario estimates only.",
  },

  "strategy-room": {
    conditionName: (band) => {
      const upper = band.toUpperCase();
      if (upper === "DISORDERED") return "Execution chamber — structurally disordered";
      if (upper === "MISALIGNED") return "Execution chamber — authority misaligned";
      if (upper === "DRIFTING") return "Execution chamber — strategic drift active";
      if (upper === "ESCALATE") return "Execution chamber — escalation warranted";
      return "Execution chamber — condition confirmed";
    },
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "DISORDERED") return "Governing condition is structurally disordered — the execution record must address root cause before action is valid";
      if (upper === "MISALIGNED") return "Authority is misaligned with the execution requirement — mandate clarity must precede commitment";
      if (upper === "DRIFTING") return "Strategic drift is present — execution without correction compounds the governing condition";
      return "Execution conditions are confirmed — the governing record supports action";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Execution under a disordered governing condition generates compounding liability — every action taken without structural correction increases the recovery cost",
        sixtyDays: "The execution record becomes evidence of the disorder rather than its resolution — stakeholder confidence erodes at the structural level",
        ninetyDays: "Institutional reset is required — the cost of unstructured execution significantly exceeds the cost of deliberate correction taken now",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Authority misalignment means execution creates friction at every approval gate — the cost accumulates without a visible forcing event",
        sixtyDays: "Teams absorb misalignment as operational overhead — the gap between committed action and authority to act widens",
        ninetyDays: "Structural intervention is required — operational management cannot resolve authority-level misalignment",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Execution proceeds with manageable drift if the governing condition is held deliberately",
        sixtyDays: "Drift compounds silently under execution pressure — periodic review prevents trajectory shift",
        ninetyDays: "Return for structural review — conditions change under active execution and must be confirmed",
      };
      return {
        thirtyDays: "Execution conditions are confirmed — proceed with the governed directive",
        sixtyDays: "Checkpoint required — execution without review allows untracked drift",
        ninetyDays: "Return brief will carry this session as the governing record — outcome verification confirms trajectory",
      };
    },
    differentiator: "Whether the execution directive is derived from the evidence record or from the presenting problem — evidence-derived execution has materially better outcomes and higher accountability confidence.",
    caveat: "Execution condition is derived from self-reported constitutional inputs. Not independently verified. Consequence path is a scenario estimate — not a financial forecast.",
  },

  "executive-reporting": {
    conditionName: (band) => {
      const upper = band.toUpperCase();
      if (upper === "DISORDERED") return "Executive Condition — structurally disordered";
      if (upper === "MISALIGNED") return "Executive Condition — authority misaligned";
      if (upper === "DRIFTING") return "Executive Condition — strategic drift identified";
      return "Executive Condition — within functional range";
    },
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "DISORDERED") return "Governing condition is structurally disordered — intervention is required before further decisions are valid";
      if (upper === "MISALIGNED") return "Decision authority and execution are misaligned — mandate clarity must precede action";
      if (upper === "DRIFTING") return "Strategic drift is present — deliberate correction will prevent escalation";
      return "Governing condition is within functional range — maintain diagnostic cadence";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Unresolved executive condition compounds — each consequential decision made under this condition adds structural liability",
        sixtyDays: "Governing condition becomes embedded in operational behaviour — teams route around the unresolved authority gap",
        ninetyDays: "Structural reset is required — the cost of correction exceeds the cost of early intervention by a significant margin",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Authority misalignment continues to generate friction at decision points — cost accumulates without visible forcing event",
        sixtyDays: "Misalignment becomes normalised — the organisation adapts around the gap rather than resolving it",
        ninetyDays: "Structural correction becomes more expensive as misalignment embeds in team culture",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Strategic drift holds at current level if deliberate correction begins",
        sixtyDays: "Window for low-cost correction narrows — drift accelerates without intervention",
        ninetyDays: "Return for executive review — drift that appears stable can compound silently under pressure",
      };
      return {
        thirtyDays: "Executive condition is within functional range — maintain structural discipline",
        sixtyDays: "Return for diagnostic review to confirm trajectory",
        ninetyDays: "Periodic executive review maintains diagnostic rigour",
      };
    },
    differentiator: "Whether the executive intervention addresses the governing condition structurally or manages its symptoms operationally — symptomatic management has a high recurrence rate.",
    caveat: "Executive condition classification is based on self-reported inputs. Not independently verified. Consequence path is a scenario estimate only.",
  },

  "operator-decision-pack": {
    conditionName: (band) => `Decision Pack — ${band.replace(/_/g, " ").toLowerCase()}`,
    patternTag: (band) => {
      const upper = band.toUpperCase();
      if (upper === "CRITICAL" || upper === "HIGH") return "Decision pack reveals critical governance gaps requiring immediate attention";
      if (upper === "MODERATE" || upper === "ELEVATED") return "Decision pack identifies elevated governance exposure requiring deliberate correction";
      return "Decision pack confirms governance fundamentals are in place";
    },
    consequence: (severity) => {
      if (severity === "CRITICAL") return {
        thirtyDays: "Governance gaps in the decision pack compound — each decision made without correcting them adds liability",
        sixtyDays: "Exposure becomes visible to external parties — board, investors, or regulators",
        ninetyDays: "Recovery requires formal governance redesign — internal correction is no longer sufficient",
      };
      if (severity === "ALERT") return {
        thirtyDays: "Gaps widen under operational pressure without deliberate structural correction",
        sixtyDays: "Decision quality degrades as governance gaps compound",
        ninetyDays: "Structural intervention required — operational management cannot resolve governance-level gaps",
      };
      if (severity === "CONCERN") return {
        thirtyDays: "Gaps hold if deliberate correction begins",
        sixtyDays: "Correction window narrows — governance gaps compound quietly",
        ninetyDays: "Return for pack review — governance exposure requires ongoing monitoring",
      };
      return {
        thirtyDays: "Decision pack confirms governance fundamentals",
        sixtyDays: "Maintain documentation discipline across all decision records",
        ninetyDays: "Periodic pack review confirms ongoing governance health",
      };
    },
    differentiator: "Whether the decision pack is treated as a live governance instrument or a one-time documentation exercise — live instruments with ongoing maintenance have significantly better outcomes.",
    caveat: "Decision pack classification is based on self-reported inputs. Not independently verified. Governance outcomes are scenario estimates.",
  },
};

const FALLBACK_CONFIG: InstrumentConfig = {
  conditionName: (band) => `Instrument result — ${band.replace(/_/g, " ").toLowerCase()}`,
  patternTag: () => "Instrument finding based on your self-reported inputs",
  consequence: (severity) => {
    if (severity === "CRITICAL" || severity === "ALERT") return {
      thirtyDays: "Current condition compounds without deliberate structural intervention",
      sixtyDays: "Inaction increases the cost of correction",
      ninetyDays: "Intervention window narrows — recovery becomes more expensive",
    };
    return {
      thirtyDays: "Current trajectory holds if deliberate action continues",
      sixtyDays: "Return for review to confirm trajectory",
      ninetyDays: "Periodic review maintains diagnostic rigour",
    };
  },
  differentiator: "Whether the finding drives deliberate structural action or remains diagnostic only.",
  caveat: "Classification is based on self-reported inputs. Not independently verified. Scenario only.",
};

// ─── Main Builder ─────────────────────────────────────────────────────────────

/**
 * Builds the full signal authority block for an instrument result page.
 *
 * @param instrumentKey - The instrument registry key (e.g. "decision-exposure-instrument")
 * @param score         - The instrument's primary score (0–100). Pass null if not applicable.
 * @param band          - The instrument's primary band/classification string
 * @param recommendation - The instrument's recommendation text (becomes nextMove)
 */
export function buildInstrumentSignalAuthority(
  instrumentKey: string,
  score: number | null,
  band: string,
  recommendation: string,
): InstrumentSignalAuthority {
  const config = INSTRUMENT_CONFIG[instrumentKey] ?? FALLBACK_CONFIG;
  const severity = bandToSeverity(band);

  let comparisonBand: string | null = null;
  let comparisonCaveat: string | null = null;
  let comparisonBasisLabel: string | null = null;
  let comparisonMaturityLevel: number | null = null;

  if (score !== null) {
    try {
      const pres = resolveComparisonPresentation(instrumentKey, score);
      if (pres.canSurface && pres.band) {
        comparisonBand = pres.band;
        comparisonCaveat = pres.caveat;
        comparisonBasisLabel = pres.basisLabel;
        comparisonMaturityLevel = pres.basis.maturityLevel;
      }
    } catch {
      // Non-fatal — comparison band is best-effort
    }
  }

  return {
    conditionName: config.conditionName(band),
    severity,
    patternTag: config.patternTag(band),
    comparisonBand,
    comparisonCaveat,
    comparisonBasisLabel,
    comparisonMaturityLevel,
    consequence: config.consequence(severity),
    differentiator: config.differentiator,
    nextMove: recommendation,
    caveat: config.caveat,
  };
}
