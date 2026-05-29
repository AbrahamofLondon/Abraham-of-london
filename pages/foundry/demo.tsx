/* pages/foundry/demo.tsx — PUBLIC FOUNDRY DEMO PLAYGROUND
 *
 * Safe, limited demo of Foundry-style pressure testing.
 * No admin data. No real ResearchRun persistence. No governed engine calls.
 * All analysis runs client-side with deterministic pattern matching.
 * Output is clearly labelled DEMO throughout.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoTab = "contradiction" | "diagnostic" | "release" | "market";

type DemoResult = {
  summary:    string;
  findings:   { label: string; detail: string; severity: "HIGH" | "MEDIUM" | "LOW" }[];
  consequence: string;
  nextAction:  string;
  fullRunAdds: string[];
};

// ─── Client-side analysis engines (no API calls) ──────────────────────────────

const CONTRADICTION_PATTERNS: [RegExp, string, string][] = [
  [/\b(ready|launch|ship|deploy)\b.{0,80}\b(not ready|need more|haven't|haven.t|missing|pending)\b/i,
    "Readiness contradiction",
    "A launch assertion conflicts with an unresolved dependency. This is a structural contradiction — not a timing issue."],
  [/\b(approved|sign[- ]?off|sign[- ]?ed off|approved by)\b.{0,80}\b(no one|nobody|not yet|pending|waiting)\b/i,
    "Authority gap",
    "Approval has been asserted but no authority has actually signed off. Governance cannot proceed without a named decision-maker."],
  [/\b(data|evidence|proof|tested|validated)\b.{0,80}\b(no data|no evidence|haven.t tested|not tested|unvalidated|assumption)\b/i,
    "Evidence contradiction",
    "A claim of evidence-backed decision conflicts with missing or untested data. This is a common governance failure mode."],
  [/\b(customers?|users?|clients?|market)\b.{0,80}\b(don.t know|unclear|not sure|unknown|haven.t asked)\b/i,
    "Customer understanding gap",
    "A market or customer claim is made without validated understanding. Decisions based on assumed customer knowledge carry high reversal risk."],
  [/\b(urgent|asap|immediately|now|today)\b.{0,80}\b(not sure|don.t know|unclear|undefined|tbd)\b/i,
    "Urgency without clarity",
    "Urgency is asserted while key variables remain undefined. Forced timelines without resolved dependencies are a primary cause of execution failure."],
  [/\b(risk|risky|high.risk)\b.{0,80}\b(no mitigation|no plan|no backup|no contingency|if .{0,20} fails)\b/i,
    "Risk without mitigation",
    "A risk has been identified but no mitigation path is described. Acknowledged risk without a response plan is organisational exposure."],
  [/\b(everyone|team|all agree[ds]?)\b.{0,80}\b(but|except|however|although)\b/i,
    "Alignment contradiction",
    "Apparent consensus is undermined by a dissenting qualifier. False alignment is more dangerous than visible disagreement."],
];

function analyseContradiction(input: string): DemoResult {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 20) {
    return {
      summary: "Input too short for meaningful contradiction analysis.",
      findings: [],
      consequence: "Provide at least one complete sentence describing a decision or situation.",
      nextAction: "Enter a full decision statement, meeting outcome, or situation summary.",
      fullRunAdds: [],
    };
  }

  const matched: DemoResult["findings"] = [];
  for (const [pattern, label, detail] of CONTRADICTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      matched.push({ label, detail, severity: "HIGH" });
    }
  }

  // Detect hedging density
  const hedges = (trimmed.match(/\b(maybe|perhaps|might|could|possibly|probably|sort of|kind of|I think|I guess|not sure|unclear)\b/gi) || []).length;
  const wordCount = trimmed.split(/\s+/).length;
  if (hedges > 0 && wordCount > 10) {
    const rate = (hedges / wordCount) * 100;
    if (rate > 12) {
      matched.push({
        label: "High hedging density",
        detail: `${hedges} uncertainty markers in ${wordCount} words (${rate.toFixed(0)}% hedge rate). High hedging in a decision statement signals unresolved ambiguity that will surface as execution confusion.`,
        severity: "MEDIUM",
      });
    }
  }

  // Detect passive voice authority gap
  if (/\b(was decided|has been decided|it was agreed|it was felt|it is felt|it was determined)\b/i.test(trimmed)) {
    matched.push({
      label: "Anonymous authority",
      detail: "A decision is described in passive voice with no named decision-maker. Decisions without a named authority cannot be held to account or reversed cleanly.",
      severity: "HIGH",
    });
  }

  if (matched.length === 0) {
    return {
      summary: "No structural contradictions detected in this statement.",
      findings: [{ label: "No contradictions found", detail: "The statement appears internally consistent. This is a necessary but not sufficient condition for a sound decision.", severity: "LOW" }],
      consequence: "A clean scan does not mean the decision is sound — only that it does not contradict itself on the surface.",
      nextAction: "Run a full Constitutional Diagnostic to check authority, evidence, and governance path.",
      fullRunAdds: [
        "Deep authority chain analysis",
        "Evidence adequacy assessment",
        "Cross-decision contradiction detection (not just within one statement)",
        "Governance event durability check",
        "ResearchRun with audit trail",
      ],
    };
  }

  const highCount = matched.filter((f) => f.severity === "HIGH").length;
  const consequence = highCount >= 2
    ? `${highCount} HIGH-severity contradictions in one statement indicates systemic governance breakdown. This decision should not proceed without resolution.`
    : matched[0]?.label === "Authority gap"
    ? "Without a named authority, this decision cannot be executed, reversed, or audited. It will stall or be made informally — both are governance failures."
    : "Unresolved contradictions in a decision statement predict execution failures at the point where assumptions meet reality.";

  return {
    summary: `${matched.length} structural issue${matched.length !== 1 ? "s" : ""} detected in your statement.`,
    findings: matched,
    consequence,
    nextAction: "Resolve contradictions before proceeding. Each finding maps to a governance event that a full Foundry run would require evidence for.",
    fullRunAdds: [
      "Cross-run contradiction detection (finds contradictions with prior decisions)",
      "Authority chain validation against institutional registry",
      "Evidence adequacy scoring for each claim",
      "Governance event emission with audit trail",
      "ResearchRun persisted for future reference",
    ],
  };
}

// ─── Constitutional Diagnostic Preview ────────────────────────────────────────

type DiagAnswers = {
  decisionType: string;
  authority:    string;
  evidence:     string;
  urgency:      string;
};

const ROUTES: Record<string, { name: string; desc: string; score: number }> = {
  "strategic-board-high-standard":   { name: "Boardroom Route",    desc: "Full dossier, authority validation, evidence gate, structured delivery.", score: 92 },
  "strategic-board-high-urgent":     { name: "Boardroom Route",    desc: "Expedited dossier. Authority gate cannot be bypassed — urgency does not waive governance.", score: 88 },
  "strategic-committee-high-standard": { name: "Executive Reporting Route", desc: "Structured brief with evidence mandate and delivery tracking.", score: 84 },
  "strategic-committee-low-urgent":  { name: "Fast Diagnostic Route", desc: "Evidence is insufficient for strategic scope. Flag as decision risk before proceeding.", score: 61 },
  "operational-solo-high-standard":  { name: "Executive Reporting Route", desc: "Operational scope with strong evidence — expedited review path.", score: 78 },
  "operational-solo-low-urgent":     { name: "Fast Diagnostic Route", desc: "Urgency combined with weak evidence. Proceed only if consequence of delay exceeds risk of error.", score: 55 },
  "investment-board-high-standard":  { name: "Boardroom Route",    desc: "Investment decisions require full evidence gate and board-level authority. No shortcuts.", score: 96 },
  "investment-solo-low-urgent":      { name: "Decision Deferred",  desc: "Investment decisions cannot proceed without board authority and strong evidence. Classify as blocked.", score: 22 },
};

function getRoute(answers: DiagAnswers): { name: string; desc: string; score: number; key: string } {
  const { decisionType, authority, evidence, urgency } = answers;
  const evidenceLevel = evidence === "strong" ? "high" : "low";
  const key = `${decisionType}-${authority}-${evidenceLevel}-${urgency}`;
  const match = ROUTES[key] ?? null;

  if (match) return { ...match, key };

  // Fallback scoring
  const score =
    (decisionType === "investment" ? 30 : decisionType === "strategic" ? 20 : 10) +
    (authority === "board" ? 30 : authority === "committee" ? 20 : 5) +
    (evidence === "strong" ? 25 : evidence === "partial" ? 15 : 0) +
    (urgency === "standard" ? 10 : urgency === "extended" ? 15 : 5);

  const name = score >= 80 ? "Boardroom Route" : score >= 60 ? "Executive Reporting Route" : score >= 40 ? "Fast Diagnostic Route" : "Decision Deferred";
  const desc = score < 40
    ? "Authority and evidence are insufficient for this decision scope. Blocking is correct."
    : score < 60
    ? "Proceed with caution. Evidence or authority gaps must be resolved before commitment."
    : "Proceed via structured review. Document the governance path before acting.";

  return { name, desc, score, key };
}

// ─── Release Risk Scanner ─────────────────────────────────────────────────────

const RELEASE_FLAGS: [RegExp, string, string, "HIGH" | "MEDIUM" | "LOW"][] = [
  [/\b(not sure|unclear|unknown|haven.t decided|tbd|t\.b\.d\.)\b/i, "Undefined scope", "One or more release parameters are undefined. Shipping undefined scope is a governance failure, not a velocity trade-off.", "HIGH"],
  [/\b(no sign[- ]?off|not approved|pending approval|waiting for|waiting on)\b/i, "Missing approval", "Release requires named authority approval. Approval pending is a hard block.", "HIGH"],
  [/\b(haven.t tested|not tested|no testing|skip test|skipping test|skip the test)\b/i, "Test gap", "Untested code reaching production is a release risk, not a release. Flag for mandatory test evidence.", "HIGH"],
  [/\b(critical bug|showstopper|show stopper|breaking change|breaks? .{0,20}production|regression)\b/i, "Known critical defect", "A known critical defect is present. Release is blocked until resolved or accepted with a governance record.", "HIGH"],
  [/\b(hope|hopefully|should work|might work|probably fine|should be fine|fingers crossed)\b/i, "Assumption-based confidence", "Confidence based on hope or assumption (not evidence) is a release risk signal. Each occurrence should map to an evidence requirement.", "MEDIUM"],
  [/\b(rollback|can.t rollback|no rollback|rollback plan)\b/i, "Rollback posture", "Releases without a defined rollback plan carry elevated reversal risk. Governance requires a documented rollback path.", "MEDIUM"],
  [/\b(no monitoring|no alerting|no observability|can.t see|won.t know|flying blind)\b/i, "Observability gap", "Releases without monitoring leave governance blind to production impact. This is a post-release risk, not a ship-blocker — but it must be documented.", "MEDIUM"],
  [/\b(customers? will notice|users? will see|public-facing|visible change|UI change)\b/i, "User-facing change without evidence", "User-visible changes require documented validation (user testing, A/B gate, or explicit sign-off from a named authority).", "MEDIUM"],
  [/\b(dependency|depends on|waiting on|blocked by|requires .{0,20}first)\b/i, "Unresolved dependency", "An external dependency is listed. Release cannot be independent if dependencies are unresolved.", "LOW"],
  [/\b(a bit|little bit|somewhat|slightly|a few issues?|minor issues?)\b/i, "Minimising language", "Softening language around defects or gaps is a risk signal. Each 'minor issue' must be explicitly characterised before release.", "LOW"],
];

function analyseRelease(input: string): DemoResult {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 20) {
    return {
      summary: "Input too short for release risk analysis.",
      findings: [],
      consequence: "Describe your product's current release readiness to scan for governance gaps.",
      nextAction: "Enter a summary of your product's state, known issues, approval status, and intended release date.",
      fullRunAdds: [],
    };
  }

  const matched: DemoResult["findings"] = [];
  for (const [pattern, label, detail, severity] of RELEASE_FLAGS) {
    if (pattern.test(trimmed)) {
      matched.push({ label, detail, severity });
    }
  }

  const highCount = matched.filter((f) => f.severity === "HIGH").length;

  if (matched.length === 0) {
    return {
      summary: "No surface-level release blockers detected.",
      findings: [{ label: "No blockers found on this scan", detail: "Surface-level indicators are clear. This does not mean the release is safe — only that the statement doesn't contain common governance red flags.", severity: "LOW" }],
      consequence: "A clean surface scan is not a release gate. A full governed run checks evidence, authority, test coverage, and downstream dependency chains.",
      nextAction: "Request a full governed release review from the Foundry to generate a ResearchRun with a signed-off release record.",
      fullRunAdds: [
        "Evidence adequacy check for each release claim",
        "Authority chain validation",
        "Dependency resolution map",
        "Rollback plan assessment",
        "Post-release monitoring coverage check",
      ],
    };
  }

  return {
    summary: `${matched.length} release risk signal${matched.length !== 1 ? "s" : ""} found. ${highCount > 0 ? `${highCount} are release-blocking.` : "None are hard blockers."}`,
    findings: matched.sort((a, b) => (a.severity === "HIGH" ? -1 : b.severity === "HIGH" ? 1 : 0)),
    consequence: highCount >= 2
      ? "Multiple hard blockers indicate a release that is not ready for production governance sign-off. Proceeding risks reversal, customer impact, and governance debt."
      : highCount === 1
      ? "One hard blocker must be resolved and documented before a governed release can be signed off."
      : "Medium and low signals indicate governance gaps that may not stop the release but will create unresolved debt. Each must be documented.",
    nextAction: highCount > 0
      ? "Resolve hard blockers first. Each resolution should generate a governance event with evidence. Then request a full Foundry governed release review."
      : "Document each medium/low signal as a known risk with a named owner. Run a full governed review to generate the release record.",
    fullRunAdds: [
      "Evidence-gated sign-off with named authority",
      "Dependency resolution with evidence chain",
      "Rollback plan validation",
      "CI gate check (blocks deployment if governance is incomplete)",
      "Persistent ResearchRun with full audit trail",
    ],
  };
}

// ─── Market Response Classifier ───────────────────────────────────────────────

type SignalClass = "THREAT" | "OPPORTUNITY" | "NOISE" | "VALIDATION" | "REGULATOR_SIGNAL";

const SIGNAL_PATTERNS: [RegExp, SignalClass, string, string][] = [
  [/\b(compet|rival|competitor|alternatives?|switching|switch to|moved to|went with)\b/i, "THREAT", "Competitive displacement signal", "Analyse market share impact and the specific capability gap being exploited. Act within 30 days or accept position loss."],
  [/\b(interest|demand|asking for|want|need|looking for|search|enquiry|enquiries)\b/i, "OPPORTUNITY", "Demand signal", "An unmet demand has been surfaced. Validate it against current product positioning and assess fulfilment gap."],
  [/\b(regulator|regulation|compliance|legislation|law|gdpr|ico|cma|fca|sec|ftc)\b/i, "REGULATOR_SIGNAL", "Regulatory signal", "Regulatory signals require governance-level response, not operational response. Escalate to the appropriate authority chain within 48 hours."],
  [/\b(negative review|bad review|complaint|unhappy|dissatisfied|frustrated|disappointed|angry customer)\b/i, "THREAT", "Customer dissatisfaction signal", "Negative customer sentiment patterns predict churn and reputational risk. Each complaint is a data point in a pattern — classify by frequency and severity."],
  [/\b(positive review|great feedback|love it|excellent|five star|5 star|nps|recommend)\b/i, "VALIDATION", "Product validation signal", "Positive market signals should be codified as evidence for product decisions, not just celebrated. Each maps to a validated product assumption."],
  [/\b(price|too expensive|cheaper|cost|pricing|budget|afford)\b/i, "THREAT", "Price pressure signal", "Price objections can signal misaligned positioning rather than a pricing error. Analyse what value is being compared and where the gap is."],
  [/\b(partnership|integration|api|connect|work with|collaborate)\b/i, "OPPORTUNITY", "Integration or partnership signal", "Partnership interest requires qualification. Assess strategic fit, governance implications, and what dependency it creates."],
];

function classifyMarketSignal(input: string): DemoResult {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 15) {
    return {
      summary: "Input too short for signal classification.",
      findings: [],
      consequence: "Enter a market observation, customer feedback, or competitive signal to classify.",
      nextAction: "Describe what you observed, heard, or received from the market.",
      fullRunAdds: [],
    };
  }

  const matched: Array<{ signal: SignalClass; label: string; detail: string }> = [];
  for (const [pattern, signal, label, detail] of SIGNAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      matched.push({ signal, label, detail });
    }
  }

  if (matched.length === 0) {
    return {
      summary: "Signal classified as NOISE — no actionable pattern detected.",
      findings: [{ label: "NOISE", detail: "No market pattern was matched. This signal may be a one-off observation, anecdote, or weak indicator. Do not act on it without corroboration.", severity: "LOW" }],
      consequence: "Acting on noise without corroboration wastes strategic resources and creates false governance signals.",
      nextAction: "Gather additional data points before treating this as an actionable signal. Two or more similar observations move it from noise to pattern.",
      fullRunAdds: [
        "Pattern frequency analysis across multiple signals",
        "Signal source credibility weighting",
        "Cross-signal correlation against product positioning",
        "ResearchRun with sourced evidence chain",
      ],
    };
  }

  // matched is non-empty here (guarded by early return above)
  const primary = matched[0]!;
  const severity: "HIGH" | "MEDIUM" | "LOW" =
    primary.signal === "THREAT" || primary.signal === "REGULATOR_SIGNAL" ? "HIGH" :
    primary.signal === "OPPORTUNITY" ? "MEDIUM" : "LOW";

  return {
    summary: `Signal classified as ${primary.signal}. ${matched.length > 1 ? `${matched.length - 1} secondary signal(s) also detected.` : ""}`,
    findings: matched.map(({ label, detail, signal }) => ({
      label: `[${signal}] ${label}`,
      detail,
      severity: (signal === "THREAT" || signal === "REGULATOR_SIGNAL" ? "HIGH" : signal === "OPPORTUNITY" ? "MEDIUM" : "LOW") as "HIGH" | "MEDIUM" | "LOW",
    })),
    consequence: primary.signal === "THREAT"
      ? "Unaddressed threats compound. A competitive or customer threat that does not receive a governed response within 30 days becomes an accepted position loss."
      : primary.signal === "REGULATOR_SIGNAL"
      ? "Regulatory signals cannot be treated as operational tasks. They require a governance-level decision with a named authority and documented response."
      : primary.signal === "OPPORTUNITY"
      ? "Unactioned opportunity signals decay. Market windows are time-limited. This signal needs a qualifying decision within the window."
      : "Validation signals should be codified as evidence for product and strategy decisions — not just noted.",
    nextAction: primary.signal === "THREAT"
      ? "Escalate to named authority within 24–48 hours. Prepare a governed response brief with evidence and proposed action."
      : primary.signal === "REGULATOR_SIGNAL"
      ? "Route immediately to legal/compliance authority. Do not treat as an operational matter."
      : "Qualify the signal against product strategy. Assign a named owner and a response deadline.",
    fullRunAdds: [
      "Cross-signal pattern analysis (not single-observation)",
      "Source credibility and context assessment",
      "Connection to product strategy and governance events",
      "Named authority assignment and deadline governance",
      "ResearchRun with full evidence chain and audit trail",
    ],
  };
}

// ─── Severity colours ─────────────────────────────────────────────────────────

function severityClasses(s: "HIGH" | "MEDIUM" | "LOW"): { dot: string; badge: string; border: string; bg: string } {
  return s === "HIGH"
    ? { dot: "bg-red-400",    badge: "text-red-400/80 border-red-500/25 bg-red-500/8",     border: "border-red-500/20",    bg: "bg-red-500/5" }
    : s === "MEDIUM"
    ? { dot: "bg-amber-400",  badge: "text-amber-400/80 border-amber-500/25 bg-amber-500/8", border: "border-amber-500/20", bg: "bg-amber-500/5" }
    : { dot: "bg-white/30",   badge: "text-white/50 border-white/15 bg-white/5",            border: "border-white/10",      bg: "bg-white/3" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";

const TAB_CONFIG: { id: DemoTab; label: string; tagline: string }[] = [
  { id: "contradiction", label: "Decision Contradiction",   tagline: "Paste a decision, plan, or meeting outcome. Detect structural contradictions instantly." },
  { id: "diagnostic",   label: "Constitutional Diagnostic", tagline: "Answer 4 questions. Get a governance route and authority assessment." },
  { id: "release",      label: "Release Risk Scanner",      tagline: "Describe your release readiness. Surface governance blockers before they surface in production." },
  { id: "market",       label: "Market Signal Classifier",  tagline: "Enter a market observation. Classify threat, opportunity, noise, or regulatory signal." },
];

export default function FoundryDemoPage() {
  const [activeTab, setActiveTab] = React.useState<DemoTab>("contradiction");
  const [input,     setInput]     = React.useState("");
  const [result,    setResult]    = React.useState<DemoResult | null>(null);
  const [analysing, setAnalysing] = React.useState(false);

  // Diagnostic state
  const [diagAnswers, setDiagAnswers] = React.useState<DiagAnswers>({
    decisionType: "", authority: "", evidence: "", urgency: "",
  });
  const [diagResult, setDiagResult] = React.useState<ReturnType<typeof getRoute> | null>(null);

  const tab = TAB_CONFIG.find((t) => t.id === activeTab)!;

  function handleTabChange(t: DemoTab) {
    setActiveTab(t);
    setInput("");
    setResult(null);
    setDiagAnswers({ decisionType: "", authority: "", evidence: "", urgency: "" });
    setDiagResult(null);
  }

  function handleAnalyse() {
    setAnalysing(true);
    // Small delay to make the interaction feel deliberate
    setTimeout(() => {
      const r = activeTab === "contradiction" ? analyseContradiction(input)
              : activeTab === "release"       ? analyseRelease(input)
              : activeTab === "market"        ? classifyMarketSignal(input)
              : null;
      setResult(r);
      setAnalysing(false);
    }, 400);
  }

  function handleDiagnostic() {
    const all = Object.values(diagAnswers).every(Boolean);
    if (!all) return;
    setDiagResult(getRoute(diagAnswers));
  }

  const scoreColour = diagResult
    ? diagResult.score >= 80 ? "text-emerald-400"
    : diagResult.score >= 55 ? "text-amber-400"
    : "text-red-400"
    : "";

  return (
    <Layout
      title="Foundry Demo — Decision & Governance Pressure Testing | Abraham of London"
      description="Experience Foundry-style pressure testing: detect decision contradictions, assess constitutional routes, scan release risk, and classify market signals. No sign-up required."
      fullWidth
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-black text-white">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="border-b border-white/8 px-6 pb-16 pt-20 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-center gap-2">
              <span
                className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest"
                style={{ borderColor: `${GOLD}40`, color: `${GOLD}CC`, backgroundColor: `${GOLD}10` }}
              >
                Demo
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">
                No sign-up required
              </span>
            </div>
            <h1 className="font-serif text-5xl leading-tight text-white md:text-7xl">
              The Foundry
            </h1>
            <p className="mt-4 text-xl text-white/50" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }}>
              Governance pressure testing for decisions that carry real consequence.
            </p>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/40">
              Paste a decision. Answer four questions. Enter a market signal.
              The Foundry returns contradictions, risk, consequence, and next action — in seconds.
            </p>
            <p className="mt-4 font-mono text-[10px] text-white/20 uppercase tracking-wider">
              All analysis below is a limited demo. Output is clearly labelled DEMO.
              A full governed run includes audit trails, ResearchRun persistence, and authority validation.
            </p>
          </div>
        </section>

        {/* ── Demo module tabs ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 py-12">

          {/* Tab nav */}
          <div className="mb-8 flex flex-wrap gap-2">
            {TAB_CONFIG.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`rounded-lg border px-4 py-2 text-xs font-mono transition-all ${
                  activeTab === t.id
                    ? "border-white/25 bg-white/8 text-white/85"
                    : "border-white/8 bg-white/2 text-white/30 hover:border-white/15 hover:text-white/55"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* DEMO badge + tagline */}
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded border border-amber-500/25 bg-amber-500/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400/70">
              Demo Module
            </span>
            <p className="text-sm text-white/45">{tab.tagline}</p>
          </div>

          {/* ── Contradiction / Release / Market — text input ────────────────── */}
          {activeTab !== "diagnostic" && (
            <div className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setResult(null); }}
                placeholder={
                  activeTab === "contradiction"
                    ? "Paste a decision statement, meeting outcome, or plan summary…"
                    : activeTab === "release"
                    ? "Describe your product's current state, known issues, approval status, and intended release…"
                    : "Enter a market observation, customer feedback, or competitive signal…"
                }
                rows={6}
                className="w-full rounded-xl border border-white/12 bg-[#080808] px-4 py-3 text-sm text-white/75 placeholder:text-white/20 focus:border-white/25 focus:outline-none resize-none leading-7"
              />
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAnalyse}
                  disabled={analysing || input.trim().length < 10}
                  className="rounded-lg border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-mono text-white/70 transition-all hover:border-white/35 hover:bg-white/8 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {analysing ? "Analysing…" : "Analyse"}
                </button>
                {input.trim().length > 0 && input.trim().length < 10 && (
                  <p className="text-[11px] font-mono text-white/25">Enter at least 10 characters</p>
                )}
              </div>
            </div>
          )}

          {/* ── Constitutional Diagnostic — question form ────────────────────── */}
          {activeTab === "diagnostic" && (
            <div className="space-y-5">
              {[
                {
                  key: "decisionType" as const,
                  question: "What type of decision is this?",
                  options: [
                    { value: "operational", label: "Operational — day-to-day execution or process change" },
                    { value: "strategic",   label: "Strategic — direction, positioning, or major investment" },
                    { value: "investment",  label: "Financial investment — capital allocation or acquisition" },
                  ],
                },
                {
                  key: "authority" as const,
                  question: "Who has authority to make this decision?",
                  options: [
                    { value: "solo",      label: "One person (solo authority)" },
                    { value: "committee", label: "A committee or leadership team" },
                    { value: "board",     label: "Board or governing body" },
                  ],
                },
                {
                  key: "evidence" as const,
                  question: "What evidence exists for this decision?",
                  options: [
                    { value: "strong",  label: "Strong — data, research, validated assumptions" },
                    { value: "partial", label: "Partial — some evidence, some assumptions" },
                    { value: "weak",    label: "Weak or none — primarily assumption-based" },
                  ],
                },
                {
                  key: "urgency" as const,
                  question: "What is the decision timeline?",
                  options: [
                    { value: "urgent",   label: "Urgent — decision needed within 48 hours" },
                    { value: "standard", label: "Standard — 1–4 weeks" },
                    { value: "extended", label: "Extended — more than a month" },
                  ],
                },
              ].map(({ key, question, options }) => (
                <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                  <p className="text-sm text-white/65">{question}</p>
                  <div className="space-y-2">
                    {options.map((opt) => (
                      <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/6 bg-white/2 px-3 py-2 transition-all hover:border-white/15">
                        <input
                          type="radio"
                          name={key}
                          value={opt.value}
                          checked={diagAnswers[key] === opt.value}
                          onChange={() => {
                            setDiagAnswers((prev) => ({ ...prev, [key]: opt.value }));
                            setDiagResult(null);
                          }}
                          className="accent-white"
                        />
                        <span className="text-xs text-white/55">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleDiagnostic}
                disabled={!Object.values(diagAnswers).every(Boolean)}
                className="rounded-lg border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-mono text-white/70 transition-all hover:border-white/35 hover:bg-white/8 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Get Constitutional Route
              </button>
            </div>
          )}

          {/* ── Constitutional Diagnostic Result ─────────────────────────────── */}
          {activeTab === "diagnostic" && diagResult && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="rounded border border-amber-500/25 bg-amber-500/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400/70">Demo Result</span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-1">Recommended Route</p>
                    <p className="text-xl font-semibold text-white/85">{diagResult.name}</p>
                    <p className="text-sm text-white/50 mt-1">{diagResult.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-1">Authority Score</p>
                    <p className={`text-3xl font-mono font-semibold ${scoreColour}`}>{diagResult.score}</p>
                    <p className="font-mono text-[9px] text-white/20">/ 100</p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/6 bg-white/2 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-2">What this score means</p>
                  <p className="text-xs text-white/50 leading-6">
                    {diagResult.score >= 80
                      ? "Strong governance posture. The decision has appropriate authority, evidence, and scope alignment. Proceed via the recommended route with a formal record."
                      : diagResult.score >= 55
                      ? "Moderate governance posture. Gaps exist in evidence or authority. Proceeding without addressing them creates reversibility risk."
                      : "Weak governance posture. This decision should not proceed without resolving authority and evidence gaps. Proceeding creates execution debt and liability."}
                  </p>
                </div>
              </div>

              <FullRunPanel adds={[
                "10-question authority scoring against institutional registry",
                "Evidence chain validation",
                "Cross-decision consistency check",
                "Route-specific template and delivery format",
                "ResearchRun with signed governance record",
              ]} />
            </div>
          )}

          {/* ── Text module result ────────────────────────────────────────────── */}
          {result && activeTab !== "diagnostic" && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="rounded border border-amber-500/25 bg-amber-500/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400/70">Demo Result</span>
                <p className="text-sm text-white/55 font-medium">{result.summary}</p>
              </div>

              {/* Findings */}
              {result.findings.length > 0 && (
                <div className="space-y-3">
                  {result.findings.map((f, i) => {
                    const sc = severityClasses(f.severity);
                    return (
                      <div key={i} className={`rounded-xl border ${sc.border} ${sc.bg} p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${sc.badge}`}>{f.severity}</span>
                          <span className="text-xs font-medium text-white/70">{f.label}</span>
                        </div>
                        <p className="text-xs text-white/50 leading-6">{f.detail}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Consequence + Next action */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-2">Consequence</p>
                  <p className="text-xs text-white/55 leading-6">{result.consequence}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-2">Next Action</p>
                  <p className="text-xs text-white/55 leading-6">{result.nextAction}</p>
                </div>
              </div>

              {result.fullRunAdds.length > 0 && (
                <FullRunPanel adds={result.fullRunAdds} />
              )}
            </div>
          )}
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <section className="border-t border-white/8 px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-3">
              What you saw was a limited demo
            </p>
            <h2 className="text-2xl font-semibold text-white/80 mb-3">
              Ready for a governed review?
            </h2>
            <p className="text-sm text-white/40 mb-8 leading-7">
              A full governed run adds authority validation, evidence adequacy scoring,
              ResearchRun persistence with audit trail, CI gate integration, and a signed governance record.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/foundry/start"
                className="rounded-lg border border-white/25 bg-white/5 px-8 py-3 text-sm font-mono text-white/75 transition-all hover:border-white/40 hover:text-white"
              >
                Run a governed review →
              </Link>
              <Link
                href="/foundry/value"
                className="text-sm font-mono text-white/30 hover:text-white/55 transition-colors"
              >
                See the value case
              </Link>
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
}

// ─── Full Run Panel ───────────────────────────────────────────────────────────

function FullRunPanel({ adds }: { adds: string[] }) {
  return (
    <div
      className="rounded-xl border p-4 space-y-2"
      style={{ borderColor: `${GOLD}25`, backgroundColor: `${GOLD}06` }}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: `${GOLD}80` }}>
        What a full governed run adds
      </p>
      <ul className="space-y-1.5">
        {adds.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: `${GOLD}70` }}>
            <span className="mt-1 shrink-0 text-[10px]">+</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
