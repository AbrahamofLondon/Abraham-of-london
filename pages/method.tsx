import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { getProductDisplayPrice } from "@/lib/commercial/catalog";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function Rule() { return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-8 lg:my-10" />; }

const MethodPage: NextPage = () => (
  <Layout title="Method | Abraham of London" description="Identifies contradiction. Prices consequence. Forces decision." canonicalUrl="/method" fullWidth headerTransparent>
    <Head><meta name="description" content="A governed decision system that identifies contradiction, prices consequence, and forces decision." /></Head>

    <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">

        {/* ── 1. AUTHORITY STATEMENT ── */}
        <div className="max-w-3xl">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>Method</p>
          <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 0.98, color: "rgba(255,255,255,0.92)" }}>
            The system builds a case against your assumptions.
          </h1>
          <p className="mt-3" style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.5, color: "rgba(252,165,165,0.50)", fontStyle: "italic", maxWidth: "44ch" }}>
            Then it prices the cost of being wrong. Then it forces the decision.
          </p>
        </div>

        <Rule />

        {/* ── 2. ESCALATION OF CONSEQUENCE (the spine — now primary) ── */}
        <div>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.75rem" }}>
            Escalation of consequence
          </p>
          <div className="space-y-0">
            {[
              { stage: "Personal", arrow: "Personal contradiction", consequence: "Operational strain" },
              { stage: "Constitutional", arrow: "Structural weakness", consequence: "Coordination failure" },
              { stage: "Team", arrow: "Perception divergence", consequence: "Execution cost" },
              { stage: "Enterprise", arrow: "Institutional drag", consequence: "Financial exposure" },
              { stage: "Executive Report", arrow: "Accumulated evidence", consequence: "Forced decision", highlight: true },
              { stage: "Strategy Room", arrow: "Decision confirmed", consequence: "Execution sequenced", highlight: true },
            ].map((s) => (
              <div key={s.stage} className="grid grid-cols-[5rem_1fr_1rem_1fr] items-center py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: s.highlight ? `${GOLD}80` : "rgba(255,255,255,0.25)" }}>{s.stage}</span>
                <span style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.35)" }}>{s.arrow}</span>
                <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.12)" }}>&rarr;</span>
                <span style={{ ...serif, fontSize: "0.85rem", color: s.highlight ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)" }}>{s.consequence}</span>
              </div>
            ))}
          </div>
          <p className="mt-3" style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.18)", fontStyle: "italic" }}>
            Each stage increases what is at stake. The system advances when the condition requires it.
          </p>
        </div>

        <Rule />

        {/* ── 3. WHAT MAKES THIS DIFFERENT ── */}
        <div className="max-w-3xl">
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.75rem" }}>What this is not</p>
          <div className="space-y-3">
            {[
              { label: "A survey", you: "tells you how you feel", system: "shows where your position collapses under evidence" },
              { label: "A coaching tool", you: "helps you reflect", system: "forces the decision you have been avoiding" },
              { label: "An AI prompt", you: "generates plausible advice", system: "scores your condition against a proprietary contradiction engine, then prices it" },
              { label: "A consulting report", you: "tells you what the consultant thinks", system: "shows what your own data proves — and what it costs to ignore" },
            ].map((d) => (
              <div key={d.label} style={{ borderLeft: "2px solid rgba(255,255,255,0.05)", paddingLeft: "0.85rem" }}>
                <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>{d.label} {d.you}</span>
                <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.50)", marginTop: "0.15rem" }}>This system {d.system}.</p>
              </div>
            ))}
          </div>
        </div>

        <Rule />

        {/* ── 4. THREE AUTHORITY PANELS (replaces 5-column grid) ── */}
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { n: "01", title: "Detects contradiction", desc: "Every statement is measured on two axes: resonance and certainty. High resonance with low certainty is where you claim alignment you haven't earned. The system names 12 structural patterns from these signals.", color: "rgba(252,165,165,0.55)" },
            { n: "02", title: "Prices consequence", desc: "Contradictions are connected to time horizons and costs. The system calculates annual exposure with visible math — inputs, formula, output. No black box. The user can verify the number.", color: `${GOLD}80` },
            { n: "03", title: "Forces action", desc: "The output is a named decision, a sequenced priority stack, and a first move with a deadline. Patterns that persist across stages escalate. The system remembers what you have not resolved.", color: `${AMBER}80` },
          ].map((p) => (
            <div key={p.n} style={{ border: `1px solid ${p.color}25`, backgroundColor: `${p.color}06`, padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "9px", color: `${p.color}` }}>{p.n}</span>
              <h3 className="mt-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: p.color }}>{p.title}</h3>
              <p className="mt-2" style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.55, color: "rgba(255,255,255,0.38)" }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Secondary mechanism detail (collapsed, not primary) */}
        <div className="mt-6 grid gap-2 md:grid-cols-5">
          {[
            { label: "Dual-axis scoring", detail: "Resonance + certainty per statement" },
            { label: "12 pattern taxonomy", detail: "Named structural conditions" },
            { label: "Cross-stage memory", detail: "Patterns that persist escalate" },
            { label: "Evidence graph", detail: "Typed nodes across the journey" },
            { label: "Consequence modelling", detail: "Time-bound financial exposure" },
          ].map((m) => (
            <div key={m.label} style={{ border: "1px solid rgba(255,255,255,0.04)", padding: "0.65rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{m.label}</span>
              <p style={{ ...serif, fontSize: "0.75rem", color: "rgba(255,255,255,0.28)", marginTop: "0.15rem" }}>{m.detail}</p>
            </div>
          ))}
        </div>

        <Rule />

        {/* ── 5. WHAT THE SYSTEM PRODUCES ── */}
        <div className="max-w-3xl">
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.5rem" }}>What the system produces</p>
          <div className="space-y-1">
            {[
              "A named condition — not generic severity",
              "A contradiction you cannot dismiss",
              "A priced consequence with visible math",
              "The decision you have been avoiding — quoted back",
              "A first move with a deadline and a cost if skipped",
            ].map((line) => (
              <p key={line} style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.45)" }}>{line}</p>
            ))}
          </div>
        </div>

        <Rule />

        {/* ── EVIDENCE ── */}
        <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.5rem" }}>Does it work?</p>
          <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>
            Observed outcomes, accuracy metrics, and anonymised case evidence are published. Every diagnostic output includes a determinism proof and full decision trace — the user can verify exactly how the system reached its conclusion.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/evidence" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}AA` }}>See applied evidence</Link>
            <Link href="/diagnostics/fast" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Run the diagnostic to see the proof</Link>
          </div>
        </div>

        <Rule />

        {/* ── CTA ── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/diagnostics/fast" className="group inline-flex items-center gap-2 transition-all duration-200"
              style={{ padding: "10px 20px", border: `1px solid ${AMBER}42`, color: AMBER, ...mono, fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Run the diagnostic <ArrowRight style={{ width: 11, height: 11 }} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/diagnostics/purpose-alignment" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
              Personal assessment &middot; Free
            </Link>
          </div>

          {/* Trust routing */}
          <div className="flex flex-wrap gap-3">
            <Link href="/verification" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Verify the founder</Link>
            <Link href="/trust" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Trust boundaries</Link>
            <Link href="/foundations" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Foundations</Link>
            <Link href="/about/founder" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Founder</Link>
          </div>
        </div>
      </div>
    </main>
  </Layout>
);

export default MethodPage;
