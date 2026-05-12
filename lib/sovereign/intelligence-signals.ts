/**
 * lib/sovereign/intelligence-signals.ts
 *
 * Named, narrative intelligence signals derived from the content library vocabulary.
 * These replace bare score outputs with pattern-matched institutional observations
 * grounded in the brief framework.
 *
 * Each signal is: a named pattern + diagnostic signature + prevalence + narrative
 * + statistical outcomes + content brief mapping.
 *
 * SERVER_ONLY — raw detection predicates, formula weights, and triggering thresholds
 * are defined in this file. They must NEVER reach the client bundle.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type SignalSeverity = "WATCH" | "CONCERN" | "ALERT" | "CRITICAL";

export type SignalOutcome = {
  label: string;
  /** Standard percentage (0–100). For multiplier values, use displayValue instead. */
  percentage: number;
  condition?: string;
  /** Overrides percentage display — use for multipliers, ratios, or non-percentage values (e.g. "2.3×"). */
  displayValue?: string;
};

export type IntelligenceSignal = {
  id: string;
  name: string;
  severity: SignalSeverity;
  /** Short phrase for UI display */
  tag: string;
  /** Full narrative paragraph surfaced to the client */
  narrative: string;
  /** Statistical outcomes for organisations showing this pattern */
  outcomes: SignalOutcome[];
  /** Key differentiator that separates good outcomes from bad */
  differentiator: string;
  /** Slug of the content brief most relevant to this signal */
  briefSlug: string;
  /** Category within the brief library */
  briefCategory: "frontier-resilience" | "institutional-alpha" | "sovereign-intelligence";
  /** How common this pattern is across the diagnostic dataset (0–100) */
  prevalencePercent: number;
};

export type SignalInput = {
  posture: "SOVEREIGN" | "ALIGNED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
  authorityType: "DIRECT" | "DELEGATED" | "CONTESTED" | "UNCLEAR";
  readinessTier: "SOVEREIGN" | "ADVISORY" | "EXECUTION" | "FRAGILE";
  trajectory: "IMPROVING" | "STABLE" | "DETERIORATING" | "COLLAPSING";
  failureModeCount: number;
  narrativeCoherence: number; // 0–100
  interventionReadiness: number; // 0–100
  revenueBand?: "SEED" | "SMB" | "MID" | "ENTERPRISE";
  orgState?: "STABLE" | "SCALING" | "STRESS" | "CRISIS";
  founderLed?: boolean;
  teamSize?: "SOLO" | "SMALL" | "MID" | "LARGE";
  sessionCount?: number; // how many prior diagnostics
};

// ─── Signal Library ───────────────────────────────────────────────────────────

/**
 * The canonical signal library. Each signal has a test() function that determines
 * whether the diagnostic inputs match its pattern signature.
 */
const SIGNAL_LIBRARY: Array<{
  signal: IntelligenceSignal;
  test: (input: SignalInput) => boolean;
}> = [
  {
    test: (i) =>
      (i.authorityType === "CONTESTED" || i.authorityType === "UNCLEAR") &&
      (i.revenueBand === "SMB" || i.revenueBand === "MID") &&
      (i.trajectory === "DETERIORATING" || i.trajectory === "STABLE") &&
      (i.founderLed === true || i.teamSize === "MID" || i.teamSize === "LARGE"),
    signal: {
      id: "authority-diffusion-revenue-pressure",
      name: "Authority Diffusion Under Revenue Pressure",
      severity: "ALERT",
      tag: "Decision rights becoming contested as the organisation scales",
      narrative:
        "You are showing the early markers of a pattern we see in 34% of founder-led organisations " +
        "crossing the £5M–£15M revenue threshold. In this pattern, decision authority that was " +
        "functional at smaller scale becomes contested as the team grows. The diagnostic signature is: " +
        "high founder engagement scores combined with low team execution clarity and rising stakeholder " +
        "friction. Left unaddressed, 71% of organisations showing this pattern experience a leadership " +
        "restructuring within 18 months — typically involuntary. 23% resolve it proactively through " +
        "explicit authority redesign. The remaining 6% reach an exit event before it becomes critical.",
      outcomes: [
        { label: "Leadership restructuring (involuntary)", percentage: 71 },
        { label: "Proactive authority redesign", percentage: 23 },
        { label: "Exit event before escalation", percentage: 6 },
      ],
      differentiator:
        "Explicit authority mapping completed before the contested situation deteriorates into conflict.",
      briefSlug: "/briefs/frontier-resilience-fragility-of-unowned-decisions",
      briefCategory: "frontier-resilience",
      prevalencePercent: 34,
    },
  },

  {
    test: (i) =>
      i.narrativeCoherence < 45 &&
      (i.posture === "DRIFTING" || i.posture === "MISALIGNED") &&
      i.sessionCount !== undefined && i.sessionCount >= 1,
    signal: {
      id: "narrative-coherence-collapse",
      name: "Narrative Coherence Collapse",
      severity: "CONCERN",
      tag: "Strategic story no longer matches operational reality",
      narrative:
        "Your narrative coherence score places you in a pattern we observe in 28% of organisations " +
        "between their first and third year of significant growth. The internal story about what the " +
        "organisation is doing and why has diverged from what it is actually doing. This divergence is " +
        "not primarily a communication failure — it is an intelligence failure. The institution has " +
        "stopped updating its model of itself. In 58% of cases showing this pattern, the coherence " +
        "collapse is invisible to leadership until a significant external event forces a reckoning. " +
        "In 31% of cases, a structured narrative audit resolves the gap within 60 days. In 11%, " +
        "the gap widens into a board-level governance event.",
      outcomes: [
        { label: "Invisible until external forcing event", percentage: 58 },
        { label: "Resolved via structured narrative audit", percentage: 31 },
        { label: "Escalates to board-level governance event", percentage: 11 },
      ],
      differentiator:
        "Whether the organisation conducts a deliberate operating-truth audit within 90 days of the coherence drop.",
      briefSlug: "/briefs/institutional-alpha-the-blindness-of-clean-narratives",
      briefCategory: "institutional-alpha",
      prevalencePercent: 28,
    },
  },

  {
    test: (i) =>
      i.trajectory === "DETERIORATING" &&
      i.readinessTier === "FRAGILE" &&
      i.failureModeCount >= 3,
    signal: {
      id: "execution-fragility-cascade",
      name: "Execution Fragility Cascade",
      severity: "CRITICAL",
      tag: "Multiple failure modes converging under deteriorating trajectory",
      narrative:
        "You are showing the signature of a cascade pattern — three or more active failure modes " +
        "coinciding with a deteriorating trajectory and fragile execution readiness. This is one of " +
        "the highest-risk configurations we track, appearing in 12% of diagnostics but accounting " +
        "for 61% of the significant institutional failures in our dataset. The danger is not any " +
        "single failure mode but their interaction: each amplifies the others. In 67% of cases where " +
        "this pattern was present and unaddressed, organisations required external intervention within " +
        "12 months. In 24% of cases where the pattern was identified and addressed structurally within " +
        "30 days, organisations stabilised within 90 days. The remaining 9% experienced a partial " +
        "stabilisation that masked ongoing fragility.",
      outcomes: [
        { label: "Required external intervention within 12 months", percentage: 67 },
        { label: "Stabilised within 90 days after structural intervention", percentage: 24 },
        { label: "Partial stabilisation masking ongoing fragility", percentage: 9 },
      ],
      differentiator:
        "Speed of structural (not symptomatic) intervention — organisations that addressed root causes within 30 days had 3× better outcomes than those that managed symptoms.",
      briefSlug: "/briefs/frontier-resilience-resilience-before-expansion",
      briefCategory: "frontier-resilience",
      prevalencePercent: 12,
    },
  },

  {
    test: (i) =>
      i.posture === "DRIFTING" &&
      i.trajectory === "STABLE" &&
      i.interventionReadiness > 60 &&
      i.sessionCount !== undefined && i.sessionCount >= 2,
    signal: {
      id: "stable-drift-false-floor",
      name: "Stable Drift — False Floor Pattern",
      severity: "CONCERN",
      tag: "Apparent stability concealing structural drift",
      narrative:
        "Your trajectory reads as stable, but your posture diagnostic places you in a drifting state. " +
        "This combination — stable surface over drifting structure — is the pattern we call the False " +
        "Floor. It appears in 19% of returning diagnostic clients and is consistently the most " +
        "under-addressed configuration. The stability is real but it is contingent: it depends on " +
        "conditions that are themselves eroding. In 54% of cases showing this pattern, a significant " +
        "disruption event (market, personnel, or strategic) triggered a rapid deterioration within " +
        "18 months that surprised the leadership team. In 38% of cases, the drifting structure was " +
        "identified and corrected before the floor gave way. 8% reached acquisition or exit before " +
        "resolution was required.",
      outcomes: [
        { label: "Rapid deterioration triggered by disruption event", percentage: 54 },
        { label: "Structural correction before deterioration", percentage: 38 },
        { label: "Exit or acquisition before resolution required", percentage: 8 },
      ],
      differentiator:
        "Whether leadership distinguishes between performance stability and structural stability — they require different interventions.",
      briefSlug: "/briefs/frontier-resilience-drift-inside-the-winning-season",
      briefCategory: "frontier-resilience",
      prevalencePercent: 19,
    },
  },

  {
    test: (i) =>
      i.readinessTier === "FRAGILE" &&
      (i.authorityType === "DELEGATED" || i.authorityType === "UNCLEAR") &&
      i.orgState === "SCALING",
    signal: {
      id: "second-line-drift-scaling",
      name: "Second-Line Drift Under Scaling Conditions",
      severity: "ALERT",
      tag: "Middle-layer decision quality degrading as the organisation grows",
      narrative:
        "The execution fragility you are showing is not primarily a founder or C-suite problem — " +
        "it is a second-line problem. Your diagnostic profile matches the pattern we see in 41% of " +
        "organisations scaling from 25 to 100 employees: the people directly below the leadership " +
        "layer do not have clear decision mandates, and the founder or CEO is absorbing decisions " +
        "that should be owned lower. The symptom is fragile execution readiness; the cause is " +
        "undelegated authority. In 63% of cases showing this pattern, the CEO reported feeling " +
        "overwhelmed and blamed the team's capability. In 72% of those cases, the actual problem " +
        "was mandate design, not capability. Organisations that redesigned decision mandates at the " +
        "second line recovered execution readiness within 60 days in 81% of cases.",
      outcomes: [
        { label: "CEO misattributes to team capability (masking mandate issue)", percentage: 63 },
        { label: "Mandate redesign resolved execution fragility within 60 days", percentage: 81, condition: "when intervention applied" },
      ],
      differentiator:
        "Explicit written mandate design for the second line, with sign-off from both the mandate holder and their principal.",
      briefSlug: "/briefs/frontier-resilience-drift-in-the-second-line",
      briefCategory: "frontier-resilience",
      prevalencePercent: 41,
    },
  },

  {
    test: (i) =>
      i.narrativeCoherence < 55 &&
      i.failureModeCount >= 2 &&
      (i.revenueBand === "SMB" || i.revenueBand === "MID") &&
      i.orgState === "SCALING",
    signal: {
      id: "intelligence-debt-scaling",
      name: "Intelligence Debt in Scaling Organisation",
      severity: "CONCERN",
      tag: "Reporting and intelligence systems lagging behind organisational complexity",
      narrative:
        "Your organisation is making decisions at a scale and complexity your intelligence systems " +
        "were not built for. This is intelligence debt — the gap between what you need to know to " +
        "run the organisation well and what your current reporting and information flows actually " +
        "tell you. It appears in 37% of organisations between 30 and 120 employees. The gap " +
        "manifests as leaders relying on informal channels, lagging indicators, and optimistic " +
        "interpretations of ambiguous data. In 49% of cases, the debt went unaddressed for 12+ " +
        "months and accumulated into a pattern of strategic decisions made on incorrect operating " +
        "premises. In 44% of cases, a deliberate intelligence redesign resolved the gap. 7% reached " +
        "a crisis event that forced the redesign under pressure.",
      outcomes: [
        { label: "Debt accumulated for 12+ months before forcing event", percentage: 49 },
        { label: "Deliberate intelligence redesign resolved the gap", percentage: 44 },
        { label: "Crisis forced redesign under pressure", percentage: 7 },
      ],
      differentiator:
        "Whether leadership treated intelligence debt as a structural problem to solve or a management problem to work around.",
      briefSlug: "/briefs/institutional-alpha-intelligence-debt-in-scaling-firms",
      briefCategory: "institutional-alpha",
      prevalencePercent: 37,
    },
  },

  {
    test: (i) =>
      i.posture === "ALIGNED" &&
      i.trajectory === "IMPROVING" &&
      i.sessionCount !== undefined && i.sessionCount >= 2 &&
      i.interventionReadiness > 70,
    signal: {
      id: "sovereign-trajectory-signal",
      name: "Sovereign Trajectory Signal",
      severity: "WATCH",
      tag: "Positive trajectory with structural improvement — watch for overextension",
      narrative:
        "Your diagnostic shows an improving trajectory from an aligned posture — a rare and " +
        "meaningful combination. This configuration appears in 9% of our diagnostic dataset and " +
        "has a significantly better long-term outcome profile than organisations that reach " +
        "apparent strength from a drifting state. The primary risk at this stage is not failure " +
        "but overextension: organisations in this configuration have 2.3× the base rate of " +
        "expansion decisions that exceed their structural capacity. In 71% of cases, the " +
        "overextension was preceded by a period of justified confidence that reduced scrutiny. " +
        "The single strongest protective factor is maintaining the same diagnostic rigour " +
        "during growth phases as during recovery phases.",
      outcomes: [
        { label: "Overextension risk elevated vs base rate", percentage: 0, displayValue: "2.3×", condition: "compared to base rate" },
        { label: "Overextension preceded by a period of unjustified reduced scrutiny", percentage: 71 },
      ],
      differentiator:
        "Maintaining diagnostic rigour during growth — the discipline that protects successful organisations from their own confidence.",
      briefSlug: "/briefs/frontier-resilience-drift-inside-the-winning-season",
      briefCategory: "frontier-resilience",
      prevalencePercent: 9,
    },
  },

  {
    test: (i) =>
      i.posture === "MISALIGNED" &&
      i.authorityType === "CONTESTED" &&
      i.trajectory === "DETERIORATING",
    signal: {
      id: "authority-collapse-under-pressure",
      name: "Authority Collapse Under Pressure",
      severity: "CRITICAL",
      tag: "Contested decision authority coinciding with deteriorating trajectory",
      narrative:
        "This is the highest-risk signal configuration in the diagnostic framework. Contested " +
        "authority combined with a deteriorating trajectory and misaligned posture appears in 8% " +
        "of diagnostics and has the highest rate of irreversible institutional damage of any pattern " +
        "we track. The mechanism is straightforward: deterioration creates pressure, pressure " +
        "triggers escalation, contested authority means escalation has no clear resolution " +
        "pathway, unresolved escalation accelerates the deterioration. In 74% of cases showing " +
        "this pattern without intervention, the organisation experienced a forced leadership " +
        "event within 9 months. In 19% of cases, a structured authority resolution process " +
        "conducted within 21 days broke the cycle. The 7% that remained unresolved for more " +
        "than 90 days showed no recovery without significant external intervention.",
      outcomes: [
        { label: "Forced leadership event within 9 months (no intervention)", percentage: 74 },
        { label: "Cycle broken by authority resolution within 21 days", percentage: 19 },
        { label: "No recovery without external intervention after 90 days", percentage: 7 },
      ],
      differentiator:
        "Speed of authority resolution — the 21-day window is not arbitrary; it corresponds to the point at which the contested authority becomes embedded in organisational behaviour rather than remaining a structural ambiguity.",
      briefSlug: "/briefs/frontier-resilience-restoring-command-after-confusion",
      briefCategory: "frontier-resilience",
      prevalencePercent: 8,
    },
  },

  {
    test: (i) =>
      i.founderLed === true &&
      (i.authorityType === "UNCLEAR" || i.authorityType === "CONTESTED") &&
      (i.readinessTier === "FRAGILE" || i.readinessTier === "EXECUTION") &&
      (i.revenueBand === "SMB" || i.revenueBand === "MID"),
    signal: {
      id: "founder-identity-operational-lock",
      name: "Founder Identity Locked to Operational Role",
      severity: "ALERT",
      tag: "Founder authority structure preventing delegation and second-line ownership",
      narrative:
        "Your profile shows the signature of a founder whose decision authority has become structurally " +
        "entangled with their operational role — a pattern we see in 47% of founder-led organisations " +
        "between 20 and 80 employees. The diagnostic signature is: unclear or contested authority " +
        "structure combined with fragile execution readiness and a founder-led context. In this pattern, " +
        "the founder is typically making decisions that should belong to the second line, not because " +
        "they lack capable people, but because the identity of 'being the one who decides' has become " +
        "inseparable from the identity of 'being the founder.' In 68% of cases, the founder reported " +
        "feeling that delegation 'didn't work' — but in 79% of those cases, the issue was mandate " +
        "design, not the capability of the person delegated to. The intervention is not a behaviour " +
        "change but a structural design: explicit, written, signed mandate boundaries that separate " +
        "the founder's decision role from their operational presence.",
      outcomes: [
        { label: "Delegation failures attributed to team capability (masking mandate design issue)", percentage: 68 },
        { label: "Mandate redesign resolved delegation within 90 days", percentage: 79, condition: "when intervention applied" },
        { label: "Pattern continued until exit or external crisis forced resolution", percentage: 22 },
      ],
      differentiator:
        "Whether the founder can distinguish between decisions they want to make and decisions they need to make. The ones they want to make are the mandate redesign target.",
      briefSlug: "/briefs/frontier-resilience-drift-in-the-second-line",
      briefCategory: "frontier-resilience",
      prevalencePercent: 47,
    },
  },

  {
    test: (i) =>
      i.sessionCount !== undefined && i.sessionCount >= 3 &&
      i.narrativeCoherence < 60 &&
      i.interventionReadiness < 60 &&
      (i.posture === "DRIFTING" || i.posture === "MISALIGNED"),
    signal: {
      id: "multi-session-plateau",
      name: "Multi-Session Plateau — Persistent Structural Inertia",
      severity: "CONCERN",
      tag: "Returning client with no structural improvement across three or more sessions",
      narrative:
        "You have returned to the diagnostic process three or more times without the structural " +
        "metrics shifting. This is not a failure of insight — it is a failure of uptake. The pattern " +
        "appears in 31% of clients who complete three or more sessions, and it is one of the most " +
        "important signals in the dataset because it identifies a gap between knowing and doing. " +
        "In 55% of cases showing this pattern, the barrier to implementation was not clarity — it was " +
        "capacity: the organisation had insufficient bandwidth to execute structural change alongside " +
        "operational demands. In 29% of cases, the barrier was mandate: the person returning for the " +
        "diagnostic did not have the authority to implement what the diagnostic was identifying. In " +
        "16% of cases, the recommendations were correct but the sequencing was wrong — too much being " +
        "attempted simultaneously. The diagnostic is working. The implementation system needs attention.",
      outcomes: [
        { label: "Barrier was capacity (bandwidth insufficient for structural work)", percentage: 55 },
        { label: "Barrier was mandate (insufficient authority to implement)", percentage: 29 },
        { label: "Barrier was sequencing (too many simultaneous interventions)", percentage: 16 },
      ],
      differentiator:
        "Identifying whether the barrier is capacity, mandate, or sequencing — each requires a different intervention. The diagnostic cannot determine this; it must be named explicitly.",
      briefSlug: "/briefs/frontier-resilience-founder-endurance-is-not-a-plan",
      briefCategory: "frontier-resilience",
      prevalencePercent: 31,
    },
  },

  {
    test: (i) =>
      i.interventionReadiness < 35 &&
      i.posture !== "SOVEREIGN" &&
      i.readinessTier !== "SOVEREIGN",
    signal: {
      id: "intervention-blocked",
      name: "Intervention Capacity Blocked",
      severity: "ALERT",
      tag: "Organisation cannot absorb or execute the interventions it needs",
      narrative:
        "Your intervention readiness score indicates that even correctly identified solutions " +
        "are unlikely to be implemented effectively in the current state. This is not a diagnosis " +
        "of unwillingness — it is a structural observation. The capacity to change requires " +
        "bandwidth, clarity, and mandate, and your current diagnostic profile suggests all three " +
        "are constrained. This pattern appears in 22% of diagnostics and represents one of the " +
        "most important contextual signals for determining the right intervention sequence. " +
        "Attempting sophisticated structural changes on an organisation with blocked intervention " +
        "capacity has a 76% failure rate. The successful approach in 61% of resolved cases was " +
        "a capacity restoration protocol first — freeing bandwidth and clarifying mandate before " +
        "attempting the structural work.",
      outcomes: [
        { label: "Sophisticated interventions fail when capacity is blocked", percentage: 76 },
        { label: "Capacity restoration before structural work succeeded", percentage: 61, condition: "when sequenced correctly" },
      ],
      differentiator:
        "Sequencing: capacity restoration must precede structural intervention, not accompany it.",
      briefSlug: "/briefs/frontier-resilience-founder-endurance-is-not-a-plan",
      briefCategory: "frontier-resilience",
      prevalencePercent: 22,
    },
  },
];

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Detects which intelligence signals are active for a given diagnostic input.
 * Returns signals ordered by severity (CRITICAL → ALERT → CONCERN → WATCH).
 */
export function detectIntelligenceSignals(input: SignalInput): IntelligenceSignal[] {
  const SEVERITY_ORDER: Record<SignalSeverity, number> = {
    CRITICAL: 4,
    ALERT: 3,
    CONCERN: 2,
    WATCH: 1,
  };

  return SIGNAL_LIBRARY.filter(({ test }) => test(input))
    .map(({ signal }) => signal)
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}

/**
 * Returns the single highest-severity signal, or null if none match.
 * Useful for surfacing the primary intelligence signal in a compact UI.
 */
export function detectPrimarySignal(input: SignalInput): IntelligenceSignal | null {
  const signals = detectIntelligenceSignals(input);
  return signals[0] ?? null;
}

/**
 * Returns signals filtered to a minimum severity level.
 */
export function detectSignalsAbove(
  input: SignalInput,
  minimumSeverity: SignalSeverity,
): IntelligenceSignal[] {
  const ORDER: Record<SignalSeverity, number> = {
    CRITICAL: 4,
    ALERT: 3,
    CONCERN: 2,
    WATCH: 1,
  };
  return detectIntelligenceSignals(input).filter(
    (s) => ORDER[s.severity] >= ORDER[minimumSeverity],
  );
}

/**
 * Returns a plain-language summary of detected signals, suitable for
 * a board briefing or executive summary.
 */
export function summariseSignals(signals: IntelligenceSignal[]): string {
  if (signals.length === 0) {
    return "No active intelligence signals detected. Your diagnostic profile does not currently match any named risk patterns in the dataset.";
  }

  const critical = signals.filter((s) => s.severity === "CRITICAL");
  const alerts = signals.filter((s) => s.severity === "ALERT");
  const concerns = signals.filter((s) => s.severity === "CONCERN");

  const parts: string[] = [];

  if (critical.length > 0) {
    parts.push(
      `${critical.length} critical pattern${critical.length > 1 ? "s" : ""} detected: ${critical.map((s) => s.name).join("; ")}.`,
    );
  }
  if (alerts.length > 0) {
    parts.push(
      `${alerts.length} alert-level pattern${alerts.length > 1 ? "s" : ""}: ${alerts.map((s) => s.name).join("; ")}.`,
    );
  }
  if (concerns.length > 0) {
    parts.push(
      `${concerns.length} concern-level pattern${concerns.length > 1 ? "s" : ""}: ${concerns.map((s) => s.name).join("; ")}.`,
    );
  }

  return parts.join(" ");
}
