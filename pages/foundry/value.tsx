/* pages/foundry/value.tsx — BUYER-FACING VALUE DASHBOARD
 *
 * Translates Foundry capability into business outcomes a buyer understands.
 * No admin data. No private routes. No engineering inventory.
 * Public. Static. No auth required.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import ExecutiveReportingSection from "@/components/homepage/ExecutiveReportingSection";
import StrategyRoomSection from "@/components/homepage/StrategyRoomSection";
import ProvenanceThesisSection from "@/components/homepage/ProvenanceThesisSection";
import Layout from "@/components/Layout";

// ─── Constants ───────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";

// ─── Panel data ──────────────────────────────────────────────────────────────

type ValueMetric = {
  label: string;
  value: string;
  context: string;
};

type ValuePanel = {
  id: string;
  headline: string;
  subhead: string;
  body: string;
  stat: ValueMetric;
  proof: string;
  signal: string; // what the Foundry actually detected
};

const PANELS: ValuePanel[] = [
  {
    id: "cost-of-delay",
    headline: "Cost of Delay",
    subhead: "Every unresolved decision has a clock running against it.",
    body: "When a decision sits unresolved — no authority named, no evidence checked, no directive issued — the team keeps spending. Engineering time, planning cycles, and stakeholder attention continue to accrue even when nothing ships. The Foundry measures how long a decision has been open, flags the governance gap causing the stall, and produces a directive in one governed run.",
    stat: {
      label: "Avg. stall duration before Foundry intake",
      value: "11 days",
      context: "across operator pilot organisations",
    },
    proof: "One governed diagnostic typically closes a decision that has been stalled for over a week — without a meeting.",
    signal: "Foundry detects: unresolved authority, missing evidence threshold, contradictory direction across teams",
  },
  {
    id: "release-risk-avoided",
    headline: "Release Risk Avoided",
    subhead: "Governance gaps don't wait until after you ship to become problems.",
    body: "Missing auth checks, unvalidated deployment assumptions, no rollback path, rate-limit absent — these are not engineering oversights. They are governance gaps. The Foundry CI gate runs before merge, catches high-severity findings, and blocks the release until they are resolved. You learn about the gap on Tuesday, not from a post-incident review on Friday.",
    stat: {
      label: "Release-blocking findings caught before deployment",
      value: "1 in 3",
      context: "governance reviews surface at least one blocker",
    },
    proof: "Operators with CI gate integration report fewer post-release governance incidents in the first 60 days.",
    signal: "Foundry detects: route exposure gaps, missing authority sign-off, unresolved critical findings, absent evidence chain",
  },
  {
    id: "decision-contradictions",
    headline: "Decision Contradictions Found",
    subhead: "Most stalls are not resource problems. They are structural contradictions.",
    body: "\"We're moving fast\" and \"we need full consensus\" cannot both be true. \"This is a pilot\" and \"this must scale to enterprise\" cannot both direct the same sprint. The Foundry contradiction scanner identifies structurally incompatible directives before they consume another month of execution budget. A contradiction found early is a month of clarity recovered.",
    stat: {
      label: "Decisions with at least one structural contradiction",
      value: "68%",
      context: "in the first Foundry scan",
    },
    proof: "In pilot organisations, the first contradiction scan consistently identifies directives that have been pulling the team in opposite directions for weeks.",
    signal: "Foundry detects: hedge language, passive authority, authority conflicts, incompatible scope statements",
  },
  {
    id: "governance-gaps-closed",
    headline: "Governance Gaps Closed",
    subhead: "A finding without a resolution is just documentation.",
    body: "The Foundry does not produce reports. It produces governed runs — each finding carries an owner, a severity, and a fix path. When a finding is resolved, the ResearchRun audit trail records who closed it, when, and under what authority. Operators can prove governance closure to auditors, regulators, and boards without assembling evidence manually.",
    stat: {
      label: "Governance findings with named owner and fix path",
      value: "100%",
      context: "in a governed ResearchRun",
    },
    proof: "Every finding produced by the Foundry carries a severity classification, a recommended resolution, and is linked to the evidence run that detected it.",
    signal: "Foundry produces: named authority, evidence adequacy score, per-finding fix path, ResearchRun audit trail",
  },
  {
    id: "execution-risk-reduced",
    headline: "Execution Risk Reduced",
    subhead: "The Foundry tells you what is at risk before it becomes a delay.",
    body: "Most execution failures are not surprises. The signals were there — incomplete evidence, unnamed authority, missing sign-off, contradictory scope. The Foundry reads those signals structurally and flags them before resources are committed. For organisations moving into a new market, a critical product launch, or a board-level initiative, a single governed run replaces weeks of informal risk assessment.",
    stat: {
      label: "Organisations that run a second diagnostic within 30 days",
      value: "4 in 5",
      context: "after first governed run",
    },
    proof: "Once operators see the structural gap between what they believed was decided and what the Foundry can confirm as decided, they immediately identify three or four more decisions in the same state.",
    signal: "Foundry produces: authority validation, evidence adequacy score, 8-component intake gate, governance directive",
  },
];

// ─── Supporting copy ──────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  {
    without: "11+ day stalls as decisions wait for informal alignment",
    with: "One governed diagnostic closes the stall with a named directive",
  },
  {
    without: "Post-release incidents discovered after customer impact",
    with: "CI gate blocks the release when governance gaps are detected pre-merge",
  },
  {
    without: "Contradiction discovered in a retrospective, after the sprint",
    with: "Contradiction scanner flags incompatible directives before resources commit",
  },
  {
    without: "Risk assessment assembled manually from meeting notes and Slack threads",
    with: "Governance run produces evidence chain, severity classification, named owner",
  },
  {
    without: "Board reporting requires manual evidence gathering across teams",
    with: "ResearchRun audit trail is already complete — governance closure is provable",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function FoundryValuePage() {
  return (
    <Layout
      title="Value Case — What the Foundry Delivers | Abraham of London"
      description="The Intelligence Foundry in business terms: cost of delay, release risk avoided, decision contradictions found, governance gaps closed, execution risk reduced."
      fullWidth
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-black text-white">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="border-b border-white/8 px-6 pb-16 pt-20">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-4">
              Intelligence Foundry — Value Case
            </p>
            <h1 className="font-serif text-5xl leading-tight text-white">
              What does the Foundry actually deliver?
            </h1>
            <p
              className="mt-5 text-lg text-white/50 leading-8"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }}
            >
              Not a governance engine. Not an AI audit tool. A system that turns unresolved decisions,
              release risk, and structural contradictions into evidence — before they become costs.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/foundry/demo"
                className="rounded-lg border px-5 py-2.5 font-mono text-sm transition-all hover:border-white/35 hover:text-white/85"
                style={{ borderColor: `${GOLD}40`, color: `${GOLD}90`, backgroundColor: `${GOLD}08` }}
              >
                Try the free demo →
              </Link>
              <Link
                href="/foundry/start"
                className="rounded-lg border border-white/15 bg-white/[0.03] px-5 py-2.5 font-mono text-sm text-white/50 transition-all hover:border-white/30 hover:text-white/75"
              >
                Find your pathway
              </Link>
            </div>
          </div>
        </section>

        {/* ── Value panels ──────────────────────────────────────────────────── */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl space-y-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-8 px-2">
              Five categories of measurable value
            </p>

            {PANELS.map((panel, i) => (
              <div
                key={panel.id}
                className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden"
              >
                {/* Panel header */}
                <div className="px-6 pt-6 pb-4 border-b border-white/5">
                  <div className="flex items-start gap-4">
                    <div
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs"
                      style={{ backgroundColor: `${GOLD}12`, color: `${GOLD}70`, border: `1px solid ${GOLD}25` }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white/85">{panel.headline}</h2>
                      <p
                        className="mt-1 text-sm leading-6"
                        style={{ color: `${GOLD}70`, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}
                      >
                        {panel.subhead}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Panel body */}
                <div className="px-6 py-5 grid sm:grid-cols-5 gap-6">
                  {/* Left: narrative */}
                  <div className="sm:col-span-3">
                    <p className="text-sm text-white/55 leading-7">{panel.body}</p>
                    <p className="mt-4 text-xs text-white/35 leading-6 italic">{panel.proof}</p>
                  </div>

                  {/* Right: stat + signal */}
                  <div className="sm:col-span-2 space-y-4">
                    {/* Stat block */}
                    <div
                      className="rounded-lg border p-4"
                      style={{ borderColor: `${GOLD}20`, backgroundColor: `${GOLD}06` }}
                    >
                      <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: `${GOLD}50` }}>
                        {panel.stat.label}
                      </p>
                      <p className="font-mono text-3xl font-bold" style={{ color: GOLD }}>
                        {panel.stat.value}
                      </p>
                      <p className="font-mono text-[10px] mt-1" style={{ color: `${GOLD}50` }}>
                        {panel.stat.context}
                      </p>
                    </div>

                    {/* Signal block */}
                    <div className="rounded-lg border border-white/6 bg-white/[0.015] p-4">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-white/20 mb-2">
                        What the Foundry detects
                      </p>
                      <p className="text-xs text-white/40 leading-5">{panel.signal}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Before / After comparison ─────────────────────────────────────── */}
        <section className="border-t border-white/6 px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-6 px-2">
              Without vs. with the Foundry
            </p>

            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="grid grid-cols-2 border-b border-white/8">
                <div className="px-5 py-3 border-r border-white/8">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-white/25">Without</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-white/25">With the Foundry</p>
                </div>
              </div>

              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-2 ${i < COMPARISON_ROWS.length - 1 ? "border-b border-white/5" : ""}`}
                >
                  <div className="px-5 py-4 border-r border-white/5">
                    <p className="text-xs text-white/35 leading-5">{row.without}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs text-white/60 leading-5">{row.with}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How the Foundry produces this ────────────────────────────────── */}
        <section className="border-t border-white/6 px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-6 px-2">
              How it works
            </p>

            <div className="space-y-3">
              {[
                {
                  step: "01",
                  label: "Intake",
                  desc: "Decision, claim, or release description submitted via the Foundry intake gate. Eight components checked: scope, authority, evidence, urgency, contradictions, stakeholders, timeline, rollback.",
                },
                {
                  step: "02",
                  label: "Governed Run",
                  desc: "The Foundry runs a ResearchRun against the intake. Every finding is classified by severity, assigned a named owner, and linked to its evidence source.",
                },
                {
                  step: "03",
                  label: "Directive",
                  desc: "A governance directive is produced: the decision is approved, blocked, or returned with a specific remediation path. No ambiguous recommendations.",
                },
                {
                  step: "04",
                  label: "Audit Trail",
                  desc: "The full run — intake, findings, directive, resolution — is persisted to the ResearchRun record. Authority validation and sign-off are captured. The record is complete and provable.",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 rounded-xl border border-white/6 bg-white/[0.015] px-5 py-4">
                  <div className="shrink-0 font-mono text-[10px] text-white/20 w-6 pt-0.5">{item.step}</div>
                  <div>
                    <p className="text-sm font-medium text-white/70 mb-1">{item.label}</p>
                    <p className="text-xs text-white/40 leading-5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Qualification ─────────────────────────────────────────────────── */}
        <section className="border-t border-white/6 px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-5 px-2">
              The Foundry is designed for
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  icon: "◆",
                  label: "Product & engineering leaders",
                  desc: "Who need to know whether a release is actually ready — not just feature-complete.",
                },
                {
                  icon: "◆",
                  label: "Strategy and operations teams",
                  desc: "Who need to close decisions, not just document them, before the next planning cycle.",
                },
                {
                  icon: "◆",
                  label: "Governance and compliance functions",
                  desc: "Who need evidence of authority and audit trail that can survive external review.",
                },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <p className="text-[10px] mb-3" style={{ color: `${GOLD}50` }}>{card.icon}</p>
                  <p className="text-sm font-medium text-white/75 mb-2">{card.label}</p>
                  <p className="text-xs text-white/40 leading-5">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Executive Reporting ──────────────────────────────────────────── */}
        <ExecutiveReportingSection />

        {/* ── Strategy Room ──────────────────────────────────────────────── */}
        <StrategyRoomSection />

        {/* ── Provenance Thesis ──────────────────────────────────────────── */}
        <ProvenanceThesisSection />

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="border-t border-white/8 px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-3">Ready to start</p>
            <h2 className="text-2xl font-semibold text-white/80 mb-4">See it in action — or request access</h2>
            <p className="text-sm text-white/40 mb-8 leading-7">
              The free demo runs four Foundry instruments against your real decision, claim, or release statement.
              No account required. Operator access gives you the full governed run with persistence, authority
              validation, and the audit trail.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/foundry/demo"
                className="rounded-lg border px-7 py-3 font-mono text-sm transition-all hover:opacity-90"
                style={{ borderColor: `${GOLD}35`, backgroundColor: `${GOLD}10`, color: `${GOLD}` }}
              >
                Try the free demo
              </Link>
              <Link
                href="/foundry/start#contact"
                className="rounded-lg border border-white/20 bg-white/5 px-7 py-3 font-mono text-sm text-white/60 transition-all hover:border-white/35 hover:text-white/80"
              >
                Request operator access
              </Link>
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
}
