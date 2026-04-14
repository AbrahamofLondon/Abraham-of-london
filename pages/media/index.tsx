// pages/media.tsx
// Design: Institutional Monumentalism
// Differentiated from Education & Research through:
// — darker hero atmosphere (left-side radial vs right-side)
// — "Dispatch" framing for format cards instead of numbered working modes
// — format cards presented as a horizontal row with vertical dividers (editorial newspaper feel)
// — CTA routes to contact for media requests specifically

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  ArrowRight,
  Radio,
  Mic2,
  FileText,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";

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
// FORMAT CARD — editorial/newspaper layout feel
// Uses a vertical divider pattern between cards rather than a grid gap
// ─────────────────────────────────────────────────────────────────────────────

function FormatCard({
  icon: Icon,
  label,
  title,
  text,
  isLast = false,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  title: string;
  text: string;
  isLast?: boolean;
}) {
  return (
    <motion.div variants={fadeUp} className="flex">
      <div className="flex-1 py-8 pr-8">
        <div className="flex items-center gap-2.5 mb-6">
          <Icon style={{ width: "14px", height: "14px", color: `${GOLD}90` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px",
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: `${GOLD}80`,
          }}>
            {label}
          </span>
        </div>

        <h3 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "clamp(1.35rem, 1.8vw, 1.60rem)",
          lineHeight: 1.06,
          letterSpacing: "-0.022em",
          color: "rgba(255,255,255,0.88)",
          marginBottom: "0.85rem",
        }}>
          {title}
        </h3>

        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.95rem",
          lineHeight: 1.70,
          color: "rgba(255,255,255,0.40)",
          maxWidth: "28ch",
        }}>
          {text}
        </p>
      </div>

      {/* Vertical divider — not shown on last card */}
      {!isLast && (
        <div className="w-px self-stretch"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)" }}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const MediaPage: NextPage = () => {
  return (
    <Layout
      title="Media | Abraham of London"
      description="Commentary, interviews, and public-facing media engagements shaped for clarity, discipline, and substance."
      canonicalUrl="/media"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:title" content="Media | Abraham of London" />
        <meta property="og:description" content="Public communication with discipline. Commentary, interviews, and analysis shaped for clarity under scrutiny." />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            {/* Left-side atmosphere — differentiates from Education (right-side) */}
            <div className="absolute" style={{
              left: "-8%", top: "0%",
              width: "650px", height: "550px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}09 0%, ${GOLD}03 30%, transparent 65%)`,
              filter: "blur(140px)",
            }} />
            <div className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }} />
            {/* Horizontal accent lines — gives a broadcast/transmission feeling */}
            <div className="absolute inset-x-0 opacity-[0.015]" style={{ top: "35%", height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)" }} />
            <div className="absolute inset-x-0 opacity-[0.010]" style={{ top: "65%", height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)" }} />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }} />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-52" />

            <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
              <motion.div variants={fadeUp}>
                <Eyebrow>Media · Commentary · Public engagement</Eyebrow>
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
                Public communication,
                <br />
                <span style={{ color: "rgba(255,255,255,0.30)" }}>disciplined message.</span>
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
                Commentary, interviews, essays, and cultural analysis shaped for
                public communication without sacrificing clarity, seriousness,
                or intellectual discipline.
              </motion.p>

              {/* Attribute strip */}
              <motion.div variants={fadeUp} style={{ marginTop: "2rem" }}>
                <div className="flex flex-wrap items-center gap-5">
                  {[
                    { icon: MessageSquare, label: "Public commentary" },
                    { icon: Radio,         label: "Broadcast ready" },
                    { icon: FileText,      label: "Editorial work" },
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

        {/* ── ENGAGEMENT FORMATS — editorial row layout ─────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mb-10"
            >
              <Eyebrow>Engagement formats</Eyebrow>
              <h2 style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}>
                How the work appears in public.
              </h2>
            </motion.div>

            {/* Top border */}
            <div className="mb-0"><GoldRule /></div>

            {/* Format cards — editorial row with vertical dividers */}
            <motion.div
              variants={stagger(0.10)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid md:grid-cols-3"
            >
              <FormatCard
                icon={Radio}
                label="Broadcast"
                title="Interviews & commentary"
                text="Broadcast-ready perspectives for public discussion and strategic commentary shaped for clarity under pressure."
              />
              <FormatCard
                icon={Mic2}
                label="Speaking"
                title="Speaking requests"
                text="Panels, podcasts, roundtables, and public forums requiring structure, composure, and a disciplined message."
              />
              <FormatCard
                icon={FileText}
                label="Editorial"
                title="Editorial contributions"
                text="Articles, commentary pieces, and public-facing writing built to hold their shape under scrutiny."
                isLast
              />
            </motion.div>

            {/* Bottom border */}
            <div className="mt-0"><GoldRule /></div>
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
                <Eyebrow>Public standard</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.7rem, 2.8vw, 2.5rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.022em",
                  color: "rgba(255,255,255,0.88)",
                }}>
                  The same discipline
                  <span style={{ color: "rgba(255,255,255,0.32)" }}> in every format.</span>
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
                  Public engagement is not a separate register from the rest of the
                  work — it is the same standard of thought applied to a different
                  surface. Commentary should survive the same scrutiny as private advice.
                </p>
                <p>
                  Media engagements are handled selectively. The format varies;
                  the intellectual standard does not.
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
                  Media engagement
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
                  For interview requests, speaking engagements, or editorial
                  contributions. All media enquiries are reviewed and responded
                  to with a clear position.
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
                    Request conversation <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </Link>
                  <Link href="/editorials"
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
                    Read editorials
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

export default MediaPage;