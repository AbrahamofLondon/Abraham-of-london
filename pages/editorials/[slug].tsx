// pages/editorials/[slug].tsx
// Design: Institutional publication record — the formal page for a written asset
// Every publication has: a proper hero, a citation panel, access surfaces,
// and an escalation close. Nothing generic. Nothing decorative without purpose.

import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Quote,
} from "lucide-react";

import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import {
  getPublicationBySlug,
  getPublicationCatalogue,
} from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  item: PublicationRecord;
  previewHref: string | null;
  citationHref: string;
  relatedSlugs: { prev: string | null; next: string | null };
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";
const VOID = "rgb(3 3 5)";

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
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const EditorialPage: NextPage<Props> = ({ item, previewHref, citationHref, relatedSlugs }) => {
  const { data: session } = useSession();
  const isPublic = item.tier === "public";

  // For restricted editorials, strip download links client-side
  const safePreviewHref = isPublic ? previewHref : null;
  const safePdfPath = isPublic ? item.pdfPath : null;
  const safeEpubPath = isPublic ? item.epubPath : null;

  if (!isPublic && !session?.user) {
    return (
      <Layout
        title={`${item.title} | Abraham of London`}
        description={item.description || item.subtitle || item.title}
        canonicalUrl={`/editorials/${item.slug}`}
        fullWidth
        headerTransparent
      >
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
          <div className="flex min-h-screen items-center justify-center px-6">
            <AccessGate
              title={item.title}
              requiredTier={item.tier}
              message="This publication requires appropriate access."
              isAuthenticated={false}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${item.title} | Abraham of London`}
      description={item.description || item.subtitle || item.title}
      canonicalUrl={`/editorials/${item.slug}`}
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── COVER ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          {/* Atmosphere */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{
              left: "-5%", top: "-15%",
              width: "650px", height: "600px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}10 0%, ${GOLD}04 30%, transparent 65%)`,
              filter: "blur(130px)",
            }} />
            <div className="absolute inset-x-0 bottom-0 h-40" style={{
              background: `linear-gradient(to top, ${BASE}, transparent)`,
            }} />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>

          {/* Top gold rule */}
          <div className="absolute inset-x-0 top-0 h-px" style={{
            background: `linear-gradient(to right, transparent, ${GOLD}25, transparent)`,
          }} />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-28 md:pt-36" />

            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55 }}
              className="flex items-center gap-2"
            >
              <Link
                href="/editorials"
                className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                <ArrowLeft style={{ width: "11px", height: "11px" }} />
                Editorials
              </Link>
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "10px" }}>/</span>
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.20)",
              }}>
                {item.category || "Editorial"}
              </span>
            </motion.div>

            {/* Cover block */}
            <div className="mt-8 grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">

              {/* Left — title block */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Classification badges */}
                <div className="flex flex-wrap items-center gap-2.5 mb-6">
                  {item.category && (
                    <div className="px-3 py-1.5" style={{
                      border: `1px solid ${GOLD}30`,
                      backgroundColor: `${GOLD}09`,
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.38em",
                        textTransform: "uppercase",
                        color: `${GOLD}BB`,
                      }}>
                        {item.category}
                      </span>
                    </div>
                  )}
                  <div className="px-3 py-1.5" style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.34em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.35)",
                    }}>
                      {item.tier}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2.2rem, 5vw, 4.2rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.035em",
                  color: "rgba(255,255,255,0.94)",
                }}>
                  {item.title}
                </h1>

                {item.subtitle && (
                  <p style={{
                    marginTop: "1.1rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.05rem, 1.4vw, 1.30rem)",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.45)",
                    fontStyle: "italic",
                    maxWidth: "46ch",
                  }}>
                    {item.subtitle}
                  </p>
                )}

                {item.description && (
                  <p style={{
                    marginTop: "0.85rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.02rem",
                    lineHeight: 1.72,
                    color: "rgba(255,255,255,0.38)",
                    maxWidth: "46ch",
                  }}>
                    {item.description}
                  </p>
                )}

                {/* Meta strip */}
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  {[item.author, item.date, item.readingTime, item.version ? `v${item.version}` : null, item.contentId]
                    .filter(Boolean)
                    .map((val, i, arr) => (
                      <React.Fragment key={i}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.26em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.22)",
                        }}>
                          {val}
                        </span>
                        {i < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>}
                      </React.Fragment>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3 mt-8">
                  {item.pdfPath && (
                    <a
                      href={item.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        padding: "12px 24px",
                        border: `1px solid ${GOLD}42`,
                        backgroundColor: `${GOLD}0E`,
                        color: GOLD,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
                    >
                      <Download style={{ width: "12px", height: "12px" }} />
                      Download PDF
                    </a>
                  )}

                  {previewHref && (
                    <a
                      href={previewHref}
                      className="inline-flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        padding: "12px 24px",
                        border: "1px solid rgba(255,255,255,0.09)",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        color: "rgba(255,255,255,0.50)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.75)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.50)"; }}
                    >
                      <Eye style={{ width: "12px", height: "12px" }} />
                      Preview
                    </a>
                  )}

                  {item.epubEnabled && item.epubPath && (
                    <a
                      href={item.epubPath}
                      className="inline-flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        padding: "12px 24px",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.32)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.14)"; el.style.color = "rgba(255,255,255,0.55)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.32)"; }}
                    >
                      <BookOpen style={{ width: "12px", height: "12px" }} />
                      EPUB
                    </a>
                  )}
                </div>
              </motion.div>

              {/* Right — metadata record panel */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, delay: 0.14 }}
                className="space-y-3 lg:sticky lg:top-28"
              >
                {/* Publication record */}
                <div style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: LIFT,
                }}>
                  <div style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}>
                      Publication record
                    </span>
                  </div>
                  <div style={{ padding: "0.75rem 1.25rem" }}>
                    {[
                      { label: "Content ID",  value: item.contentId },
                      { label: "Author",      value: item.author },
                      { label: "Tier",        value: item.tier },
                      { label: "Category",    value: item.category || "—" },
                      { label: "Date",        value: item.date || "—" },
                      { label: "Version",     value: item.version || "—" },
                      { label: "Status",      value: item.status || "—" },
                      { label: "Reading time", value: item.readingTime || "—" },
                    ].map(({ label, value }) => (
                      <div key={label}
                        className="flex items-start justify-between gap-3 py-2"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.32em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.20)",
                        }}>
                          {label}
                        </span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.10em",
                          color: "rgba(255,255,255,0.55)",
                          textAlign: "right",
                          maxWidth: "58%",
                          wordBreak: "break-all",
                        }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citation panel */}
                <div style={{
                  border: `1px solid ${GOLD}18`,
                  backgroundColor: `${GOLD}06`,
                  padding: "1.25rem",
                }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Quote style={{ width: "11px", height: "11px", color: `${GOLD}80` }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}>
                      Citation
                    </span>
                  </div>

                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.90rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.60)",
                    fontStyle: "italic",
                    marginBottom: "1rem",
                  }}>
                    {item.citation.citationAuthor}.{" "}
                    <em style={{ fontStyle: "normal", color: "rgba(255,255,255,0.75)" }}>
                      {item.citation.citationTitle}
                    </em>
                    .{" "}
                    {item.citation.citationPublisher},{" "}
                    {item.citation.citationYear}.
                  </p>

                  {item.citation.doi && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "6.5px",
                        letterSpacing: "0.30em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                      }}>
                        DOI
                      </span>
                      <span style={{
                        marginLeft: "0.75rem",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        color: "rgba(255,255,255,0.45)",
                        letterSpacing: "0.06em",
                      }}>
                        {item.citation.doi}
                      </span>
                    </div>
                  )}

                  <a
                    href={citationHref}
                    className="group mt-3 flex items-center justify-between transition-opacity hover:opacity-75"
                  >
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}>
                      Citation JSON
                    </span>
                    <ExternalLink style={{ width: "10px", height: "10px", color: `${GOLD}70` }} />
                  </a>
                </div>

                {/* Access surfaces */}
                <div style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}>
                  <div style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                    }}>
                      Access surfaces
                    </span>
                  </div>

                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {item.pdfPath && (
                      <a href={item.pdfPath} target="_blank" rel="noopener noreferrer"
                        className="group flex items-center justify-between transition-opacity hover:opacity-75"
                        style={{ padding: "0.85rem 1.25rem" }}
                      >
                        <div className="flex items-center gap-2">
                          <Download style={{ width: "10px", height: "10px", color: `${GOLD}80` }} />
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>PDF Edition</span>
                        </div>
                        <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                      </a>
                    )}
                    {previewHref && (
                      <a href={previewHref}
                        className="group flex items-center justify-between transition-opacity hover:opacity-75"
                        style={{ padding: "0.85rem 1.25rem" }}
                      >
                        <div className="flex items-center gap-2">
                          <Eye style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.30)" }} />
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Preview Route</span>
                        </div>
                        <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                      </a>
                    )}
                    {item.epubEnabled && item.epubPath && (
                      <a href={item.epubPath}
                        className="group flex items-center justify-between transition-opacity hover:opacity-75"
                        style={{ padding: "0.85rem 1.25rem" }}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.30)" }} />
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>EPUB Edition</span>
                        </div>
                        <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                      </a>
                    )}
                    <a href={citationHref}
                      className="group flex items-center justify-between transition-opacity hover:opacity-75"
                      style={{ padding: "0.85rem 1.25rem" }}
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.30)" }} />
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Citation JSON</span>
                      </div>
                      <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            <div style={{ paddingBottom: "4rem" }} />
          </div>
        </section>

        {/* ── PUBLICATION SUMMARY ───────────────────────────────────────── */}
        {item.description && (
          <section style={{ backgroundColor: BASE }}>
            <div className="mx-auto max-w-4xl px-6 py-14 lg:px-12">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.70 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8" style={{ background: `linear-gradient(to right, ${GOLD}45, transparent)` }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.40em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.20)",
                  }}>
                    Publication summary
                  </span>
                </div>

                <div style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.012)",
                  padding: "2rem 2.5rem",
                }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.05rem, 1.3vw, 1.20rem)",
                    lineHeight: 1.80,
                    color: "rgba(255,255,255,0.62)",
                  }}>
                    {item.description}
                  </p>

                  {item.subtitle && (
                    <p style={{
                      marginTop: "1.25rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.02rem",
                      lineHeight: 1.72,
                      color: "rgba(255,255,255,0.38)",
                      fontStyle: "italic",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      paddingTop: "1.25rem",
                    }}>
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ── ADJACENT NAVIGATION ───────────────────────────────────────── */}
        {(relatedSlugs.prev || relatedSlugs.next) && (() => {
          const catalogue = getPublicationCatalogue();
          const prevItem = relatedSlugs.prev ? catalogue.find(i => i.slug === relatedSlugs.prev) : null;
          const nextItem = relatedSlugs.next ? catalogue.find(i => i.slug === relatedSlugs.next) : null;
          return (
            <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
                <div className="grid gap-4 sm:grid-cols-2">
                  {prevItem ? (
                    <Link href={`/editorials/${prevItem.slug}`}
                      className="group flex items-center gap-4 transition-opacity hover:opacity-75"
                      style={{ padding: "1.25rem 1.5rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)" }}
                    >
                      <ArrowLeft style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.35rem" }}>Previous</div>
                        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", color: "rgba(255,255,255,0.58)" }}>{prevItem.title}</div>
                      </div>
                    </Link>
                  ) : <div />}

                  {nextItem && (
                    <Link href={`/editorials/${nextItem.slug}`}
                      className="group flex items-center justify-end gap-4 text-right transition-opacity hover:opacity-75"
                      style={{ padding: "1.25rem 1.5rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)" }}
                    >
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.35rem" }}>Next</div>
                        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", color: "rgba(255,255,255,0.58)" }}>{nextItem.title}</div>
                      </div>
                      <ArrowRight style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                    </Link>
                  )}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ── ESCALATION CLOSE ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-14 lg:px-12">
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
                If this publication raises a question that requires a conversation
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
                Publications establish the intellectual frame. Diagnostics apply it.
                The Strategy Room exists for situations where the question carries
                material consequence.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/diagnostics"
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
                  Enter diagnostics <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>
                <Link href="/strategy-room"
                  className="inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.62)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.color = "rgba(255,255,255,0.38)"; }}
                >
                  Strategy Room
                </Link>
                <Link href="/editorials"
                  className="inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.22)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "rgba(255,255,255,0.45)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "rgba(255,255,255,0.22)"; }}
                >
                  All editorials
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticPaths: GetStaticPaths = async () => {
  // Hardcoded catalogue is tiny; use blocking so new additions render
  // without a redeploy.
  const items = getPublicationCatalogue();
  return {
    paths: items.map(item => ({ params: { slug: item.slug } })),
    fallback: "blocking",
  };


};

export const getStaticProps: GetStaticProps<Props> = async ctx => {
  const slug = typeof ctx.params?.slug === "string" ? ctx.params.slug : "";
  const item = getPublicationBySlug(slug);
  if (!item) return { notFound: true };

  const catalogue = getPublicationCatalogue();
  const sorted = [...catalogue].sort((a, b) => a.title.localeCompare(b.title));
  const idx = sorted.findIndex(i => i.slug === slug);
  const prev = idx > 0 ? sorted[idx - 1]!.slug : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1]!.slug : null;

  const isPublic = item.tier === "public";
  const previewHref = isPublic && item.previewEnabled
    ? (item.previewPath || `/api/editorials/preview/${item.slug}`)
    : null;

  // Strip asset paths for non-public publications at the server level
  const safeItem = isPublic
    ? item
    : { ...item, pdfPath: undefined, epubPath: undefined, previewPath: undefined };

  return {
    props: {
      item: safeItem,
      previewHref,
      citationHref: `/api/editorials/citation/${item.slug}`,
      relatedSlugs: { prev, next },
    },
    revalidate: 1800,
  };


};

export default EditorialPage;