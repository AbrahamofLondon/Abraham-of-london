import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function SL({ children }: { children: React.ReactNode }) {
  return <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.55rem" }}>{children}</div>;
}

function Rule() { return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-10" />; }

const MethodPage: NextPage = () => {
  return (
    <Layout
      title="Method | Abraham of London"
      description="This system identifies contradictions you cannot see, prices the consequence of inaction, and forces a decision."
      canonicalUrl="/method"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="A governed decision system. Identifies contradiction, prices consequence, forces decision. Not assessment. Not advice." />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">

          {/* ── 1. AUTHORITY STATEMENT ──────────────────────────────────────── */}
          <div className="max-w-3xl">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>
              Method
            </p>
            <h1 className="mt-5" style={{ ...serif, fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)", lineHeight: 0.98, color: "rgba(255,255,255,0.92)" }}>
              Most systems measure alignment.
            </h1>
            <p className="mt-3" style={{ ...serif, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", lineHeight: 1.15, color: "rgba(252,165,165,0.55)", fontStyle: "italic" }}>
              This system identifies contradiction, prices consequence, and forces decision.
            </p>
            <p className="mt-4" style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(255,255,255,0.38)", maxWidth: "52ch" }}>
              It does not tell you what you want to hear. It shows you where your position collapses under evidence — and what that costs.
            </p>
          </div>

          <Rule />

          {/* ── 2. CORE MECHANISM ──────────────────────────────────────────── */}
          <div>
            <SL>How it works</SL>
            <div className="grid gap-3 md:grid-cols-5">
              {[
                { n: "01", title: "Dual-axis truth detection", desc: "Every statement is measured on two axes: how true you believe it is, and how certain you are. High resonance with low certainty is the most diagnostic signal — it reveals where you're claiming alignment you haven't earned." },
                { n: "02", title: "Contradiction identification", desc: "The system compares what you claim against what you evidence. When your scores say one thing and your words say another, that gap is the finding — not the scores." },
                { n: "03", title: "Cross-stage accumulation", desc: "Patterns that appear in one stage and reappear in the next are structural, not accidental. The system tracks 12 named contradiction patterns across your entire diagnostic journey." },
                { n: "04", title: "Consequence modelling", desc: "Every identified contradiction is connected to a time horizon and a cost. The system does not describe risk — it prices the annual exposure of unresolved conditions." },
                { n: "05", title: "Action enforcement", desc: "The output is not a recommendation. It is a named decision, a sequenced priority stack, and a first move with a deadline. If you skip the first move, the system tells you what compounds." },
              ].map((m) => (
                <div key={m.n} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                  <span style={{ ...mono, fontSize: "9px", color: `${GOLD}45` }}>{m.n}</span>
                  <h3 className="mt-2" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
                    {m.title}
                  </h3>
                  <p className="mt-2" style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.55, color: "rgba(255,255,255,0.35)" }}>
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Rule />

          {/* ── 3. DIFFERENTIATION ──────────────────────────────────────────── */}
          <div className="max-w-3xl">
            <SL>What this is not</SL>
            <div className="space-y-4">
              {[
                { label: "A survey", contrast: "tells you how people feel", system: "shows you where claimed reality contradicts measured evidence" },
                { label: "A coaching tool", contrast: "helps you reflect", system: "forces a decision you have been avoiding" },
                { label: "An AI prompt", contrast: "generates plausible advice from your description", system: "scores your condition against a proprietary contradiction engine, then prices the consequence" },
                { label: "A consulting report", contrast: "tells you what the consultant thinks", system: "shows you what your own data proves — and what it costs to ignore it" },
              ].map((d) => (
                <div key={d.label} style={{ borderLeft: "2px solid rgba(255,255,255,0.06)", paddingLeft: "1rem" }}>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                    {d.label}
                  </span>
                  <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.55, color: "rgba(255,255,255,0.30)", marginTop: "0.15rem" }}>
                    {d.contrast}
                  </p>
                  <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>
                    This system {d.system}.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Rule />

          {/* ── 4. THE LADDER (escalation of consequence) ───────────────────── */}
          <div>
            <SL>Escalation of consequence</SL>
            <p className="mb-5" style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.35)", maxWidth: "52ch" }}>
              Each stage increases what is at stake. The system advances when the condition requires it.
            </p>
            <div className="space-y-1">
              {[
                { stage: "Personal", from: "Personal contradiction", to: "Operational strain", desc: "Where your stated position diverges from your actual behaviour" },
                { stage: "Constitutional", from: "Structural weakness", to: "Coordination failure", desc: "Where authority, trust, and governance are producing the condition" },
                { stage: "Team", from: "Perception divergence", to: "Execution cost", desc: "Where leadership believes one thing and the team measures another" },
                { stage: "Enterprise", from: "Institutional drag", to: "Financial exposure", desc: "Where systemic friction is converting into revenue loss" },
                { stage: "Executive Report", from: "Accumulated evidence", to: "Forced decision", desc: "Where the condition is priced and the priority stack is non-negotiable" },
                { stage: "Strategy Room", from: "Decision confirmed", to: "Execution sequenced", desc: "Where the first move is defined, timed, and the consequence of inaction is stated" },
              ].map((s, i) => (
                <div key={s.stage} className="grid gap-3 md:grid-cols-[6rem_1fr_1fr_1fr] items-start py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: i >= 4 ? `${GOLD}80` : "rgba(255,255,255,0.30)" }}>
                    {s.stage}
                  </span>
                  <span style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.38)" }}>{s.from}</span>
                  <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>&rarr;</span>
                  <div>
                    <span style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.52)" }}>{s.to}</span>
                    <p style={{ ...serif, fontSize: "0.75rem", color: "rgba(255,255,255,0.22)", marginTop: "0.15rem" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Rule />

          {/* ── 5. THE OUTCOME ──────────────────────────────────────────────── */}
          <div className="max-w-3xl">
            <SL>What you receive</SL>
            <p className="mb-4" style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)" }}>
              Not a report. Not a score. Not insight.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Named condition", desc: "From a taxonomy of 12 structural patterns — not generic severity" },
                { label: "Contradiction you cannot ignore", desc: "Where your stated position collapses under your own evidence" },
                { label: "Priced consequence", desc: "Annual exposure calculated with visible math — inputs, formula, output" },
                { label: "Required decision", desc: "Extracted from your own words — the decision you have been avoiding" },
                { label: "First move", desc: "Executable tomorrow — with timeframe, owner, and consequence if skipped" },
                { label: "Escalation path", desc: "Earned routing to the next layer — not promotional, inevitable" },
              ].map((o) => (
                <div key={o.label} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.85rem" }}>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}60` }}>{o.label}</span>
                  <p className="mt-1" style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.38)" }}>{o.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Rule />

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/diagnostics/constitutional-diagnostic" className="inline-flex items-center gap-2 transition-all duration-200"
              style={{ padding: "10px 20px", border: `1px solid ${AMBER}42`, color: AMBER, ...mono, fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Start diagnostic <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
            <Link href="/diagnostics/executive-reporting" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
              Executive Reporting &middot; &pound;95
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default MethodPage;
