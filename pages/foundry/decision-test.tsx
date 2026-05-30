/* pages/foundry/decision-test.tsx — PUBLIC DECISION TEST
 *
 * Decision triage — not contradiction detection.
 *
 * Classifies domain first, then applies domain-specific risk logic.
 * Compliance/statutory/deadline-bound decisions are escalated even when
 * no internal contradictions are present.
 *
 * GUARDRAILS (enforced in copy, not in logic):
 * - Does not provide formal tax, legal, or financial advice
 * - Does not calculate liabilities or penalties
 * - Does not claim certainty about outcomes
 * - Does not instruct users to ignore deadlines
 * - Does not return LOW when external obligation risk is obvious
 *
 * No persistence. No admin data. Client-side analysis only.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { InterestForm } from "@/components/foundry/InterestForm";
import { track } from "@/lib/foundry/track";

const GOLD = "#C9A96E";

type Finding = {
  label: string;
  detail: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
};

type RiskLabel = "LOW RISK" | "MODERATE RISK" | "HIGH RISK" | "ESCALATE";

type TestResult = {
  score: number;
  label: RiskLabel;
  summary: string;
  findings: Finding[];
  primaryTension: string | null;
  evidenceNote: string;
  consequence: string;
  nextAction: string;
  demoRef: string;
  timestamp: string;
};

// ─── Domain classifier ────────────────────────────────────────────────────────

type Domain =
  | "compliance"
  | "financial_exposure"
  | "deadline_bound"
  | "capability_gap"
  | "placeholder_filing"
  | "board_sensitive"
  | "product_release"
  | "general_governance";

function classifyDomains(lower: string): Set<Domain> {
  const d = new Set<Domain>();

  // Compliance / statutory / regulatory
  if (
    /\b(tax|taxes|filing|file|hmrc|vat|ct600|corporation tax|self.?assessment|companies house|statutory|regulatory|compliance|accounts|turnover|revenue|profit|loss|irs|ato|cra|inland revenue|companies act|annual return|confirmation statement|payroll|paye|national insurance|ni contribution)\b/.test(lower)
  ) d.add("compliance");

  // Financial exposure — fines, penalties, material amounts
  if (
    /\b(fine|fines|penalty|penalt|huge fine|large fine|late penalty|surcharge|exposure|liability|liabilit|£|€|\$)\b/.test(lower) ||
    /\d[\d,]*[km]?\s*(turnover|revenue|profit|loss|fine|penalty)/.test(lower) ||
    /turnover\D{0,30}£/.test(lower) ||
    /£\d/.test(lower)
  ) d.add("financial_exposure");

  // Deadline-bound — hard dates, extensions exhausted, overdue
  if (
    /\b(deadline|by \w+ \d{4}|extension|extended|till|until|expir|must file|must submit|overdue|late filing|time limit|last date|due date|before \w+ \d{4}|june|july|august|september|31 jan|31st jan|31 october|by end of)\b/.test(lower) ||
    /\d{1,2}(st|nd|rd|th)? (january|february|march|april|may|june|july|august|september|october|november|december)/.test(lower)
  ) d.add("deadline_bound");

  // Capability / resource gap
  if (
    /\b(no accountant|no funds|no budget|can.t afford|cannot afford|complicated|complex accounts|no (advisor|adviser|expert|professional|specialist)|do it myself|do.?it.?yourself|diy|use agent|using agent|agent (do|handle|file)|without (a |an )?(accountant|adviser|advisor|professional)|no (resource|money for))\b/.test(lower)
  ) d.add("capability_gap");

  // Placeholder or provisional submission
  if (
    /\b(placeholder|provisional|estimated|dummy|temporary (filing|submission|return)|interim return|nil return|nil submission)\b/.test(lower)
  ) d.add("placeholder_filing");

  // Board / senior authority
  if (
    /\b(board|ceo|cfo|cto|c-suite|executive (team|approval|sign.?off)|sponsor|committee|trustee|directors?|shareholder|investor)\b/.test(lower)
  ) d.add("board_sensitive");

  // Product / release
  if (
    /\b(release|deploy|launch|ship|production|staging|rollback|pull request|feature flag|go.?live)\b/.test(lower)
  ) d.add("product_release");

  // Always include general governance as a base domain
  d.add("general_governance");

  return d;
}

// ─── Finding generators ───────────────────────────────────────────────────────

function complianceFindings(lower: string, domains: Set<Domain>): Finding[] {
  const f: Finding[] = [];

  if (domains.has("deadline_bound")) {
    f.push({
      label: "Deadline-bound statutory obligation",
      detail:
        "A filing or regulatory deadline is present. Statutory deadlines carry automatic penalties that compound over time, independent of the filer's intent or financial position.",
      severity: "HIGH",
    });
  }

  if (domains.has("capability_gap")) {
    f.push({
      label: "Complexity exceeds ordinary self-service risk",
      detail:
        "The accounts are described as complicated without professional resource available. Complex returns filed without professional review carry significant risk of errors, rejected submissions, or missed reliefs — each of which can exceed the cost of a targeted professional review.",
      severity: "HIGH",
    });
  }

  if (domains.has("placeholder_filing")) {
    f.push({
      label: "Provisional submission not yet finalised",
      detail:
        "A placeholder or estimated filing has been submitted. The gap between the provisional submission and a final accurate return must be resolved before the deadline. Leaving a placeholder in place is not the same as filing.",
      severity: "HIGH",
    });
  }

  // Turnover/profit mismatch
  if (
    /turnover|revenue/.test(lower) &&
    /\b(profit|loss|little|small|low|minimal|hardly any|very little|negligible)\b/.test(lower)
  ) {
    f.push({
      label: "Turnover/profit relationship requires reconciliation",
      detail:
        "Significant turnover with low profit typically requires careful review of allowable deductions, cost classification, and expense treatment. Errors in this area are a common trigger for compliance review.",
      severity: "HIGH",
    });
  }

  if (domains.has("financial_exposure")) {
    f.push({
      label: "Material financial penalty at risk",
      detail:
        "A significant fine or penalty is referenced. The cost of an error or late filing may substantially exceed the cost of targeted professional assistance. This changes the risk/cost calculation for DIY handling.",
      severity: "HIGH",
    });
  }

  if (domains.has("capability_gap")) {
    f.push({
      label: "Resource constraint does not remove the obligation",
      detail:
        "Limited budget for professional support is a real constraint, but it does not reduce the legal duty to file accurately and on time. Fixed-scope or limited-review engagements often cost significantly less than full-service accounting.",
      severity: "MEDIUM",
    });
  }

  return f.slice(0, 5);
}

function governanceFindings(lower: string): Finding[] {
  const f: Finding[] = [];

  if (
    !lower.includes("approved") &&
    !lower.includes("sign") &&
    !lower.includes("authority") &&
    !lower.includes("decide") &&
    !lower.includes("decided")
  ) {
    f.push({
      label: "No named decision-maker",
      detail:
        "No approval authority or decision-maker is identified. Without a named authority, this decision cannot proceed through governance.",
      severity: "HIGH",
    });
  }

  if (lower.includes("pending") || lower.includes("waiting") || lower.includes("not sure")) {
    f.push({
      label: "Decision stall detected",
      detail:
        "Language suggests the decision is stalled. Identify the blocking dependency and name the owner.",
      severity: "HIGH",
    });
  }

  if (
    !lower.includes("data") &&
    !lower.includes("evidence") &&
    !lower.includes("research") &&
    !lower.includes("analysis")
  ) {
    f.push({
      label: "No evidence referenced",
      detail:
        "The decision description does not reference any data, evidence, or analysis. Decisions without evidence references carry elevated reversal risk.",
      severity: "MEDIUM",
    });
  }

  if (
    lower.includes("assume") ||
    lower.includes("believe") ||
    lower.includes("think") ||
    lower.includes("maybe")
  ) {
    f.push({
      label: "Assumption-based reasoning",
      detail:
        "The decision relies on assumptions rather than verified evidence. Each assumption should be stated explicitly and tested before commitment.",
      severity: "MEDIUM",
    });
  }

  if (
    !lower.includes("commit") &&
    !lower.includes("will ") &&
    !lower.includes("we are") &&
    !lower.includes("decided")
  ) {
    f.push({
      label: "Commitment unclear",
      detail:
        "It is not clear what is actually being decided or committed to. A governed decision requires a specific, bounded commitment statement.",
      severity: "MEDIUM",
    });
  }

  if (
    lower.includes("urgent") ||
    lower.includes("immediately") ||
    lower.includes("asap") ||
    lower.includes("rush")
  ) {
    f.push({
      label: "Urgency signal detected",
      detail:
        "Urgency language may indicate a decision being forced without proper governance. Verify that the timeline is real, not manufactured.",
      severity: "LOW",
    });
  }

  if (
    lower.includes("quarter") ||
    lower.includes("deadline") ||
    lower.includes("end of") ||
    lower.includes("by ")
  ) {
    f.push({
      label: "Time-bound decision",
      detail:
        "A deadline is referenced. Ensure the timeline allows for proper evidence gathering and authority review.",
      severity: "LOW",
    });
  }

  return f.slice(0, 5);
}

// ─── Primary tension classifier ───────────────────────────────────────────────

function derivePrimaryTension(domains: Set<Domain>, lower: string): string | null {
  if (domains.has("compliance") && domains.has("capability_gap") && domains.has("financial_exposure")) {
    return "Cash constraint vs compliance exposure — saving on professional fees may create larger penalties, corrections, or rejected filings.";
  }
  if (domains.has("compliance") && domains.has("placeholder_filing") && domains.has("deadline_bound")) {
    return "Provisional filing vs final accurate return — the placeholder removes immediate jeopardy but the underlying compliance gap remains open.";
  }
  if (domains.has("compliance") && domains.has("capability_gap")) {
    return "DIY efficiency vs error risk — complexity without professional oversight increases the probability of filing errors and missed reliefs.";
  }
  if (domains.has("deadline_bound") && domains.has("capability_gap")) {
    return "Time pressure vs preparation readiness — the deadline is fixed but the capability to meet it accurately is uncertain.";
  }
  if (domains.has("board_sensitive") && !lower.includes("approved") && !lower.includes("sign")) {
    return "Decision authority vs approval gap — the required sign-off authority has not been confirmed.";
  }
  return null;
}

// ─── Main analyser ────────────────────────────────────────────────────────────

function generateDemoRef(): string {
  return Date.now().toString(36).slice(-6).toUpperCase();
}

function analyzeDecision(text: string): TestResult {
  const lower = text.toLowerCase();
  const domains = classifyDomains(lower);

  // ── Determine primary path ─────────────────────────────────────────────────
  const isCompliancePath =
    domains.has("compliance") &&
    (domains.has("deadline_bound") ||
      domains.has("financial_exposure") ||
      domains.has("placeholder_filing") ||
      domains.has("capability_gap"));

  // ── Generate domain-specific findings ─────────────────────────────────────
  let rawFindings: Finding[];

  if (isCompliancePath) {
    rawFindings = complianceFindings(lower, domains);
    // Top up with governance findings if we have room and they're relevant
    if (rawFindings.length < 3) {
      rawFindings = [...rawFindings, ...governanceFindings(lower)].slice(0, 5);
    }
  } else {
    rawFindings = governanceFindings(lower);
  }

  // Guarantee at least 3 findings
  if (rawFindings.length < 3) {
    rawFindings.push({
      label: "Limited decision context",
      detail:
        "The description provides limited context about the scope, stakeholders, or constraints. A complete submission improves assessment accuracy.",
      severity: "LOW",
    });
  }

  const findings = rawFindings.slice(0, 5);
  const highCount = findings.filter(f => f.severity === "HIGH").length;
  const medCount = findings.filter(f => f.severity === "MEDIUM").length;

  // ── Determine risk label and score ─────────────────────────────────────────
  let label: RiskLabel;
  let score: number;
  let summary: string;
  let consequence: string;
  let nextAction: string;

  // Compliance escalation — hard override when external obligation + risk are present
  const complianceEscalation =
    isCompliancePath &&
    (domains.has("deadline_bound") || domains.has("placeholder_filing")) &&
    highCount >= 2;

  if (complianceEscalation) {
    label = "ESCALATE";
    score = Math.max(0, 20 - (highCount - 2) * 5); // Low but not 0 — the info is valuable
    summary =
      "This is a deadline-bound statutory obligation with material complexity and financial exposure. " +
      "Pattern analysis alone is insufficient — targeted professional triage is required.";
    consequence =
      "Attempting a complex return without professional review risks filing errors, rejected submissions, " +
      "penalties beyond the original deadline, or missed reliefs. The cost of rescue work after an error " +
      "typically exceeds the cost of a limited-scope professional review before it.";
    nextAction =
      "Seek a fixed-scope tax adviser or accountant for filing rescue or limited review. " +
      "If full service is unaffordable, pay for targeted checking rather than handling a complex " +
      "statutory return unaided. Do not rely on general-purpose tools for time-sensitive compliance decisions.";
  } else if (highCount >= 2 || (isCompliancePath && highCount >= 1)) {
    label = "HIGH RISK";
    score = Math.max(0, 100 - highCount * 25 - medCount * 10);
    summary = isCompliancePath
      ? "This decision involves statutory or compliance obligations that require professional input before proceeding."
      : "This decision is not ready for formal commitment. Critical elements are missing.";
    consequence = isCompliancePath
      ? "Proceeding without addressing these gaps creates compliance exposure that may exceed the cost of professional assistance."
      : "Proceeding without addressing these gaps carries significant risk of failure, reversal, or escalation.";
    nextAction = isCompliancePath
      ? "Identify the minimum viable professional intervention — a limited-scope review or targeted consultation — before committing to a course of action."
      : "Do not proceed. Resolve all HIGH findings. A full governed review will build the evidence and authority chain required.";
  } else if (highCount === 1 || medCount >= 2) {
    label = "MODERATE RISK";
    score = Math.max(0, 100 - highCount * 25 - medCount * 10);
    summary = "This decision has gaps that should be addressed before proceeding.";
    consequence =
      "Unaddressed gaps may lead to reversal, rework, or escalation. Each high-severity finding materially increases that risk.";
    nextAction =
      "Address the HIGH-priority findings before seeking formal approval. A full review captures the complete evidence chain.";
  } else {
    label = "LOW RISK";
    score = Math.max(70, 100 - medCount * 10);
    summary = "This decision appears structurally sound. Key governance elements are present.";
    consequence =
      "Proceed with standard governance. Ensure the decision is documented and the authority is recorded.";
    nextAction =
      "Document the decision and proceed through your standard approval process.";
  }

  // ── Evidence note ──────────────────────────────────────────────────────────
  let evidenceNote: string;

  if (isCompliancePath) {
    const needItems: string[] = [];
    if (domains.has("deadline_bound")) needItems.push("exact filing deadline and any remaining extension window");
    if (domains.has("placeholder_filing")) needItems.push("status of provisional vs final submission");
    needItems.push("completeness of underlying records and accounts");
    if (/turnover|revenue/.test(lower)) needItems.push("turnover/profit reconciliation and allowable deductions");
    needItems.push("budget available for limited-scope professional review");
    evidenceNote =
      "A full review would require: " + needItems.join("; ") + ". " +
      "This structural analysis identifies the category and urgency of the decision — it does not assess the accuracy of the underlying accounts or filings.";
  } else {
    const hasEvidence =
      lower.includes("data") || lower.includes("evidence") ||
      lower.includes("research") || lower.includes("analysis");
    const hasAuthority =
      lower.includes("approved") || lower.includes("sign") || lower.includes("authority");
    evidenceNote =
      hasEvidence && hasAuthority
        ? "Evidence and authority signals were detected. A full review would verify and timestamp these references against a durable record."
        : !hasEvidence && !hasAuthority
        ? "No evidence references or authority signals were found. Both are required for a decision to be governed and traceable."
        : !hasEvidence
        ? "No evidence references were found. A governed decision requires cited evidence with a clear expiry or review date."
        : "No authority signal was found. A governed decision requires a named decision-maker with recorded mandate.";
  }

  const primaryTension = derivePrimaryTension(domains, lower);

  return {
    score,
    label,
    summary,
    findings,
    primaryTension,
    evidenceNote,
    consequence,
    nextAction,
    demoRef: generateDemoRef(),
    timestamp: new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DecisionTestPage() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<TestResult | null>(null);

  const SAMPLE =
    "We need to launch the new service by end of quarter. The team believes we're ready but we're still waiting on legal review. No one has formally approved the budget yet.";

  function handleSubmit() {
    if (!text.trim()) return;
    track("foundry_test_run", { test: "decision", charCount: text.length });
    setResult(analyzeDecision(text));
  }

  function handleSample() {
    setText(SAMPLE);
    track("foundry_test_sample", { test: "decision" });
  }

  return (
    <Layout
      title="Test a Decision | Foundry | Abraham of London"
      description="Submit a decision under consideration. Receive a risk score, evidence gaps, and authority assessment."
      canonicalUrl="/foundry/decision-test"
    >
      <Head><title>Test a Decision | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">

          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Decision Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Test a Decision
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Describe a decision your organisation is facing. The Foundry will classify the domain,
            identify risk factors, and return a triage assessment with a clear next action.
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/60">
            Public test · No data persisted · Results are illustrative · Not professional advice
          </p>

          {/* Input */}
          <div className="mt-10 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Describe the decision: what you are facing, who is involved, what the deadline is, what constraints exist, and what you are trying to decide..."
              className="w-full border bg-black/30 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                data-analytics="foundry-decision-submit"
                className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
                style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
              >
                Assess Decision
              </button>
              <button
                onClick={handleSample}
                data-analytics="foundry-decision-sample"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Use Sample
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-12 space-y-6">

              {/* 1. Score + label */}
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                      Decision Risk Score
                    </p>
                    <p className="mt-2 font-serif text-5xl font-light text-white/90">
                      {result.score}<span className="text-2xl text-white/30">/100</span>
                    </p>
                  </div>
                  <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    result.label === "LOW RISK"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : result.label === "HIGH RISK" || result.label === "ESCALATE"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {result.label}
                  </span>
                </div>
                <p className="mt-4 text-sm text-white/70">{result.summary}</p>

                {/* Primary tension — only shown when detected */}
                {result.primaryTension && (
                  <div className="mt-4 border-l-2 pl-4 py-1" style={{ borderColor: `${GOLD}40` }}>
                    <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">
                      Primary tension
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed italic">
                      {result.primaryTension}
                    </p>
                  </div>
                )}

                {/* 6. Demo ref + 7. Timestamp */}
                <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    Demo ref: {result.demoRef}
                  </span>
                  <span className="text-white/10">·</span>
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    {result.timestamp}
                  </span>
                  <span className="rounded border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] text-amber-400/40">
                    Demo — not verifiable
                  </span>
                </div>
              </div>

              {/* 2. Findings */}
              {result.findings.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Findings</p>
                  {result.findings.map((f, i) => (
                    <div key={i} className={`border p-4 ${
                      f.severity === "HIGH" ? "border-red-500/20 bg-red-500/5" :
                      f.severity === "MEDIUM" ? "border-amber-500/15 bg-amber-500/5" :
                      "border-white/8 bg-white/2"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${
                          f.severity === "HIGH" ? "bg-red-500/10 text-red-400" :
                          f.severity === "MEDIUM" ? "bg-amber-500/10 text-amber-400" :
                          "bg-white/5 text-white/40"
                        }`}>{f.severity}</span>
                        <span className="text-sm font-medium text-white/70">{f.label}</span>
                      </div>
                      <p className="text-xs text-white/55">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Evidence & authority note */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">
                  Evidence & Context Note
                </p>
                <p className="text-sm text-white/65">{result.evidenceNote}</p>
              </div>

              {/* 4. Consequence + 5. Next action */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Consequence</p>
                <p className="text-sm text-white/70">{result.consequence}</p>
                <div className="mt-4 h-px bg-white/5" />
                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">
                  Recommended Next Action
                </p>
                <p className="text-sm" style={{ color: `${GOLD}CC` }}>{result.nextAction}</p>
              </div>

              {/* 8. Disclaimer */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">
                  Public preview · Domain triage only · Not professional, legal, tax, or financial advice · No data retained
                </p>
              </div>

              {/* Interest capture */}
              <InterestForm sourceTest="decision" />

              {/* 9. Conversion CTA */}
              <div className="border border-white/8 bg-white/2 p-5 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
                  What a full review adds
                </p>
                <p className="text-xs text-white/50 mb-4 max-w-md mx-auto">
                  A full review produces a verifiable record: evidence timestamped, authority confirmed,
                  commitments tracked. For compliance or statutory decisions, it also identifies the
                  minimum viable professional intervention.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/foundry/start"
                    data-analytics="foundry-conversion-full-review"
                    onClick={() => track("foundry_conversion_click", { target: "full-review", source: "decision-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
                  >
                    Start a full review →
                  </Link>
                  <Link
                    href="/continuity"
                    data-analytics="foundry-conversion-continuity"
                    onClick={() => track("foundry_conversion_click", { target: "continuity", source: "decision-test" })}
                    className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
                  >
                    Understand continuity →
                  </Link>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <Link href="/foundry" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  ← Back to Foundry
                </Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/market-signal-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  Try Market Signal Test →
                </Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/release-risk-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  Try Release Risk Test →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
