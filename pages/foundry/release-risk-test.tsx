/* pages/foundry/release-risk-test.tsx — PUBLIC RELEASE RISK TEST
 *
 * Controlled public test: submit a release, launch, or operational commitment.
 * Returns a readiness assessment with proceed/hold/escalate directive.
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
  severity: "BLOCKER" | "WARNING" | "INFO";
};

type TestResult = {
  directive: "PROCEED" | "HOLD" | "ESCALATE";
  summary: string;
  findings: Finding[];
  evidenceNote: string;
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

  // Blocker detection
  if (!lower.includes("approved") && !lower.includes("sign") && !lower.includes("authorised") && !lower.includes("authorized")) {
    findings.push({
      label: "No approval recorded",
      detail: "No approval, sign-off, or authorisation is mentioned. Releases without recorded approval should not proceed.",
      severity: "BLOCKER",
    });
  }
  if (lower.includes("not tested") || lower.includes("untested") || lower.includes("no test") || lower.includes("haven't tested")) {
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

  // Warning detection
  if (lower.includes("risk") || lower.includes("concern") || lower.includes("issue") || lower.includes("problem")) {
    findings.push({
      label: "Known risks acknowledged",
      detail: "Risks or issues are acknowledged. Each should be documented with a mitigation plan before release.",
      severity: "WARNING",
    });
  }
  if (lower.includes("deadline") || lower.includes("urgent") || lower.includes("must ship") || lower.includes("hard date")) {
    findings.push({
      label: "Date-driven release pressure",
      detail: "The release appears to be driven by a date rather than readiness. Date-driven releases are more likely to fail.",
      severity: "WARNING",
    });
  }
  if (lower.includes("small") || lower.includes("minor") || lower.includes("quick") || lower.includes("simple")) {
    findings.push({
      label: "Scope understated",
      detail: "The release is described as small or simple. Understating scope is a common precursor to release failure.",
      severity: "WARNING",
    });
  }

  // Info
  if (lower.includes("rollback") || lower.includes("revert") || lower.includes("backout")) {
    findings.push({
      label: "Rollback plan mentioned",
      detail: "A rollback or revert plan is mentioned. This is good practice — ensure it is documented and tested.",
      severity: "INFO",
    });
  }
  if (lower.includes("monitor") || lower.includes("observ") || lower.includes("alert") || lower.includes("dashboard")) {
    findings.push({
      label: "Monitoring referenced",
      detail: "Monitoring or observability is mentioned. This supports safe release practices.",
      severity: "INFO",
    });
  }

  // Cap at 5
  const capped = findings.slice(0, 5);

  // Pad to at least 3
  if (capped.length < 3) {
    capped.push({
      label: "Release scope unclear",
      detail: "The description provides limited detail about the scope, affected systems, or dependencies. A release submission should clearly identify what is changing.",
      severity: "WARNING",
    });
  }

  const blockers = capped.filter(f => f.severity === "BLOCKER").length;
  const warnings = capped.filter(f => f.severity === "WARNING").length;

  let directive: "PROCEED" | "HOLD" | "ESCALATE";
  let summary: string, rationale: string, nextAction: string;

  if (blockers > 0) {
    directive = "ESCALATE";
    summary = "This release has blocking issues that must be resolved before it can proceed.";
    rationale = `${blockers} blocker(s) found. Releases with unresolved blockers should not proceed under any circumstances.`;
    nextAction = "Resolve all BLOCKER findings. Do not release until each blocker has been cleared and re-verified.";
  } else if (warnings >= 2) {
    directive = "HOLD";
    summary = "This release has multiple risk factors that should be addressed before proceeding.";
    rationale = `${warnings} warning(s) found. The release may succeed but carries elevated risk of incident or failure.`;
    nextAction = "Address all WARNING findings. Consider a staged rollout with enhanced monitoring.";
  } else {
    directive = "PROCEED";
    summary = "This release appears ready to proceed with standard governance.";
    rationale = "No blockers and minimal warnings detected. Standard release governance applies.";
    nextAction = "Proceed with standard release governance. Ensure post-release monitoring is active.";
  }

  // Evidence note
  const hasApproval = lower.includes("approved") || lower.includes("sign") || lower.includes("authorised") || lower.includes("authorized");
  const hasTesting = lower.includes("test") || lower.includes("qa") || lower.includes("verified") || lower.includes("staging");
  const evidenceNote = hasApproval && hasTesting
    ? "Approval and testing signals were detected. A full review would record these against a durable, verifiable release record."
    : !hasApproval && !hasTesting
    ? "No approval or testing references were found. Both are required for a release to be considered governed."
    : !hasApproval
    ? "No approval reference was found. A release without recorded authorisation creates accountability gaps."
    : "No testing reference was found. A governed release requires confirmation that changes have been validated.";

  return {
    directive,
    summary,
    findings: capped,
    evidenceNote,
    rationale,
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

  return (
    <Layout
      title="Check Release Risk | Foundry | Abraham of London"
      description="Submit a release, launch, or operational commitment. Receive a readiness assessment with a proceed/hold/escalate directive."
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
            Describe a release, launch, or operational commitment. The Foundry will assess readiness
            and return a proceed / hold / escalate directive.
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/60">
            Public test · No data persisted · Results are illustrative
          </p>

          <div className="mt-10 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Describe the release: what is being released, who approved it, what testing has been done, and what risks remain..."
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

              {/* 1. Directive header */}
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Release Directive</p>
                    <p className={`mt-2 font-serif text-4xl font-light ${
                      result.directive === "PROCEED" ? "text-emerald-400" :
                      result.directive === "HOLD" ? "text-amber-400" :
                      "text-red-400"
                    }`}>{result.directive}</p>
                  </div>
                  <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    result.directive === "PROCEED" ? "bg-emerald-500/10 text-emerald-400" :
                    result.directive === "HOLD" ? "bg-amber-500/10 text-amber-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>{result.directive}</span>
                </div>
                <p className="mt-4 text-sm text-white/70">{result.summary}</p>

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

              {/* 3. Evidence note */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Approval & Testing Note</p>
                <p className="text-sm text-white/65">{result.evidenceNote}</p>
              </div>

              {/* 4. Rationale + 5. Next action */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Rationale</p>
                <p className="text-sm text-white/70">{result.rationale}</p>
                <div className="mt-4 h-px bg-white/5" />
                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Recommended Next Action</p>
                <p className="text-sm" style={{ color: `${GOLD}CC` }}>{result.nextAction}</p>
              </div>

              {/* 8. Disclaimer */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">
                  Public preview · Pattern-based analysis only · Not a full governed assessment · No data retained
                </p>
              </div>

              {/* Interest capture */}
              <InterestForm sourceTest="release-risk" />

              {/* 9. Conversion CTA */}
              <div className="border border-white/8 bg-white/2 p-5 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
                  What a full review adds
                </p>
                <p className="text-xs text-white/50 mb-4 max-w-md mx-auto">
                  A full review records approval authority, testing evidence, and dependency state
                  against a verifiable timestamp. The directive becomes an auditable release decision.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/foundry/start"
                    data-analytics="foundry-conversion-full-review"
                    onClick={() => track("foundry_conversion_click", { target: "full-review", source: "release-risk-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
                  >
                    Start a full review →
                  </Link>
                  <Link
                    href="/continuity"
                    data-analytics="foundry-conversion-continuity"
                    onClick={() => track("foundry_conversion_click", { target: "continuity", source: "release-risk-test" })}
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
                <Link href="/foundry/decision-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  Try Decision Test →
                </Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/market-signal-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  Try Market Signal Test →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
