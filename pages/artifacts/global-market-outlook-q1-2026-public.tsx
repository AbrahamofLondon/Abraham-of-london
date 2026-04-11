// pages/artifacts/global-market-outlook-q1-2026-public.tsx
// The public entry point to the GMI product family.
// Design: Premium editorial reading surface — FT Weekend meets a private briefing room.
// The reader is a sophisticated operator. Treat them accordingly.
// No noise. No gamification. Just a clean, authoritative reading experience.

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, NextPage } from "next";
import { motion } from "framer-motion";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Globe,
  Lock,
  Scale,
  ShieldCheck,
  TrendingUp,
  Presentation,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PublicBriefProps = {
  title: string;
  subtitle: string;
  description: string;
  date: string;
  classification: string;
  productLine: string;
  docId: string;
  version: string;
  contentHtml: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "#070E18";
const LIFT = "#0B1523";
const VOID = "#040A12";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN RENDERER
// Upgraded: proper blockquote treatment, section dividers, callout blocks
// ─────────────────────────────────────────────────────────────────────────────

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(input: string): string {
  let out = escapeHtml(input);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" style="color:${GOLD};text-decoration:underline;text-underline-offset:3px;">$1</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw  = lines[i] ?? "";
    const line = raw.trim();

    if (!line) { i++; continue; }

    // H1
    if (line.startsWith("# ")) {
      html.push(`<h1 style="margin-top:3rem;margin-bottom:1.25rem;font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:clamp(1.8rem,3vw,2.6rem);line-height:1.0;letter-spacing:-0.025em;color:rgba(255,255,255,0.94);">${inlineMarkdown(line.slice(2))}</h1>`);
      i++; continue;
    }

    // H2
    if (line.startsWith("## ")) {
      html.push(`<h2 style="margin-top:2.5rem;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid rgba(255,255,255,0.07);font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:clamp(1.35rem,2.2vw,1.85rem);line-height:1.05;letter-spacing:-0.018em;color:rgba(255,255,255,0.88);">${inlineMarkdown(line.slice(3))}</h2>`);
      i++; continue;
    }

    // H3
    if (line.startsWith("### ")) {
      html.push(`<h3 style="margin-top:2rem;margin-bottom:0.75rem;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:0.72rem;letter-spacing:0.32em;text-transform:uppercase;color:rgba(201,169,110,0.75);">${inlineMarkdown(line.slice(4))}</h3>`);
      i++; continue;
    }

    // Blockquote — treated as a callout panel
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("> ")) {
        quoteLines.push((lines[i] ?? "").trim().slice(2));
        i++;
      }
      html.push(`<blockquote style="margin:2rem 0;padding:1.25rem 1.5rem;border-left:2px solid ${GOLD}60;background:${GOLD}07;font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:1.05rem;line-height:1.72;color:rgba(255,255,255,0.75);font-style:italic;">${inlineMarkdown(quoteLines.join(" "))}</blockquote>`);
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? "").trim())) {
        items.push((lines[i] ?? "").trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      html.push(`<ul style="margin:1.5rem 0;padding:0;list-style:none;">${
        items.map(item =>
          `<li style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:1rem;line-height:1.65;color:rgba(255,255,255,0.65);"><span style="flex-shrink:0;margin-top:0.55rem;width:5px;height:1px;background:${GOLD}70;display:block;"></span><span>${inlineMarkdown(item)}</span></li>`
        ).join("")
      }</ul>`);
      continue;
    }

    // HR — section divider with gold rule
    if (line === "---") {
      html.push(`<div style="margin:2.5rem 0;height:1px;background:linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent);"></div>`);
      i++; continue;
    }

    // Paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = (lines[i] ?? "").trim();
      if (!next || next.startsWith("# ") || next.startsWith("## ") || next.startsWith("### ")
        || /^[-*]\s+/.test(next) || next === "---" || next.startsWith("> ")) break;
      paragraphLines.push(next);
      i++;
    }
    html.push(`<p style="margin:1.25rem 0;font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:1.05rem;line-height:1.80;color:rgba(255,255,255,0.65);">${inlineMarkdown(paragraphLines.join(" "))}</p>`);
  }

  return html.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<PublicBriefProps> = async () => {
  const filePath = path.join(
    process.cwd(), "content", "artifacts", "global-market-outlook-q1-2026-public.mdx",
  );

  const fallback: PublicBriefProps = {
    title:         "Global Market Outlook Q1 2026",
    subtitle:      "Public Brief",
    description:   "A disciplined public reading of the Q1 2026 market environment.",
    date:          "April 8, 2026",
    classification: "PUBLIC",
    productLine:   "Market Intelligence",
    docId:         "GMI-Q1-2026-PB",
    version:       "1.0.0",
    contentHtml:   `<p style="color:rgba(255,255,255,0.65);font-family:'Cormorant Garamond',Georgia,serif;font-size:1.05rem;line-height:1.80;">The public brief source file could not be loaded.</p>`,
  };

  try {
    if (!fs.existsSync(filePath)) return { props: fallback };
    const raw    = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    return {
      props: {
        title:          safeString(parsed.data.title,          fallback.title),
        subtitle:       safeString(parsed.data.subtitle,       fallback.subtitle),
        description:    safeString(parsed.data.description,    fallback.description),
        date:           safeString(parsed.data.date,           fallback.date),
        classification: safeString(parsed.data.classification, fallback.classification).toUpperCase(),
        productLine:    safeString(parsed.data.productLine,    "Market Intelligence"),
        docId:          safeString(parsed.data.docId,          fallback.docId),
        version:        safeString(parsed.data.version,        fallback.version),
        contentHtml:    markdownToHtml(parsed.content),
      },
      revalidate: 3600,
    };
  } catch {
    return { props: fallback, revalidate: 3600 };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const GlobalMarketOutlookPublicPage: NextPage<PublicBriefProps> = ({
  title, subtitle, description, date, classification, productLine, docId, version, contentHtml,
}) => {
  return (
    <>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
      </Head>

      <Layout headerTransparent fullWidth>
        <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
            {/* Atmosphere */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute" style={{
                left: "-10%", top: "-20%",
                width: "700px", height: "600px",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, ${GOLD}10 0%, ${GOLD}04 30%, transparent 65%)`,
                filter: "blur(120px)",
              }} />
              <div className="absolute inset-x-0 bottom-0 h-32" style={{
                background: `linear-gradient(to top, ${BASE}, transparent)`,
              }} />
              <div className="absolute inset-0 opacity-[0.02]" style={GRAIN} />
            </div>

            {/* Top rule */}
            <div className="absolute inset-x-0 top-0 h-px" style={{
              background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)`,
            }} />

            <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-12">
              <div className="pt-36 md:pt-44" />

              {/* Breadcrumb */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.60 }}
              >
                <Link href="/artifacts"
                  className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.30)",
                  }}
                >
                  <ArrowLeft style={{ width: "11px", height: "11px" }} />
                  Artifacts
                </Link>
              </motion.div>

              {/* Classification + tags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.06 }}
                className="flex flex-wrap items-center gap-2.5"
                style={{ marginTop: "1.75rem" }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5" style={{
                  border: `1px solid ${GOLD}30`,
                  backgroundColor: `${GOLD}0A`,
                }}>
                  <TrendingUp style={{ width: "11px", height: "11px", color: `${GOLD}AA` }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.36em",
                    textTransform: "uppercase",
                    color: `${GOLD}CC`,
                  }}>
                    Public Brief
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5" style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}>
                  <ShieldCheck style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.30)" }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.30em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.40)",
                  }}>
                    {classification}
                  </span>
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}>
                  {productLine}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  marginTop: "1.5rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2.2rem, 5vw, 4.2rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.035em",
                  color: "rgba(255,255,255,0.94)",
                }}
              >
                {title}
              </motion.h1>

              {/* Subtitle */}
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.75, delay: 0.20 }}
                  style={{
                    marginTop: "1rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.1rem, 1.5vw, 1.35rem)",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.45)",
                    fontStyle: "italic",
                  }}
                >
                  {subtitle}
                </motion.p>
              )}

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.75, delay: 0.26 }}
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.42)",
                  maxWidth: "48ch",
                }}
              >
                {description}
              </motion.p>

              {/* Document metadata strip */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.32 }}
                style={{ marginTop: "2rem" }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  {[
                    { label: "Document",       value: docId || "GMI-Q1-2026" },
                    { label: "Published",      value: date },
                    { label: "Version",        value: version || "1.0" },
                    { label: "Classification", value: classification },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ backgroundColor: LIFT, padding: "1rem 1.25rem" }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "6.5px",
                        letterSpacing: "0.36em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.24)",
                        marginBottom: "0.5rem",
                      }}>
                        {label}
                      </div>
                      <div style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1rem",
                        color: "rgba(255,255,255,0.75)",
                      }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Edition navigation */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.38 }}
                className="flex flex-wrap gap-3"
                style={{ marginTop: "1.75rem" }}
              >
                <Link href="/artifacts/global-market-intelligence-report-q1-2026"
                  className="group inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${GOLD}38`,
                    backgroundColor: `${GOLD}0D`,
                    color: GOLD,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}55`; el.style.backgroundColor = `${GOLD}15`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}38`; el.style.backgroundColor = `${GOLD}0D`; }}
                >
                  <Lock style={{ width: "11px", height: "11px" }} />
                  Institutional edition
                </Link>
                <Link href="/artifacts/gmi-q1-2026-deck"
                  className="group inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "10px 20px",
                    border: "1px solid rgba(255,255,255,0.09)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.40)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.65)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.40)"; }}
                >
                  <Presentation style={{ width: "11px", height: "11px" }} />
                  Board deck
                </Link>
                <Link href="/intelligence/global-market-intelligence-q1-2026"
                  className="group inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "10px 20px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    color: "rgba(255,255,255,0.30)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.12)"; el.style.color = "rgba(255,255,255,0.55)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.30)"; }}
                >
                  <Globe style={{ width: "11px", height: "11px" }} />
                  Intelligence surface
                </Link>
              </motion.div>

              <div style={{ paddingBottom: "3.5rem" }} />
            </div>
          </section>

          {/* ── ARTICLE BODY ──────────────────────────────────────────────── */}
          <section style={{ backgroundColor: BASE }}>
            <div className="mx-auto px-6 lg:px-12" style={{ maxWidth: "900px", paddingTop: "4rem", paddingBottom: "5rem" }}>

              {/* Reading column — contained width for premium readability */}
              <div className="grid gap-10 lg:grid-cols-[1fr_260px] lg:items-start">

                {/* Main article */}
                <motion.article
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                    style={{
                      // Base reading styles — all inline markup inherits from here
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontSize: "1.05rem",
                      lineHeight: 1.80,
                      color: "rgba(255,255,255,0.65)",
                    }}
                  />
                </motion.article>

                {/* Sticky sidebar — document metadata and escalation */}
                <motion.aside
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: 0.15 }}
                  className="lg:sticky lg:top-28 space-y-4"
                >
                  {/* Document card */}
                  <div style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: LIFT,
                    padding: "1.25rem",
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                      marginBottom: "1rem",
                    }}>
                      Document record
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "ID",     value: docId || "GMI-Q1-2026-PB" },
                        { label: "Ver",    value: version || "1.0.0" },
                        { label: "Date",   value: date },
                        { label: "Class",  value: classification },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-3">
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "6.5px",
                            letterSpacing: "0.30em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.22)",
                          }}>
                            {label}
                          </span>
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7.5px",
                            letterSpacing: "0.12em",
                            color: "rgba(255,255,255,0.55)",
                            textAlign: "right",
                          }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edition navigator */}
                  <div style={{
                    border: `1px solid ${GOLD}22`,
                    backgroundColor: `${GOLD}07`,
                    padding: "1.25rem",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                      marginBottom: "0.85rem",
                    }}>
                      Full product family
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Institutional edition", icon: Lock, href: "/artifacts/global-market-intelligence-report-q1-2026", gold: true },
                        { label: "Board deck",            icon: Presentation, href: "/artifacts/gmi-q1-2026-deck", gold: false },
                        { label: "Boardroom PDF",         icon: Scale, href: "/artifacts/intel-2026-q1-pdf", gold: false },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href}
                            className="group flex items-center justify-between gap-2 transition-opacity hover:opacity-80"
                            style={{ padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            <div className="flex items-center gap-2">
                              <Icon style={{
                                width: "11px", height: "11px",
                                color: item.gold ? `${GOLD}AA` : "rgba(255,255,255,0.28)",
                              }} />
                              <span style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: "7px",
                                letterSpacing: "0.24em",
                                textTransform: "uppercase",
                                color: item.gold ? `${GOLD}BB` : "rgba(255,255,255,0.38)",
                              }}>
                                {item.label}
                              </span>
                            </div>
                            <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Consulting hook */}
                  <div style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: LIFT,
                    padding: "1.25rem",
                  }}>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.90rem",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.40)",
                      fontStyle: "italic",
                    }}>
                      If this raises questions that require a conversation, the Strategy Room exists for that purpose.
                    </p>
                    <Link href="/consulting/strategy-room"
                      className="group inline-flex items-center gap-2 mt-3 transition-opacity hover:opacity-75"
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.30em",
                        textTransform: "uppercase",
                        color: `${GOLD}AA`,
                      }}
                    >
                      Strategy Room
                      <ArrowRight style={{ width: "10px", height: "10px" }} />
                    </Link>
                  </div>
                </motion.aside>
              </div>
            </div>
          </section>

          {/* ── ESCALATION PANEL ─────────────────────────────────────────── */}
          <section style={{
            backgroundColor: VOID,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
              <div style={{
                border: `1px solid ${GOLD}22`,
                backgroundColor: `${GOLD}07`,
                padding: "2.5rem",
              }}>
                {/* Rule */}
                <div style={{
                  height: "1px",
                  width: "32px",
                  background: `linear-gradient(to right, ${GOLD}55, transparent)`,
                  marginBottom: "1.5rem",
                }} />

                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                  marginBottom: "1rem",
                }}>
                  Next layer
                </div>

                <h2 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.4rem, 2.5vw, 2.0rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.020em",
                  color: "rgba(255,255,255,0.88)",
                  marginBottom: "0.85rem",
                }}>
                  Need the full institutional edge?
                </h2>

                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.02rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.45)",
                  maxWidth: "48ch",
                  marginBottom: "1.75rem",
                }}>
                  The public brief is the open layer. The institutional report carries the deeper
                  reading, stronger framing, and full board instruction set. The board deck exists
                  for executive presentation and rapid circulation.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href="/artifacts/global-market-intelligence-report-q1-2026"
                    className="group inline-flex items-center gap-3 transition-all duration-300"
                    style={{
                      padding: "13px 24px",
                      backgroundColor: "rgba(255,255,255,0.94)",
                      color: "rgb(4 10 18)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,1)"}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.94)"}
                  >
                    Open institutional edition
                    <ArrowRight style={{ width: "12px", height: "12px" }} />
                  </Link>

                  <Link href="/artifacts/gmi-q1-2026-deck"
                    className="group inline-flex items-center gap-3 transition-all duration-300"
                    style={{
                      padding: "13px 24px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      color: "rgba(255,255,255,0.50)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.75)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.10)"; el.style.color = "rgba(255,255,255,0.50)"; }}
                  >
                    <FileText style={{ width: "12px", height: "12px" }} />
                    Open board deck
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>
      </Layout>
    </>
  );
};

export default GlobalMarketOutlookPublicPage;