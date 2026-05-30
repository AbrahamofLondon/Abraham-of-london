/* pages/foundry/decision-test.tsx — PUBLIC DECISION TEST
 *
 * Failure-map driven decision triage.
 *
 * Output: where the decision is most likely to fail, the primary tension,
 * the minimum viable next move, fallback if ideal path is blocked.
 *
 * Not a score machine. Not a contradiction detector.
 * A failure architecture diagnosis.
 *
 * No persistence. No admin data. Client-side analysis only.
 * Not professional, legal, tax, or financial advice.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { InterestForm } from "@/components/foundry/InterestForm";
import { track } from "@/lib/foundry/track";
import {
  analyzeDecisionFailureMap,
  type FailurePoint,
} from "@/lib/decision/decision-failure-map";
import type { DecisionDomain } from "@/lib/decision/constraint-reality-layer";

const GOLD = "#C9A96E";

// ─── Labels ───────────────────────────────────────────────────────────────────

const FAILURE_LABELS: Record<FailurePoint, string> = {
  OBLIGATION_FAILURE:    "Obligation",
  AUTHORITY_FAILURE:     "Authority",
  EVIDENCE_FAILURE:      "Evidence",
  CONSTRAINT_FAILURE:    "Constraint",
  CONSEQUENCE_FAILURE:   "Consequence",
  REVERSIBILITY_FAILURE: "Reversibility",
  DEPENDENCY_FAILURE:    "Dependency",
  EXPOSURE_FAILURE:      "Exposure",
  VIABILITY_FAILURE:     "Viability",
  CONTINUITY_FAILURE:    "Continuity",
  NO_CRITICAL_FAILURE:   "No critical failure",
};

const DOMAIN_LABELS: Record<DecisionDomain, string> = {
  compliance_statutory:  "Compliance / Statutory",
  financial_exposure:    "Financial Commitment",
  legal_regulatory:      "Legal / Regulatory",
  deadline_bound:        "Deadline-Bound",
  product_release:       "Product / Release",
  market_claim:          "Market / Positioning",
  board_sensitive:       "Board / Governance",
  family_legal_admin:    "Personal / Legal Admin",
  operational_dependency:"Operational Risk",
  personal_low_stakes:   "Low Stakes / Preference",
  unclear:               "Unclear — more context needed",
};

function directiveBadgeClass(d: string): string {
  if (d === "LOW") return "bg-emerald-500/10 text-emerald-400";
  if (d === "CONSTRAINED_RESCUE" || d === "ESCALATE") return "bg-red-500/10 text-red-400";
  if (d === "HIGH") return "bg-red-500/10 text-red-400";
  return "bg-amber-500/10 text-amber-400";
}

function failurePointColor(point: FailurePoint): string {
  if (point === "NO_CRITICAL_FAILURE") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (["OBLIGATION_FAILURE", "REVERSIBILITY_FAILURE", "CONSTRAINT_FAILURE"].includes(point))
    return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

function riskSeverityClass(s: string): string {
  if (s === "CRITICAL") return "border-red-500/20 bg-red-500/5";
  if (s === "HIGH")     return "border-red-500/15 bg-red-500/4";
  if (s === "MEDIUM")   return "border-amber-500/15 bg-amber-500/5";
  return "border-white/8 bg-white/2";
}

function riskBadgeClass(s: string): string {
  if (s === "CRITICAL") return "bg-red-500/15 text-red-400";
  if (s === "HIGH")     return "bg-red-500/10 text-red-400/80";
  if (s === "MEDIUM")   return "bg-amber-500/10 text-amber-400";
  return "bg-white/5 text-white/40";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DecisionTestPage() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<ReturnType<typeof analyzeDecisionFailureMap> | null>(null);

  // Stable refs — do not regenerate on re-render
  const demoRef = React.useRef("");
  const timestamp = React.useRef("");

  const SAMPLE =
    "We need to launch the new service by end of quarter. The team believes we're ready but we're still waiting on legal review. No one has formally approved the budget yet.";

  function handleSubmit() {
    if (!text.trim()) return;
    demoRef.current = Date.now().toString(36).slice(-6).toUpperCase();
    timestamp.current = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const analysis = analyzeDecisionFailureMap(text);
    track("foundry_test_run", {
      test: "decision",
      charCount: text.length,
      directive: analysis.directive,
      decisionType: analysis.decisionType,
      primaryFailurePoint: analysis.primaryFailurePoint,
    });
    setResult(analysis);
  }

  function handleSample() {
    setText(SAMPLE);
    track("foundry_test_sample", { test: "decision" });
  }

  return (
    <Layout
      title="Test a Decision | Foundry | Abraham of London"
      description="Submit a decision. Receive a failure map: where this decision is most likely to break, the minimum viable next move, and the fallback if the ideal path is blocked."
      canonicalUrl="/foundry/decision-test"
    >
      <Head><title>Test a Decision | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">

          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Decision Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Test a Decision
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Describe the decision, the pressure you are under, and the constraints you are facing.
            The Foundry maps where this decision is most likely to fail —
            obligation, authority, evidence, constraint, or any of the ten failure dimensions —
            and returns the minimum viable next move.
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/60">
            Public test · No data persisted · Not professional, legal, tax, or financial advice
          </p>

          {/* Input */}
          <div className="mt-10 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Describe the decision: what you face, the deadline, the constraints, what you have tried, and what is preventing the ideal solution..."
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
                Map Failure Points
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

          {result && (
            <div className="mt-12 space-y-6">

              {/* ── 1. Failure point header ─────────────────────────── */}
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>

                {/* Primary failure point — the main output */}
                <div className="mb-4">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">
                    Most likely to fail at
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${failurePointColor(result.primaryFailurePoint)}`}>
                      {FAILURE_LABELS[result.primaryFailurePoint]}
                    </span>
                    {result.secondaryFailurePoint && result.secondaryFailurePoint !== result.primaryFailurePoint && (
                      <span className={`rounded border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${failurePointColor(result.secondaryFailurePoint)}`}>
                        {FAILURE_LABELS[result.secondaryFailurePoint]}
                      </span>
                    )}
                    <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${directiveBadgeClass(result.directive)}`}>
                      {result.directive === "CONSTRAINED_RESCUE" ? "CONSTRAINED RESCUE" : result.directive}
                    </span>
                  </div>
                </div>

                {/* Domain + confidence */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="rounded px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] bg-white/5 text-white/35">
                    {DOMAIN_LABELS[result.decisionType]}
                  </span>
                  <span className={`rounded px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${
                    result.confidence === "high" ? "bg-white/5 text-white/30" :
                    result.confidence === "medium" ? "bg-amber-500/5 text-amber-400/40" :
                    "bg-amber-500/8 text-amber-400/50"
                  }`}>
                    {result.confidence === "high" ? "High confidence" :
                     result.confidence === "medium" ? "Medium confidence" :
                     "Low confidence — more context improves accuracy"}
                  </span>
                </div>

                {/* Situation summary */}
                <p className="text-sm text-white/70 leading-relaxed">{result.situationSummary}</p>

                {/* Primary tension */}
                {result.primaryTension && (
                  <div className="mt-4 border-l-2 pl-4 py-1" style={{ borderColor: `${GOLD}40` }}>
                    <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">Primary tension</p>
                    <p className="text-xs text-white/60 leading-relaxed italic">{result.primaryTension}</p>
                  </div>
                )}

                {/* Demo ref + timestamp */}
                <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    Demo ref: {demoRef.current}
                  </span>
                  <span className="text-white/10">·</span>
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    {timestamp.current}
                  </span>
                  <span className="rounded border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] text-amber-400/40">
                    Demo — not verifiable
                  </span>
                </div>
              </div>

              {/* ── 2. Failure risks ──────────────────────────────────── */}
              {result.failureRisks.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Failure risks</p>
                  {result.failureRisks.slice(0, 5).map((r, i) => (
                    <div key={i} className={`border p-4 ${riskSeverityClass(r.severity)}`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] ${riskBadgeClass(r.severity)}`}>
                          {r.severity}
                        </span>
                        <span className="text-sm font-medium text-white/70">{r.label}</span>
                      </div>
                      <p className="text-xs text-white/55 leading-relaxed">{r.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 3. Constraint + exposure reality ─────────────────── */}
              {(result.constraintSignals.length > 0 || result.exposureTypes.length > 0) && (
                <div className="border border-white/8 bg-white/2 p-5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">Constraint & exposure reality</p>
                  <div className="flex flex-wrap gap-2">
                    {result.constraintSignals.map(s => (
                      <span key={s} className="rounded border border-red-500/15 bg-red-500/5 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-red-400/70">
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                    {result.exposureTypes.map(e => (
                      <span key={e} className="rounded border border-amber-500/15 bg-amber-500/5 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-amber-400/60">
                        {e} exposure
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 4. Must not be delayed ────────────────────────────── */}
              {result.whatMustNotBeDelayed.length > 0 && (
                <div className="border border-red-500/15 bg-red-500/4 p-5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-red-400/60 mb-3">Must not be delayed</p>
                  <ul className="space-y-2">
                    {result.whatMustNotBeDelayed.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/40" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── 5. Minimum viable next move ───────────────────────── */}
              <div className="border p-5" style={{ borderColor: `${GOLD}25` }}>
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">
                  Minimum viable next move
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: `${GOLD}CC` }}>
                  {result.minimumViableNextMove}
                </div>
              </div>

              {/* ── 6. Fallback ───────────────────────────────────────── */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">
                  Fallback — if the ideal path is unavailable
                </p>
                <p className="text-sm text-white/65 leading-relaxed">{result.fallbackPath}</p>
              </div>

              {/* ── 7. Viable moves + evidence needed ────────────────── */}
              <div className="grid gap-4 sm:grid-cols-2">
                {result.viableMoves.length > 0 && (
                  <div className="border border-white/8 bg-white/2 p-5">
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">
                      Viable moves
                    </p>
                    <ul className="space-y-3">
                      {result.viableMoves.map((m, i) => (
                        <li key={i}>
                          <p className="text-xs font-medium text-white/65 mb-0.5">{m.label}</p>
                          <p className="text-xs text-white/45 leading-relaxed">{m.description}</p>
                          {m.accessibility === "possible_with_low_funds" && (
                            <span className="mt-1 inline-block rounded bg-emerald-500/8 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.15em] text-emerald-400/50">
                              low-resource viable
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border border-white/8 bg-white/2 p-5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">
                    Evidence needed next
                  </p>
                  <ul className="space-y-2">
                    {result.evidenceNeeded.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── 8. Impossible advice ─────────────────────────────── */}
              {result.impossibleAdvice.length > 0 && (
                <div className="border border-white/5 bg-white/1 p-4">
                  <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-2">
                    What the system will not recommend given your constraints
                  </p>
                  <ul className="space-y-1">
                    {result.impossibleAdvice.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/35">
                        <span className="mt-1 text-white/20">×</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── 9. Escalation threshold ──────────────────────────── */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">
                  Escalation threshold
                </p>
                <p className="text-xs text-white/40">{result.escalationThreshold}</p>
              </div>

              {/* ── 10. Disclaimer ────────────────────────────────────── */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">
                  Public preview · Failure-map triage only · Not professional, legal, tax, or financial advice · No data retained
                </p>
              </div>

              {/* ── Paid Decision Failure Brief ──────────────────────── */}
              <BriefCheckoutBlock
                decisionType={result.decisionType}
                primaryFailurePoint={result.primaryFailurePoint}
                directive={result.directive}
              />

              {/* Interest capture */}
              <InterestForm sourceTest="decision" initialDecisionType={result.decisionType} />

              {/* Conversion CTA */}
              <div className="border border-white/8 bg-white/2 p-5 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
                  What a full review adds
                </p>
                <p className="text-xs text-white/50 mb-4 max-w-md mx-auto">
                  A full review produces a verifiable record of the failure map, evidence, authority,
                  and the minimum viable intervention — with timestamps your organisation can return to.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/foundry/start"
                    onClick={() => track("foundry_conversion_click", { target: "full-review", source: "decision-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
                  >
                    Start a full review →
                  </Link>
                  <Link
                    href="/continuity"
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

// ─── Paid Brief Checkout Block ────────────────────────────────────────────────

const TIER_OPTIONS = [
  {
    id: "basic" as const,
    label: "Basic",
    price: "£49",
    turnaround: "72 hours",
    includes: ["Failure map with primary and secondary failure points", "Primary tension analysis", "Minimum viable next move", "Fallback path"],
  },
  {
    id: "full" as const,
    label: "Full",
    price: "£149",
    turnaround: "48 hours",
    includes: ["Everything in Basic", "Signed record with verification token", "Evidence pack with what is needed next", "What must not be delayed", "Escalation threshold"],
    recommended: true,
  },
  {
    id: "urgent" as const,
    label: "Urgent",
    price: "£349",
    turnaround: "24 hours",
    includes: ["Everything in Full", "24-hour delivery", "Follow-up Q&A", "Priority review by the Foundry team"],
  },
  {
    id: "executive" as const,
    label: "Executive Review",
    price: "From £2,500",
    turnaround: "5 days",
    includes: ["Full Decision Failure Map", "Authority and evidence review", "Risk register with named owners", "Board-ready summary", "Continuity record with verification", "Follow-up call with Foundry team"],
    qualified: true,
  },
];

function BriefCheckoutBlock({
  decisionType,
  primaryFailurePoint,
  directive,
}: {
  decisionType: string;
  primaryFailurePoint: string;
  directive: string;
}) {
  const [selectedTier, setSelectedTier] = React.useState<string>("full");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [checkoutState, setCheckoutState] = React.useState<"idle" | "loading" | "error" | "executive_submitted">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  // Executive Review fields
  const [organisation, setOrganisation] = React.useState("");
  const [role, setRole] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [stakeholders, setStakeholders] = React.useState("");
  const [desiredOutcome, setDesiredOutcome] = React.useState("");

  const isExecutive = selectedTier === "executive";

  async function handleCheckout() {
    if (!name.trim() || !email.trim()) return;
    setCheckoutState("loading");
    setErrorMsg("");

    if (isExecutive) {
      // Route to qualified interest form — not Stripe
      try {
        const res = await fetch("/api/foundry/interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            organisation: organisation.trim() || undefined,
            role: role.trim() || undefined,
            context: `Executive Review request. Decision type: ${decisionType}. Deadline: ${deadline || "not specified"}. Stakeholders: ${stakeholders || "not specified"}. Desired outcome: ${desiredOutcome || "not specified"}. Summary: ${summary || "not provided"}. Failure point: ${primaryFailurePoint}. Directive: ${directive}.`,
            urgency: deadline ? "High" : "Medium",
            sourceTest: "decision",
            consentGiven: true,
          }),
        });

        const data = await res.json();

        if (data.ok) {
          track("foundry_conversion_click", {
            target: "executive-review",
            source: "decision-test",
          });
          setCheckoutState("executive_submitted");
        } else {
          setErrorMsg("Could not submit your request. Please try again.");
          setCheckoutState("error");
        }
      } catch {
        setErrorMsg("Could not reach the service. Please try again.");
        setCheckoutState("error");
      }
      return;
    }

    // Standard Stripe checkout for Basic/Full/Urgent
    try {
      const res = await fetch("/api/checkout/decision-failure-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          tier: selectedTier,
          decisionSummary: summary.trim() || undefined,
          decisionType,
          primaryFailurePoint,
          directive,
          sourceTest: "decision",
        }),
      });

      const data = await res.json();

      if (data.ok && data.checkoutUrl) {
        track("foundry_conversion_click", {
          target: "paid-brief",
          source: "decision-test",
          tier: selectedTier,
        });
        window.location.href = data.checkoutUrl;
      } else {
        setErrorMsg(data.error || "Checkout failed. Please try again.");
        setCheckoutState("error");
      }
    } catch {
      setErrorMsg("Could not reach the payment service. Please try again.");
      setCheckoutState("error");
    }
  }

  // Executive Review success state
  if (checkoutState === "executive_submitted") {
    return (
      <div className="border p-6 text-center" style={{ borderColor: `${GOLD}30`, backgroundColor: `${GOLD}06` }}>
        <p className="font-serif text-xl font-light italic text-white/80 mb-3">
          Executive Review request received
        </p>
        <p className="text-sm text-white/55 leading-7 max-w-md mx-auto">
          Thank you. A member of the Foundry team will review your request and respond
          within two business days to discuss scope, timeline, and pricing.
        </p>
      </div>
    );
  }

  const selectedTierData = TIER_OPTIONS.find(t => t.id === selectedTier);

  return (
    <div className="border p-6" style={{ borderColor: `${GOLD}30`, backgroundColor: `${GOLD}04` }}>
      <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">
        Paid service
      </p>
      <p className="font-serif text-xl font-light italic text-white/80 mb-1">
        Unlock a Decision Failure Brief
      </p>
      <p className="text-xs text-white/50 mb-5 leading-relaxed">
        A full written brief with your personalised failure map, minimum viable next move,
        and a verifiable record. Reviewed by the Foundry team before delivery.
      </p>

      {/* Tier selection */}
      <div className="grid gap-3 sm:grid-cols-4 mb-5">
        {TIER_OPTIONS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => setSelectedTier(tier.id)}
            className={`relative border p-4 text-left transition-all ${
              selectedTier === tier.id
                ? "border-white/30 bg-white/5"
                : "border-white/8 bg-white/[0.015] hover:border-white/15"
            }`}
          >
            {tier.recommended && (
              <span
                className="absolute -top-2 right-3 rounded px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em]"
                style={{ backgroundColor: GOLD, color: "#0a0a0a" }}
              >
                Recommended
              </span>
            )}
            {tier.qualified && (
              <span
                className="absolute -top-2 left-3 rounded px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] bg-violet-500/20 text-violet-400"
              >
                Qualified
              </span>
            )}
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 mb-1">{tier.label}</p>
            <p className="font-serif text-2xl font-light text-white/80 mb-1">{tier.price}</p>
            <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/25 mb-2">{tier.turnaround}</p>
            <ul className="space-y-1">
              {tier.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] text-white/45">
                  <span className="mt-0.5 text-white/20">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Checkout form */}
      <div className="space-y-3 border-t border-white/5 pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">
              Name <span className="text-red-400/60">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
          <div>
            <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">
              Email <span className="text-red-400/60">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@organisation.com"
              className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>

        {/* Executive Review additional fields */}
        {isExecutive && (
          <div className="space-y-3 border border-violet-500/15 bg-violet-500/5 p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-violet-400/60 mb-2">Executive Review — additional context</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">Organisation</label>
                <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Company or institution" className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">Role</label>
                <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. CEO, GC, Board Member" className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">Decision deadline or timeline</label>
              <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="e.g. Board meeting 15 June, no hard deadline" className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">Key stakeholders</label>
              <input value={stakeholders} onChange={e => setStakeholders(e.target.value)} placeholder="Who else is involved in this decision?" className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">Desired outcome</label>
              <textarea value={desiredOutcome} onChange={e => setDesiredOutcome(e.target.value)} rows={2} placeholder="What would a successful outcome look like?" maxLength={500} className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
          </div>
        )}

        <div>
          <label className="block font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">
            {isExecutive ? "Brief summary of your situation" : "Brief summary of your decision (optional)"}
          </label>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={2}
            placeholder={isExecutive ? "Describe the decision context, what you have tried, and what is at stake..." : "A sentence or two about the decision context..."}
            maxLength={500}
            className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400/80">{errorMsg}</p>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={!name.trim() || !email.trim() || checkoutState === "loading"}
          className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
          style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
        >
          {checkoutState === "loading" ? "Processing..." : isExecutive ? "Submit Executive Review Request" : `Unlock ${selectedTierData?.label} Brief — ${selectedTierData?.price}`}
        </button>
        <p className="font-mono text-[6px] uppercase tracking-[0.25em] text-white/15">
          {isExecutive ? "Qualified request · A team member will respond within 2 business days" : "Secure payment via Stripe · No decision text stored without your consent"}
        </p>
      </div>
    </div>
  );
}
