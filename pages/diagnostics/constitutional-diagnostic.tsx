// pages/diagnostics/constitutional-diagnostic.tsx
// Design: Institutional Monumentalism
// The constitutional diagnostic is the first gate of the product ladder.
// It receives operators before the team, enterprise, or executive layers.
// The page must establish the gravity of what it is — not wrap a component
// in a 50-line file with a breadcrumb and a "Next Layer" footnote.

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Shield,
} from "lucide-react";

import Layout from "@/components/Layout";
import ConstitutionalDiagnosticSuite from "@/components/assessments/ConstitutionalDiagnosticSuite";

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
    } />
  );
}

export default function ConstitutionalDiagnosticPage() {
  return (
    <Layout
      title="Constitutional Diagnostic | Abraham of London"
      description="The first gate of the diagnostic ladder. Route, posture, authority, and escalation fitness — assessed through a dual-axis constitutional instrument."
      canonicalUrl="/diagnostics/constitutional-diagnostic"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{
              left: "-5%", top: "-15%",
              width: "600px", height: "600px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}09 0%, transparent 65%)`,
              filter: "blur(140px)",
            }} />
            <div className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }} />
            <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
          </div>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}20, transparent)` }} />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-32 md:pt-40 pb-14">

              {/* Breadcrumb */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.55 }}
                className="flex items-center gap-2 mb-10"
              >
                <Link href="/diagnostics" className="transition-opacity hover:opacity-70 flex items-center gap-1.5"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}
                >
                  <ArrowLeft style={{ width: "10px", height: "10px" }} /> Diagnostics
                </Link>
                <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Constitutional Diagnostic
                </span>
              </motion.div>

              <div className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">

                {/* Left */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.80 }}
                >
                  <Eyebrow>Layer 01 · Entry gate</Eyebrow>
                  <h1 style={{
                    marginTop: "1.5rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(2.5rem, 6.5vw, 6rem)",
                    lineHeight: 0.90,
                    letterSpacing: "-0.045em",
                    color: "rgba(255,255,255,0.94)",
                  }}>
                    Before strategy,
                    <br />
                    <span style={{ color: "rgba(255,255,255,0.28)" }}>the constitution.</span>
                  </h1>
                  <p style={{
                    marginTop: "1.5rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1rem, 1.4vw, 1.18rem)",
                    lineHeight: 1.72,
                    color: "rgba(255,255,255,0.42)",
                    maxWidth: "50ch",
                  }}>
                    Ten questions. Two axes. One constitutional route. The
                    instrument reads posture, authority, readiness, and
                    failure mode density — then routes the signal forward.
                    No login. No output inflation. No generic recommendations.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-8">
                    <Link href="#instrument"
                      className="group inline-flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        padding: "13px 26px",
                        border: `1px solid ${GOLD}42`,
                        backgroundColor: `${GOLD}0E`,
                        color: GOLD,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
                    >
                      Begin diagnostic
                      <ArrowRight style={{ width: "12px", height: "12px" }} />
                    </Link>
                    <Link href="/diagnostics"
                      className="inline-flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        padding: "13px 26px",
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "rgba(255,255,255,0.38)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.65)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.38)"; }}
                    >
                      View full ladder
                    </Link>
                  </div>
                </motion.div>

                {/* Right — instrument spec + ladder position */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.80, delay: 0.14 }}
                  className="space-y-4"
                >
                  {/* Instrument specification */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.14)", backgroundColor: LIFT }}>
                    <div style={{ padding: "0.95rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: "rgba(255,255,255,0.44)" }}>
                        Instrument specification
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                      {[
                        { label: "Questions",      value: "10 dual-axis statements" },
                        { label: "Scoring",        value: "Resonance × certainty weight" },
                        { label: "Domains",        value: "9 constitutional domains" },
                        { label: "Engine",         value: "V2.2 sovereign routing kernel" },
                        { label: "Routes",         value: "STRATEGY · DIAGNOSTIC · REJECT" },
                        { label: "Output",         value: "Route, posture, readiness, rationale" },
                        { label: "Duration",       value: "4–7 minutes" },
                        { label: "Login required", value: "No" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4 px-4 py-3.5">
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.44)" }}>
                            {label}
                          </span>
                          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.58, color: "rgba(255,255,255,0.82)", textAlign: "right", maxWidth: "56%" }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ladder position */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.85rem" }}>
                      Position in ladder
                    </div>
                    {[
                      { label: "01 Constitutional",  active: true,  done: false },
                      { label: "02 Team Assessment", active: false, done: false },
                      { label: "03 Enterprise",      active: false, done: false },
                      { label: "04 Executive Report",active: false, done: false },
                    ].map(item => (
                      <div key={item.label} style={{
                        padding: "0.45rem 0.75rem", marginBottom: "0.30rem",
                        border: `1px solid ${item.active ? `${GOLD}22` : "transparent"}`,
                        backgroundColor: item.active ? `${GOLD}08` : "transparent",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase",
                        color: item.active ? `${GOLD}CC` : "rgba(255,255,255,0.18)",
                      }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </section>

        {/* ── INSTRUMENT ────────────────────────────────────────────────── */}
        <section id="instrument" className="scroll-mt-0" style={{ backgroundColor: BASE }}>
          <ConstitutionalDiagnosticSuite />
        </section>

        {/* ── CLOSE ─────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-6" style={{ background: `linear-gradient(to right, ${GOLD}30, transparent)` }} />
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
                  Layer 01 of 04
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/diagnostics" className="transition-opacity hover:opacity-70"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                  Diagnostic ladder
                </Link>
                <Link href="/diagnostics/team-assessment"
                  className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  Team Assessment <ChevronRight style={{ width: "10px", height: "10px" }} />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
