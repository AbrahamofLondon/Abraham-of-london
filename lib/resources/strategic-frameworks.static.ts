/* lib/resources/strategic-frameworks.static.ts — SSOT STATIC (BUILD-SAFE)
   - No prisma, no fs, no node APIs
   - Exports Framework + helpers + requiredTier (used by server layer)
*/

import type { AccessTier } from "@/lib/access/tier-policy";

export const LIBRARY_HREF = "/resources/strategic-frameworks";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface OperatingLogic {
  title: string;
  body: string;
}

export interface PlaybookStep {
  step: number;
  detail: string;
  deliverable: string;
}

export interface Metric {
  metric: string;
  whyItMatters: string;
  reviewCadence: string;
}

/**
 * NOTE:
 * - `tier` here is brand-language labels (Founder/Board/etc).
 * - Access policy maps these labels to SSOT AccessTier for gating.
 */
export interface Framework {
  slug: string;
  title: string;
  oneLiner: string;

  /** Brand-language labels (UI + policy input) */
  tier: string[];

  tag?: string;
  accent?: "gold" | "emerald" | "blue" | "rose" | "indigo";
  canonRoot?: string;

  executiveSummary?: string[];
  operatingLogic?: OperatingLogic[];
  applicationPlaybook?: PlaybookStep[];
  metrics?: Metric[];
  boardQuestions?: string[];
  failureModes?: string[];
  whatToDoNext?: string[];

  artifactHref?: string;

  [k: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* REGISTRY                                                                    */
/* -------------------------------------------------------------------------- */

const FOUNDATION_TRACK: Framework[] = [
  {
    slug: "sovereignty-index",
    title: "The Sovereignty Index",
    oneLiner: "A diagnostic tool for measuring institutional autonomy against external volatility.",
    tier: ["Founder", "Board"],
    tag: "Protocol 01",
    accent: "gold",
    canonRoot: "The Architecture of Human Purpose",
    executiveSummary: [
      "Sovereignty is the ratio of internal agency to external dependency.",
      "This index benchmarks your 'Survival Horizon'—the time your institution can operate if external nodes are severed.",
    ],
    operatingLogic: [
      {
        title: "The Dependency Axial",
        body: "Identify critical nodes (Vendors, Talent, Capital) that lack immediate redundancy.",
      },
    ],
    applicationPlaybook: [
      { step: 1, detail: "Map primary external dependencies.", deliverable: "Dependency Map" },
      { step: 2, detail: "Calculate cost of node failure.", deliverable: "Risk Assessment" },
    ],
    metrics: [{ metric: "Autonomy Ratio", whyItMatters: "Measures independence.", reviewCadence: "Quarterly" }],
    boardQuestions: ["If our primary cloud provider pivots, do we exist?"],
    failureModes: ["Treating sovereignty as isolationism rather than resilience."],
    whatToDoNext: ["Execute a 'Dark Node' simulation with your executive team."],
  },
  {
    slug: "decision-authority-matrix",
    title: "Decision Authority Matrix",
    oneLiner: "Maps who actually decides, who thinks they decide, and where authority leaks.",
    tier: ["Founder", "Board", "Executive"],
    tag: "Protocol 02",
    accent: "emerald",
    canonRoot: "Canon VII — Institutions & Order",
    executiveSummary: [
      "Most organisational failures trace to authority confusion: multiple people believe they own the same decision, or nobody does.",
      "The Decision Authority Matrix maps formal vs. effective authority across critical decisions, exposing gaps before they produce crisis.",
    ],
    operatingLogic: [
      { title: "Authority Inventory", body: "List every decision above a materiality threshold. For each, name the formal owner and the person who actually decides in practice." },
      { title: "Gap Classification", body: "Classify each gap: VACUUM (nobody owns), SHADOW (informal owner overrides formal), COLLISION (multiple claimants)." },
      { title: "Resolution Protocol", body: "For each gap, define the resolution: explicit assignment, mandate clarification, or structural redesign." },
    ],
    applicationPlaybook: [
      { step: 1, detail: "Identify the 10 most consequential decisions made in the last quarter.", deliverable: "Decision Inventory" },
      { step: 2, detail: "For each, name formal owner AND actual decision-maker.", deliverable: "Authority Map" },
      { step: 3, detail: "Classify gaps: vacuum, shadow, or collision.", deliverable: "Gap Report" },
      { step: 4, detail: "Assign explicit authority with deadline and accountability.", deliverable: "Authority Charter" },
    ],
    metrics: [
      { metric: "Authority Gap Count", whyItMatters: "Number of decisions without clear single owner.", reviewCadence: "Monthly" },
      { metric: "Shadow Decision Rate", whyItMatters: "Percentage of decisions made by non-formal owners.", reviewCadence: "Quarterly" },
    ],
    boardQuestions: [
      "For the three most expensive decisions this quarter, can you name a single accountable owner?",
      "How many decisions were made by someone other than the designated authority?",
    ],
    failureModes: [
      "Confusing consultation with authority — asking for input does not mean sharing ownership.",
      "Assigning authority without ensuring the owner has information access.",
      "Creating authority on paper without verifying it in practice.",
    ],
    whatToDoNext: ["Run the Mandate Clarity Framework to score your current authority structure."],
  },
  {
    slug: "institutional-drift-map",
    title: "Institutional Drift Map",
    oneLiner: "Detects where incremental deviation from mission has become structural.",
    tier: ["Founder", "Board"],
    tag: "Protocol 03",
    accent: "rose",
    canonRoot: "Canon I — Foundations of Purpose",
    executiveSummary: [
      "Drift is not dramatic failure. It is incremental deviation — each step rational in isolation, catastrophic in accumulation.",
      "The Drift Map surfaces where daily operations have diverged from stated mission, before the gap becomes irrecoverable.",
    ],
    operatingLogic: [
      { title: "Mission Anchor", body: "Restate the original mission in operational terms: what does success look like in observable behaviour?" },
      { title: "Behaviour Audit", body: "Compare actual resource allocation (time, money, attention) against mission-aligned allocation." },
      { title: "Drift Classification", body: "Classify each divergence: ADAPTIVE (appropriate response to reality), EROSIVE (loss of discipline), STRUCTURAL (embedded misalignment)." },
    ],
    applicationPlaybook: [
      { step: 1, detail: "Write the mission in one sentence of observable outcomes.", deliverable: "Mission Statement (Operational)" },
      { step: 2, detail: "Audit calendar and budget for mission alignment.", deliverable: "Alignment Score" },
      { step: 3, detail: "Classify each drift point.", deliverable: "Drift Map" },
      { step: 4, detail: "Design correction for EROSIVE and STRUCTURAL items.", deliverable: "Correction Plan" },
    ],
    metrics: [
      { metric: "Mission Alignment Score", whyItMatters: "Percentage of resources directed at stated mission.", reviewCadence: "Quarterly" },
      { metric: "Drift Velocity", whyItMatters: "Rate of divergence between stated and actual priorities.", reviewCadence: "Monthly" },
    ],
    boardQuestions: [
      "If we followed the money for the last quarter, would it tell the same story as our strategy deck?",
      "What decision made last month moved us further from our stated mission?",
    ],
    failureModes: [
      "Treating all drift as negative — some adaptation is healthy.",
      "Measuring drift by activity rather than outcome.",
      "Correcting symptoms without addressing the structural incentive that produces drift.",
    ],
    whatToDoNext: ["Run the Institutional Diagnostics Toolkit to quantify drift severity."],
  },
  {
    slug: "governance-pressure-ladder",
    title: "Governance Pressure Ladder",
    oneLiner: "Escalation framework for when institutional pressure exceeds governance capacity.",
    tier: ["Board", "Executive"],
    tag: "Protocol 04",
    accent: "blue",
    canonRoot: "Canon VII — Institutions & Order",
    executiveSummary: [
      "Governance capacity is not infinite. Under sustained pressure, oversight structures fail in predictable sequence.",
      "The Governance Pressure Ladder maps the escalation path and identifies which governance layer fails first.",
    ],
    operatingLogic: [
      { title: "Pressure Inventory", body: "Identify all active pressure sources: regulatory, market, internal conflict, resource constraint, leadership transition." },
      { title: "Governance Load Test", body: "For each pressure source, identify which governance mechanism absorbs it and whether that mechanism is at capacity." },
      { title: "Escalation Triggers", body: "Define the conditions under which each governance layer should escalate to the next." },
    ],
    applicationPlaybook: [
      { step: 1, detail: "List all active institutional pressures.", deliverable: "Pressure Register" },
      { step: 2, detail: "Map each pressure to its absorbing governance layer.", deliverable: "Load Map" },
      { step: 3, detail: "Stress-test: which layer fails first under sustained pressure?", deliverable: "Vulnerability Assessment" },
      { step: 4, detail: "Define escalation triggers and backup protocols.", deliverable: "Escalation Protocol" },
    ],
    metrics: [
      { metric: "Governance Headroom", whyItMatters: "Remaining capacity in primary governance layer.", reviewCadence: "Monthly" },
      { metric: "Escalation Frequency", whyItMatters: "How often issues bypass normal governance.", reviewCadence: "Quarterly" },
    ],
    boardQuestions: [
      "Which governance mechanism would fail first if three of our current pressures intensified simultaneously?",
      "When was the last time an issue escalated past normal governance? What happened?",
    ],
    failureModes: [
      "Assuming governance capacity scales with pressure — it does not.",
      "Over-relying on individual leaders rather than structural mechanisms.",
      "Treating escalation as failure rather than designed response.",
    ],
    whatToDoNext: ["Run the Board Governance Toolkit to assess current oversight capacity."],
  },
  {
    slug: "execution-integrity-grid",
    title: "Execution Integrity Grid",
    oneLiner: "Measures whether decisions survive the journey from boardroom to operations.",
    tier: ["Founder", "Executive"],
    tag: "Protocol 05",
    accent: "gold",
    canonRoot: "Canon II — Governance & Formation",
    executiveSummary: [
      "Most decisions fail after approval — in the execution layer, not the decision layer.",
      "The Execution Integrity Grid maps where decisions degrade between intent and action, and why.",
    ],
    operatingLogic: [
      { title: "Decision Tracing", body: "For each major decision, trace the path from approval to operational execution. Identify where the decision was modified, delayed, or abandoned." },
      { title: "Integrity Scoring", body: "Score each decision on execution fidelity: was the outcome what was intended?" },
      { title: "Failure Pattern", body: "Classify failure type: COMMUNICATION (decision not understood), OWNERSHIP (nobody drove it), CAPACITY (resources insufficient), RESISTANCE (active opposition)." },
    ],
    applicationPlaybook: [
      { step: 1, detail: "Select 5 recent board/executive decisions.", deliverable: "Decision Sample" },
      { step: 2, detail: "Trace each from approval to execution outcome.", deliverable: "Execution Trace" },
      { step: 3, detail: "Score fidelity (1-10) and classify failure type.", deliverable: "Integrity Grid" },
      { step: 4, detail: "Design fix for dominant failure pattern.", deliverable: "Execution Protocol" },
    ],
    metrics: [
      { metric: "Execution Fidelity Score", whyItMatters: "Percentage of decisions executed as intended.", reviewCadence: "Quarterly" },
      { metric: "Decision Decay Rate", whyItMatters: "How quickly decisions lose integrity after approval.", reviewCadence: "Monthly" },
    ],
    boardQuestions: [
      "Of the decisions we approved last quarter, how many were executed as intended?",
      "What is the average time between decision and first visible action?",
    ],
    failureModes: [
      "Assuming approval equals execution.",
      "Measuring activity (meetings, reports) rather than outcome fidelity.",
      "Blaming execution teams when the decision was ambiguous at source.",
    ],
    whatToDoNext: ["Run the Decision Exposure Instrument to quantify current execution risk."],
  },
  {
    slug: "board-accountability-loop",
    title: "Board Accountability Loop",
    oneLiner: "Closes the gap between board direction and verified organisational response.",
    tier: ["Board"],
    tag: "Protocol 06",
    accent: "indigo",
    canonRoot: "Canon VII — Institutions & Order",
    executiveSummary: [
      "Boards direct. Organisations respond. But the loop between direction and verified response is rarely closed.",
      "The Board Accountability Loop creates a structured feedback cycle that proves whether direction was received, acted on, and effective.",
    ],
    operatingLogic: [
      { title: "Direction Registry", body: "Every board directive must be logged with: what, who, when, and how success is measured." },
      { title: "Response Verification", body: "At defined intervals, verify: was the directive received, was it acted on, was the outcome as intended?" },
      { title: "Accountability Enforcement", body: "If verification fails: escalate, reassign, or restructure. No directive should exist without a verified response." },
    ],
    applicationPlaybook: [
      { step: 1, detail: "Create a board directive registry.", deliverable: "Directive Log" },
      { step: 2, detail: "Assign verification owners and timelines.", deliverable: "Accountability Matrix" },
      { step: 3, detail: "Run first verification cycle.", deliverable: "Verification Report" },
      { step: 4, detail: "Enforce consequences for unverified directives.", deliverable: "Enforcement Protocol" },
    ],
    metrics: [
      { metric: "Directive Completion Rate", whyItMatters: "Percentage of board directives with verified outcomes.", reviewCadence: "Quarterly" },
      { metric: "Response Latency", whyItMatters: "Average time between directive and first verified response.", reviewCadence: "Monthly" },
    ],
    boardQuestions: [
      "Which of our directives from last quarter have verified outcomes?",
      "How do we know our directions are being acted on, rather than merely acknowledged?",
    ],
    failureModes: [
      "Confusing acknowledgement with action.",
      "Measuring response time rather than response quality.",
      "Allowing directives to expire without explicit closure.",
    ],
    whatToDoNext: ["Run the Board Governance Toolkit to structure your accountability system."],
  },
  {
    slug: "succession-readiness-model",
    title: "Succession Readiness Model",
    oneLiner: "Measures whether your institution survives the departure of any single person.",
    tier: ["Founder", "Board"],
    tag: "Protocol 07",
    accent: "emerald",
    canonRoot: "Canon IV — Family & Formation",
    executiveSummary: [
      "An institution that cannot survive the departure of its founder is not an institution. It is a dependency.",
      "The Succession Readiness Model measures structural resilience against leadership transition at every level.",
    ],
    operatingLogic: [
      { title: "Key Person Inventory", body: "Identify every role where departure would cause material disruption. Score the disruption severity." },
      { title: "Knowledge Audit", body: "For each key person, identify what knowledge is documented, transferable, and currently shared." },
      { title: "Successor Pipeline", body: "For each key role, identify: is there a named successor, are they capable, do they know, is the transition plan documented?" },
    ],
    applicationPlaybook: [
      { step: 1, detail: "Identify all single-point-of-failure roles.", deliverable: "Key Person Map" },
      { step: 2, detail: "Score knowledge documentation and transferability.", deliverable: "Knowledge Audit" },
      { step: 3, detail: "Name successors and assess readiness.", deliverable: "Successor Pipeline" },
      { step: 4, detail: "Create transition plans for top 5 critical roles.", deliverable: "Transition Protocols" },
    ],
    metrics: [
      { metric: "Succession Readiness Score", whyItMatters: "Percentage of critical roles with named, capable successors.", reviewCadence: "Semi-annually" },
      { metric: "Knowledge Transfer Completeness", whyItMatters: "Percentage of critical knowledge that is documented and transferable.", reviewCadence: "Quarterly" },
    ],
    boardQuestions: [
      "If our founder left tomorrow, what decisions would be unresolvable?",
      "How many of our critical roles have a named successor who could start within 30 days?",
    ],
    failureModes: [
      "Treating succession as a retirement event rather than a continuous readiness posture.",
      "Naming successors without testing them under pressure.",
      "Confusing institutional memory with personal memory.",
    ],
    whatToDoNext: ["Run the Succession Engineering Toolkit to build your transition infrastructure."],
  },
];

export const FRAMEWORKS: readonly Framework[] = FOUNDATION_TRACK;

/* -------------------------------------------------------------------------- */
/* ACCESS POLICY (STATIC, DETERMINISTIC)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Maps brand-language labels -> SSOT AccessTier.
 * Deterministic, build-safe, and shared by server & API layers.
 */
export function requiredTier(fw: Framework): AccessTier {
  const labels = (fw?.tier ?? []).map((x) => String(x).toLowerCase().trim());
  const set = new Set(labels);

  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner_circle";
  if (set.has("member")) return "member";
  return "public";
}

/* -------------------------------------------------------------------------- */
/* PURE HELPERS                                                                */
/* -------------------------------------------------------------------------- */

export function getAllFrameworks(): Framework[] {
  return [...FOUNDATION_TRACK];
}

export function getAllFrameworkSlugs(): string[] {
  return FOUNDATION_TRACK.map((f) => f.slug);
}

export function getFrameworkBySlug(slug: string): Framework | undefined {
  const s = String(slug || "").trim();
  return FOUNDATION_TRACK.find((f) => f.slug === s);
}
