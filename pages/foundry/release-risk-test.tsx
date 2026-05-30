/* pages/foundry/release-risk-test.tsx — PUBLIC RELEASE RISK TEST
 *
 * Release readiness triage with trade-off logic.
 * Directive: PROCEED / HOLD / ESCALATE / CONDITIONAL_PROCEED
 *
 * CONDITIONAL_PROCEED: no hard blockers but release requires specific
 * conditions to be met (monitoring, rollback owner, failure threshold,
 * review window). The conditions are stated explicitly.
 *
 * Trade-off analysis:
 *   - Revenue urgency vs evidence readiness
 *   - Cost of delay vs cost of failure
 *   - Rollback cost and owner
 *   - Minimum safe release conditions
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

type FindingSeverity = "BLOCKER" | "WARNING" | "INFO";

type Finding = {
  label: string;
  detail: string;
  severity: FindingSeverity;
};

type Directive = "PROCEED" | "HOLD" | "ESCALATE" | "CONDITIONAL_PROCEED";

type TestResult = {
  directive: Directive;
  summary: string;
  findings: Finding[];
  approvalNote: string;
  tradeOff: string | null;
  conditions: string[];
  rationale: string;
  nextAction: string;
  demoRef: string;
  timestamp: string;
};

function generateDemoRef(): string {
  return Date.now().toString(36).slice(-6).toUpperCase();
}

function analyzeReleaseRisk(text: string): TestResult {
  const findings: Finding[] = [];
  const lower = text.toLowerCase();

  // ── Blocker detection ──────────────────────────────────────────────────────

  if (!lower.includes("approved") && !lower.includes("sign") && !lower.includes("authorised") && !lower.includes("authorized")) {
    findings.push({
      label: "No approval recorded",
      detail: "No approval, sign-off, or authorisation is mentioned. Releases without recorded approval should not proceed.",
      severity: "BLOCKER",
    });
  }

  if (lower.includes("not tested") || lower.includes("untested") || lower.includes("no test") || lower.includes("haven't tested") || lower.includes("have not tested")) {
    findings.push({
      label: "Untested release",
      detail: "The release is described as untested. Releasing untested changes to production carries extreme risk.",
      severity: "BLOCKER",
    });
  }

  if (lower.includes("legal") && (lower.includes("pending") || lower.includes("not yet") || lower.includes("waiting") || lower.includes("review"))) {
    findings.push({
      label: "Legal review incomplete",
      detail: "Legal review is referenced but not complete. Releasing before legal clearance creates regulatory and liability exposure.",
      severity: "BLOCKER",
    });
  }

  // ── Warning detection ──────────────────────────────────────────────────────

  if (lower.includes("risk") || lower.includes("concern") || lower.includes("issue") || lower.includes("problem")) {
    findings.push({
      label: "Known risks acknowledged",
      detail: "Risks or issues are acknowledged. Each should be documented with a mitigation plan and a named owner.",
      severity: "WARNING",
    });
  }

  if (lower.includes("deadline") || lower.includes("urgent") || lower.includes("must ship") || lower.includes("hard date") || lower.includes("revenue") || lower.includes("contract")) {
    findings.push({
      label: "Date or revenue pressure present",
      detail: "The release appears driven by a date or revenue commitment rather than readiness. Date-driven releases have higher incident rates.",
      severity: "WARNING",
    });
  }

  if (lower.includes("small") || lower.includes("minor") || lower.includes("quick") || lower.includes("simple")) {
    findings.push({
      label: "Scope understated",
      detail: "Describing a release as small or simple is a common precursor to failure. All production changes carry risk proportional to the system, not the perceived size.",
      severity: "WARNING",
    });
  }

  if (!lower.includes("rollback") && !lower.includes("revert") && !lower.includes("backout")) {
    findings.push({
      label: "No rollback plan mentioned",
      detail: "No rollback or revert plan is described. A named rollback owner and a defined trigger threshold are minimum requirements for a safe release.",
      severity: "WARNING",
    });
  }

  // ── Info ───────────────────────────────────────────────────────────────────

  if (lower.includes("rollback") || lower.includes("revert") || lower.includes("backout")) {
    findings.push({
      label: "Rollback plan mentioned",
      detail: "A rollback or revert plan is mentioned. Confirm it is documented, tested, and has a named owner.",
      severity: "INFO",
    });
  }

  if (lower.includes("monitor") || lower.includes("observ") || lower.includes("alert") || lower.includes("dashboard")) {
    findings.push({
      label: "Monitoring referenced",
      detail: "Monitoring or observability is mentioned. Confirm alert thresholds and escalation paths are set before release.",
      severity: "INFO",
    });
  }

  if (lower.includes("staged") || lower.includes("canary") || lower.includes("feature flag") || lower.includes("dark launch")) {
    findings.push({
      label: "Staged rollout strategy detected",
      detail: "A phased or flag-controlled rollout reduces blast radius. This is a positive signal.",
      severity: "INFO",
    });
  }

  // Cap at 5
  const capped = findings.slice(0, 5);

  // Pad to at least 3
  if (capped.length < 3) {
    capped.push({
      label: "Release scope needs clarification",
      detail: "The description provides limited detail about what is being released, what was tested, and what systems are affected.",
      severity: "WARNING",
    });
  }

  const blockers = capped.filter(f => f.severity === "BLOCKER").length;
  const warnings = capped.filter(f => f.severity === "WARNING").length;
  const hasRollback = capped.some(f => f.label.includes("Rollback plan mentioned"));
  const hasMonitoring = capped.some(f => f.label.includes("Monitoring"));
  const hasRevenueUrgency = lower.includes("revenue") || lower.includes("contract") || lower.includes("deadline") || lower.includes("must ship");

  // ── Trade-off analysis ─────────────────────────────────────────────────────
  let tradeOff: string | null = null;
  if (blockers === 0 && hasRevenueUrgency && warnings >= 1) {
    tradeOff = hasRollback
      ? "Revenue urgency vs evidence readiness: the business case for releasing exists, but incomplete evidence readiness means any incident will cost more than the delay. A rollback plan reduces but does not eliminate this risk."
      : "Revenue urgency vs release readiness: the cost of delay is visible, but the cost of a production incident — including lost revenue, customer trust, and engineering time — typically exceeds the cost of a short hold.";
  }

  // ── Directive ─────────────────────────────────────────────────────────────
  let directive: Directive;
  let summary: string, rationale: string, nextAction: string;
  const conditions: string[] = [];

  if (blockers > 0) {
    directive = "ESCALATE";
    summary = "This release has blocking issues that must be resolved before it can proceed.";
    rationale = `${blockers} blocker(s) found. Releases with unresolved blockers should not proceed under any circumstances. Escalate to the release authority immediately.`;
    nextAction = "Resolve all BLOCKER findings. Do not release until each has been cleared by the named approver. Document the resolution.";
  } else if (warnings >= 2 && !(hasRollback && hasMonitoring)) {
    directive = "HOLD";
    summary = "This release has multiple risk factors and does not yet meet minimum safe release conditions.";
    rationale = `${warnings} warning(s) found without sufficient mitigations in place. Proceeding carries elevated incident risk.`;
    nextAction = "Address all WARNING findings. Confirm rollback plan, monitoring, and approval. Consider staged rollout.";
  } else if (warnings >= 1 || (blockers === 0 && warnings === 0 && !hasRollback)) {
    // Conditional proceed: no blockers, some warnings, but mitigations possible
    directive = "CONDITIONAL_PROCEED";
    summary = "No hard blockers detected. Release may proceed subject to specific conditions being confirmed before go-live.";
    rationale = `No blockers. ${warnings} warning(s) identified. Mitigation conditions below must be met before release.`;
    nextAction = "Confirm all conditions below before proceeding. Assign a named release owner accountable for the 24-hour window.";

    // Build minimum conditions list
    if (!hasRollback) conditions.push("Document rollback plan with named owner and specific trigger threshold");
    if (!hasMonitoring) conditions.push("Confirm monitoring, alerts, and dashboards are active and reviewed");
    conditions.push("Define failure threshold: what metric triggers an automatic rollback within the first 24 hours");
    conditions.push("Assign a named release owner accountable for the post-release window");
    if (hasRevenueUrgency) conditions.push("Revenue/deadline context noted — confirm this pressure does not override a genuine readiness gap");
    conditions.push("Confirm post-release review window: check-in at 4h and 24h after release");
  } else {
    directive = "PROCEED";
    summary = "This release appears ready to proceed with standard governance.";
    rationale = "No blockers and minimal warnings detected. Standard release governance applies.";
    nextAction = "Proceed with standard release governance. Ensure post-release monitoring is active. Review at 24 hours.";
  }

  const hasApproval = lower.includes("approved") || lower.includes("sign") || lower.includes("authorised") || lower.includes("authorized");
  const hasTesting = lower.includes("test") || lower.includes("qa") || lower.includes("verified") || lower.includes("staging");
  const approvalNote = hasApproval && hasTesting
    ? "Approval and testing signals detected. A full review would record these with timestamps against a verifiable release record."
    : !hasApproval && !hasTesting
    ? "No approval or testing references found. Both are required for a release to be considered governed."
    : !hasApproval
    ? "No approval signal found. A release without recorded authorisation creates accountability gaps."
    : "No testing reference found. A governed release requires confirmed test evidence before go-live.";

  return {
    directive,
    summary,
    findings: capped,
    approvalNote,
    tradeOff,
    conditions,
    rationale,
    nextAction,
    demoRef: generateDemoRef(),
    timestamp: new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
  };
}

export default function ReleaseRiskTestPage() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<TestResult | null>(null);

  const SAMPLE =
    "We need to release the platform update by end of week. Legal review is still pending but the team says it's a minor change. We haven't done full regression testing due to time constraints. No formal approval has been recorded yet.";

  function handleSubmit() {
    if (!text.trim()) return;
    track("foundry_test_run", { test: "release-risk", charCount: text.length });
    setResult(analyzeReleaseRisk(text));
  }

  function handleSample() {
    setText(SAMPLE);
    track("foundry_test_sample", { test: "release-risk" });
  }

  function directiveColor(d: Directive) {
    if (d === "PROCEED") return "text-emerald-400";
    if (d === "HOLD") return "text-amber-400";
    if (d === "CONDITIONAL_PROCEED") return "text-sky-400";
    return "text-red-400";
  }

  function directiveBadge(d: Directive) {
    if (d === "PROCEED") return "bg-emerald-500/10 text-emerald-400";
    if (d === "HOLD") return "bg-amber-500/10 text-amber-400";
    if (d === "CONDITIONAL_PROCEED") return "bg-sky-500/10 text-sky-400";
    return "bg-red-500/10 text-red-400";
  }

  return (
    <Layout
      title="Check Release Risk | Foundry | Abraham of London"
      description="Submit a release or operational commitment. Receive a proceed / hold / escalate / conditional proceed directive with trade-off analysis."
      canonicalUrl="/foundry/release-risk-test"
    >
      <Head><title>Check Release Risk | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">

          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Release Risk Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Check Release Risk
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Describe a release, launch, or operational commitment. The Foundry returns a directive —
            proceed, hold, escalate, or conditional proceed — with trade-off analysis and minimum
            safe conditions.
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/60">
            Public test · No data persisted · Results are illustrative
          </p>

          <div className="mt-10 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Describe the release: what is being released, who approved it, what testing has been done, what risks remain, and any deadline or revenue pressure..."
              className="w-full border bg-black/30 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                data-analytics="foundry-release-submit"
                className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
                style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
              >
                Assess Release Risk
              </button>
              <button
                onClick={handleSample}
                data-analytics="foundry-release-sample"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Use Sample
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-12 space-y-6">

              {/* Directive header */}
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Release Directive</p>
                    <p className={`mt-2 font-serif text-4xl font-light ${directiveColor(result.directive)}`}>
                      {result.directive === "CONDITIONAL_PROCEED" ? "CONDITIONAL" : result.directive}
                    </p>
                    {result.directive === "CONDITIONAL_PROCEED" && (
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sky-400/70 mt-0.5">
                        Proceed with conditions
                      </p>
                    )}
                  </div>
                  <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${directiveBadge(result.directive)}`}>
                    {result.directive === "CONDITIONAL_PROCEED" ? "CONDITIONAL" : result.directive}
                  </span>
                </div>
                <p className="mt-4 text-sm text-white/70">{result.summary}</p>

                {/* Trade-off */}
                {result.tradeOff && (
                  <div className="mt-4 border-l-2 pl-4 py-1" style={{ borderColor: `${GOLD}40` }}>
                    <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">Trade-off analysis</p>
                    <p className="text-xs text-white/60 leading-relaxed italic">{result.tradeOff}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">Demo ref: {result.demoRef}</span>
                  <span className="text-white/10">·</span>
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">{result.timestamp}</span>
                  <span className="rounded border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] text-amber-400/40">
                    Demo — not verifiable
                  </span>
                </div>
              </div>

              {/* Conditions block — only for CONDITIONAL_PROCEED */}
              {result.directive === "CONDITIONAL_PROCEED" && result.conditions.length > 0 && (
                <div className="border border-sky-500/20 bg-sky-500/5 p-5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-sky-400/70 mb-3">
                    Conditions — must be confirmed before release
                  </p>
                  <ul className="space-y-2">
                    {result.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                        <span className="mt-1.5 font-mono text-[8px] text-sky-400/50 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Findings */}
              {result.findings.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Findings</p>
                  {result.findings.map((f, i) => (
                    <div key={i} className={`border p-4 ${
                      f.severity === "BLOCKER" ? "border-red-500/20 bg-red-500/5" :
                      f.severity === "WARNING" ? "border-amber-500/15 bg-amber-500/5" :
                      "border-white/8 bg-white/2"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase ${
                          f.severity === "BLOCKER" ? "bg-red-500/10 text-red-400" :
                          f.severity === "WARNING" ? "bg-amber-500/10 text-amber-400" :
                          "bg-white/5 text-white/40"
                        }`}>{f.severity}</span>
                        <span className="text-sm font-medium text-white/70">{f.label}</span>
                      </div>
                      <p className="text-xs text-white/55">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Approval / testing note */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Approval & Testing Note</p>
                <p className="text-sm text-white/65">{result.approvalNote}</p>
              </div>

              {/* Rationale + next action */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Rationale</p>
                <p className="text-sm text-white/70">{result.rationale}</p>
                <div className="mt-4 h-px bg-white/5" />
                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Recommended Next Action</p>
                <p className="text-sm" style={{ color: `${GOLD}CC` }}>{result.nextAction}</p>
              </div>

              {/* Disclaimer */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">
                  Public preview · Pattern-based analysis only · Not a full governed assessment · No data retained
                </p>
              </div>

              <InterestForm sourceTest="release-risk" />

              <div className="border border-white/8 bg-white/2 p-5 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">What a full review adds</p>
                <p className="text-xs text-white/50 mb-4 max-w-md mx-auto">
                  A full review records approval authority, testing evidence, and dependency state with verifiable timestamps.
                  The directive becomes an auditable release decision.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/foundry/start" onClick={() => track("foundry_conversion_click", { target: "full-review", source: "release-risk-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}>
                    Start a full review →
                  </Link>
                  <Link href="/continuity" onClick={() => track("foundry_conversion_click", { target: "continuity", source: "release-risk-test" })}
                    className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors">
                    Understand continuity →
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <Link href="/foundry" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">← Back to Foundry</Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/decision-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">Try Decision Test →</Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/market-signal-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">Try Market Signal Test →</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
