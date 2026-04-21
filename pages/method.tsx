import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const MethodPage: NextPage = () => {
  return (
    <Layout
      title="Method | Abraham of London"
      description="How the governed executive reporting system works — from diagnostic evidence through constitutional analysis to a decision-ready executive brief."
      canonicalUrl="/method"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="How the Abraham of London governed executive reporting system works — from diagnostic evidence through constitutional routing to a board-grade executive brief." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
          <div className="max-w-3xl">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "8px", letterSpacing: "0.28em", color: `${GOLD}90` }}
            >
              Method
            </p>

            <h1
              className="mt-6"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                lineHeight: 0.95,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              How this system works.
            </h1>

            <p
              className="mt-5"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: "1.15rem",
                lineHeight: 1.6,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.42)",
                maxWidth: "56ch",
              }}
            >
              A governed executive reporting system. Structured diagnostic evidence
              produces a board-grade brief: position, financial exposure, priority
              stack, and next action.
            </p>

            <p
              className="mt-5"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.20em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              This page explains how the system thinks. It does not expose proprietary scoring thresholds or internal model weights.
            </p>
          </div>

          {/* Concrete operating flow */}
          <div
            className="mt-12 grid gap-4 border p-5 md:grid-cols-[1fr_0.95fr]"
            style={{ borderColor: "rgba(201,169,110,0.18)", backgroundColor: "rgba(201,169,110,0.035)" }}
          >
            <div>
              <p
                className="font-mono uppercase"
                style={{ fontSize: "7.5px", letterSpacing: "0.28em", color: `${GOLD}80`, marginBottom: "1rem" }}
              >
                Simple flow
              </p>
              <div className="grid gap-2 text-sm leading-6 md:grid-cols-3">
                {["Signal capture", "Structural classification", "Governed output"].map((step, index) => (
                  <div key={step} className="border p-4" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(0,0,0,0.24)" }}>
                    <div className="font-mono text-[7px] uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.32)" }}>
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.78)" }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p
                className="font-mono uppercase"
                style={{ fontSize: "7.5px", letterSpacing: "0.28em", color: `${GOLD}80`, marginBottom: "1rem" }}
              >
                Concrete example
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 300,
                  fontSize: "0.98rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                If a team reports slow execution, the system does not stop at “low performance.”
                It tests whether the issue is authority confusion, trust erosion, resource constraint,
                or governance drift, then routes the next step accordingly.
              </p>
            </div>
          </div>

          {/* Principle strip */}
          <div
            className="mt-16 grid gap-6 md:grid-cols-3"
            style={{ maxWidth: "72rem" }}
          >
            {[
              {
                label: "Evidence accumulation",
                body: "Diagnostic stages accumulate structured evidence: constitutional posture, team perception gaps, enterprise pressure readings, and failure mode density. Each stage adds to the evidence base. Tension signals persist and escalate across stages when confirmed by multiple sources.",
              },
              {
                label: "Constitutional routing",
                body: "Evidence is evaluated against a deterministic constitutional framework — clarity, authority, coherence, readiness. The system routes to STRATEGY, DIAGNOSTIC, or WATCH based on what the evidence actually warrants. No probabilistic guessing. No generic scoring.",
              },
              {
                label: "Governed executive reporting",
                body: "The flagship output. Takes accumulated evidence plus a structured executive intake and produces a board-grade position: financial exposure, governed priority stack, trajectory outlook. Claim governance prevents the report from stating capabilities the evidence does not support.",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  padding: "1.5rem",
                }}
              >
                <p
                  className="font-mono uppercase"
                  style={{
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    color: `${GOLD}80`,
                    marginBottom: "1rem",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 300,
                    fontSize: "0.97rem",
                    lineHeight: 1.78,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Diagnostic ladder */}
          <div className="mt-20 max-w-3xl">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "7.5px", letterSpacing: "0.28em", color: `${GOLD}70`, marginBottom: "1.5rem" }}
            >
              The diagnostic ladder
            </p>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                lineHeight: 1.78,
                color: "rgba(255,255,255,0.55)",
                marginBottom: "2rem",
              }}
            >
              The system operates as a governed evidence ladder. Free diagnostic stages build
              structural evidence. Executive Reporting is the flagship output — where evidence
              becomes a decision-ready position. Escalation beyond that is governed by constitutional
              authority.
            </p>

            <div className="space-y-4">
              {[
                {
                  stage: "Evidence",
                  name: "Constitutional Diagnostic",
                  access: "Free",
                  desc: "Entry gate. 10 dual-axis questions across 9 constitutional domains. Routes to STRATEGY, DIAGNOSTIC, or WATCH with confidence score and failure mode density.",
                },
                {
                  stage: "Evidence",
                  name: "Team Assessment",
                  access: "Free",
                  desc: "Perception gap analysis. Leader View (fast directional read) or Respondent-Based (team-wide campaign with measurable confidence). Strengthens Executive Reporting evidence.",
                },
                {
                  stage: "Evidence",
                  name: "Enterprise Assessment",
                  access: "Free",
                  desc: "Institutional stress test. Leadership coherence, governance reliability, execution variance, risk posture. Routes to Executive Reporting or WATCH.",
                },
                {
                  stage: "Flagship",
                  name: "Executive Reporting",
                  access: "£95",
                  desc: "The governed executive brief. Takes accumulated diagnostic evidence, adds structured intake, produces position statement, financial exposure, priority stack, and trajectory outlook.",
                },
                {
                  stage: "Escalation",
                  name: "Strategy Room",
                  access: "£395",
                  desc: "Governed escalation environment. Opens only when constitutional evidence warrants direct intervention. Decision authority enforcement at the gate.",
                },
              ].map((s) => (
                <div
                  key={s.stage}
                  className="flex gap-5"
                  style={{
                    borderLeft: `2px solid ${s.access === "Free" ? "rgba(255,255,255,0.08)" : `${GOLD}40`}`,
                    paddingLeft: "1.25rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <div style={{ minWidth: "4.5rem" }}>
                    <p className="font-mono uppercase" style={{ fontSize: "7px", letterSpacing: "0.26em", color: "rgba(255,255,255,0.28)" }}>
                      {s.stage}
                    </p>
                    <p className="font-mono uppercase" style={{ fontSize: "7px", letterSpacing: "0.20em", color: s.access === "Free" ? "rgba(110,231,183,0.55)" : `${GOLD}90`, marginTop: "4px" }}>
                      {s.access}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 650, color: "rgba(255,255,255,0.78)" }}>
                      {s.name}
                    </p>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginTop: "0.4rem" }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Governance principles */}
          <div className="mt-20 max-w-3xl">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "7.5px", letterSpacing: "0.28em", color: `${GOLD}70`, marginBottom: "1.5rem" }}
            >
              Governance principles
            </p>

            <div className="space-y-6">
              {[
                {
                  principle: "Escalation is governed by evidence, not by sales logic.",
                  detail: "If the evidence warrants only a diagnostic reading, the system will not recommend paid interpretation. Commercial commitment is gated by signal strength and constitutional routing.",
                },
                {
                  principle: "Claims are governed by proof, not by marketing.",
                  detail: "The report will not claim benchmarked position without sufficient cohort data, team-wide sentiment without respondent threshold, or monitoring posture without recurring snapshots. A claim governor enforces this at runtime.",
                },
                {
                  principle: "Team evidence is mode-declared.",
                  detail: "Leader View (single-person estimate) and Respondent-Based (multi-respondent campaign) are distinct modes. The report states which mode was used and adjusts confidence accordingly. Leader estimate is never presented as team sentiment.",
                },
                {
                  principle: "The method is disclosed. The implementation is not.",
                  detail: "You are entitled to understand how this system works. You are not entitled to its scoring thresholds, routing logic, or proprietary analytical models.",
                },
              ].map((g) => (
                <div key={g.principle}>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
                    {g.principle}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.72, color: "rgba(255,255,255,0.40)", marginTop: "0.5rem" }}>
                    {g.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* What you can verify */}
          <div className="mt-20 max-w-3xl">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "7.5px", letterSpacing: "0.28em", color: `${GOLD}70`, marginBottom: "1.5rem" }}
            >
              What you can verify
            </p>
            <div className="space-y-3">
              {[
                "The evidence ladder is structured — free diagnostic stages precede the paid executive brief.",
                "Escalation is governed — the system will not recommend intervention the evidence does not support.",
                "Claims are proof-gated — benchmark, trajectory, team sentiment, and monitoring claims require runtime evidence thresholds.",
                "Team evidence mode is declared — leader-estimate vs respondent-derived is stated explicitly with confidence.",
                "Executive Reporting is the flagship — every other product feeds, extends, or supports it.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: `${GOLD}70` }} />
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.72, color: "rgba(255,255,255,0.55)" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/diagnostics"
                className="inline-flex items-center gap-2 border-b pb-1 transition-colors hover:border-white/45"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}CC`,
                  borderColor: `${GOLD}40`,
                }}
              >
                Start the diagnostic ladder →
              </Link>
              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-2 border-b pb-1 transition-colors hover:border-white/45"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(245,245,245,0.70)",
                  borderColor: "rgba(255,255,255,0.20)",
                }}
              >
                View Executive Reporting →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default MethodPage;
