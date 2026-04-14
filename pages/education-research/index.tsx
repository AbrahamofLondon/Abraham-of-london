// pages/education-research.tsx
// Design: Institutional Monumentalism
// Palette: #060609 base · #C9A96E softGold · sharp panels

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowRight,
  Library,
  Search,
  GraduationCap,
  ScrollText,
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
// MODE CARD
// ─────────────────────────────────────────────────────────────────────────────

function ModeCard({
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
          el.style.borderColor = `${GOLD}20`;
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
        {/* Top thread */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500"
          style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)` }}
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

const EducationResearchPage: NextPage = () => {
  return (
    <Layout
      title="Education & Research | Abraham of London"
      description="Research-led education, structured learning, and disciplined intellectual formation for serious operators."
      canonicalUrl="/education-research"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:title" content="Education & Research | Abraham of London" />
        <meta property="og:description" content="Formation with structure. Research with purpose. A disciplined environment for inquiry and intellectual development." />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{
              right: "-5%", top: "-10%",
              width: "600px", height: "600px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}10 0%, ${GOLD}04 30%, transparent 65%)`,
              filter: "blur(130px)",
            }} />
            <div className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }} />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }} />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-52" />

            <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
              <motion.div variants={fadeUp}>
                <Eyebrow>Formation · Research · Knowledge</Eyebrow>
              </motion.div>

              <motion.h1 variants={fadeUp} style={{
                marginTop: "1.5rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(2.8rem, 7vw, 7.5rem)",
                lineHeight: 0.90,
                letterSpacing: "-0.048em",
                color: "rgba(255,255,255,0.94)",
              }}>
                Formation with structure.
                <br />
                <span style={{ color: "rgba(255,255,255,0.30)" }}>Research with purpose.</span>
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
                A disciplined environment for inquiry, knowledge transfer, and the
                development of durable intellectual frameworks that stand up to scrutiny.
              </motion.p>

              {/* Attribute strip */}
              <motion.div variants={fadeUp} style={{ marginTop: "2rem" }}>
                <div className="flex flex-wrap items-center gap-5">
                  {[
                    { icon: ScrollText, label: "Primary research" },
                    { icon: GraduationCap, label: "Structured learning" },
                    { icon: Library, label: "Reusable knowledge" },
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
            </motion.div>

            <div style={{ paddingBottom: "5rem" }} />
          </div>
        </section>

        {/* ── THREE WORKING MODES ───────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mb-12"
            >
              <Eyebrow>Areas of focus</Eyebrow>
              <h2 style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}>
                Three working modes.
                <span style={{ color: "rgba(255,255,255,0.30)" }}> Each governed by the same standard.</span>
              </h2>
            </motion.div>

            <motion.div
              variants={stagger(0.10)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              <ModeCard
                icon={Search}
                title="Research frameworks"
                text="Structured models for analysis, evidence review, and strategic interpretation — built for decisions under uncertainty."
                n="01"
              />
              <ModeCard
                icon={GraduationCap}
                title="Learning programs"
                text="Teaching environments designed for substance rather than noise, including seminars, tutorials, and deep-dive learning."
                n="02"
              />
              <ModeCard
                icon={Library}
                title="Knowledge architecture"
                text="Systems for organising doctrine, insight, and applied reasoning into reusable institutional memory that compounds over time."
                n="03"
              />
            </motion.div>
          </div>
        </section>

        {/* ── OPERATING POSTURE ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
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
                  Inquiry that produces something
                  <span style={{ color: "rgba(255,255,255,0.32)" }}> useful and durable.</span>
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
                  Research without application is incomplete. Formation without
                  rigour is theatre. The aim here is intellectual work that produces
                  frameworks, insights, and knowledge structures that compound in value.
                </p>
                <p>
                  This work is suited to institutions, leadership teams, and serious
                  individuals who want structured engagement with difficult questions —
                  not the appearance of education.
                </p>
              </motion.div>
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
                  Research or learning mandate
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
                  For institutional partnerships, research collaborations, or
                  tailored learning programmes. Initial conversations are handled
                  with clear boundaries and no obligation.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact"
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
                    Discuss mandate <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </Link>
                  <Link href="/canon"
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
                    Enter the canon
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

export default EducationResearchPage;