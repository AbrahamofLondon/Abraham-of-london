// pages/diagnostics/constitutional-diagnostic.tsx
// Design: Institutional Monumentalism
// The constitutional diagnostic is the first gate of the product ladder.
// It receives operators before the team, enterprise, or executive layers.
// The page must establish the gravity of what it is — not wrap a component
// in a 50-line file with a breadcrumb and a "Next Layer" footnote.

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Shield,
} from "lucide-react";

import Layout from "@/components/Layout";
import ConstitutionalDiagnosticSuite from "@/components/assessments/ConstitutionalDiagnosticSuite";
import AssessmentResultSurface from "@/components/diagnostics/AssessmentResultSurface";
import { mapConstitutionalToAssessmentResult, type ConstitutionalBundle } from "@/lib/diagnostics/assessment-result-mappers";
import type { AssessmentResult } from "@/lib/diagnostics/assessment-result-contract";
import { getOrCreateSubjectId } from "@/lib/diagnostics/subject-id";
import { trackFunnelEntry, trackStageStart, trackDropoff } from "@/lib/analytics/funnel";
import { track } from "@/lib/analytics/track";
import { trackDiagnosticStart } from "@/lib/analytics/journey-client";
import { loadSpineFromSession } from "@/lib/decision/spine-persistence";
import { advanceSpine, type IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { saveSpineToSession, persistSpineToDB } from "@/lib/decision/spine-persistence";
import { getInheritedContext } from "@/lib/decision/spine-guard";

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

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function ConstitutionalDiagnosticPage() {
  const router = useRouter();
  const [spine, setSpine] = React.useState<IntelligenceSpine | null>(null);
  const [inheritedContext, setInheritedContext] = React.useState<ReturnType<typeof getInheritedContext> | null>(null);
  const [assessmentResult, setAssessmentResult] = React.useState<AssessmentResult | null>(null);

  React.useEffect(() => {
    getOrCreateSubjectId();
    trackFunnelEntry("/diagnostics/constitutional-diagnostic");
    trackStageStart("constitutional");
    trackDiagnosticStart("constitutional");

    // Load spine for inherited context (non-blocking — page works without spine)
    const loaded = loadSpineFromSession();
    if (loaded) {
      setSpine(loaded);
      setInheritedContext(getInheritedContext(loaded));
    }

    const handleUnload = () => trackDropoff("constitutional");
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const executiveBlocked = router.isReady && router.query.executive === "blocked";

  React.useEffect(() => {
    if (!router.isReady) return;
    const queryOrigin = router.query.origin === "purpose_alignment";
    let storedOrigin = false;
    try {
      storedOrigin = window.sessionStorage.getItem("aol_diagnostics_origin") === "purpose_alignment";
    } catch {
      storedOrigin = false;
    }
    if (!queryOrigin && !storedOrigin) return;
    track("purpose_alignment_to_constitutional_started", {
      origin: "purpose_alignment",
      source: queryOrigin ? "query" : "session",
    });
  }, [router.isReady, router.query.origin]);

  // ── EXECUTIVE BLOCKED STATE ──
  // When a user without access tries to visit Executive Reporting, they are
  // redirected here with ?executive=blocked. Show a premium upsell instead of
  // the normal assessment flow.
  if (executiveBlocked) {
    return (
      <Layout
        title="Executive Reporting | Abraham of London"
        description="Executive Reporting requires completed diagnostic evidence or direct sponsorship."
        canonicalUrl="/diagnostics/constitutional-diagnostic"
        fullWidth
        headerTransparent
      >
        <Head><meta name="robots" content="noindex,nofollow" /></Head>
        <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
          <div className="mx-auto max-w-3xl px-6 py-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Executive Reporting · Premium
              </span>
            </div>

            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.92)", maxWidth: "18ch" }}>
              Executive Reporting requires completed diagnostic evidence.
            </h1>

            <p style={{ marginTop: "1.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72, color: "rgba(255,255,255,0.48)", maxWidth: "48ch" }}>
              The system does not generate executive briefs from weak or incomplete evidence. To access Executive Reporting, complete the diagnostic ladder or enter through a sponsored or monitoring path.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}06`, padding: "1.25rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.5rem" }}>
                  Complete the ladder
                </div>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
                  Complete the Constitutional Diagnostic, Team Assessment, and Enterprise Assessment to build sufficient evidence for an executive brief.
                </p>
                <Link href="/diagnostics" style={{ display: "inline-block", marginTop: "0.85rem", padding: "10px 20px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                  View diagnostics ladder
                </Link>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
                  Sponsored or monitoring access
                </div>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
                  If you have a sponsorship token, monitoring account ID, or direct access link, use the original link you were given.
                </p>
                <Link href="/diagnostics/executive-reporting" style={{ display: "inline-block", marginTop: "0.85rem", padding: "10px 20px", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                  Try again
                </Link>
              </div>
            </div>

            <div className="mt-10" style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                Executive Reporting is the flagship product. It prices consequence, orders priorities, and produces a governed brief. The system will not generate one from weak or incomplete evidence — that protects the integrity of every report issued.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
                    Ten questions. Two axes. One constitutional route. Tests
                    whether the decision problem is structural — reads posture,
                    authority, readiness, and failure mode density, then routes
                    the assessment forward. No login. No inflation. Governed output.
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
                      Test the structure
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
                  <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: LIFT }}>
                    <div style={{ padding: "0.85rem 1.25rem", borderBottom: `1px solid ${GOLD}12`, background: `linear-gradient(to right, ${GOLD}08, transparent)` }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}90` }}>
                        Instrument specification
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      {[
                        { label: "Questions",      value: "10 dual-axis statements" },
                        { label: "Scoring",        value: "Resonance × certainty weight" },
                        { label: "Domains",        value: "9 constitutional domains" },
                        { label: "Engine",         value: "Constitutional routing system" },
                        { label: "Routes",         value: "STRATEGY · DIAGNOSTIC · REJECT" },
                        { label: "Output",         value: "Route, posture, readiness, rationale" },
                        { label: "Duration",       value: "4–7 minutes" },
                        { label: "Login required", value: "No" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
                            {label}
                          </span>
                          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.58)", textAlign: "right", maxWidth: "55%" }}>
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
                  {/* Route explanation */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.85rem" }}>
                      What the routes mean
                    </div>
                    {[
                      { route: "STRATEGY", desc: "Evidence supports escalation. The decision has structural consequence that warrants governed intervention." },
                      { route: "DIAGNOSTIC", desc: "Evidence is developing. Additional diagnostic layers will strengthen the reading before escalation." },
                      { route: "REJECT", desc: "Current evidence does not support escalation. This is governed preparation, not dismissal. Other assessment pathways remain open. Strengthen the evidence and return." },
                    ].map(item => (
                      <div key={item.route} style={{ marginBottom: "0.65rem" }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase",
                          color: item.route === "REJECT" ? "rgba(248,113,113,0.55)" : item.route === "STRATEGY" ? "rgba(110,231,183,0.55)" : "rgba(251,191,36,0.55)",
                        }}>
                          {item.route}
                        </span>
                        <p style={{
                          marginTop: "0.2rem",
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.5,
                          color: "rgba(255,255,255,0.35)",
                        }}>
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </section>

        {/* ── INHERITED CONTEXT (from spine) ─────────────────────────────── */}
        {inheritedContext && (
          <section className="relative" style={{ backgroundColor: BASE }}>
            <div className="mx-auto max-w-2xl px-6 py-8">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: `${GOLD}BB` }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px", letterSpacing: "0.30em", textTransform: "uppercase", color: `${GOLD}88`,
                  }}>
                    Intelligence inherited from prior stage
                  </span>
                </div>
                <p style={{
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                  fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)",
                  maxWidth: "48ch",
                }}>
                  {inheritedContext.headline}
                </p>
                {inheritedContext.contradiction && (
                  <p style={{
                    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                    fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)",
                    marginTop: "0.5rem",
                  }}>
                    Contradiction detected: {inheritedContext.contradiction.slice(0, 120)}...
                  </p>
                )}
                <p style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px", color: "rgba(255,255,255,0.20)", marginTop: "0.75rem",
                }}>
                  This stage tests the structural conditions sustaining that state. {inheritedContext.stagesCompleted.length} stage{inheritedContext.stagesCompleted.length === 1 ? "" : "s"} completed.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── INSTRUMENT CONTEXT ───────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-12 pb-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.75rem 1.25rem", backgroundColor: `${GOLD}04` }}>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.4rem" }}>
                  What this reads
                </p>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                  Your stated authority, posture across nine constitutional domains, readiness tier, mandate fit, and failure mode density.
                </p>
              </div>
              <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.75rem 1.25rem", backgroundColor: `${GOLD}04` }}>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.4rem" }}>
                  What this detects
                </p>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                  Authority finding, accountability gap, admissibility to escalation, and required constitutional repair before the next layer can proceed.
                </p>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 1.25rem", backgroundColor: "rgba(255,255,255,0.015)" }}>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.4rem" }}>
                  Record boundary
                </p>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.40)" }}>
                  This creates a session result until saved. Saving creates an account-bound governed case in Decision Centre.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── INSTRUMENT ────────────────────────────────────────────────── */}
        <section id="instrument" className="scroll-mt-0" style={{ backgroundColor: BASE }}>
          <ConstitutionalDiagnosticSuite
            onComplete={(bundle) =>
              setAssessmentResult(mapConstitutionalToAssessmentResult(bundle as ConstitutionalBundle))
            }
          />
        </section>

        {/* ── SHARED RESULT SURFACE (appears after instrument completes) ─── */}
        {assessmentResult && (
          <section style={{ backgroundColor: BASE }}>
            <div className="mx-auto max-w-2xl px-6 lg:px-12 pb-16">
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "2rem" }}>
                <AssessmentResultSurface result={assessmentResult} />
              </div>
            </div>
          </section>
        )}

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
                <Link
                  href={assessmentResult?.earnedRoute.href ?? "/diagnostics/team-assessment"}
                  className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  {assessmentResult?.earnedRoute.label ?? "Team Assessment"} <ChevronRight style={{ width: "10px", height: "10px" }} />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
