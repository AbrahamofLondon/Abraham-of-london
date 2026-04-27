// pages/institutional.tsx
// Design: Institutional Monumentalism
// The strongest of the three engagement lane pages — keeps its structural
// depth (hero grid, capabilities, operating posture, CTA) while aligning
// every visual detail to the platform design system.

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Landmark,
  ArrowRight,
  Building2,
  Shield,
  Network,
  Scale,
  Gavel,
  Eye,
  Briefcase,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = (d = 0.10) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/28 to-transparent"
    } />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8.5px",
        letterSpacing: "0.40em",
        textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY CARD
// ─────────────────────────────────────────────────────────────────────────────

function CapabilityCard({
  icon: Icon,
  title,
  text,
  n,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  title: string;
  text: string;
  n: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <div
        className="relative overflow-hidden h-full transition-all duration-400"
        style={{
          backgroundColor: "rgb(5 5 7)",
          border: "1px solid rgba(255,255,255,0.062)",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = `${GOLD}22`;
          el.style.transform = "translateY(-2px)";
          el.style.boxShadow = "0 24px 60px -20px rgba(0,0,0,0.65)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "rgba(255,255,255,0.062)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500"
          style={{ background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
        />
        {/* Corner accent */}
        <div className="absolute right-0 top-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ width: "24px", height: "24px", borderRight: `1px solid ${GOLD}25`, borderTop: `1px solid ${GOLD}25` }}
        />

        <div className="p-8 md:p-9">
          <div className="flex items-start justify-between mb-7">
            <Icon style={{ width: "20px", height: "20px", color: `${GOLD}AA` }} />
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "2.2rem",
              lineHeight: 1,
              color: "rgba(255,255,255,0.06)",
            }}>
              {n}
            </span>
          </div>

          <h3 style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(1.35rem, 1.8vw, 1.60rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.022em",
            color: "rgba(255,255,255,0.88)",
          }}>
            {title}
          </h3>

          <p style={{
            marginTop: "0.85rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.95rem",
            lineHeight: 1.68,
            color: "rgba(255,255,255,0.40)",
            maxWidth: "30ch",
          }}>
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const InstitutionalPage: NextPage = () => {
  return (
    <Layout
      title="Institutional | Abraham of London"
      description="Governance, policy, and institutional architecture for serious organisations that need systems built to outlast personalities."
      canonicalUrl="/institutional"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:title" content="Institutional | Abraham of London" />
        <meta property="og:description" content="Governance with spine. Policy with structure. Advisory for organisations that need systems, standards, and decision architecture." />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{
              left: "8%", top: "6%",
              width: "500px", height: "500px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}09 0%, ${GOLD}03 30%, transparent 65%)`,
              filter: "blur(140px)",
            }} />
            <div className="absolute" style={{
              right: "10%", top: "22%",
              width: "380px", height: "380px",
              borderRadius: "50%",
              background: "radial-gradient(circle at center, rgba(255,255,255,0.025) 0%, transparent 65%)",
              filter: "blur(110px)",
            }} />
            <div className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }} />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }} />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-52" />

            <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">

              {/* Left */}
              <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <Eyebrow>Governance · Policy · Architecture</Eyebrow>
                </motion.div>

                <motion.h1 variants={fadeUp} style={{
                  marginTop: "1.5rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2.8rem, 6.5vw, 7rem)",
                  lineHeight: 0.90,
                  letterSpacing: "-0.048em",
                  color: "rgba(255,255,255,0.94)",
                }}>
                  Governance with spine.
                  <br />
                  <span style={{ color: "rgba(255,255,255,0.30)" }}>Policy with structure.</span>
                </motion.h1>

                <motion.p variants={fadeUp} style={{
                  marginTop: "1.75rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.42)",
                  maxWidth: "46ch",
                }}>
                  Advisory for organisations, public institutions, and serious
                  leadership teams that need systems, standards, and decision
                  architecture built to last.
                </motion.p>

                <motion.div variants={fadeUp} style={{ marginTop: "2rem" }}>
                  <div className="flex flex-wrap items-center gap-5">
                    {[
                      { icon: Scale,  label: "Decision rights" },
                      { icon: Gavel, label: "Accountability" },
                      { icon: Shield, label: "Control systems" },
                    ].map((item, i, arr) => (
                      <React.Fragment key={item.label}>
                        <div className="flex items-center gap-2">
                          <item.icon style={{ width: "11px", height: "11px", color: `${GOLD}80` }} />
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7.5px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.28)",
                          }}>
                            {item.label}
                          </span>
                        </div>
                        {i < arr.length - 1 && <div className="h-3 w-px bg-white/[0.08]" />}
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} style={{ marginTop: "2rem" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-px w-12" style={{ background: `linear-gradient(to right, ${GOLD}35, transparent)` }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.32em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}>
                      Built for institutional durability
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right — capability grid */}
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.80, delay: 0.16 }}
              >
                <div style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: LIFT,
                  padding: "1.5rem",
                }}>
                  {/* 2×2 icon grid */}
                  <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                    {[
                      { icon: Landmark, label: "Governance" },
                      { icon: Scale,    label: "Policy" },
                      { icon: Network,  label: "Systems" },
                      { icon: Gavel,    label: "Control" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="py-6 text-center" style={{ backgroundColor: "rgb(5 5 7)" }}>
                        <Icon style={{ width: "18px", height: "18px", color: `${GOLD}AA`, margin: "0 auto" }} />
                        <p style={{
                          marginTop: "0.75rem",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.26em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.38)",
                        }}>
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Mission statement */}
                  <div style={{
                    marginTop: "1rem",
                    padding: "1.25rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                    backgroundColor: "rgba(255,255,255,0.01)",
                  }}>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.05rem",
                      color: "rgba(255,255,255,0.72)",
                    }}>
                      Institutional mandate
                    </p>
                    <p style={{
                      marginTop: "0.5rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.92rem",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.40)",
                    }}>
                      Systems designed to survive leadership transition, strain,
                      and external pressure.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div style={{ paddingBottom: "5rem" }} />
          </div>
        </section>

        {/* ── CAPABILITIES ──────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <div className="mb-12 grid gap-8 md:grid-cols-2 md:items-end">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Eyebrow>Core capabilities</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}>
                  Systems that outlast personalities.
                </h2>
              </motion.div>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: 0.10 }}
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.02rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.38)",
                  maxWidth: "38ch",
                }}
              >
                Built for durability, not convenience. Designed to remain coherent
                through leadership transitions, institutional strain, and external pressure.
              </motion.p>
            </div>

            <motion.div
              variants={stagger(0.10)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <CapabilityCard
                icon={Building2}
                title="Institution design"
                text="Structures, mandates, and operating principles designed to outlast personalities and preserve institutional continuity."
                n="01"
              />
              <CapabilityCard
                icon={Shield}
                title="Governance advisory"
                text="Decision rights, accountability, controls, and legitimacy under scrutiny. Systems that hold under pressure."
                n="02"
              />
              <CapabilityCard
                icon={Network}
                title="System architecture"
                text="Operating models that connect policy, leadership rhythm, and execution from boardroom to front line."
                n="03"
              />
            </motion.div>
          </div>
        </section>

        {/* ── SECTION DIVIDER ───────────────────────────────────────────── */}
        <div style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <GoldRule soft />
          </div>
        </div>

        {/* ── OPERATING POSTURE ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Eyebrow>Operating posture</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.7rem, 2.8vw, 2.5rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.022em",
                  color: "rgba(255,255,255,0.88)",
                }}>
                  Advisory for institutions
                  <span style={{ color: "rgba(255,255,255,0.32)" }}> that cannot afford drift.</span>
                </h2>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: 0.12 }}
                className="space-y-5"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  lineHeight: 1.80,
                  color: "rgba(255,255,255,0.48)",
                }}
              >
                <p>
                  This work is suited to boards, executive teams, regulated entities,
                  and public institutions where legitimacy, operating discipline, and
                  continuity matter.
                </p>
                <p>
                  The aim is not decorative strategy. The aim is to produce decision
                  architecture, governance clarity, and system coherence that survives
                  scrutiny.
                </p>
              </motion.div>
            </div>

            {/* Audience cards */}
            <motion.div
              variants={stagger(0.09)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid gap-4 md:grid-cols-3 mt-12"
            >
              {[
                { icon: Briefcase, title: "Boards", text: "Governance rhythm, clarity of role, and defensible decision process." },
                { icon: Eye,       title: "Executive teams", text: "Operational alignment between policy intent and execution reality." },
                { icon: Landmark,  title: "Public institutions", text: "Structures with enough discipline to hold under political and external pressure." },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.title} variants={fadeUp}>
                    <div style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.015)",
                      padding: "1.75rem 2rem",
                    }}>
                      <Icon style={{ width: "18px", height: "18px", color: `${GOLD}80`, marginBottom: "1.25rem" }} />
                      <h3 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.2rem",
                        color: "rgba(255,255,255,0.82)",
                        marginBottom: "0.65rem",
                      }}>
                        {item.title}
                      </h3>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.92rem",
                        lineHeight: 1.65,
                        color: "rgba(255,255,255,0.38)",
                      }}>
                        {item.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ── PROOF / DELIVERY / BOUNDARY ────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
            <div className="grid gap-4 md:grid-cols-3">
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.85rem" }}>Proof</div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                  Observed in anonymised decision cases across governance pressure, decision exposure, and board accountability environments.
                </p>
                <Link href="/evidence" className="mt-3 inline-flex items-center gap-1.5" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                  See evidence <ArrowRight style={{ width: 9, height: 9 }} />
                </Link>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.85rem" }}>Delivery</div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                  Diagnostic evidence, Executive Reporting, and Strategy Room. Board-grade output derived from structured inputs — not open-ended engagement.
                </p>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.85rem" }}>Boundary</div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                  Evidence method: anonymised and modelled. No client naming. No speculative claims. Verified outcomes where stated.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MANDATE CLOSE ─────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              <div style={{
                border: `1px solid ${GOLD}18`,
                backgroundColor: `${GOLD}06`,
                padding: "2rem 2.5rem",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                  marginBottom: "1rem",
                }}>
                  Institutional mandate
                </div>
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.02rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.42)",
                  fontStyle: "italic",
                  maxWidth: "48ch",
                  marginBottom: "1.5rem",
                }}>
                  For boards, executive teams, and public institutions. Initial
                  conversations are handled discreetly and with clear boundaries.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact?type=institutional"
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "11px 22px",
                      border: `1px solid ${GOLD}35`,
                      backgroundColor: `${GOLD}0D`,
                      color: `${GOLD}BB`,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}55`; el.style.backgroundColor = `${GOLD}14`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}35`; el.style.backgroundColor = `${GOLD}0D`; }}
                  >
                    Discuss an institutional mandate <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </Link>
                  <Link href="/diagnostics/fast"
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "11px 22px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.30)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "rgba(255,255,255,0.55)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "rgba(255,255,255,0.30)"; }}
                  >
                    Run the diagnostic first
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default InstitutionalPage;