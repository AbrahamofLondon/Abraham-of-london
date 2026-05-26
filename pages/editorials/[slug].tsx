// pages/editorials/[slug].tsx
// Design: Body-first publication page — the editorial is the thing. Everything
// else is apparatus. Hero shows the title and almost nothing else. The body
// begins immediately after the fold. Metadata moves post-body.

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
  Quote,
} from "lucide-react";

import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
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
  staticHtml: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";
const VOID = "rgb(3 3 5)";

const serif = "'Cormorant Garamond', Georgia, ui-serif, serif";
const mono  = "'JetBrains Mono', ui-monospace, monospace";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const EditorialPage: NextPage<Props> = ({ item, previewHref, citationHref, relatedSlugs, staticHtml }) => {
  const { data: session } = useSession();
  const isPublic = item.tier === "public";

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

        {/* ── COVER — title-only, full viewport ─────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{ minHeight: "100vh", backgroundColor: VOID }}
        >
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

          {/* Inner flex column — full viewport height */}
          <div
            className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12"
            style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
          >
            <div style={{ paddingTop: "7rem" }} />

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
                  fontFamily: mono,
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
                fontFamily: mono,
                fontSize: "8px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.20)",
              }}>
                {item.category || "Editorial"}
              </span>
            </motion.div>

            {/* Hero — centred, title-only */}
            <div
              className="flex-1 flex flex-col items-center justify-center text-center"
              style={{ paddingBottom: "5rem" }}
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{ maxWidth: "800px", width: "100%" }}
              >
                {/* Gold accent bar */}
                <div style={{
                  width: "1px",
                  height: "40px",
                  background: `${GOLD}60`,
                  margin: "0 auto 2rem",
                }} />

                {/* Title */}
                <h1 style={{
                  fontFamily: serif,
                  fontWeight: 300,
                  fontSize: "clamp(2.4rem, 5vw, 4.4rem)",
                  lineHeight: 0.96,
                  letterSpacing: "-0.035em",
                  color: "rgba(255,255,255,0.94)",
                  marginBottom: "1.1rem",
                }}>
                  {item.title}
                </h1>

                {/* Subtitle */}
                {item.subtitle && (
                  <p style={{
                    fontFamily: serif,
                    fontWeight: 300,
                    fontSize: "clamp(1rem, 1.3vw, 1.22rem)",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.40)",
                    fontStyle: "italic",
                    marginBottom: "1.75rem",
                  }}>
                    {item.subtitle}
                  </p>
                )}

                {/* Meta strip */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  fontFamily: mono,
                  fontSize: "7.5px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}>
                  {[item.author, item.date, item.readingTime, item.tier]
                    .filter(Boolean)
                    .map((val, i, arr) => (
                      <React.Fragment key={i}>
                        <span>{val}</span>
                        {i < arr.length - 1 && (
                          <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── READING FRAME ─────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-3xl px-6 py-16 lg:px-12">

            {/* Convergence note — inline, no label */}
            {item.convergenceNote && (
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.60 }}
                style={{
                  fontFamily: serif,
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.75,
                  color: "rgba(255,255,255,0.32)",
                  fontStyle: "italic",
                  maxWidth: "54ch",
                  marginBottom: "2.5rem",
                }}
              >
                {item.convergenceNote}
              </motion.p>
            )}

            {/* Divider between convergence note and body */}
            {item.convergenceNote && staticHtml && (
              <div style={{ marginBottom: "3rem" }}>
                <GoldRule />
              </div>
            )}

            {/* Editorial body */}
            {staticHtml ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.70 }}
              >
                <div className="editorial-body">
                  <StaticMDXRenderer html={staticHtml} />
                </div>

                {/* Footer links */}
                <div
                  className="mt-14 flex flex-wrap items-center gap-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}
                >
                  {item.pdfPath && (
                    <a
                      href={item.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-opacity hover:opacity-75"
                      style={{
                        fontFamily: mono,
                        fontSize: "7.5px",
                        letterSpacing: "0.26em",
                        textTransform: "uppercase",
                        color: `${GOLD}99`,
                      }}
                    >
                      <Download style={{ width: "10px", height: "10px" }} />
                      Download PDF
                    </a>
                  )}
                  <a
                    href={citationHref}
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-75"
                    style={{
                      fontFamily: mono,
                      fontSize: "7.5px",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    <ExternalLink style={{ width: "10px", height: "10px" }} />
                    Citation JSON
                  </a>
                  <Link
                    href="/editorials"
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-75"
                    style={{
                      fontFamily: mono,
                      fontSize: "7.5px",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.16)",
                    }}
                  >
                    ← All Editorials
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div style={{
                border: "1px solid rgba(255,255,255,0.05)",
                backgroundColor: "rgba(255,255,255,0.01)",
                padding: "1.75rem 2rem",
              }}>
                <span style={{
                  fontFamily: mono,
                  fontSize: "7px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                }}>
                  Canonical text pending
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── POST-BODY APPARATUS ───────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-12">

            {/* Section label */}
            <div style={{
              fontFamily: mono,
              fontSize: "7px",
              letterSpacing: "0.40em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.16)",
              marginBottom: "1.25rem",
            }}>
              Publication apparatus
            </div>
            <GoldRule soft />
            <div style={{ marginTop: "2.5rem" }} />

            {/* 2-column grid — publication record + citation/access */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Left — Publication record */}
              <div style={{
                border: "1px solid rgba(255,255,255,0.07)",
                backgroundColor: LIFT,
              }}>
                <div style={{
                  padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{
                    fontFamily: mono,
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
                    { label: "Content ID",   value: item.contentId },
                    { label: "Author",       value: item.author },
                    { label: "Tier",         value: item.tier },
                    { label: "Category",     value: item.category || "—" },
                    { label: "Date",         value: item.date || "—" },
                    { label: "Version",      value: item.version || "—" },
                    { label: "Status",       value: item.status || "—" },
                    { label: "Reading time", value: item.readingTime || "—" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-3 py-2"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <span style={{
                        fontFamily: mono,
                        fontSize: "6.5px",
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                      }}>
                        {label}
                      </span>
                      <span style={{
                        fontFamily: mono,
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

              {/* Right — Citation + Access surfaces */}
              <div className="space-y-3">

                {/* Citation panel */}
                <div style={{
                  border: `1px solid ${GOLD}18`,
                  backgroundColor: `${GOLD}06`,
                  padding: "1.25rem",
                }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Quote style={{ width: "11px", height: "11px", color: `${GOLD}80` }} />
                    <span style={{
                      fontFamily: mono,
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}>
                      Citation
                    </span>
                  </div>

                  <p style={{
                    fontFamily: serif,
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
                        fontFamily: mono,
                        fontSize: "6.5px",
                        letterSpacing: "0.30em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                      }}>
                        DOI
                      </span>
                      <span style={{
                        marginLeft: "0.75rem",
                        fontFamily: mono,
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
                      fontFamily: mono,
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
                      fontFamily: mono,
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
                      <a
                        href={item.pdfPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between transition-opacity hover:opacity-75"
                        style={{ padding: "0.85rem 1.25rem" }}
                      >
                        <div className="flex items-center gap-2">
                          <Download style={{ width: "10px", height: "10px", color: `${GOLD}80` }} />
                          <span style={{ fontFamily: mono, fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>PDF Edition</span>
                        </div>
                        <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                      </a>
                    )}
                    {previewHref && (
                      <a
                        href={previewHref}
                        className="group flex items-center justify-between transition-opacity hover:opacity-75"
                        style={{ padding: "0.85rem 1.25rem" }}
                      >
                        <div className="flex items-center gap-2">
                          <Eye style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.30)" }} />
                          <span style={{ fontFamily: mono, fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Preview Route</span>
                        </div>
                        <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                      </a>
                    )}
                    {item.epubEnabled && item.epubPath && (
                      <a
                        href={item.epubPath}
                        className="group flex items-center justify-between transition-opacity hover:opacity-75"
                        style={{ padding: "0.85rem 1.25rem" }}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.30)" }} />
                          <span style={{ fontFamily: mono, fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>EPUB Edition</span>
                        </div>
                        <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                      </a>
                    )}
                    <a
                      href={citationHref}
                      className="group flex items-center justify-between transition-opacity hover:opacity-75"
                      style={{ padding: "0.85rem 1.25rem" }}
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.30)" }} />
                        <span style={{ fontFamily: mono, fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Citation JSON</span>
                      </div>
                      <ChevronRight style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.18)" }} />
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── COMPANION SCHEMATIC (flagship only) ────────────────────────── */}
        {item.slug === "ultimate-purpose-of-man" && (
          <section style={{ backgroundColor: `${GOLD}06`, borderTop: `1px solid ${GOLD}18` }}>
            <div className="mx-auto max-w-3xl px-6 py-10 lg:px-12">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div style={{
                    fontFamily: mono,
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: `${GOLD}70`,
                    marginBottom: "0.5rem",
                  }}>
                    Companion edition
                  </div>
                  <p style={{
                    fontFamily: serif,
                    fontWeight: 300,
                    fontSize: "1rem",
                    lineHeight: 1.45,
                    color: "rgba(255,255,255,0.72)",
                  }}>
                    The Strategic Schematic Edition — definitions, operating sequence, governance checklist, and 30-day alignment protocol.
                  </p>
                </div>
                <Link
                  href="/downloads/ultimate-purpose-of-man-editorial"
                  className="shrink-0 inline-flex items-center gap-2 transition-opacity hover:opacity-75"
                  style={{
                    border: `1px solid ${GOLD}40`,
                    backgroundColor: `${GOLD}0D`,
                    color: `${GOLD}CC`,
                    fontFamily: mono,
                    fontSize: "7.5px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    padding: "0.6rem 1.1rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  Open schematic edition
                </Link>
              </div>
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
                    <Link
                      href={`/editorials/${prevItem.slug}`}
                      className="group flex items-center gap-4 transition-opacity hover:opacity-75"
                      style={{ padding: "1.25rem 1.5rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)" }}
                    >
                      <ArrowLeft style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: mono, fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.35rem" }}>Previous</div>
                        <div style={{ fontFamily: serif, fontWeight: 300, fontSize: "1.02rem", color: "rgba(255,255,255,0.58)" }}>{prevItem.title}</div>
                      </div>
                    </Link>
                  ) : <div />}

                  {nextItem && (
                    <Link
                      href={`/editorials/${nextItem.slug}`}
                      className="group flex items-center justify-end gap-4 text-right transition-opacity hover:opacity-75"
                      style={{ padding: "1.25rem 1.5rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)" }}
                    >
                      <div>
                        <div style={{ fontFamily: mono, fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.35rem" }}>Next</div>
                        <div style={{ fontFamily: serif, fontWeight: 300, fontSize: "1.02rem", color: "rgba(255,255,255,0.58)" }}>{nextItem.title}</div>
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
                fontFamily: mono,
                fontSize: "7px",
                letterSpacing: "0.40em",
                textTransform: "uppercase",
                color: `${GOLD}90`,
                marginBottom: "1rem",
              }}>
                The estate that flows from this argument
              </div>
              <p style={{
                fontFamily: serif,
                fontWeight: 300,
                fontSize: "1.02rem",
                lineHeight: 1.72,
                color: "rgba(255,255,255,0.42)",
                fontStyle: "italic",
                maxWidth: "50ch",
                marginBottom: "1.5rem",
              }}>
                This editorial establishes the frame. The series, the essays, the diagnostics,
                and the strategy work are all extensions of the question it answers. If something
                in this argument demands further examination — in your organisation, your leadership,
                or your own formation — that is what the rest of the estate exists for.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/diagnostics"
                  className="inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: `1px solid ${GOLD}35`,
                    backgroundColor: `${GOLD}0D`,
                    color: `${GOLD}BB`,
                    fontFamily: mono,
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}55`; el.style.backgroundColor = `${GOLD}14`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}35`; el.style.backgroundColor = `${GOLD}0D`; }}
                >
                  Enter diagnostics <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>
                <Link
                  href="/strategy-room"
                  className="inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: mono,
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.62)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.color = "rgba(255,255,255,0.38)"; }}
                >
                  Strategy Room
                </Link>
                <Link
                  href="/editorials"
                  className="inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.22)",
                    fontFamily: mono,
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

  // ── Resolve editorial body ───────────────────────────────────────────────
  let staticHtml = "";
  try {
    const { getAllEditorials } = await import("@/lib/content/server");
    const editorials = getAllEditorials();
    const editorialDoc = editorials.find(
      (e) => e.slug === slug || e._raw?.flattenedPath?.endsWith(`/${slug}`) || e._raw?.flattenedPath === `editorials/${slug}`,
    );
    if (editorialDoc) {
      const result = renderDocBodyToStaticHtml(editorialDoc);
      staticHtml = result.mode !== "empty" ? result.html : "";
    }
  } catch {
    staticHtml = "";
  }

  // ── Missing-body guard ───────────────────────────────────────────────────
  if (!staticHtml && isPublic && !item.canonicalTextPending && process.env.NODE_ENV !== "production") {
    console.warn(
      `[editorial] MISSING BODY: "${slug}" is public but has no body source at content/editorials/${slug}.mdx — set canonicalTextPending: true in the catalogue to suppress this warning.`,
    );
  }

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
      staticHtml,
    },
    revalidate: 1800,
  };
};

export default EditorialPage;
