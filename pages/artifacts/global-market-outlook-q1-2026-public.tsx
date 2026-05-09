// pages/artifacts/global-market-outlook-q1-2026-public.tsx
// Global Market Outlook Q1 2026 — Public Brief
// Rebuilt for cleaner editorial authority, better reading rhythm, stronger product-family navigation,
// improved markdown rendering, sharper premium hierarchy, and better mobile behavior.

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, NextPage } from "next";
import { motion, useReducedMotion } from "framer-motion";
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
const PANEL = "#0A1320";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

const GRID: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.07) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(255,255,255,0.05) 0.5px, transparent 0.5px)",
  backgroundSize: "84px 84px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
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

function escapeAttribute(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(input: string): string {
  let out = escapeHtml(input);

  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text: string, href: string) =>
      `<a href="${escapeAttribute(href)}" style="color:${GOLD};text-decoration:underline;text-underline-offset:3px;">${escapeHtml(
        text,
      )}</a>`,
  );

  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+)`/g, `<code style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:0.88em;color:rgba(255,255,255,0.82);background:rgba(255,255,255,0.05);padding:0.08rem 0.30rem;">$1</code>`);

  return out;
}

function paragraphHtml(content: string): string {
  return `<p style="margin:1.2rem 0;font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:1.06rem;line-height:1.82;color:rgba(255,255,255,0.66);">${inlineMarkdown(
    content,
  )}</p>`;
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      html.push(
        `<h1 style="margin-top:3rem;margin-bottom:1.15rem;font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:clamp(1.85rem,3vw,2.7rem);line-height:1.0;letter-spacing:-0.028em;color:rgba(255,255,255,0.94);">${inlineMarkdown(
          line.slice(2),
        )}</h1>`,
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      html.push(
        `<h2 style="margin-top:2.8rem;margin-bottom:1rem;padding-bottom:0.8rem;border-bottom:1px solid rgba(255,255,255,0.07);font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:clamp(1.4rem,2.2vw,1.95rem);line-height:1.04;letter-spacing:-0.02em;color:rgba(255,255,255,0.90);">${inlineMarkdown(
          line.slice(3),
        )}</h2>`,
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      html.push(
        `<h3 style="margin-top:2rem;margin-bottom:0.8rem;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:0.72rem;letter-spacing:0.32em;text-transform:uppercase;color:rgba(201,169,110,0.78);">${inlineMarkdown(
          line.slice(4),
        )}</h3>`,
      );
      i++;
      continue;
    }

    if (line === "---") {
      html.push(
        `<div style="margin:2.8rem 0;height:1px;background:linear-gradient(to right,transparent,rgba(255,255,255,0.09),transparent);"></div>`,
      );
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("> ")) {
        quoteLines.push((lines[i] ?? "").trim().slice(2));
        i++;
      }

      html.push(
        `<blockquote style="margin:2rem 0;padding:1.25rem 1.5rem;border-left:2px solid ${GOLD}60;background:rgba(201,169,110,0.07);font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:1.05rem;line-height:1.72;color:rgba(255,255,255,0.76);font-style:italic;">${inlineMarkdown(
          quoteLines.join(" "),
        )}</blockquote>`,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? "").trim())) {
        items.push((lines[i] ?? "").trim().replace(/^[-*]\s+/, ""));
        i++;
      }

      html.push(
        `<ul style="margin:1.5rem 0;padding:0;list-style:none;">${items
          .map(
            (item) =>
              `<li style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.7rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-family:'Cormorant Garamond',Georgia,ui-serif,serif;font-weight:300;font-size:1rem;line-height:1.65;color:rgba(255,255,255,0.65);"><span style="flex-shrink:0;margin-top:0.58rem;width:5px;height:1px;background:${GOLD}72;display:block;"></span><span>${inlineMarkdown(
                item,
              )}</span></li>`,
          )
          .join("")}</ul>`,
      );
      continue;
    }

    const paragraphLines: string[] = [line];
    i++;

    while (i < lines.length) {
      const next = (lines[i] ?? "").trim();
      if (
        !next ||
        next.startsWith("# ") ||
        next.startsWith("## ") ||
        next.startsWith("### ") ||
        /^[-*]\s+/.test(next) ||
        next === "---" ||
        next.startsWith("> ")
      ) {
        break;
      }
      paragraphLines.push(next);
      i++;
    }

    html.push(paragraphHtml(paragraphLines.join(" ")));
  }

  return html.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<PublicBriefProps> = async () => {
  const filePath = path.join(
    process.cwd(),
    "content",
    "artifacts",
    "global-market-outlook-q1-2026-public.mdx",
  );

  const fallback: PublicBriefProps = {
    title: "Global Market Outlook Q1 2026",
    subtitle: "Public Brief",
    description: "A disciplined public reading of the Q1 2026 market environment.",
    date: "April 8, 2026",
    classification: "PUBLIC",
    productLine: "Market Intelligence",
    docId: "GMI-Q1-2026-PB",
    version: "1.0.0",
    contentHtml:
      `<p style="color:rgba(255,255,255,0.65);font-family:'Cormorant Garamond',Georgia,serif;font-size:1.05rem;line-height:1.80;">The public brief source file could not be loaded.</p>`,
  };

  try {
    if (!fs.existsSync(filePath)) {
      return { props: fallback, revalidate: 3600 };
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);

    return {
      props: {
        title: safeString(parsed.data.title, fallback.title),
        subtitle: safeString(parsed.data.subtitle, fallback.subtitle),
        description: safeString(parsed.data.description, fallback.description),
        date: safeString(parsed.data.date, fallback.date),
        classification: safeString(
          parsed.data.classification,
          fallback.classification,
        ).toUpperCase(),
        productLine: safeString(parsed.data.productLine, "Market Intelligence"),
        docId: safeString(parsed.data.docId, fallback.docId),
        version: safeString(parsed.data.version, fallback.version),
        contentHtml: markdownToHtml(parsed.content),
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
  title,
  subtitle,
  description,
  date,
  classification,
  productLine,
  docId,
  version,
  contentHtml,
}) => {
  const reduceMotion = useReducedMotion();

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
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute"
                style={{
                  left: "-10%",
                  top: "-20%",
                  width: "760px",
                  height: "620px",
                  borderRadius: "50%",
                  background: `radial-gradient(ellipse at center, ${GOLD}10 0%, ${GOLD}04 30%, transparent 65%)`,
                  filter: "blur(120px)",
                }}
              />
              <div
                className="absolute"
                style={{
                  right: "-6%",
                  top: "5%",
                  width: "420px",
                  height: "420px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at center, rgba(255,255,255,0.028) 0%, transparent 64%)",
                  filter: "blur(100px)",
                }}
              />
              <div className="absolute inset-0 opacity-[0.015]" style={GRID} />
              <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
              <div
                className="absolute inset-x-0 bottom-0 h-36"
                style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
              />
            </div>

            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)`,
              }}
            />

            <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
              <div className="pt-36 md:pt-44" />

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.60 }}
              >
                <Link
                  href="/artifacts"
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
                  Intelligence Archives
                </Link>
              </motion.div>

              <div className="grid gap-10 lg:grid-cols-[1fr_290px] lg:items-end">
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.06 }}
                    className="mt-7 flex flex-wrap items-center gap-2.5"
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-1.5"
                      style={{
                        border: `1px solid ${GOLD}30`,
                        backgroundColor: `${GOLD}0A`,
                      }}
                    >
                      <TrendingUp
                        style={{ width: "11px", height: "11px", color: `${GOLD}AA` }}
                      />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.36em",
                          textTransform: "uppercase",
                          color: `${GOLD}CC`,
                        }}
                      >
                        Public Brief
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2 px-3 py-1.5"
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <ShieldCheck
                        style={{
                          width: "11px",
                          height: "11px",
                          color: "rgba(255,255,255,0.30)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.30em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.40)",
                        }}
                      >
                        {classification}
                      </span>
                    </div>

                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                      }}
                    >
                      {productLine}
                    </span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.85,
                      delay: 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      marginTop: "1.5rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(2.2rem, 5vw, 4.35rem)",
                      lineHeight: 0.94,
                      letterSpacing: "-0.036em",
                      color: "rgba(255,255,255,0.94)",
                      maxWidth: "12ch",
                    }}
                  >
                    {title}
                  </motion.h1>

                  {subtitle && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.75, delay: 0.20 }}
                      style={{
                        marginTop: "1rem",
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "clamp(1.08rem, 1.5vw, 1.35rem)",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.45)",
                        fontStyle: "italic",
                      }}
                    >
                      {subtitle}
                    </motion.p>
                  )}

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
                      maxWidth: "50ch",
                    }}
                  >
                    {description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.38 }}
                    className="mt-8 flex flex-wrap gap-3"
                  >
                    <Link
                      href="/artifacts/global-market-intelligence-report-q1-2026"
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
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = `${GOLD}55`;
                        el.style.backgroundColor = `${GOLD}15`;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = `${GOLD}38`;
                        el.style.backgroundColor = `${GOLD}0D`;
                      }}
                    >
                      <Lock style={{ width: "11px", height: "11px" }} />
                      Institutional edition
                    </Link>

                    <Link
                      href="/artifacts/global-market-intelligence-board-deck-q1-2026"
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
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "rgba(255,255,255,0.16)";
                        el.style.color = "rgba(255,255,255,0.65)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "rgba(255,255,255,0.09)";
                        el.style.color = "rgba(255,255,255,0.40)";
                      }}
                    >
                      <Presentation style={{ width: "11px", height: "11px" }} />
                      Board deck
                    </Link>

                    <Link
                      href="/intelligence/global-market-intelligence-q1-2026"
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
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "rgba(255,255,255,0.12)";
                        el.style.color = "rgba(255,255,255,0.55)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "rgba(255,255,255,0.07)";
                        el.style.color = "rgba(255,255,255,0.30)";
                      }}
                    >
                      <Globe style={{ width: "11px", height: "11px" }} />
                      Intelligence surface
                    </Link>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.20 }}
                >
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: "rgba(255,255,255,0.018)",
                      padding: "1.2rem 1.35rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                        marginBottom: "0.7rem",
                      }}
                    >
                      Public layer
                    </div>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.96rem",
                        lineHeight: 1.62,
                        color: "rgba(255,255,255,0.56)",
                      }}
                    >
                      This edition is open by design. It gives the shape of the
                      quarter cleanly, without pretending to be the full boardroom
                      instrument.
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.32 }}
                style={{ marginTop: "2.2rem" }}
              >
                <div
                  className="grid grid-cols-2 gap-px sm:grid-cols-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  {[
                    { label: "Document", value: docId || "GMI-Q1-2026-PB" },
                    { label: "Published", value: date },
                    { label: "Version", value: version || "1.0.0" },
                    { label: "Classification", value: classification },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{ backgroundColor: LIFT, padding: "1rem 1.25rem" }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.36em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.24)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1rem",
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div style={{ paddingBottom: "3.5rem" }} />
            </div>
          </section>

          {/* ── ARTICLE BODY ──────────────────────────────────────────────── */}
          <section style={{ backgroundColor: BASE }}>
            <div
              className="mx-auto px-6 lg:px-12"
              style={{ maxWidth: "1160px", paddingTop: "4rem", paddingBottom: "5rem" }}
            >
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                <motion.article
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                >
                  <div
                    style={{
                      maxWidth: "720px",
                    }}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                </motion.article>

                <motion.aside
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: 0.15 }}
                  className="space-y-4 lg:sticky lg:top-28"
                >
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: LIFT,
                      padding: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.38em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                        marginBottom: "1rem",
                      }}
                    >
                      Document record
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "ID", value: docId || "GMI-Q1-2026-PB" },
                        { label: "Ver", value: version || "1.0.0" },
                        { label: "Date", value: date },
                        { label: "Class", value: classification },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-start justify-between gap-3"
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.30em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.22)",
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7.5px",
                              letterSpacing: "0.12em",
                              color: "rgba(255,255,255,0.55)",
                              textAlign: "right",
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      border: `1px solid ${GOLD}22`,
                      backgroundColor: `${GOLD}07`,
                      padding: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.38em",
                        textTransform: "uppercase",
                        color: `${GOLD}90`,
                        marginBottom: "0.85rem",
                      }}
                    >
                      Full product family
                    </div>

                    <div className="space-y-1">
                      {[
                        {
                          label: "Institutional edition",
                          icon: Lock,
                          href: "/artifacts/global-market-intelligence-report-q1-2026",
                          gold: true,
                        },
                        {
                          label: "Board deck",
                          icon: Presentation,
                          href: "/artifacts/global-market-intelligence-board-deck-q1-2026",
                          gold: false,
                        },
                        {
                          label: "Boardroom PDF",
                          icon: Scale,
                          href: "/artifacts/global-market-intelligence-report-q1-2026",
                          gold: false,
                        },
                      ].map((item, idx, arr) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center justify-between gap-2 transition-opacity hover:opacity-80"
                            style={{
                              padding: "0.75rem 0",
                              borderBottom:
                                idx < arr.length - 1
                                  ? "1px solid rgba(255,255,255,0.05)"
                                  : "none",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Icon
                                style={{
                                  width: "11px",
                                  height: "11px",
                                  color: item.gold
                                    ? `${GOLD}AA`
                                    : "rgba(255,255,255,0.28)",
                                }}
                              />
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                  fontSize: "7px",
                                  letterSpacing: "0.24em",
                                  textTransform: "uppercase",
                                  color: item.gold
                                    ? `${GOLD}BB`
                                    : "rgba(255,255,255,0.38)",
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                            <ChevronRight
                              style={{
                                width: "10px",
                                height: "10px",
                                color: "rgba(255,255,255,0.18)",
                              }}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: PANEL,
                      padding: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                        marginBottom: "0.8rem",
                      }}
                    >
                      Strategic follow-through
                    </div>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.92rem",
                        lineHeight: 1.65,
                        color: "rgba(255,255,255,0.42)",
                        fontStyle: "italic",
                      }}
                    >
                      If the reading raises questions that require interpretation
                      rather than more material, the Strategy Room exists for that
                      purpose.
                    </p>

                    <Link
                      href="/strategy-room"
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
          <section
            style={{
              backgroundColor: VOID,
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
              <div
                style={{
                  border: `1px solid ${GOLD}22`,
                  backgroundColor: `${GOLD}07`,
                  padding: "2.5rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  className="pointer-events-none absolute right-0 top-0"
                  style={{
                    width: "360px",
                    height: "360px",
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at top right, ${GOLD}10 0%, transparent 70%)`,
                    filter: "blur(80px)",
                  }}
                />

                <div
                  style={{
                    height: "1px",
                    width: "32px",
                    background: `linear-gradient(to right, ${GOLD}55, transparent)`,
                    marginBottom: "1.5rem",
                  }}
                />

                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.40em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                    marginBottom: "1rem",
                  }}
                >
                  Next layer
                </div>

                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.45rem, 2.5vw, 2.05rem)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.020em",
                    color: "rgba(255,255,255,0.88)",
                    marginBottom: "0.85rem",
                    maxWidth: "18ch",
                  }}
                >
                  Need the full institutional edge?
                </h2>

                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.02rem",
                    lineHeight: 1.72,
                    color: "rgba(255,255,255,0.45)",
                    maxWidth: "48ch",
                    marginBottom: "1.75rem",
                  }}
                >
                  The public brief is the open layer. The institutional report
                  carries the deeper reading, stronger framing, and fuller board
                  instruction set. The board deck exists for executive presentation
                  and rapid circulation.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/artifacts/global-market-intelligence-report-q1-2026"
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
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "rgba(255,255,255,1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "rgba(255,255,255,0.94)";
                    }}
                  >
                    Open institutional edition
                    <ArrowRight style={{ width: "12px", height: "12px" }} />
                  </Link>

                  <Link
                    href="/artifacts/global-market-intelligence-board-deck-q1-2026"
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
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.18)";
                      el.style.color = "rgba(255,255,255,0.75)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.10)";
                      el.style.color = "rgba(255,255,255,0.50)";
                    }}
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