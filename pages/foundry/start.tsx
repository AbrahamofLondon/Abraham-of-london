/* pages/foundry/start.tsx — SELF-SERVE FOUNDRY ENTRY
 *
 * Guides prospects into the correct instrument based on what they need.
 * Public. No auth. No admin data. Static + client-side selection only.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { InterestForm } from "@/components/foundry/InterestForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type PathwayId =
  | "test-decision"
  | "pressure-test-claim"
  | "check-release-risk"
  | "execution-stall"
  | "market-response";

type Pathway = {
  id:          PathwayId;
  question:    string;
  description: string;
  example:     string;
  route:       PathwayRoute[];
};

type PathwayRoute = {
  step:        string;
  label:       string;
  href?:       string;
  type:        "public" | "demo" | "contact" | "pilot";
  desc:        string;
};

// ─── Pathway definitions ──────────────────────────────────────────────────────

const PATHWAYS: Pathway[] = [
  {
    id: "test-decision",
    question: "I need to test a decision",
    description: "You have a decision to make — or one that has already been made — and you need to know if it is structurally sound before committing resources.",
    example: "\"We've decided to enter a new market segment. Is this decision actually ready to execute?\"",
    route: [
      { step: "1", label: "Decision Contradiction Demo",    href: "/foundry/demo#contradiction", type: "demo",    desc: "Run a free, instant contradiction scan on your decision statement." },
      { step: "2", label: "Constitutional Diagnostic",      href: "/foundry/demo#diagnostic",    type: "demo",    desc: "Get a constitutional route and authority score in 60 seconds." },
      { step: "3", label: "Fast Diagnostic (governed run)", href: "/foundry/start#contact",       type: "contact", desc: "Full governed diagnostic with signed record, evidence chain, and authority validation." },
      { step: "4", label: "Executive Reporting",            href: "/foundry/start#contact",       type: "pilot",   desc: "For strategic decisions: full executive brief with delivery and sign-off tracking." },
    ],
  },
  {
    id: "pressure-test-claim",
    question: "I need to pressure-test a product claim",
    description: "You need to know if a product or market claim holds up under scrutiny — before it reaches customers, analysts, or regulators.",
    example: "\"Our product reduces decision time by 40%. We want to know if that claim is defensible.\"",
    route: [
      { step: "1", label: "Market Response Classifier Demo", href: "/foundry/demo#market",   type: "demo",    desc: "Classify your claim as validated signal, threat, or noise." },
      { step: "2", label: "Content Red Team",                href: "/foundry/start#contact", type: "contact", desc: "Overclaim detection, guarantee language analysis, evidence posture review." },
      { step: "3", label: "Market Response Lab (governed)",   href: "/foundry/start#contact", type: "pilot",   desc: "Full governed copy check with per-claim feedback and governed audit trail." },
    ],
  },
  {
    id: "check-release-risk",
    question: "I need to check release risk",
    description: "You are approaching a product or software release and you need to know what governance gaps could block it — or cause it to fail after shipping.",
    example: "\"We're shipping in two weeks. What is the governance risk?\"",
    route: [
      { step: "1", label: "Release Risk Scanner Demo",   href: "/foundry/demo#release",   type: "demo",    desc: "Instant surface-level governance check for your release readiness." },
      { step: "2", label: "Release Gate Check",               href: "/foundry/start#contact",  type: "contact", desc: "Wire the Foundry release gate into your deployment pipeline. Blocks releases with unresolved critical findings." },
      { step: "3", label: "Security Red Team",           href: "/foundry/start#contact",  type: "pilot",   desc: "Route exposure, auth checks, rate-limit presence, manual checklist." },
      { step: "4", label: "Full Governed Release Review", href: "/foundry/start#contact", type: "pilot",   desc: "Evidence-gated release sign-off with named authority and audit trail." },
    ],
  },
  {
    id: "execution-stall",
    question: "I need to understand why execution is stalling",
    description: "Something is not moving. Work is being done but decisions are not landing. Priorities keep shifting. You need a structural diagnosis.",
    example: "\"We have 12 people working on this but nothing ships. What is happening?\"",
    route: [
      { step: "1", label: "Decision Contradiction Demo",    href: "/foundry/demo#contradiction", type: "demo",    desc: "Identify structural contradictions in your current strategy or plan." },
      { step: "2", label: "Strategy Room (governed)",        href: "/foundry/start#contact",      type: "contact", desc: "8-component intake gate, authority check, and decision directive. Identifies where governance has broken down." },
      { step: "3", label: "Operator Pilot",                  href: "/foundry/start#contact",      type: "pilot",   desc: "Full Foundry onboarding with Fast Diagnostic, Strategy Room, and ongoing release governance." },
    ],
  },
  {
    id: "market-response",
    question: "I need to evaluate market response",
    description: "You have received a market signal — customer feedback, competitive move, regulatory inquiry, or analyst comment — and need to know how to respond.",
    example: "\"A major competitor just released a feature that directly overlaps with ours. What now?\"",
    route: [
      { step: "1", label: "Market Signal Classifier Demo",  href: "/foundry/demo#market",    type: "demo",    desc: "Classify the signal as threat, opportunity, noise, or regulatory — in seconds." },
      { step: "2", label: "Market Response Lab (governed)", href: "/foundry/start#contact",   type: "contact", desc: "Full governed copy check with per-finding feedback intake." },
      { step: "3", label: "Executive Reporting",            href: "/foundry/start#contact",   type: "pilot",   desc: "For strategic market response: full executive brief with evidence chain and delivery tracking." },
    ],
  },
];

const TYPE_STYLES: Record<PathwayRoute["type"], { badge: string; border: string; bg: string }> = {
  demo:    { badge: "text-amber-400/70 border-amber-500/25 bg-amber-500/8",   border: "border-white/8",  bg: "bg-white/[0.02]" },
  public:  { badge: "text-emerald-400/70 border-emerald-500/25 bg-emerald-500/8", border: "border-white/8", bg: "bg-white/[0.02]" },
  contact: { badge: "text-violet-400/70 border-violet-500/25 bg-violet-500/8", border: "border-white/8", bg: "bg-white/[0.02]" },
  pilot:   { badge: "text-sky-400/70 border-sky-500/25 bg-sky-500/8",         border: "border-white/8",  bg: "bg-white/[0.02]" },
};

const TYPE_LABELS: Record<PathwayRoute["type"], string> = {
  demo:    "Free demo",
  public:  "Public",
  contact: "Operator access",
  pilot:   "Operator pilot",
};

const GOLD = "#C9A96E";

export default function FoundryStartPage() {
  const [selected, setSelected] = React.useState<PathwayId | null>(null);

  const pathway = PATHWAYS.find((p) => p.id === selected) ?? null;

  return (
    <Layout
      title="Start — Choose Your Foundry Pathway | Abraham of London"
      description="Not sure where to start? Choose what you need and get directed to the right Foundry instrument — from free demo to governed operator access."
      fullWidth
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-black text-white">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="border-b border-white/8 px-6 pb-14 pt-20">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-4">
              Intelligence Foundry
            </p>
            <h1 className="font-serif text-5xl leading-tight text-white">
              Where do you need to start?
            </h1>
            <p className="mt-4 text-lg text-white/45" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }}>
              No guessing. Choose what you actually need and get the right instrument.
            </p>
          </div>
        </section>

        {/* ── Choice grid ───────────────────────────────────────────────────── */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-6 px-2">
              Select your situation
            </p>

            <div className="space-y-2">
              {PATHWAYS.map((p) => {
                const isActive = selected === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(isActive ? null : p.id)}
                    className={`w-full rounded-xl border px-6 py-4 text-left transition-all ${
                      isActive
                        ? "border-white/25 bg-white/5"
                        : "border-white/8 bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-base font-medium transition-colors ${isActive ? "text-white/90" : "text-white/60"}`}>
                        {p.question}
                      </span>
                      <span className={`shrink-0 font-mono text-lg transition-colors ${isActive ? "text-white/50" : "text-white/20"}`}>
                        {isActive ? "−" : "+"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Pathway output ─────────────────────────────────────────────────── */}
        {pathway && (
          <section className="border-t border-white/6 px-4 py-12">
            <div className="mx-auto max-w-4xl space-y-8">

              {/* Context */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
                <p className="text-sm text-white/60 leading-7 mb-3">{pathway.description}</p>
                <p className="font-mono text-[11px]" style={{ color: `${GOLD}70` }}>
                  e.g. {pathway.example}
                </p>
              </div>

              {/* Recommended pathway */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-4 px-2">
                  Recommended pathway
                </p>
                <div className="space-y-3">
                  {pathway.route.map((step) => {
                    const styles = TYPE_STYLES[step.type];
                    return (
                      <div key={step.step} className={`rounded-xl border ${styles.border} ${styles.bg} p-4 flex items-start gap-4`}>
                        <div className="shrink-0 w-7 h-7 rounded-full border border-white/10 flex items-center justify-center">
                          <span className="font-mono text-[10px] text-white/30">{step.step}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white/75">{step.label}</span>
                            <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${styles.badge}`}>
                              {TYPE_LABELS[step.type]}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 leading-5">{step.desc}</p>
                        </div>
                        {step.href && step.type === "demo" && (
                          <Link
                            href={step.href}
                            className="shrink-0 rounded border border-white/12 bg-white/3 px-3 py-1.5 font-mono text-[10px] text-white/40 hover:border-white/25 hover:text-white/65 transition-colors"
                          >
                            Try it →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next step CTA */}
              <div
                className="rounded-xl border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
                style={{ borderColor: `${GOLD}25`, backgroundColor: `${GOLD}06` }}
              >
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: `${GOLD}60` }}>
                    Next step
                  </p>
                  <p className="text-sm text-white/65">
                    Start with the free demo to see how the Foundry thinks. Then request operator access for the full governed run.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Link
                    href="/foundry/demo"
                    className="rounded-lg border border-white/20 bg-white/4 px-5 py-2.5 font-mono text-xs text-white/65 transition-all hover:border-white/35 hover:text-white/85"
                  >
                    Free demo
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── No selection CTA ──────────────────────────────────────────────── */}
        {!pathway && (
          <section className="border-t border-white/6 px-4 py-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm text-white/30 mb-6">
                Not sure which applies? Start with the free demo — it covers all four Foundry instruments.
              </p>
              <Link
                href="/foundry/demo"
                className="inline-block rounded-lg border border-white/20 bg-white/5 px-8 py-3 font-mono text-sm text-white/65 transition-all hover:border-white/35 hover:text-white/85"
              >
                Try the free demo →
              </Link>
            </div>
          </section>
        )}

        {/* ── Contact anchor — interest capture form ─────────────────────────── */}
        <section id="contact" className="border-t border-white/8 px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-3 text-center">Operator Access</p>
            <h2 className="text-2xl font-semibold text-white/80 mb-4 text-center">Request a full review</h2>
            <p className="text-sm text-white/40 mb-8 leading-7 text-center max-w-lg mx-auto">
              Public tests identify visible risk patterns. A full review creates a structured record,
              checks evidence and authority, and gives the decision a continuity path.
            </p>

            <InterestForm />
          </div>
        </section>

      </main>
    </Layout>
  );
}
